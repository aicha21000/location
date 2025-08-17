const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const kitDeménagementÉconomique = {
  type: 'movingKit',
  name: 'Kit Déménagement Économique',
  description: 'Kit de déménagement abordable avec l\'essentiel pour un déménagement réussi. Parfait pour les petits budgets.',
  price: 29.99,
  stock: 50,
  minStock: 5,
  category: 'movingKit',
  features: [
    'Cartons double cannelure (5 unités)',
    'Rouleau de ruban adhésif (1 unité)',
    'Marqueurs permanents (2 unités)',
    'Papier de soie pour protection (1 rouleau)',
    'Étiquettes de déménagement (10 unités)',
    'Guide de déménagement inclus'
  ],
  images: [
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center',
      alt: 'Cartons de déménagement empilés',
      isPrimary: true,
      order: 0
    },
    {
      url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&crop=center',
      alt: 'Cartons et matériel d\'emballage',
      isPrimary: false,
      order: 1
    },
    {
      url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop&crop=center',
      alt: 'Cartons vides prêts pour le déménagement',
      isPrimary: false,
      order: 2
    },
    {
      url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&crop=center',
      alt: 'Kit complet de déménagement économique',
      isPrimary: false,
      order: 3
    },
    {
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center',
      alt: 'Matériel d\'emballage abordable',
      isPrimary: false,
      order: 4
    }
  ],
  metadata: {
    weight: 2.5,
    dimensions: {
      length: 40,
      width: 30,
      height: 25
    },
    material: 'Carton recyclé',
    brand: 'LocationVoitures',
    model: 'Kit-Eco-2024'
  },
  tags: ['déménagement', 'économique', 'kit', 'cartons', 'emballage'],
  isActive: true
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

const addKitDeménagementÉconomique = async () => {
  try {
    await connectDB();

    // Vérifier si le produit existe déjà
    const existingProduct = await Product.findOne({ name: kitDeménagementÉconomique.name });
    
    if (existingProduct) {
      console.log('⚠️  Le Kit Déménagement Économique existe déjà');
      console.log('ID:', existingProduct._id);
      console.log('Nom:', existingProduct.name);
      console.log('Prix:', existingProduct.price);
      console.log('Stock:', existingProduct.stock);
      console.log('Images:', existingProduct.images.length);
      
      // Mettre à jour les images si nécessaire
      if (!existingProduct.images || existingProduct.images.length === 0) {
        existingProduct.images = kitDeménagementÉconomique.images;
        await existingProduct.save();
        console.log('✅ Images mises à jour pour le produit existant');
      }
      
      return;
    }

    // Créer le nouveau produit
    const product = new Product(kitDeménagementÉconomique);
    await product.save();

    console.log('✅ Kit Déménagement Économique ajouté avec succès');
    console.log('ID:', product._id);
    console.log('Nom:', product.name);
    console.log('Prix:', product.price);
    console.log('Stock:', product.stock);
    console.log('Images:', product.images.length);
    console.log('Catégorie:', product.category);
    console.log('Statut:', product.isActive ? 'Actif' : 'Inactif');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du produit:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
addKitDeménagementÉconomique();
