const axios = require('axios');

const testApi = async () => {
  try {
    console.log('🧪 Test de l\'API des services...\n');
    
    // Test 1: Récupérer tous les services
    console.log('1️⃣ Test GET /api/services');
    const response = await axios.get('http://localhost:5000/api/services');
    console.log(`✅ Status: ${response.status}`);
    console.log(`📦 Services trouvés: ${response.data.services.length}`);
    
    if (response.data.services.length > 0) {
      console.log('\n📋 Détails des services:');
      response.data.services.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} - ${service.price}€ (${service.category})`);
      });
    }
    
    // Test 2: Récupérer les services par catégorie
    console.log('\n2️⃣ Test GET /api/services?category=remorque');
    const response2 = await axios.get('http://localhost:5000/api/services?category=remorque');
    console.log(`✅ Status: ${response2.status}`);
    console.log(`📦 Services remorque trouvés: ${response2.data.services.length}`);
    
    // Test 3: Récupérer les catégories
    console.log('\n3️⃣ Test GET /api/services/categories');
    const response3 = await axios.get('http://localhost:5000/api/services/categories');
    console.log(`✅ Status: ${response3.status}`);
    console.log(`📂 Catégories disponibles: ${response3.data.join(', ')}`);
    
    console.log('\n🎉 Tous les tests API sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || 'Aucun message'}`);
    }
  }
};

// Exécuter le test
testApi();
