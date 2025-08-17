const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ProductOrder = require('../models/ProductOrder');

// @route   POST /api/product-orders
// @desc    Créer une nouvelle commande de produit
// @access  Private
router.post('/', [
  auth,
  [
    body('product.type').isIn(['movingKit', 'packingMaterials', 'furnitureProtection', 'other']).withMessage('Type de produit invalide'),
    body('product.name').notEmpty().withMessage('Le nom du produit est requis'),
    body('product.price').isNumeric().withMessage('Le prix doit être un nombre'),
    body('product.quantity').isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
    body('delivery.date').isISO8601().withMessage('Date de livraison invalide'),
    body('delivery.time').notEmpty().withMessage('L\'heure de livraison est requise'),
    body('delivery.address').notEmpty().withMessage('L\'adresse de livraison est requise'),
    body('delivery.city').notEmpty().withMessage('La ville est requise'),
    body('delivery.postalCode').notEmpty().withMessage('Le code postal est requis'),
    body('payment.method').isIn(['paypal', 'stripe', 'cash']).withMessage('Méthode de paiement invalide')
  ]
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      product,
      delivery,
      payment,
      notes
    } = req.body;

    // Calculer les prix
    const productPrice = product.price * product.quantity;
    const deliveryFee = 0; // Livraison gratuite pour le moment
    const totalAmount = productPrice + deliveryFee;

    // Créer la commande
    const productOrder = new ProductOrder({
      user: req.user.id,
      product: {
        type: product.type,
        name: product.name,
        description: product.description || '',
        price: product.price,
        quantity: product.quantity
      },
      delivery: {
        date: new Date(delivery.date),
        time: delivery.time,
        address: delivery.address,
        city: delivery.city,
        postalCode: delivery.postalCode,
        instructions: delivery.instructions || '',
        coordinates: delivery.coordinates || null
      },
      pricing: {
        productPrice,
        deliveryFee,
        totalAmount
      },
      payment: {
        method: payment.method,
        status: 'pending'
      },
      notes: {
        customer: notes?.customer || '',
        admin: notes?.admin || ''
      }
    });

    await productOrder.save();

    res.status(201).json({
      message: 'Commande créée avec succès',
      productOrder
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/product-orders
// @desc    Récupérer toutes les commandes de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const productOrders = await ProductOrder.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(productOrders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/product-orders/:id
// @desc    Récupérer une commande spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const productOrder = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productOrder) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.json(productOrder);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/product-orders/:id
// @desc    Mettre à jour une commande
// @access  Private
router.put('/:id', [
  auth,
  [
    body('delivery.date').optional().isISO8601().withMessage('Date de livraison invalide'),
    body('delivery.time').optional().notEmpty().withMessage('L\'heure de livraison est requise'),
    body('delivery.address').optional().notEmpty().withMessage('L\'adresse de livraison est requise'),
    body('delivery.city').optional().notEmpty().withMessage('La ville est requise'),
    body('delivery.postalCode').optional().notEmpty().withMessage('Le code postal est requis')
  ]
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productOrder = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productOrder) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier si la commande peut être modifiée
    if (productOrder.status !== 'pending') {
      return res.status(400).json({ message: 'Cette commande ne peut plus être modifiée' });
    }

    // Mettre à jour les champs autorisés
    if (req.body.delivery) {
      productOrder.delivery = { ...productOrder.delivery, ...req.body.delivery };
    }

    if (req.body.notes?.customer) {
      productOrder.notes.customer = req.body.notes.customer;
    }

    await productOrder.save();

    res.json({
      message: 'Commande mise à jour avec succès',
      productOrder
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/product-orders/:id
// @desc    Annuler une commande
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const productOrder = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!productOrder) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!productOrder.canBeCancelled()) {
      return res.status(400).json({ message: 'Cette commande ne peut plus être annulée' });
    }

    productOrder.status = 'cancelled';
    productOrder.cancellation.requestedAt = new Date();
    productOrder.cancellation.reason = req.body.reason || 'Annulée par le client';

    await productOrder.save();

    res.json({
      message: 'Commande annulée avec succès',
      productOrder
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/product-orders/admin/all
// @desc    Récupérer toutes les commandes (admin)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin (à implémenter selon votre logique)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ message: 'Accès non autorisé' });
    // }

    const productOrders = await ProductOrder.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(productOrders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
