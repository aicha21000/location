const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');

const router = express.Router();

// Configuration PayPal
let environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
if (process.env.NODE_ENV === 'production') {
  environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}
const paypalClient = new paypal.core.PayPalHttpClient(environment);

// @route   GET /api/payments
// @desc    Récupérer les paiements de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find({ user: req.user.id })
      .populate('reservation', 'startDate endDate vehicle service')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments({ user: req.user.id });

    res.json({
      payments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + payments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/payments/:id
// @desc    Récupérer un paiement par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('reservation', 'startDate endDate vehicle service pricing')
      .populate('user', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/payments/create-payment-intent
// @desc    Créer une intention de paiement Stripe
// @access  Private
router.post('/create-payment-intent', [
  auth,
  body('reservationId').isMongoId().withMessage('ID de réservation invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reservationId } = req.body;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Utiliser le montant calculé dans la réservation pour éviter les incohérences
    const reservationAmount = reservation.pricing.totalAmount;
    
    // Créer l'intention de paiement Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(reservationAmount * 100), // Stripe utilise les centimes
      currency: 'eur',
      metadata: {
        reservationId: reservationId,
        userId: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement:', error);
    res.status(500).json({ message: 'Erreur lors de la création du paiement' });
  }
});

// @route   POST /api/payments/create-paypal-order
// @desc    Créer une commande PayPal
// @access  Private
router.post('/create-paypal-order', [
  auth,
  body('reservationId').isMongoId().withMessage('ID de réservation invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reservationId } = req.body;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Utiliser le montant calculé dans la réservation pour éviter les incohérences
    const reservationAmount = reservation.pricing.totalAmount;
    
    // Créer la commande PayPal
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: reservationAmount.toString()
        },
        description: `Réservation #${reservationId}`,
        custom_id: reservationId
      }]
    });

    const order = await paypalClient.execute(request);

    res.json({
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande PayPal:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
});

// @route   POST /api/payments/confirm-stripe
// @desc    Confirmer un paiement Stripe
// @access  Private
router.post('/confirm-stripe', [
  auth,
  body('paymentIntentId').notEmpty().withMessage('ID d\'intention de paiement requis'),
  body('reservationId').isMongoId().withMessage('ID de réservation invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, reservationId } = req.body;

    // Récupérer l'intention de paiement Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Paiement non réussi' });
    }

    // Vérifier que la réservation existe
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Créer l'enregistrement de paiement
    const payment = new Payment({
      user: req.user.id,
      reservation: reservationId,
      method: 'stripe',
      amount: paymentIntent.amount / 100, // Convertir les centimes en euros
      currency: 'EUR',
      status: 'paid',
      transactionId: paymentIntent.id,
      paidAt: new Date()
    });

    await payment.save();

    // Mettre à jour le statut de la réservation
    reservation.payment.status = 'paid';
    reservation.payment.transactionId = paymentIntent.id;
    reservation.payment.paidAt = new Date();
    reservation.status = 'confirmed';
    await reservation.save();

    res.json({
      message: 'Paiement confirmé avec succès',
      payment: payment
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement Stripe:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation du paiement' });
  }
});

// @route   POST /api/payments/confirm-paypal
// @desc    Confirmer un paiement PayPal
// @access  Private
router.post('/confirm-paypal', [
  auth,
  body('orderId').notEmpty().withMessage('ID de commande requis'),
  body('reservationId').isMongoId().withMessage('ID de réservation invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, reservationId } = req.body;

    // Capturer le paiement PayPal
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const capture = await paypalClient.execute(request);

    if (capture.result.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Paiement PayPal non complété' });
    }

    // Vérifier que la réservation existe
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Récupérer le montant du paiement
    const amount = parseFloat(capture.result.purchase_units[0].amount.value);

    // Créer l'enregistrement de paiement
    const payment = new Payment({
      user: req.user.id,
      reservation: reservationId,
      method: 'paypal',
      amount: amount,
      currency: 'EUR',
      status: 'paid',
      transactionId: capture.result.id,
      paidAt: new Date()
    });

    await payment.save();

    // Mettre à jour le statut de la réservation
    reservation.payment.status = 'paid';
    reservation.payment.transactionId = capture.result.id;
    reservation.payment.paidAt = new Date();
    reservation.status = 'confirmed';
    await reservation.save();

    res.json({
      message: 'Paiement PayPal confirmé avec succès',
      payment: payment
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement PayPal:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation du paiement' });
  }
});

// @route   POST /api/payments/webhook/stripe
// @desc    Webhook Stripe pour les événements de paiement
// @access  Public
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erreur de signature webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Paiement Stripe réussi:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Paiement Stripe échoué:', failedPayment.id);
        break;

      default:
        console.log(`Événement Stripe non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook Stripe:', error);
    res.status(500).json({ error: 'Erreur de traitement du webhook' });
  }
});

// @route   POST /api/payments/refund/:id
// @desc    Rembourser un paiement (admin seulement)
// @access  Private (Admin)
router.post('/refund/:id', [
  auth,
  body('amount').optional().isNumeric().withMessage('Montant invalide'),
  body('reason').optional().isLength({ max: 200 }).withMessage('Raison trop longue')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ message: 'Le paiement doit être payé pour être remboursé' });
    }

    const refundAmount = req.body.amount || payment.amount;

    // Effectuer le remboursement selon la méthode de paiement
    if (payment.method === 'stripe') {
      const refund = await stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: Math.round(refundAmount * 100)
      });
      payment.refund.transactionId = refund.id;
    } else if (payment.method === 'paypal') {
      // Logique de remboursement PayPal
      console.log('Remboursement PayPal à implémenter');
    }

    payment.refund.amount = refundAmount;
    payment.refund.reason = req.body.reason || 'Remboursement administrateur';
    payment.refund.processedAt = new Date();
    payment.status = 'refunded';

    await payment.save();

    // Mettre à jour la réservation si nécessaire
    const reservation = await Reservation.findById(payment.reservation);
    if (reservation) {
      reservation.payment.status = 'refunded';
      await reservation.save();
    }

    res.json({
      message: 'Remboursement effectué avec succès',
      payment: payment
    });
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    res.status(500).json({ message: 'Erreur lors du remboursement' });
  }
});

// @route   GET /api/payments/admin/all
// @desc    Récupérer tous les paiements (admin seulement)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { status, method, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const payments = await Payment.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('reservation', 'startDate endDate vehicle service')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + payments.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 