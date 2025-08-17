const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin requis.' });
  }
  next();
};

// GET /api/products - Récupérer tous les produits (public)
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    // Filtre par catégorie
    if (category && category !== 'all') {
      query.category = category;
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

// Routes protégées par authentification admin - DOIT ÊTRE AVANT LES ROUTES AVEC PARAMÈTRES
router.use(auth, adminAuth);

// GET /api/admin/products - Récupérer tous les produits (admin)
router.get('/admin/products', async (req, res) => {
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

// GET /api/admin/products/:id - Récupérer un produit spécifique (admin)
router.get('/admin/products/:id', async (req, res) => {
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

// POST /api/admin/products - Créer un nouveau produit
router.post('/admin/products', async (req, res) => {
  try {
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
      tags
    } = req.body;
    
    // Validation des données
    if (!type || !name || !description || !price || !category) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }
    
    if (price < 0) {
      return res.status(400).json({ message: 'Le prix ne peut pas être négatif' });
    }
    
    if (stock < 0) {
      return res.status(400).json({ message: 'Le stock ne peut pas être négatif' });
    }
    
    // Créer le produit
    const product = new Product({
      type,
      name,
      description,
      price,
      stock: stock || 0,
      minStock: minStock || 5,
      category,
      features: features || [],
      images: images || [],
      metadata: metadata || {},
      tags: tags || []
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

// PUT /api/admin/products/:id - Modifier un produit
router.put('/admin/products/:id', async (req, res) => {
  try {
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

// DELETE /api/admin/products/:id - Supprimer un produit
router.delete('/admin/products/:id', async (req, res) => {
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

// GET /api/products/:id - Récupérer un produit spécifique (public) - DOIT ÊTRE APRÈS LES ROUTES ADMIN
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('-__v');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    if (!product.isActive) {
      return res.status(404).json({ message: 'Produit non disponible' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
