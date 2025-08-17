const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function testAdminProducts() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locationVoitures');
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 Test de la route admin des produits...\n');

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

    console.log('\n🎉 Test de la base de données terminé !');
    console.log('\n📋 Maintenant testez dans votre frontend :');
    console.log('1. Redémarrez le serveur backend');
    console.log('2. Rafraîchissez la page frontend');
    console.log('3. Allez dans Gestion des produits (admin)');
    console.log('4. Vérifiez que les produits se chargent sans erreur 404');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testAdminProducts();
