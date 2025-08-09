const express = require('express');
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/vehicles
// @desc    Récupérer tous les véhicules
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      minPrice,
      maxPrice,
      available,
      limit = 20,
      page = 1
    } = req.query;

    const filter = { isActive: true };

    // Filtres
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (available === 'true') filter['availability.isAvailable'] = true;
    if (minPrice || maxPrice) {
      filter['pricing.dailyRate'] = {};
      if (minPrice) filter['pricing.dailyRate'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['pricing.dailyRate'].$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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

// @route   GET /api/vehicles/:id
// @desc    Récupérer un véhicule par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Erreur lors de la récupération du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/vehicles
// @desc    Créer un nouveau véhicule
// @access  Private (Admin)
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('category').isIn(['citadine', 'touristique', 'utilitaire', 'sans-permis', 'remorque', 'materiel']).withMessage('Catégorie invalide'),
  body('type').isIn(['voiture', 'camion', 'fourgon', 'remorque', 'materiel']).withMessage('Type invalide'),
  body('brand').notEmpty().withMessage('La marque est requise'),
  body('model').notEmpty().withMessage('Le modèle est requis'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('licensePlate').notEmpty().withMessage('La plaque d\'immatriculation est requise'),
  body('color').notEmpty().withMessage('La couleur est requise'),
  body('pricing.dailyRate').isFloat({ min: 0 }).withMessage('Tarif journalier invalide'),
  body('pricing.weeklyRate').isFloat({ min: 0 }).withMessage('Tarif hebdomadaire invalide'),
  body('pricing.monthlyRate').isFloat({ min: 0 }).withMessage('Tarif mensuel invalide'),
  body('pricing.deposit').isFloat({ min: 0 }).withMessage('Caution invalide'),
  body('pricing.insurance').isFloat({ min: 0 }).withMessage('Tarif d\'assurance invalide'),
  body('description').notEmpty().withMessage('La description est requise'),
  body('location.address').notEmpty().withMessage('L\'adresse est requise'),
  body('location.city').notEmpty().withMessage('La ville est requise'),
  body('location.postalCode').notEmpty().withMessage('Le code postal est requis')
], async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Un véhicule avec cette plaque d\'immatriculation existe déjà' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Mettre à jour un véhicule
// @access  Private (Admin)
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('category').optional().isIn(['citadine', 'touristique', 'utilitaire', 'sans-permis', 'remorque', 'materiel']).withMessage('Catégorie invalide'),
  body('type').optional().isIn(['voiture', 'camion', 'fourgon', 'remorque', 'materiel']).withMessage('Type invalide'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Année invalide'),
  body('pricing.dailyRate').optional().isFloat({ min: 0 }).withMessage('Tarif journalier invalide'),
  body('pricing.weeklyRate').optional().isFloat({ min: 0 }).withMessage('Tarif hebdomadaire invalide'),
  body('pricing.monthlyRate').optional().isFloat({ min: 0 }).withMessage('Tarif mensuel invalide'),
  body('pricing.deposit').optional().isFloat({ min: 0 }).withMessage('Caution invalide'),
  body('pricing.insurance').optional().isFloat({ min: 0 }).withMessage('Tarif d\'assurance invalide')
], async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Supprimer un véhicule
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du véhicule:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/vehicles/categories
// @desc    Récupérer toutes les catégories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Vehicle.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/vehicles/types
// @desc    Récupérer tous les types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const types = await Vehicle.distinct('type');
    res.json(types);
  } catch (error) {
    console.error('Erreur lors de la récupération des types:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 