const mongoose = require('mongoose');
const User = require('../models/User');
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

// Données de l'administrateur à créer
const adminData = {
  firstName: 'Admin',
  lastName: 'Système',
  email: 'admin@locationvoitures.com',
  password: 'Admin123',
  phone: '+33123456789',
  role: 'admin',
  isActive: true,
  isVerified: true,
  address: {
    street: '123 Rue de l\'Administration',
    city: 'Paris',
    postalCode: '75001',
    country: 'France'
  },
  dateOfBirth: null,
  avatar: null,
  preferences: {
    language: 'fr',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  }
};

// Fonction pour recréer l'administrateur
const recreateAdmin = async () => {
  try {
    console.log('🗑️  Suppression de l\'ancien administrateur...');
    
    // Supprimer l'ancien admin s'il existe
    await User.deleteOne({ email: adminData.email });
    console.log('✅ Ancien administrateur supprimé');
    
    console.log('👤 Création du nouvel administrateur...');
    
    // Créer le nouvel utilisateur administrateur
    const adminUser = new User(adminData);

    // Sauvegarder l'admin
    await adminUser.save();
    
    console.log('✅ Nouvel administrateur créé avec succès !');
    console.log('\n📋 Informations de connexion :');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Mot de passe: ${adminData.password}`);
    console.log(`   - Rôle: ${adminUser.role}`);
    console.log(`   - ID: ${adminUser._id}`);
    
    console.log('\n💡 Vous pouvez maintenant vous connecter avec :');
    console.log('   - Frontend : http://localhost:3000/login');
    console.log('   - Email: admin@locationvoitures.com');
    console.log('   - Mot de passe: Admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la recréation de l\'administrateur:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
if (require.main === module) {
  connectDB().then(() => {
    recreateAdmin();
  });
}

module.exports = { connectDB, recreateAdmin };
