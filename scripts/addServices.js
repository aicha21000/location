const mongoose = require('mongoose');
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

// Données des services à ajouter
const servicesData = [
  {
    name: 'Remorque Utilitaire',
    category: 'remorque',
    type: 'location',
    description: 'Remorque robuste pour transport de marchandises',
    price: 35,
    duration: 1,
    unit: 'jour',
    features: ['robuste', 'transport', 'marchandises'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Remorque utilitaire',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 5
    },
    location: {
      address: '789 Boulevard de la République',
      city: 'Paris',
      postalCode: '75011'
    },
    isActive: true
  },
  {
    name: 'Remorque Moto',
    category: 'remorque',
    type: 'location',
    description: 'Remorque spécialement conçue pour le transport de motos',
    price: 25,
    duration: 1,
    unit: 'jour',
    features: ['spécialisée moto', 'sécurisée', 'facile à utiliser'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Remorque moto',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 8
    },
    location: {
      address: '789 Boulevard de la République',
      city: 'Paris',
      postalCode: '75011'
    },
    isActive: true
  },
  {
    name: 'Remorque Voiture',
    category: 'remorque',
    type: 'location',
    description: 'Remorque plateforme pour transport de véhicules',
    price: 45,
    duration: 1,
    unit: 'jour',
    features: ['plateforme', 'transport véhicules', 'rampe incluse'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Remorque voiture',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 3
    },
    location: {
      address: '789 Boulevard de la République',
      city: 'Paris',
      postalCode: '75011'
    },
    isActive: true
  },
  {
    name: 'Diable de Déménagement',
    category: 'materiel',
    type: 'location',
    description: 'Diable robuste pour déplacer des charges lourdes',
    price: 15,
    duration: 1,
    unit: 'jour',
    features: ['robuste', 'roues pivotantes', 'charge jusqu\'à 300kg'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Diable de déménagement',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 20
    },
    location: {
      address: '456 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008'
    },
    isActive: true
  },
  {
    name: 'Monte-Meubles',
    category: 'materiel',
    type: 'location',
    description: 'Monte-meubles électrique pour étages élevés',
    price: 80,
    duration: 1,
    unit: 'jour',
    features: ['électrique', 'hauteur jusqu\'à 30m', 'plateforme stable'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Monte-meubles',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 2
    },
    location: {
      address: '456 Avenue des Champs',
      city: 'Paris',
      postalCode: '75008'
    },
    isActive: true
  },
  {
    name: 'Kit Déménagement Standard',
    category: 'kit',
    type: 'vente',
    description: 'Kit complet avec cartons, protections et accessoires',
    price: 45,
    duration: 1,
    unit: 'unite',
    features: ['20 cartons', 'papier bulle', 'scotch', 'marqueurs'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Kit déménagement standard',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 50
    },
    location: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    },
    isActive: true
  },
  {
    name: 'Kit Déménagement Premium',
    category: 'kit',
    type: 'vente',
    description: 'Kit premium avec cartons renforcés et protections haute qualité',
    price: 75,
    duration: 1,
    unit: 'unite',
    features: ['30 cartons renforcés', 'papier bulle premium', 'scotch renforcé', 'marqueurs', 'coussins d\'angle'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Kit déménagement premium',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 25
    },
    location: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    },
    isActive: true
  },
  {
    name: 'Service de Déménagement Complet',
    category: 'demenagement',
    type: 'service',
    description: 'Service complet incluant emballage, transport et déballage',
    price: 500,
    duration: 1,
    unit: 'unite',
    features: ['emballage', 'transport', 'déballage', 'professionnel'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Service de déménagement',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 10
    },
    location: {
      address: '321 Rue du Commerce',
      city: 'Paris',
      postalCode: '75015'
    },
    isActive: true
  },
  {
    name: 'Service Déménagement Express',
    category: 'demenagement',
    type: 'service',
    description: 'Déménagement rapide en 24h pour situations urgentes',
    price: 800,
    duration: 1,
    unit: 'unite',
    features: ['24h', 'équipe dédiée', 'transport express', 'installation rapide'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Service déménagement express',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 5
    },
    location: {
      address: '321 Rue du Commerce',
      city: 'Paris',
      postalCode: '75015'
    },
    isActive: true
  },
  {
    name: 'Livraison de Meubles',
    category: 'livraison',
    type: 'service',
    description: 'Livraison à domicile de meubles et objets encombrants',
    price: 80,
    duration: 1,
    unit: 'unite',
    features: ['livraison domicile', 'installation', 'déballage', 'service client'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Livraison de meubles',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 15
    },
    location: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    },
    isActive: true
  },
  {
    name: 'Livraison Express',
    category: 'livraison',
    type: 'service',
    description: 'Livraison express en 2h pour Paris et banlieue',
    price: 120,
    duration: 1,
    unit: 'unite',
    features: ['2h', 'Paris + banlieue', 'suivi GPS', 'signature électronique'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Livraison express',
        isPrimary: true
      }
    ],
    availability: {
      isAvailable: true,
      stock: 8
    },
    location: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001'
    },
    isActive: true
  }
];

// Fonction pour ajouter les services
const addServices = async () => {
  try {
    console.log('📦 Ajout des services...');
    const services = await Service.insertMany(servicesData);
    console.log(`✅ ${services.length} services ajoutés avec succès !`);
    
    console.log('\n🎉 Tous les services ont été ajoutés !');
    console.log('\n📋 Services ajoutés :');
    services.forEach(service => {
      console.log(`   - ${service.name}: ${service.price}€`);
    });
    
    console.log('\n💡 Vous pouvez maintenant tester :');
    console.log('   - Frontend : http://localhost:3000/services');
    console.log('   - API : http://localhost:5000/api/services');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des services:', error.message);
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
    addServices();
  });
}

module.exports = { connectDB, addServices };
