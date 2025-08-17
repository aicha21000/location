const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Document = require('../models/Document');
const Product = require('../models/Product');
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

// @route   GET /api/admin/stats
// @desc    Obtenir les statistiques du tableau de bord admin
// @access  Private (Admin)
router.get('/stats', async (req, res) => {
  try {
    // Statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Statistiques des véhicules
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ isAvailable: true });

    // Statistiques des services
    const totalServices = await Service.countDocuments();

    // Statistiques des réservations
    const totalReservations = await Reservation.countDocuments();
    const pendingReservations = await Reservation.countDocuments({ status: 'pending' });
    
    // Statistiques des paiements
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      totalVehicles,
      totalServices,
      totalReservations,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingReservations
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/recent-activity
// @desc    Obtenir l'activité récente
// @access  Private (Admin)
router.get('/recent-activity', async (req, res) => {
  try {
    const recentReservations = await Reservation.find()
      .populate('user', 'firstName lastName email')
      .populate('vehicle', 'brand model')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      reservations: recentReservations,
      users: recentUsers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité récente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES UTILISATEURS ====================

// @route   GET /api/admin/users
// @desc    Obtenir tous les utilisateurs
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/admin/users
// @desc    Créer un nouvel utilisateur
// @access  Private (Admin)
router.post('/users', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').matches(/^(\+33|0)[1-9](\d{8})$/).withMessage('Numéro de téléphone invalide'),
  body('role').isIn(['user', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, role, isActive, isVerified, address } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true,
      isVerified: isVerified !== undefined ? isVerified : true,
      address,
      password: 'tempPassword123' // Mot de passe temporaire
    });

    await user.save();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Modifier un utilisateur
// @access  Private (Admin)
router.put('/users/:id', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('phone').matches(/^(\+33|0)[1-9](\d{8})$/).withMessage('Numéro de téléphone invalide'),
  body('role').isIn(['user', 'admin']).withMessage('Rôle invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, role, isActive, isVerified, address } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
      }
    }

    // Mettre à jour l'utilisateur
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.role = role;
    user.isActive = isActive;
    user.isVerified = isVerified;
    user.address = address;

    await user.save();

    res.json({
      message: 'Utilisateur modifié avec succès',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de l'admin principal
    if (user.role === 'admin' && user.email === 'admin@locationvoitures.com') {
      return res.status(400).json({ message: 'Impossible de supprimer l\'administrateur principal' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PATCH /api/admin/users/:id/status
// @desc    Changer le statut d'un utilisateur
// @access  Private (Admin)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES VÉHICULES ====================

// @route   GET /api/admin/vehicles
// @desc    Obtenir tous les véhicules
// @access  Private (Admin)
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Erreur lors de la récupération des véhicules:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/admin/vehicles
// @desc    Créer un nouveau véhicule
// @access  Private (Admin)
router.post('/vehicles', [
  body('brand').trim().notEmpty().withMessage('Marque requise'),
  body('model').trim().notEmpty().withMessage('Modèle requis'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('licensePlate').trim().notEmpty().withMessage('Plaque d\'immatriculation requise'),
  body('dailyRate').isFloat({ min: 0 }).withMessage('Prix journalier invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Adapter les données du frontend au modèle Vehicle
    const vehicleData = {
      name: `${req.body.brand} ${req.body.model}`,
      category: req.body.category || 'citadine',
      type: req.body.category === 'car' ? 'voiture' : 'voiture',
      brand: req.body.brand,
      model: req.body.model,
      year: req.body.year,
      fuelType: req.body.fuelType || 'essence',
      transmission: req.body.transmission || 'manuelle',
      seats: req.body.seats || 5,
      doors: req.body.seats >= 5 ? 5 : 3,
      engineSize: 1.6,
      power: 100,
      mileage: 50000,
      licensePlate: req.body.licensePlate,
      color: 'Blanc',
      features: req.body.features || [],
      images: req.body.images || [],
      pricing: {
        dailyRate: req.body.dailyRate,
        weeklyRate: req.body.weeklyRate || req.body.dailyRate * 7,
        monthlyRate: req.body.monthlyRate || req.body.dailyRate * 30,
        deposit: 500,
        insurance: 15
      },
      availability: {
        isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true
      },
      location: req.body.location || {
        address: 'Adresse par défaut',
        city: 'Ville par défaut',
        postalCode: '75000'
      },
      description: req.body.description || `Véhicule ${req.body.brand} ${req.body.model} de ${req.body.year}`,
      isActive: true
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      message: 'Véhicule créé avec succès',
      vehicle
    });
  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/vehicles/:id
// @desc    Modifier un véhicule
// @access  Private (Admin)
router.put('/vehicles/:id', [
  body('brand').trim().notEmpty().withMessage('Marque requise'),
  body('model').trim().notEmpty().withMessage('Modèle requis'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('licensePlate').trim().notEmpty().withMessage('Plaque d\'immatriculation requise'),
  body('dailyRate').isFloat({ min: 0 }).withMessage('Prix journalier invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Adapter les données du frontend au modèle Vehicle
    const vehicleData = {
      name: `${req.body.brand} ${req.body.model}`,
      category: req.body.category || 'citadine',
      type: req.body.category === 'car' ? 'voiture' : 'voiture',
      brand: req.body.brand,
      model: req.body.model,
      year: req.body.year,
      fuelType: req.body.fuelType || 'essence',
      transmission: req.body.transmission || 'manuelle',
      seats: req.body.seats || 5,
      doors: req.body.seats >= 5 ? 5 : 3,
      engineSize: 1.6,
      power: 100,
      mileage: 50000,
      licensePlate: req.body.licensePlate,
      color: 'Blanc',
      features: req.body.features || [],
      images: req.body.images || [],
      pricing: {
        dailyRate: req.body.dailyRate,
        weeklyRate: req.body.weeklyRate || req.body.dailyRate * 7,
        monthlyRate: req.body.monthlyRate || req.body.dailyRate * 30,
        deposit: 500,
        insurance: 15
      },
      availability: {
        isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true
      },
      location: req.body.location || {
        address: 'Adresse par défaut',
        city: 'Ville par défaut',
        postalCode: '75000'
      },
      description: req.body.description || `Véhicule ${req.body.brand} ${req.body.model} de ${req.body.year}`,
      isActive: true
    };

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      vehicleData,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    res.json({
      message: 'Véhicule modifié avec succès',
      vehicle
    });
  } catch (error) {
    console.error('Erreur lors de la modification du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/admin/vehicles/:id
// @desc    Supprimer un véhicule
// @access  Private (Admin)
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    // Vérifier s'il y a des réservations actives pour ce véhicule
    const activeReservations = await Reservation.find({
      vehicle: req.params.id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce véhicule car il a des réservations actives' 
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PATCH /api/admin/vehicles/:id/status
// @desc    Changer le statut d'un véhicule
// @access  Private (Admin)
router.patch('/vehicles/:id/status', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    vehicle.availability.isAvailable = isAvailable;
    await vehicle.save();

    res.json({
      message: `Véhicule ${isAvailable ? 'marqué comme disponible' : 'marqué comme indisponible'}`,
      vehicle
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES SERVICES ====================

// @route   GET /api/admin/services
// @desc    Obtenir tous les services
// @access  Private (Admin)
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/admin/services
// @desc    Créer un nouveau service
// @access  Private (Admin)
router.post('/services', [
  body('name').trim().notEmpty().withMessage('Nom du service requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = new Service(req.body);
    await service.save();

    res.status(201).json({
      message: 'Service créé avec succès',
      service
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/services/:id
// @desc    Modifier un service
// @access  Private (Admin)
router.put('/services/:id', [
  body('name').trim().notEmpty().withMessage('Nom du service requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    res.json({
      message: 'Service modifié avec succès',
      service
    });
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/admin/services/:id
// @desc    Supprimer un service
// @access  Private (Admin)
router.delete('/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    // Vérifier s'il y a des réservations actives pour ce service
    const activeReservations = await Reservation.find({
      service: req.params.id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce service car il a des réservations actives' 
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PATCH /api/admin/services/:id/status
// @desc    Changer le statut d'un service
// @access  Private (Admin)
router.patch('/services/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    service.isActive = isActive;
    await service.save();

    res.json({
      message: `Service ${isActive ? 'activé' : 'désactivé'} avec succès`,
      service
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES PRODUITS ====================

// @route   GET /api/admin/products
// @desc    Obtenir tous les produits
// @access  Private (Admin)
router.get('/products', async (req, res) => {
  try {
    const { category, search, status, limit = 50, page = 1 } = req.query;
    
    let query = {};
    
    // Filtre par catégorie
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filtre par statut
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Obtenir un produit spécifique
// @access  Private (Admin)
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('-__v');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/admin/products
// @desc    Créer un nouveau produit
// @access  Private (Admin)
router.post('/products', [
  body('name').trim().notEmpty().withMessage('Nom du produit requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('category').trim().notEmpty().withMessage('Catégorie requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      name,
      description,
      price,
      stock,
      minStock,
      category,
      features,
      images,
      metadata,
      tags,
      isActive
    } = req.body;
    
    // Créer le produit
    const product = new Product({
      type: type || 'movingKit',
      name,
      description,
      price,
      stock: stock || 0,
      minStock: minStock || 5,
      category,
      features: features || [],
      images: images || [],
      metadata: metadata || {},
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Modifier un produit
// @access  Private (Admin)
router.put('/products/:id', [
  body('name').trim().notEmpty().withMessage('Nom du produit requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('category').trim().notEmpty().withMessage('Catégorie requise')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      name,
      description,
      price,
      stock,
      minStock,
      category,
      features,
      images,
      metadata,
      tags,
      isActive
    } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Mettre à jour les champs
    if (type !== undefined) product.type = type;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (minStock !== undefined) product.minStock = minStock;
    if (category !== undefined) product.category = category;
    if (features !== undefined) product.features = features;
    if (images !== undefined) product.images = images;
    if (metadata !== undefined) product.metadata = metadata;
    if (tags !== undefined) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;
    
    product.updatedAt = new Date();
    
    await product.save();
    
    res.json({
      message: 'Produit modifié avec succès',
      product
    });
  } catch (error) {
    console.error('Erreur lors de la modification du produit:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Supprimer un produit
// @access  Private (Admin)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Vérifier s'il y a des commandes associées
    const ProductOrder = require('../models/ProductOrder');
    const ordersCount = await ProductOrder.countDocuments({ product: req.params.id });
    
    if (ordersCount > 0) {
      return res.status(400).json({ 
        message: `Impossible de supprimer ce produit. Il y a ${ordersCount} commande(s) associée(s).` 
      });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PATCH /api/admin/products/:id/status
// @desc    Changer le statut d'un produit
// @access  Private (Admin)
router.patch('/products/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    product.isActive = isActive;
    await product.save();

    res.json({
      message: `Produit ${isActive ? 'activé' : 'désactivé'} avec succès`,
      product
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES RÉSERVATIONS ====================

// @route   GET /api/admin/reservations
// @desc    Obtenir toutes les réservations
// @access  Private (Admin)
router.get('/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'firstName lastName email phone')
      .populate('vehicle', 'brand model licensePlate')
      .populate('service', 'name category')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/reservations/:id/status
// @desc    Modifier le statut d'une réservation
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
      reservation.adminNotes = notes;
    }

    await reservation.save();

    await reservation.populate('user', 'firstName lastName email');
    await reservation.populate('vehicle', 'brand model');

    res.json({
      message: `Statut de la réservation mis à jour: ${status}`,
      reservation
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== GESTION DES PAIEMENTS ====================

// @route   GET /api/admin/payments
// @desc    Obtenir tous les paiements
// @access  Private (Admin)
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'firstName lastName email phone')
      .populate('reservation', 'startDate endDate totalAmount')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/admin/payments/:id/status
// @desc    Modifier le statut d'un paiement
// @access  Private (Admin)
router.put('/payments/:id/status', [
  body('status').isIn(['paid', 'pending', 'failed', 'refunded']).withMessage('Statut invalide'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes trop longues')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }

    payment.status = status;
    if (notes) {
      payment.adminNotes = notes;
    }

    await payment.save();

    await payment.populate('user', 'firstName lastName email');
    await payment.populate('reservation', 'startDate endDate');

    res.json({
      message: `Statut du paiement mis à jour: ${status}`,
      payment
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 