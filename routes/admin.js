const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
  }
  next();
};

// Appliquer le middleware admin à toutes les routes
router.use(auth, requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Obtenir les statistiques du tableau de bord admin
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Statistiques des véhicules
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ 'availability.isAvailable': true });

    // Statistiques des réservations
    const totalReservations = await Reservation.countDocuments();
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });
    const confirmedReservations = await Reservation.countDocuments({ status: 'confirmed' });
    const completedReservations = await Reservation.countDocuments({ status: 'completed' });

    // Statistiques des paiements
    const totalPayments = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Statistiques des documents
    const pendingDocuments = await Document.countDocuments({ status: 'pending' });

    // Réservations récentes
    const recentReservations = await Reservation.find()
      .populate('user', 'firstName lastName email')
      .populate('vehicle', 'name brand model')
      .sort({ createdAt: -1 })
      .limit(5);

    // Paiements récents
    const recentPayments = await Payment.find()
      .populate('user', 'firstName lastName email')
      .populate('reservation', 'startDate endDate')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        vehicles: {
          total: totalVehicles,
          available: availableVehicles
        },
        reservations: {
          total: totalReservations,
          pending: pendingReservations,
          confirmed: confirmedReservations,
          completed: completedReservations
        },
        payments: {
          total: totalPayments,
          revenue: totalRevenue[0]?.total || 0
        },
        documents: {
          pending: pendingDocuments
        }
      },
      recent: {
        reservations: recentReservations,
        payments: recentPayments
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/users
// @desc    Obtenir tous les utilisateurs avec pagination
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.isActive = status === 'active';

    const users = await User.find(filter)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + users.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/vehicles
// @desc    Obtenir tous les véhicules avec pagination
// @access  Private (Admin)
router.get('/vehicles', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (status) filter['availability.isAvailable'] = status === 'available';

    const vehicles = await Vehicle.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Vehicle.countDocuments(filter);

    res.json({
      vehicles,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + vehicles.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/reservations
// @desc    Obtenir toutes les réservations avec pagination
// @access  Private (Admin)
router.get('/reservations', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
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

// @route   GET /api/admin/payments
// @desc    Obtenir tous les paiements avec pagination
// @access  Private (Admin)
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;
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

// @route   GET /api/admin/documents
// @desc    Obtenir tous les documents avec pagination
// @access  Private (Admin)
router.get('/documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const documents = await Document.find(filter)
      .populate('user', 'firstName lastName email')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments(filter);

    res.json({
      documents,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + documents.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/reservations/:id/status
// @desc    Mettre à jour le statut d'une réservation
// @access  Private (Admin)
router.put('/reservations/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected']).withMessage('Statut invalide'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    reservation.status = status;
    if (notes) {
      reservation.notes.admin = notes;
    }

    await reservation.save();

    await reservation.populate('user', 'firstName lastName email');
    await reservation.populate('vehicle', 'name brand model');

    res.json(reservation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/vehicles/:id/availability
// @desc    Mettre à jour la disponibilité d'un véhicule
// @access  Private (Admin)
router.put('/vehicles/:id/availability', [
  body('isAvailable').isBoolean().withMessage('Disponibilité invalide'),
  body('maintenanceUntil').optional().isISO8601().withMessage('Date de maintenance invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isAvailable, maintenanceUntil } = req.body;

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    vehicle.availability.isAvailable = isAvailable;
    if (maintenanceUntil) {
      vehicle.availability.maintenanceUntil = new Date(maintenanceUntil);
    }

    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la disponibilité:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 