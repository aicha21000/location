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

// Données des véhicules à ajouter
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
      isAvailable: true
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
      isAvailable: true
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

// Données des services à ajouter
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
      isAvailable: true
    },
    location: {
      address: '789 Boulevard de la République',
      city: 'Paris',
      postalCode: '75011'
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
    price: 500,
    availability: {
      isAvailable: true
    },
    location: {
      address: '321 Rue du Commerce',
      city: 'Paris',
      postalCode: '75015'
    },
    isActive: true
  }
];

// Fonction pour ajouter les véhicules et services
const addVehiclesAndServices = async () => {
  try {
    console.log('🚗 Ajout des véhicules...');
    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`✅ ${vehicles.length} véhicules ajoutés avec succès !`);
    
    console.log('📦 Ajout des services...');
    const services = await Service.insertMany(servicesData);
    console.log(`✅ ${services.length} services ajoutés avec succès !`);
    
    console.log('\n🎉 Toutes les données ont été ajoutées !');
    console.log('\n📋 Résumé :');
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
    
    console.log('\n💡 Vous pouvez maintenant tester :');
    console.log('   - Frontend : http://localhost:3000/vehicles');
    console.log('   - API : http://localhost:5000/api/vehicles');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error.message);
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
    addVehiclesAndServices();
  });
}

module.exports = { connectDB, addVehiclesAndServices };
