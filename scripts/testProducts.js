const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const Product = require('../models/Product');

// Configuration de la base de données
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';

// Fonction de test
async function testProducts() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Test 1: Compter les produits
    console.log('\n📊 Test 1: Nombre de produits dans la base');
    const totalProducts = await Product.countDocuments();
    console.log(`Total des produits: ${totalProducts}`);

    // Test 2: Lister tous les produits
    console.log('\n📋 Test 2: Liste de tous les produits');
    const allProducts = await Product.find({}).select('name category price stock images');
    allProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.category}) - ${product.price}€ - Stock: ${product.stock} - Images: ${product.images?.length || 0}`);
    });

    // Test 3: Rechercher par catégorie
    console.log('\n🔍 Test 3: Recherche par catégorie (movingKit)');
    const movingKitProducts = await Product.find({ category: 'movingKit' });
    console.log(`Produits de type movingKit: ${movingKitProducts.length}`);
    movingKitProducts.forEach(product => {
      console.log(`  - ${product.name} - ${product.price}€`);
    });

    // Test 4: Recherche textuelle
    console.log('\n🔍 Test 4: Recherche textuelle (déménagement)');
    const searchResults = await Product.find({ $text: { $search: 'déménagement' } });
    console.log(`Résultats de recherche: ${searchResults.length}`);
    searchResults.forEach(product => {
      console.log(`  - ${product.name} - ${product.description.substring(0, 50)}...`);
    });

    // Test 5: Produits avec stock faible
    console.log('\n⚠️  Test 5: Produits avec stock faible');
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    console.log(`Produits avec stock faible: ${lowStockProducts.length}`);
    lowStockProducts.forEach(product => {
      console.log(`  - ${product.name}: Stock ${product.stock}/${product.minStock}`);
    });

    // Test 6: Produits actifs
    console.log('\n✅ Test 6: Produits actifs');
    const activeProducts = await Product.find({ isActive: true });
    console.log(`Produits actifs: ${activeProducts.length}`);

    // Test 7: Produits avec images
    console.log('\n🖼️  Test 7: Produits avec images');
    const productsWithImages = await Product.find({
      'images.0': { $exists: true }
    });
    console.log(`Produits avec images: ${productsWithImages.length}`);
    productsWithImages.forEach(product => {
      const primaryImage = product.images.find(img => img.isPrimary);
      console.log(`  - ${product.name}: ${product.images.length} images, principale: ${primaryImage ? 'Oui' : 'Non'}`);
    });

    // Test 8: Statistiques par catégorie
    console.log('\n📈 Test 8: Statistiques par catégorie');
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    categoryStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} produits, stock total: ${stat.totalStock}, prix moyen: ${stat.avgPrice.toFixed(2)}€`);
    });

    console.log('\n🎉 Tests des produits terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
    process.exit(0);
  }
}

// Exécuter le script
if (require.main === module) {
  testProducts();
}

module.exports = { testProducts };
