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

// Données de test pour les véhicules
const vehiclesData = [
  {
    name: 'Renault Clio',
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
    licensePlate: 'AB-123-CD',
    color: 'Blanc',
    features: ['climatisation', 'gps', 'bluetooth', 'abs', 'esp', 'airbags'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Renault Clio',
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
      isAvailable: true,
      nextAvailableDate: new Date()
    },
    location: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    },
    description: 'Citadine moderne et économique, parfaite pour la ville',
    isActive: true
  },
  {
    name: 'Peugeot 208',
    category: 'citadine',
    type: 'voiture',
    brand: 'Peugeot',
    model: '208',
    year: 2023,
    fuelType: 'essence',
    transmission: 'automatique',
    seats: 5,
    doors: 5,
    engineSize: 1.2,
    power: 100,
    mileage: 8000,
    licensePlate: 'EF-456-GH',
    color: 'Bleu',
    features: ['climatisation', 'gps', 'bluetooth', 'camera-recul', 'abs', 'esp', 'airbags'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Peugeot 208',
        isPrimary: true
      }
    ],
    pricing: {
      dailyRate: 50,
      weeklyRate: 300,
      monthlyRate: 1300,
      deposit: 600,
      insurance: 18
    },
    availability: {
      isAvailable: true,
      nextAvailableDate: new Date()
    },
    location: {
      address: '456 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008'
    },
    description: 'Citadine élégante avec transmission automatique',
    isActive: true
  }
];

// Données de test pour les services
const servicesData = [
  {
    name: 'Remorque Utilitaire',
    category: 'remorque',
    type: 'location',
    description: 'Remorque robuste pour transport de marchandises',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Remorque utilitaire',
        isPrimary: true
      }
    ],
    pricing: {
      dailyRate: 35,
      weeklyRate: 200,
      monthlyRate: 800
    },
    availability: {
      isAvailable: true,
      nextAvailableDate: new Date()
    },
    location: {
      address: '789 Boulevard de la République',
      city: 'Paris',
      postalCode: '75011',
      coordinates: [2.3688, 48.8566]
    },
    isActive: true
  },
  {
    name: 'Service de Déménagement Complet',
    category: 'demenagement',
    type: 'service',
    description: 'Service complet incluant emballage, transport et déballage',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Service de déménagement',
        isPrimary: true
      }
    ],
    pricing: {
      price: 500,
      deposit: 200
    },
    availability: {
      isAvailable: true,
      nextAvailableDate: new Date()
    },
    location: {
      address: '321 Rue du Commerce',
      city: 'Paris',
      postalCode: '75015',
      coordinates: [2.2945, 48.8566]
    },
    isActive: true
  }
];

// Fonction pour initialiser la base de données
const initDatabase = async () => {
  try {
    console.log('🗑️  Suppression des données existantes...');
    await Vehicle.deleteMany({});
    await Service.deleteMany({});
    
    console.log('📝 Insertion des véhicules de test...');
    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`✅ ${vehicles.length} véhicules insérés`);
    
    console.log('📝 Insertion des services de test...');
    const services = await Service.insertMany(servicesData);
    console.log(`✅ ${services.length} services insérés`);
    
    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('\n📋 Données disponibles :');
    console.log(`   - Véhicules : ${vehicles.length}`);
    console.log(`   - Services : ${services.length}`);
    
    // Afficher les IDs pour les tests
    console.log('\n🆔 IDs des véhicules pour les tests :');
    vehicles.forEach(vehicle => {
      console.log(`   - ${vehicle.name}: ${vehicle._id}`);
    });
    
    console.log('\n🆔 IDs des services pour les tests :');
    services.forEach(service => {
      console.log(`   - ${service.name}: ${service._id}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
if (require.main === module) {
  connectDB().then(() => {
    initDatabase();
  });
}

module.exports = { connectDB, initDatabase };
