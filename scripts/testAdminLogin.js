const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';
    await mongoose.connect(mongoURI);
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

// Test de connexion admin
const testAdminLogin = async () => {
  try {
    await connectDB();
    
    // Récupérer l'utilisateur admin
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ Aucun utilisateur admin trouvé');
      return;
    }
    
    console.log('👤 Utilisateur admin trouvé:');
    console.log(`   - Nom: ${admin.firstName} ${admin.lastName}`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Rôle: ${admin.role}`);
    console.log(`   - Actif: ${admin.isActive}`);
    console.log(`   - Vérifié: ${admin.isVerified}`);
    
    // Test de connexion avec le mot de passe
    const testPassword = 'Admin123'; // Mot de passe par défaut
    const isMatch = await admin.comparePassword(testPassword);
    
    if (isMatch) {
      console.log('✅ Mot de passe correct');
      console.log('🔑 Identifiants de connexion:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Mot de passe: ${testPassword}`);
    } else {
      console.log('❌ Mot de passe incorrect');
      console.log('💡 Vérifiez le mot de passe dans le script createAdmin.js');
    }
    
    // Test de génération de token JWT
    const jwt = require('jsonwebtoken');
    const payload = {
      user: {
        id: admin.id,
        role: admin.role
      }
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'location-voitures-jwt-secret-2024-super-securise', { expiresIn: '7d' });
    console.log('🔐 Token JWT généré:', token.substring(0, 50) + '...');
    
    // Test de décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'location-voitures-jwt-secret-2024-super-securise');
    console.log('✅ Token JWT valide');
    console.log(`   - User ID: ${decoded.user.id}`);
    console.log(`   - Role: ${decoded.user.role}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le test
testAdminLogin();

