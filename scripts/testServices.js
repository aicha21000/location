const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

async function testServices() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locationVoitures');
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 Test des services dans la base de données...\n');

    // 1. Compter tous les services
    const totalServices = await Service.countDocuments();
    console.log(`📊 Total des services: ${totalServices}`);

    // 2. Lister tous les services avec leurs images
    const allServices = await Service.find({});
    console.log('\n📋 Services avec images:');
    allServices.forEach(service => {
      console.log(`- ${service.name} (${service.category})`);
      console.log(`  Prix: ${service.price}€`);
      console.log(`  Images: ${service.images.length}`);
      if (service.images.length > 0) {
        service.images.forEach((img, index) => {
          console.log(`    ${index + 1}. ${img.url} (${img.isPrimary ? 'Principale' : 'Secondaire'})`);
        });
      }
      console.log('');
    });

    // 3. Vérifier les services par catégorie
    const categories = await Service.distinct('category');
    console.log('🏷️ Catégories disponibles:', categories);

    // 4. Vérifier les services actifs vs inactifs
    const activeServices = await Service.countDocuments({ isActive: true });
    const inactiveServices = await Service.countDocuments({ isActive: false });
    console.log(`\n📈 Services actifs: ${activeServices}, Inactifs: ${inactiveServices}`);

    // 5. Vérifier les services avec des images
    const servicesWithImages = await Service.countDocuments({ 'images.0': { $exists: true } });
    console.log(`🖼️ Services avec images: ${servicesWithImages}`);

    console.log('\n🎉 Tests terminés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testServices();
