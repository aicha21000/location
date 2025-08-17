const mongoose = require('mongoose');
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

// Fonction pour réinitialiser complètement la base de données
const resetDatabase = async () => {
  try {
    console.log('🗑️  Suppression complète de la base de données...');
    
    // Supprimer complètement la base de données
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Base de données supprimée');
    
    console.log('🎉 Base de données réinitialisée avec succès !');
    console.log('💡 Vous pouvez maintenant utiliser le dashboard admin pour ajouter des véhicules');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
};

// Exécuter le script
if (require.main === module) {
  connectDB().then(() => {
    resetDatabase();
  });
}

module.exports = { connectDB, resetDatabase };
