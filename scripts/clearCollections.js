const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
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

// Fonction pour supprimer les collections
const clearCollections = async () => {
  try {
    console.log('🗑️  Suppression des collections existantes...');
    
    // Supprimer les collections
    await Vehicle.deleteMany({});
    await Service.deleteMany({});
    
    console.log('✅ Collections vidées avec succès !');
    console.log('💡 Vous pouvez maintenant ajouter de nouveaux véhicules');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
if (require.main === module) {
  connectDB().then(() => {
    clearCollections();
  });
}

module.exports = { connectDB, clearCollections };
