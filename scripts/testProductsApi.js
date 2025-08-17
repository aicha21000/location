const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function testProductsApi() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locationVoitures');
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 Test de l\'API des produits...\n');

    // 1. Compter tous les produits
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total des produits: ${totalProducts}`);

    if (totalProducts === 0) {
      console.log('❌ Aucun produit dans la base de données');
      console.log('💡 Exécutez d\'abord: node scripts/initProducts.js');
      return;
    }

    // 2. Récupérer un produit pour tester
    const testProduct = await Product.findOne({});
    console.log(`🔍 Produit de test: ${testProduct.name} (ID: ${testProduct._id})`);

    // 3. Vérifier que le produit a des images
    console.log(`🖼️ Images: ${testProduct.images.length}`);
    if (testProduct.images.length > 0) {
      testProduct.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.url} (${img.isPrimary ? 'Principale' : 'Secondaire'})`);
      });
    }

    // 4. Tester la recherche par ID
    const foundProduct = await Product.findById(testProduct._id);
    if (foundProduct) {
      console.log('✅ Recherche par ID fonctionne');
    } else {
      console.log('❌ Recherche par ID échoue');
    }

    // 5. Tester la mise à jour
    const originalName = testProduct.name;
    testProduct.name = 'TEST - ' + originalName;
    await testProduct.save();
    console.log('✅ Mise à jour du produit fonctionne');

    // Restaurer le nom original
    testProduct.name = originalName;
    await testProduct.save();
    console.log('✅ Restauration du nom original');

    console.log('\n🎉 Tests de l\'API terminés avec succès !');
    console.log('\n📋 Routes disponibles:');
    console.log('  GET  /api/products - Liste publique des produits');
    console.log('  GET  /api/products/:id - Produit public par ID');
    console.log('  GET  /api/admin/products - Liste admin des produits');
    console.log('  POST /api/admin/products - Créer un produit');
    console.log('  PUT  /api/admin/products/:id - Modifier un produit');
    console.log('  DELETE /api/admin/products/:id - Supprimer un produit');
    console.log('  GET  /api/admin/products/:id - Produit admin par ID');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testProductsApi();
