const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('phone').matches(/^(\+33|0)[1-9](\d{8})$/).withMessage('Numéro de téléphone invalide'),
  body('dateOfBirth').isISO8601().optional().withMessage('Date de naissance invalide'),
  body('drivingLicense.number').notEmpty().optional().withMessage('Numéro de permis requis'),
  body('drivingLicense.expiryDate').isISO8601().optional().withMessage('Date d\'expiration invalide'),
  body('address.street').notEmpty().optional().withMessage('Adresse requise'),
  body('address.city').notEmpty().optional().withMessage('Ville requise'),
  body('address.postalCode').notEmpty().optional().withMessage('Code postal requis')
], async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      drivingLicense,
      address
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Créer le nouvel utilisateur
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      drivingLicense,
      address
    });

    await user.save();

    // Générer le token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: user.toPublicJSON()
        });
      }
    );
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(400).json({ message: 'Compte désactivé' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Mettre à jour la dernière connexion
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // Générer le token JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: user.toPublicJSON()
        });
      }
    );
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Rafraîchir le token JWT
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Demande de réinitialisation de mot de passe
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email' });
    }

    // Générer un token de réinitialisation (expire dans 1 heure)
    const resetToken = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Envoyer un email avec le lien de réinitialisation
    // Pour l'instant, on retourne juste le token
    res.json({ 
      message: 'Un email de réinitialisation a été envoyé',
      resetToken // À supprimer en production
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Réinitialisation du mot de passe
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(400).json({ message: 'Token invalide' });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Token invalide' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 