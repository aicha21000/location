const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

const kits = [
  {
    name: 'Kit Déménagement Économique',
    description: 'Kit de déménagement économique avec l\'essentiel pour un déménagement réussi. Parfait pour les petits budgets.',
    price: 29.99,
    stock: 50,
    category: 'movingKit',
    type: 'movingKit',
    features: [
      '5 cartons double cannelure (format standard)',
      '1 rouleau de ruban adhésif de déménagement (50m)',
      '2 marqueurs permanents noirs',
      '1 rouleau de papier de soie (protection fragile)',
      '10 étiquettes de déménagement pré-imprimées',
      '1 guide de déménagement imprimé'
    ],
    tags: ['déménagement', 'économique', 'kit', 'cartons', 'emballage']
  },
  {
    name: 'Kit Déménagement Standard',
    description: 'Kit de déménagement complet avec tous les éléments nécessaires pour un déménagement sans stress.',
    price: 49.99,
    stock: 40,
    category: 'movingKit',
    type: 'movingKit',
    features: [
      '10 cartons double cannelure (formats variés)',
      '2 rouleaux de ruban adhésif de déménagement (50m chacun)',
      '3 marqueurs permanents (noir, bleu, rouge)',
      '2 rouleaux de papier de soie (protection fragile)',
      '1 rouleau de papier à bulles (protection renforcée)',
      '20 étiquettes de déménagement pré-imprimées',
      '1 guide de déménagement imprimé',
      '1 couverture de protection pour meubles'
    ],
    tags: ['déménagement', 'standard', 'kit', 'cartons', 'emballage', 'protection']
  },
  {
    name: 'Kit Déménagement Premium',
    description: 'Kit de déménagement premium avec tous les accessoires haut de gamme pour un déménagement professionnel.',
    price: 89.99,
    stock: 25,
    category: 'movingKit',
    type: 'movingKit',
    features: [
      '15 cartons double cannelure (formats variés)',
      '3 rouleaux de ruban adhésif de déménagement (50m chacun)',
      '5 marqueurs permanents (noir, bleu, rouge, vert, orange)',
      '3 rouleaux de papier de soie (protection fragile)',
      '2 rouleaux de papier à bulles (protection renforcée)',
      '1 rouleau de film étirable (protection supplémentaire)',
      '30 étiquettes de déménagement pré-imprimées',
      '1 guide de déménagement imprimé',
      '2 couvertures de protection pour meubles',
      '1 caisse à outils de déménagement',
      '1 mètre ruban de mesure',
      '1 paire de gants de protection'
    ],
    tags: ['déménagement', 'premium', 'kit', 'cartons', 'emballage', 'protection', 'professionnel']
  },
  {
    name: 'Kit Déménagement Luxe',
    description: 'Kit de déménagement luxe avec tous les accessoires premium et extras pour un déménagement de luxe.',
    price: 149.99,
    stock: 15,
    category: 'movingKit',
    type: 'movingKit',
    features: [
      '20 cartons double cannelure (formats variés)',
      '4 rouleaux de ruban adhésif de déménagement (50m chacun)',
      '6 marqueurs permanents (toutes couleurs)',
      '4 rouleaux de papier de soie (protection fragile)',
      '3 rouleaux de papier à bulles (protection renforcée)',
      '2 rouleaux de film étirable (protection supplémentaire)',
      '1 rouleau de papier kraft (emballage écologique)',
      '50 étiquettes de déménagement pré-imprimées',
      '1 guide de déménagement imprimé',
      '3 couvertures de protection pour meubles',
      '1 caisse à outils de déménagement premium',
      '1 mètre ruban de mesure',
      '2 paires de gants de protection',
      '1 coupe-carton professionnel',
      '1 lampe de poche LED',
      '1 planificateur de déménagement'
    ],
    tags: ['déménagement', 'luxe', 'kit', 'cartons', 'emballage', 'protection', 'premium', 'professionnel']
  }
];

const createMultipleKits = async () => {
  try {
    await connectDB();

    for (const kitData of kits) {
      // Vérifier si le kit existe déjà
      const existingKit = await Product.findOne({ name: kitData.name });
      
      if (existingKit) {
        console.log(`⚠️  Le kit "${kitData.name}" existe déjà`);
        continue;
      }

      // Créer le nouveau kit
      const kit = new Product({
        ...kitData,
        minStock: 5,
        isActive: true,
        metadata: {
          weight: 2.5 + (kits.indexOf(kitData) * 1.5),
          dimensions: {
            length: 40 + (kits.indexOf(kitData) * 5),
            width: 30 + (kits.indexOf(kitData) * 3),
            height: 25 + (kits.indexOf(kitData) * 2)
          },
          material: 'Carton recyclé',
          brand: 'LocationVoitures',
          model: `Kit-${kitData.name.split(' ')[2]}-2024`,
          contents: kitData.features.map(feature => feature.split(' ')[1])
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop&crop=center',
            alt: 'Cartons de déménagement empilés',
            isPrimary: true,
            order: 0
          },
          {
            url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop&crop=center',
            alt: 'Cartons et matériel d\'emballage',
            isPrimary: false,
            order: 1
          }
        ]
      });

      await kit.save();
      console.log(`✅ Kit "${kitData.name}" créé avec succès (${kitData.features.length} éléments)`);
    }

    console.log('\n🎉 Tous les kits ont été créés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la création des kits:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
createMultipleKits();
