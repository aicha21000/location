const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const services = [
  {
    name: 'Remorque de déménagement',
    category: 'remorque',
    type: 'demenagement',
    description: 'Remorque robuste pour tous vos déménagements. Capacité de charge jusqu\'à 1000kg.',
    price: 45,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Remorque de déménagement',
        isPrimary: true
      },
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop',
        alt: 'Remorque vue de côté',
        isPrimary: false
      }
    ],
    features: ['Capacité 1000kg', 'Ridelles rabattables', 'Pneus tout-terrain'],
    requirements: ['Permis B', 'Âge minimum 21 ans'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Kit de déménagement complet',
    category: 'kit',
    type: 'demenagement',
    description: 'Kit complet incluant cartons, ruban adhésif, papier bulle et accessoires.',
    price: 25,
    duration: 7,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Kit de déménagement',
        isPrimary: true
      },
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Cartons et accessoires',
        isPrimary: false
      }
    ],
    features: ['20 cartons', 'Ruban adhésif', 'Papier bulle', 'Marqueurs'],
    requirements: ['Caution de 50€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Matériel de manutention',
    category: 'materiel',
    type: 'demenagement',
    description: 'Diable, transpalette et équipements de manutention pour faciliter vos déménagements.',
    price: 35,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Matériel de manutention',
        isPrimary: true
      }
    ],
    features: ['Diable robuste', 'Transpalette', 'Sangles de levage'],
    requirements: ['Formation recommandée'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Service de livraison express',
    category: 'livraison',
    type: 'livraison',
    description: 'Service de livraison rapide dans toute la région parisienne.',
    price: 60,
    duration: 2,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Service de livraison',
        isPrimary: true
      }
    ],
    features: ['Livraison en 2h', 'Suivi GPS', 'Signature électronique'],
    requirements: ['Adresse complète', 'Téléphone de contact'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  }
];

async function initServices() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locationVoitures');
    console.log('✅ Connecté à MongoDB');

    // Supprimer tous les services existants
    await Service.deleteMany({});
    console.log('🗑️ Services existants supprimés');

    // Insérer les nouveaux services
    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} services créés avec succès`);

    // Afficher les services créés
    console.log('\n📋 Services créés :');
    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}) - ${service.price}€`);
      console.log(`  Images: ${service.images.length}`);
    });

    console.log('\n🎉 Initialisation des services terminée !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

initServices();
