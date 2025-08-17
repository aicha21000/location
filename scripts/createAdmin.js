const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Fonction pour créer l'administrateur
const createAdmin = async () => {
  try {
    console.log('👤 Création de l\'administrateur...');
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  L\'administrateur existe déjà !');
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Rôle: ${existingAdmin.role}`);
      console.log(`   - ID: ${existingAdmin._id}`);
      return;
    }

    // Hash du mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Créer l'utilisateur administrateur avec le mot de passe hashé
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });

    // Sauvegarder l'admin
    await adminUser.save();
    
    console.log('✅ Administrateur créé avec succès !');
    console.log('\n📋 Informations de connexion :');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Mot de passe: ${adminData.password}`);
    console.log(`   - Rôle: ${adminUser.role}`);
    console.log(`   - ID: ${adminUser._id}`);
    
    console.log('\n💡 Vous pouvez maintenant vous connecter avec :');
    console.log('   - Frontend : http://localhost:3000/login');
    console.log('   - Email: admin@locationvoitures.com');
    console.log('   - Mot de passe: admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error.message);
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
    createAdmin();
  });
}

module.exports = { connectDB, createAdmin };
