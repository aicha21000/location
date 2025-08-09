const express = require('express');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reservations
// @desc    Récupérer les réservations de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate('vehicle', 'name brand model images')
      .populate('service', 'name category type')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + reservations.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/reservations/:id
// @desc    Récupérer une réservation par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('vehicle', 'name brand model images pricing')
      .populate('service', 'name category type price')
      .populate('user', 'firstName lastName email phone');

    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur peut accéder à cette réservation
    if (reservation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/reservations
// @desc    Créer une nouvelle réservation
// @access  Private
router.post('/', [
  auth,
  body('vehicle').isMongoId().withMessage('Véhicule invalide'),
  body('service').optional().isMongoId().withMessage('Service invalide'),
  body('startDate').isISO8601().withMessage('Date de début invalide'),
  body('endDate').isISO8601().withMessage('Date de fin invalide'),
  body('pickupLocation.address').notEmpty().withMessage('Adresse de retrait requise'),
  body('pickupLocation.city').notEmpty().withMessage('Ville de retrait requise'),
  body('pickupLocation.postalCode').notEmpty().withMessage('Code postal de retrait requis'),
  body('returnLocation.address').notEmpty().withMessage('Adresse de retour requise'),
  body('returnLocation.city').notEmpty().withMessage('Ville de retour requise'),
  body('returnLocation.postalCode').notEmpty().withMessage('Code postal de retour requis'),
  body('payment.method').isIn(['paypal', 'stripe', 'cash']).withMessage('Méthode de paiement invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      vehicle: vehicleId,
      service: serviceId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      options,
      payment
    } = req.body;

    // Vérifier que le véhicule existe et est disponible
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    if (!vehicle.isAvailableForDates(new Date(startDate), new Date(endDate))) {
      return res.status(400).json({ message: 'Véhicule non disponible pour ces dates' });
    }

    // Vérifier que le service existe si fourni
    let service = null;
    if (serviceId) {
      service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service non trouvé' });
      }
    }

    // Calculer les prix
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const dailyRate = vehicle.pricing.dailyRate;
    const subtotal = totalDays * dailyRate;
    const insurance = options?.insurance ? totalDays * vehicle.pricing.insurance : 0;
    const totalAmount = subtotal + insurance;

    // Créer la réservation
    const reservation = new Reservation({
      user: req.user.id,
      vehicle: vehicleId,
      service: serviceId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      options: options || {},
      pricing: {
        dailyRate,
        totalDays,
        subtotal,
        insurance,
        deposit: vehicle.pricing.deposit,
        totalAmount,
        discount: 0
      },
      payment: {
        method: payment.method,
        status: 'pending'
      }
    });

    await reservation.save();

    // Populer les références pour la réponse
    await reservation.populate('vehicle', 'name brand model images');
    if (service) {
      await reservation.populate('service', 'name category type');
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/reservations/:id
// @desc    Mettre à jour une réservation
// @access  Private
router.put('/:id', [
  auth,
  body('status').optional().isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected']).withMessage('Statut invalide'),
  body('notes.customer').optional().isLength({ max: 500 }).withMessage('Notes trop longues'),
  body('notes.admin').optional().isLength({ max: 500 }).withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier les permissions
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['status', 'notes', 'cancellation'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        reservation[field] = req.body[field];
      }
    });

    // Si la réservation est annulée, calculer le remboursement
    if (req.body.status === 'cancelled' && reservation.status !== 'cancelled') {
      reservation.cancellation.requestedAt = new Date();
      reservation.cancellation.refundAmount = reservation.calculateRefundAmount();
    }

    await reservation.save();

    // Populer les références pour la réponse
    await reservation.populate('vehicle', 'name brand model images');
    await reservation.populate('service', 'name category type');

    res.json(reservation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/reservations/:id
// @desc    Supprimer une réservation
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier les permissions
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier si la réservation peut être supprimée
    if (reservation.status === 'in-progress' || reservation.status === 'completed') {
      return res.status(400).json({ message: 'Impossible de supprimer une réservation en cours ou terminée' });
    }

    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Réservation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réservation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/reservations/admin/all
// @desc    Récupérer toutes les réservations (admin seulement)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const reservations = await Reservation.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('vehicle', 'name brand model licensePlate')
      .populate('service', 'name category type')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + reservations.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 