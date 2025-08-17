const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
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

// Test simple d'ajout d'un véhicule
const testAddVehicle = async () => {
  try {
    console.log('🧪 Test d\'ajout d\'un véhicule...');
    
    // Supprimer les véhicules existants
    await Vehicle.deleteMany({});
    console.log('🗑️  Véhicules existants supprimés');
    
    // Créer un véhicule simple
    const testVehicle = new Vehicle({
      name: 'Renault Clio Test',
      category: 'citadine',
      type: 'voiture',
      brand: 'Renault',
      model: 'Clio',
      year: 2022,
      fuelType: 'essence',
      transmission: 'manuelle',
      seats: 5,
      doors: 5,
      engineSize: 1.0,
      power: 75,
      mileage: 15000,
      licensePlate: 'TEST-123',
      color: 'Blanc',
      features: ['climatisation', 'gps'],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          alt: 'Renault Clio Test',
          isPrimary: true
        }
      ],
      pricing: {
        dailyRate: 45,
        weeklyRate: 280,
        monthlyRate: 1200,
        deposit: 500,
        insurance: 15
      },
      availability: {
        isAvailable: true
      },
      location: {
        address: '123 Rue de Test',
        city: 'Paris',
        postalCode: '75001'
      },
      description: 'Véhicule de test pour développement'
    });
    
    const savedVehicle = await testVehicle.save();
    console.log('✅ Véhicule ajouté avec succès !');
    console.log(`   - ID: ${savedVehicle._id}`);
    console.log(`   - Nom: ${savedVehicle.name}`);
    console.log(`   - Prix: ${savedVehicle.pricing.dailyRate}€/jour`);
    
    // Tester la récupération
    const retrievedVehicle = await Vehicle.findById(savedVehicle._id);
    console.log('✅ Véhicule récupéré avec succès !');
    console.log(`   - Disponible: ${retrievedVehicle.availability.isAvailable}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
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

// Exécuter le test
if (require.main === module) {
  connectDB().then(() => {
    testAddVehicle();
  });
}

module.exports = { connectDB, testAddVehicle };
