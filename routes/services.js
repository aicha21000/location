const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/services
// @desc    Récupérer tous les services
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
    if (available === 'true') filter.isAvailable = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const services = await Service.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + services.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/services/:id
// @desc    Récupérer un service par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }
    res.json(service);
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/services
// @desc    Créer un nouveau service
// @access  Private (Admin)
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('category').isIn(['demenagement', 'remorque', 'materiel', 'kit', 'livraison']).withMessage('Catégorie invalide'),
  body('type').notEmpty().withMessage('Le type est requis'),
  body('description').notEmpty().withMessage('La description est requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Durée invalide'),
  body('isAvailable').optional().isBoolean().withMessage('Disponibilité invalide')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = new Service(req.body);
    await service.save();

    res.status(201).json(service);
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/services/:id
// @desc    Mettre à jour un service
// @access  Private (Admin)
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('category').optional().isIn(['demenagement', 'remorque', 'materiel', 'kit', 'livraison']).withMessage('Catégorie invalide'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Durée invalide'),
  body('isAvailable').optional().isBoolean().withMessage('Disponibilité invalide')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

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

    res.json(service);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/services/:id
// @desc    Supprimer un service
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/services/categories
// @desc    Récupérer toutes les catégories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/services/types
// @desc    Récupérer tous les types
// @access  Public
router.get('/types', async (req, res) => {
  try {
    const types = await Service.distinct('type');
    res.json(types);
  } catch (error) {
    console.error('Erreur lors de la récupération des types:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 