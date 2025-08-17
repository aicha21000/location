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

const updateKitDetails = async () => {
  try {
    await connectDB();

    // Trouver le Kit Déménagement Économique
    const product = await Product.findOne({ name: 'Kit Déménagement Économique' });
    
    if (!product) {
      console.log('❌ Kit Déménagement Économique non trouvé');
      return;
    }

    console.log('📦 Produit trouvé:');
    console.log('ID:', product._id);
    console.log('Nom:', product.name);

    // Mettre à jour la description avec des détails clairs
    product.description = `Kit de déménagement économique complet avec tous les essentiels pour un déménagement réussi. Parfait pour les petits budgets et les déménagements d'appartement.

**Contenu du kit :**
• 5 cartons double cannelure (format standard)
• 1 rouleau de ruban adhésif de déménagement (50m)
• 2 marqueurs permanents noirs
• 1 rouleau de papier de soie (protection fragile)
• 10 étiquettes de déménagement pré-imprimées
• 1 guide de déménagement imprimé

**Caractéristiques :**
• Cartons résistants et réutilisables
• Ruban adhésif haute adhérence
• Marqueurs à séchage rapide
• Papier de soie non-acide
• Étiquettes avec espaces pour nom et pièce

**Idéal pour :** Déménagement d'appartement, studio, ou petit logement.`;

    // Mettre à jour les caractéristiques avec une liste claire
    product.features = [
      '5 cartons double cannelure (format standard)',
      '1 rouleau de ruban adhésif de déménagement (50m)',
      '2 marqueurs permanents noirs',
      '1 rouleau de papier de soie (protection fragile)',
      '10 étiquettes de déménagement pré-imprimées',
      '1 guide de déménagement imprimé',
      'Cartons résistants et réutilisables',
      'Ruban adhésif haute adhérence',
      'Marqueurs à séchage rapide',
      'Papier de soie non-acide',
      'Étiquettes avec espaces pour nom et pièce'
    ];

    // Mettre à jour les métadonnées
    product.metadata = {
      weight: 2.5,
      dimensions: {
        length: 40,
        width: 30,
        height: 25
      },
      material: 'Carton recyclé',
      brand: 'LocationVoitures',
      model: 'Kit-Eco-2024',
      contents: [
        'Cartons double cannelure',
        'Ruban adhésif',
        'Marqueurs',
        'Papier de soie',
        'Étiquettes',
        'Guide'
      ]
    };

    // Mettre à jour les tags
    product.tags = [
      'déménagement',
      'économique',
      'kit',
      'cartons',
      'emballage',
      'ruban',
      'marqueurs',
      'papier de soie',
      'étiquettes',
      'guide'
    ];

    await product.save();

    console.log('\n✅ Détails du kit mis à jour avec succès!');
    console.log('Nouvelle description:', product.description.substring(0, 100) + '...');
    console.log('Caractéristiques:', product.features.length);
    console.log('Tags:', product.tags.length);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
updateKitDetails();
