const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const services = [
  {
    name: 'Service de déménagement Premium',
    category: 'demenagement',
    type: 'premium',
    description: 'Service de déménagement haut de gamme avec équipe professionnelle, emballage complet et montage/démontage de meubles.',
    price: 120,
    duration: 8,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Service de déménagement premium',
        isPrimary: true
      },
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop',
        alt: 'Équipe de déménagement',
        isPrimary: false
      }
    ],
    features: ['Équipe de 4 personnes', 'Emballage complet', 'Montage/démontage meubles', 'Assurance incluse'],
    requirements: ['Réservation 48h à l\'avance', 'Accès facile au logement'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Service de déménagement Standard',
    category: 'demenagement',
    type: 'standard',
    description: 'Service de déménagement classique avec équipe de 2 personnes pour vos déménagements essentiels.',
    price: 80,
    duration: 6,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Service de déménagement standard',
        isPrimary: true
      }
    ],
    features: ['Équipe de 2 personnes', 'Transport des meubles', 'Déplacement local'],
    requirements: ['Réservation 24h à l\'avance'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Service de déménagement Express',
    category: 'demenagement',
    type: 'express',
    description: 'Service de déménagement rapide pour urgences et déménagements de dernière minute.',
    price: 150,
    duration: 4,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Service de déménagement express',
        isPrimary: true
      }
    ],
    features: ['Intervention en 2h', 'Équipe disponible 24/7', 'Service prioritaire'],
    requirements: ['Supplément urgence', 'Disponibilité immédiate'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Remorque de déménagement Grande capacité',
    category: 'remorque',
    type: 'grande-capacite',
    description: 'Remorque de grande capacité pour déménagements volumineux. Capacité de charge jusqu\'à 2000kg.',
    price: 65,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Remorque grande capacité',
        isPrimary: true
      },
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop',
        alt: 'Remorque vue de côté',
        isPrimary: false
      }
    ],
    features: ['Capacité 2000kg', 'Ridelles rabattables', 'Pneus tout-terrain', 'Éclairage LED'],
    requirements: ['Permis B', 'Âge minimum 21 ans', 'Caution 200€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Remorque de déménagement Standard',
    category: 'remorque',
    type: 'standard',
    description: 'Remorque standard pour déménagements moyens. Capacité de charge jusqu\'à 1000kg.',
    price: 45,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=300&fit=crop',
        alt: 'Remorque standard',
        isPrimary: true
      }
    ],
    features: ['Capacité 1000kg', 'Ridelles rabattables', 'Pneus tout-terrain'],
    requirements: ['Permis B', 'Âge minimum 21 ans', 'Caution 150€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Kit de déménagement Premium',
    category: 'kit',
    type: 'premium',
    description: 'Kit de déménagement premium avec cartons renforcés, papier bulle haute densité et accessoires professionnels.',
    price: 45,
    duration: 14,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Kit de déménagement premium',
        isPrimary: true
      },
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Cartons et accessoires premium',
        isPrimary: false
      }
    ],
    features: ['30 cartons renforcés', 'Papier bulle haute densité', 'Ruban adhésif professionnel', 'Marqueurs permanents', 'Étiquettes colorées'],
    requirements: ['Caution de 100€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Kit de déménagement Standard',
    category: 'kit',
    type: 'standard',
    description: 'Kit de déménagement standard avec cartons, ruban adhésif et accessoires essentiels.',
    price: 25,
    duration: 7,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Kit de déménagement standard',
        isPrimary: true
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
    name: 'Matériel de manutention Premium',
    category: 'materiel',
    type: 'premium',
    description: 'Équipement de manutention professionnel incluant diable électrique, transpalette et accessoires de levage.',
    price: 75,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Matériel de manutention premium',
        isPrimary: true
      }
    ],
    features: ['Diable électrique', 'Transpalette hydraulique', 'Sangles de levage', 'Chariot élévateur', 'Formation incluse'],
    requirements: ['Formation obligatoire', 'Caution 300€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Matériel de manutention Standard',
    category: 'materiel',
    type: 'standard',
    description: 'Équipement de manutention standard avec diable, transpalette et accessoires de base.',
    price: 35,
    duration: 24,
    unit: 'jour',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=300&fit=crop',
        alt: 'Matériel de manutention standard',
        isPrimary: true
      }
    ],
    features: ['Diable robuste', 'Transpalette', 'Sangles de levage'],
    requirements: ['Formation recommandée', 'Caution 150€'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Service de livraison Premium',
    category: 'livraison',
    type: 'premium',
    description: 'Service de livraison premium avec suivi GPS, signature électronique et emballage professionnel.',
    price: 90,
    duration: 4,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Service de livraison premium',
        isPrimary: true
      }
    ],
    features: ['Livraison en 4h', 'Suivi GPS en temps réel', 'Signature électronique', 'Emballage professionnel', 'Assurance complète'],
    requirements: ['Adresse complète', 'Téléphone de contact', 'Disponibilité réception'],
    location: {
      address: '123 Rue de la Location',
      city: 'Paris',
      postalCode: '75001'
    }
  },
  {
    name: 'Service de livraison Express',
    category: 'livraison',
    type: 'express',
    description: 'Service de livraison rapide pour urgences et livraisons de dernière minute.',
    price: 60,
    duration: 2,
    unit: 'heure',
    isActive: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&h=300&fit=crop',
        alt: 'Service de livraison express',
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

async function restoreServices() {
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
    console.log('\n📋 Services restaurés :');
    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}) - ${service.price}€`);
      console.log(`  Type: ${service.type}`);
      console.log(`  Images: ${service.images.length}`);
    });

    console.log('\n🎉 Restauration des services terminée !');
    console.log('📊 Services par catégorie :');
    const categories = await Service.distinct('category');
    categories.forEach(category => {
      const count = createdServices.filter(s => s.category === category).length;
      console.log(`  ${category}: ${count} services`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

restoreServices();
