const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Configuration Multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// @route   GET /api/documents
// @desc    Récupérer les documents de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const documents = await Document.find(filter)
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

// @route   GET /api/documents/:id
// @desc    Récupérer un document par ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Vérifier que l'utilisateur peut accéder à ce document
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(document);
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/documents
// @desc    Uploader un nouveau document
// @access  Private
router.post('/', [
  auth,
  upload.single('file'),
  body('type').isIn(['permis-conduire', 'carte-identite', 'justificatif-domicile', 'assurance', 'autre']).withMessage('Type de document invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Fichier requis' });
    }

    const { type, description } = req.body;

    // TODO: Upload vers Firebase Storage
    // Pour l'instant, on simule l'upload
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/documents%2F${Date.now()}_${req.file.originalname}`;

    const document = new Document({
      user: req.user.id,
      type,
      description: description || '',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: fileUrl,
      status: 'pending'
    });

    await document.save();

    res.status(201).json(document);
  } catch (error) {
    console.error('Erreur lors de l\'upload du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/documents/:id
// @desc    Mettre à jour un document
// @access  Private
router.put('/:id', [
  auth,
  body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Statut invalide'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description trop longue')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Vérifier les permissions
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour les champs autorisés
    const allowedFields = ['status', 'description'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        document[field] = req.body[field];
      }
    });

    await document.save();
    res.json(document);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Supprimer un document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Vérifier les permissions
    if (document.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // TODO: Supprimer le fichier de Firebase Storage

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/documents/admin/all
// @desc    Récupérer tous les documents (admin seulement)
// @access  Private (Admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

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

// @route   PUT /api/documents/:id/approve
// @desc    Approuver un document (admin seulement)
// @access  Private (Admin)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    document.status = 'approved';
    document.reviewedBy = req.user.id;
    document.reviewedAt = new Date();

    await document.save();
    res.json(document);
  } catch (error) {
    console.error('Erreur lors de l\'approbation du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/documents/:id/reject
// @desc    Rejeter un document (admin seulement)
// @access  Private (Admin)
router.put('/:id/reject', [
  auth,
  body('reason').notEmpty().withMessage('Raison du rejet requise')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    document.status = 'rejected';
    document.reviewedBy = req.user.id;
    document.reviewedAt = new Date();
    document.rejectionReason = reason;

    await document.save();
    res.json(document);
  } catch (error) {
    console.error('Erreur lors du rejet du document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 