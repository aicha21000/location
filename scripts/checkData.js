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

// Fonction pour vérifier les données
const checkData = async () => {
  try {
    console.log('🔍 Vérification des données dans MongoDB...\n');
    
    // Vérifier les véhicules
    const vehicles = await Vehicle.find({});
    console.log(`🚗 Véhicules (${vehicles.length}) :`);
    if (vehicles.length > 0) {
      vehicles.forEach(vehicle => {
        console.log(`   - ${vehicle.name} (${vehicle.licensePlate}) - ${vehicle.pricing?.dailyRate}€/jour`);
      });
    } else {
      console.log('   Aucun véhicule trouvé');
    }
    
    console.log('\n📦 Services :');
    const services = await Service.find({});
    console.log(`   Services (${services.length}) :`);
    if (services.length > 0) {
      services.forEach(service => {
        console.log(`   - ${service.name} - ${service.price}€`);
      });
    } else {
      console.log('   Aucun service trouvé');
    }
    
    console.log('\n📊 Résumé :');
    console.log(`   - Total véhicules : ${vehicles.length}`);
    console.log(`   - Total services : ${services.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
if (require.main === module) {
  connectDB().then(() => {
    checkData();
  });
}

module.exports = { connectDB, checkData };
