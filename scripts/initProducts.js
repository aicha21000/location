const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Product = require('../models/Product');

// Configuration de la base de données
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';

// Produits de test
const testProducts = [
  {
    type: 'movingKit',
    name: 'Kit Déménagement Premium',
    description: 'Kit complet pour déménagement avec cartons, ruban adhésif, papier bulle et marqueurs. Idéal pour un déménagement professionnel.',
    price: 45.99,
    stock: 25,
    minStock: 5,
    category: 'movingKit',
    features: [
      'Cartons de différentes tailles (petit, moyen, grand)',
      'Ruban adhésif renforcé (5 rouleaux)',
      'Papier bulle de protection (10m²)',
      'Marqueurs permanents (3 unités)',
      'Ficelles et étiquettes',
      'Instructions de déménagement'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
        alt: 'Kit de déménagement complet',
        isPrimary: true,
        order: 0
      },
      {
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop',
        alt: 'Cartons et matériaux d\'emballage',
        isPrimary: false,
        order: 1
      },
      {
        url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&h=300&fit=crop',
        alt: 'Matériaux de protection',
        isPrimary: false,
        order: 2
      }
    ],
    metadata: {
      weight: 2.5,
      dimensions: {
        length: 60,
        width: 40,
        height: 30
      },
      material: 'Carton, plastique, papier',
      brand: 'MovePro',
      model: 'Premium Kit'
    },
    tags: ['déménagement', 'cartons', 'protection', 'premium'],
    isActive: true
  },
  {
    type: 'packingMaterials',
    name: 'Cartons Double Canelure',
    description: 'Cartons robustes double cannelure pour objets lourds et fragiles. Résistance exceptionnelle pour un emballage sécurisé.',
    price: 2.99,
    stock: 150,
    minStock: 20,
    category: 'packingMaterials',
    features: [
      'Double cannelure pour une résistance maximale',
      'Dimensions standardisées',
      'Facilement empilables',
      'Recyclables',
      'Certifiés qualité'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&h=300&fit=crop',
        alt: 'Cartons double cannelure',
        isPrimary: true,
        order: 0
      },
      {
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop',
        alt: 'Cartons empilés',
        isPrimary: false,
        order: 1
      }
    ],
    metadata: {
      weight: 0.8,
      dimensions: {
        length: 50,
        width: 30,
        height: 25
      },
      material: 'Carton double cannelure',
      brand: 'PackSecure',
      model: 'DC-50x30x25'
    },
    tags: ['cartons', 'double cannelure', 'robuste', 'standard'],
    isActive: true
  },
  {
    type: 'furnitureProtection',
    name: 'Couvertures de Protection',
    description: 'Couvertures spéciales pour protéger les meubles pendant le transport et le stockage. Matériau résistant et réutilisable.',
    price: 15.99,
    stock: 8,
    minStock: 10,
    category: 'furnitureProtection',
    features: [
      'Matériau résistant aux déchirures',
      'Protection contre les rayures',
      'Réutilisables',
      'Faciles à nettoyer',
      'Plusieurs tailles disponibles'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop',
        alt: 'Couvertures de protection meubles',
        isPrimary: true,
        order: 0
      },
      {
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop',
        alt: 'Protection en action',
        isPrimary: false,
        order: 1
      }
    ],
    metadata: {
      weight: 0.5,
      dimensions: {
        length: 200,
        width: 150,
        height: 0.1
      },
      material: 'Tissu synthétique renforcé',
      brand: 'FurniGuard',
      model: 'Protect-200x150'
    },
    tags: ['protection', 'meubles', 'couvertures', 'transport'],
    isActive: true
  },
  {
    type: 'packingMaterials',
    name: 'Papier de Soie de Protection',
    description: 'Papier de soie de haute qualité pour envelopper les objets fragiles et délicats. Protection douce et efficace.',
    price: 8.99,
    stock: 45,
    minStock: 15,
    category: 'packingMaterials',
    features: [
      'Papier de soie premium',
      'Protection douce',
      'Idéal pour la vaisselle',
      'Environnemental',
      'Rouleau de 50m'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop',
        alt: 'Papier de soie de protection',
        isPrimary: true,
        order: 0
      }
    ],
    metadata: {
      weight: 0.3,
      dimensions: {
        length: 50,
        width: 0.5,
        height: 0.5
      },
      material: 'Papier de soie',
      brand: 'SoftWrap',
      model: 'Silk-50m'
    },
    tags: ['papier', 'soie', 'protection', 'fragile', 'vaisselle'],
    isActive: true
  },
  {
    type: 'movingKit',
    name: 'Kit Déménagement Économique',
    description: 'Kit de déménagement abordable avec l\'essentiel pour un déménagement réussi. Parfait pour les petits budgets.',
    price: 29.99,
    stock: 35,
    minStock: 8,
    category: 'movingKit',
    features: [
      'Cartons de base (petit et moyen)',
      'Ruban adhésif standard',
      'Papier journal de protection',
      'Marqueur simple',
      'Guide de déménagement'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500&h=300&fit=crop',
        alt: 'Kit déménagement économique',
        isPrimary: true,
        order: 0
      }
    ],
    metadata: {
      weight: 1.8,
      dimensions: {
        length: 50,
        width: 35,
        height: 25
      },
      material: 'Carton, plastique, papier',
      brand: 'MoveBasic',
      model: 'Economy Kit'
    },
    tags: ['déménagement', 'économique', 'basique', 'petit budget'],
    isActive: true
  }
];

// Fonction principale
async function initProducts() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Vider la collection des produits
    console.log('🗑️  Suppression des produits existants...');
    await Product.deleteMany({});
    console.log('✅ Collection des produits vidée');

    // Insérer les nouveaux produits
    console.log('📦 Insertion des produits de test...');
    const insertedProducts = await Product.insertMany(testProducts);
    console.log(`✅ ${insertedProducts.length} produits insérés avec succès`);

    // Afficher un résumé
    console.log('\n📊 Résumé des produits insérés:');
    insertedProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.category}) - ${product.price}€ - Stock: ${product.stock}`);
    });

    console.log('\n🎉 Initialisation des produits terminée avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  initProducts();
}

module.exports = { initProducts, testProducts };
