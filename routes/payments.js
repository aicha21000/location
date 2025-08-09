const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments
// @desc    Récupérer les paiements de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('reservation', 'startDate endDate vehicle')
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

// @route   GET /api/payments/:id
// @desc    Récupérer un paiement par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('reservation', 'startDate endDate vehicle pricing')
      .populate('user', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    // Vérifier que l'utilisateur peut accéder à ce paiement
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/payments
// @desc    Créer un nouveau paiement
// @access  Private
router.post('/', [
  auth,
  body('reservation').isMongoId().withMessage('Réservation invalide'),
  body('method').isIn(['paypal', 'stripe', 'cash']).withMessage('Méthode de paiement invalide'),
  body('amount').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('currency').optional().isIn(['EUR', 'USD']).withMessage('Devise invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reservation: reservationId, method, amount, currency = 'EUR' } = req.body;

    // Vérifier que la réservation existe et appartient à l'utilisateur
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    if (reservation.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier que le montant correspond au montant de la réservation
    if (amount !== reservation.pricing.totalAmount) {
      return res.status(400).json({ message: 'Le montant ne correspond pas au montant de la réservation' });
    }

    // Créer le paiement
    const payment = new Payment({
      user: req.user.id,
      reservation: reservationId,
      method,
      amount,
      currency,
      status: 'pending'
    });

    await payment.save();

    // Populer les références pour la réponse
    await payment.populate('reservation', 'startDate endDate vehicle pricing');

    res.status(201).json(payment);
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/payments/:id/confirm
// @desc    Confirmer un paiement
// @access  Private
router.put('/:id/confirm', [
  auth,
  body('transactionId').notEmpty().withMessage('ID de transaction requis'),
  body('status').isIn(['paid', 'failed']).withMessage('Statut invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId, status } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    // Vérifier les permissions
    if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour le paiement
    payment.status = status;
    payment.transactionId = transactionId;
    payment.paidAt = status === 'paid' ? new Date() : null;

    await payment.save();

    // Si le paiement est confirmé, mettre à jour la réservation
    if (status === 'paid') {
      const reservation = await Reservation.findById(payment.reservation);
      if (reservation) {
        reservation.payment.status = 'paid';
        reservation.payment.paidAt = new Date();
        reservation.status = 'confirmed';
        await reservation.save();
      }
    }

    // Populer les références pour la réponse
    await payment.populate('reservation', 'startDate endDate vehicle pricing');

    res.json(payment);
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Rembourser un paiement
// @access  Private (Admin)
router.post('/:id/refund', [
  auth,
  body('amount').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('reason').notEmpty().withMessage('Raison du remboursement requise')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ message: 'Le paiement doit être confirmé pour être remboursé' });
    }

    if (amount > payment.amount) {
      return res.status(400).json({ message: 'Le montant du remboursement ne peut pas dépasser le montant payé' });
    }

    // Créer le remboursement
    const refund = new Payment({
      user: payment.user,
      reservation: payment.reservation,
      method: payment.method,
      amount: -amount, // Montant négatif pour le remboursement
      currency: payment.currency,
      status: 'refunded',
      transactionId: `refund_${payment.transactionId}`,
      refundReason: reason,
      refundedAt: new Date()
    });

    await refund.save();

    // Mettre à jour le paiement original
    payment.status = 'refunded';
    payment.refundAmount = amount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    res.json({ message: 'Remboursement effectué avec succès', refund });
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
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

    const { status, method, page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('reservation', 'startDate endDate vehicle pricing')
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