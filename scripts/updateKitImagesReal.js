const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const realMovingImages = [
  {
    url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop&crop=center',
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
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center',
    alt: 'Cartons vides prêts pour le déménagement',
    isPrimary: false,
    order: 2
  },
  {
    url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop&crop=center',
    alt: 'Kit complet de déménagement économique',
    isPrimary: false,
    order: 3
  },
  {
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&crop=center',
    alt: 'Matériel d\'emballage abordable',
    isPrimary: false,
    order: 4
  }
];

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

const updateKitImages = async () => {
  try {
    await connectDB();

    // Trouver le Kit Déménagement Économique
    const product = await Product.findOne({ name: 'Kit Déménagement Économique' });
    
    if (!product) {
      console.log('❌ Kit Déménagement Économique non trouvé');
      return;
    }

    console.log('📦 Produit trouvé:');
    console.log('ID:', product._id);
    console.log('Nom:', product.name);
    console.log('Images actuelles:', product.images.length);

    // Afficher les images actuelles
    if (product.images && product.images.length > 0) {
      console.log('\n🖼️  Images actuelles:');
      product.images.forEach((img, index) => {
        console.log(`${index + 1}. ${img.url || img}`);
      });
    }

    // Mettre à jour les images
    product.images = realMovingImages;
    await product.save();

    console.log('\n✅ Images mises à jour avec succès!');
    console.log('Nouvelles images:', product.images.length);

    // Afficher les nouvelles images
    console.log('\n🖼️  Nouvelles images:');
    product.images.forEach((img, index) => {
      console.log(`${index + 1}. ${img.url} (${img.alt})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
updateKitImages();
