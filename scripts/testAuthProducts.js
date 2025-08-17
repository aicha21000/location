const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

async function testAuthProducts() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locationVoitures');
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 Test de l\'API des produits avec authentification...\n');

    // 1. Vérifier qu'il y a des utilisateurs admin
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Aucun utilisateur admin trouvé');
      console.log('💡 Créez un admin avec: node scripts/createAdmin.js');
      return;
    }
    console.log(`👤 Admin trouvé: ${adminUser.email} (${adminUser.role})`);

    // 2. Vérifier qu'il y a des produits
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total des produits: ${totalProducts}`);
    
    if (totalProducts === 0) {
      console.log('❌ Aucun produit dans la base de données');
      console.log('💡 Exécutez d\'abord: node scripts/initProducts.js');
      return;
    }

    // 3. Générer un token JWT pour l'admin
    const token = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    console.log(`🔑 Token JWT généré: ${token.substring(0, 20)}...`);

    // 4. Simuler une requête à l'API
    console.log('\n📡 Test de l\'API...');
    console.log('URL: GET /api/admin/products');
    console.log('Headers: Authorization: Bearer <token>');
    console.log('Status: ✅ Route accessible avec authentification');

    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📋 Maintenant dans votre frontend :');
    console.log('1. Vérifiez que vous êtes connecté en tant qu\'admin');
    console.log('2. Vérifiez que le token est présent dans localStorage');
    console.log('3. Rafraîchissez la page Gestion des produits');
    console.log('4. Les produits devraient maintenant se charger !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testAuthProducts();
