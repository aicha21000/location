const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Service = require('../models/Service');
const config = require('./config');

async function testServiceOptions() {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Créer un service de déménagement de test
    const testService = new Service({
      name: 'Service de Déménagement Complet',
      category: 'demenagement',
      type: 'service',
      description: 'Service complet incluant emballage, transport et déballage',
      price: 500, // 500€/jour
      unit: 'jour',
      availability: {
        isAvailable: true,
        stock: 5
      },
      location: {
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345'
      }
    });

    await testService.save();
    console.log('✅ Service de déménagement créé');

    // Créer une réservation avec options
    const testReservation = new Reservation({
      user: new mongoose.Types.ObjectId(), // ID fictif pour le test
      service: testService._id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-16'), // 1 jour
      pickupLocation: {
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345'
      },
      returnLocation: {
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345'
      },
      pricing: {
        dailyRate: 500, // 500€/jour
        totalDays: 1,
        subtotal: 500, // 1 * 500€
        optionsPrice: 0,
        deposit: 0,
        totalAmount: 500,
        discount: 0
      },
             options: {
         insurance: true, // 50€ fixe
         packing: true, // 200€ fixe
         unpacking: true, // 150€ fixe
         furniture: false,
         delivery: true, // 80€ fixe
         setup: false,
         movingKit: true // 75€ fixe (kit physique)
       },
       movingKitDelivery: {
         date: new Date('2024-01-14'),
         time: '14:00',
         address: '123 Kit Delivery Street',
         city: 'Test City',
         postalCode: '12345',
         instructions: 'Livrer à l\'entrée principale'
       },
      payment: {
        method: 'stripe',
        status: 'pending'
      }
    });

    // Sauvegarder la réservation (le middleware va recalculer les prix)
    await testReservation.save();

    console.log('\n📊 Résultats du test des options pour service de déménagement :');
    console.log('===============================================================');
    console.log(`Service : ${testService.name}`);
    console.log(`Catégorie : ${testService.category}`);
    console.log(`Prix de base : ${testService.price}€/jour`);
    console.log(`Durée : ${testReservation.pricing.totalDays} jour`);
    console.log(`Prix de base total : ${testReservation.pricing.subtotal}€`);
    console.log(`Prix des options : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total : ${testReservation.pricing.totalAmount}€`);
    
         console.log('\n🔍 Détail des options :');
     console.log('======================');
     console.log(`Assurance déménagement (50€ fixe) : ${testReservation.options.insurance ? 'Oui' : 'Non'}`);
     console.log(`Emballage (200€ fixe) : ${testReservation.options.packing ? 'Oui' : 'Non'}`);
     console.log(`Déballage (150€ fixe) : ${testReservation.options.unpacking ? 'Oui' : 'Non'}`);
     console.log(`Démontage meubles (100€ fixe) : ${testReservation.options.furniture ? 'Oui' : 'Non'}`);
     console.log(`Livraison à domicile (80€ fixe) : ${testReservation.options.delivery ? 'Oui' : 'Non'}`);
     console.log(`Installation meubles (120€ fixe) : ${testReservation.options.setup ? 'Oui' : 'Non'}`);
     console.log(`Kit de déménagement (75€ fixe) : ${testReservation.options.movingKit ? 'Oui' : 'Non'}`);
     if (testReservation.options.movingKit && testReservation.movingKitDelivery) {
       console.log(`  - Date de livraison : ${testReservation.movingKitDelivery.date.toLocaleDateString()}`);
       console.log(`  - Adresse : ${testReservation.movingKitDelivery.address}, ${testReservation.movingKitDelivery.city} ${testReservation.movingKitDelivery.postalCode}`);
     }

         // Calcul manuel pour vérification
     const expectedOptionsPrice = 
       (testReservation.options.insurance ? 50 : 0) +
       (testReservation.options.packing ? 200 : 0) +
       (testReservation.options.unpacking ? 150 : 0) +
       (testReservation.options.furniture ? 100 : 0) +
       (testReservation.options.delivery ? 80 : 0) +
       (testReservation.options.setup ? 120 : 0) +
       (testReservation.options.movingKit ? 75 : 0);

    const expectedTotal = testReservation.pricing.subtotal + expectedOptionsPrice;

    console.log('\n✅ Vérification :');
    console.log('================');
    console.log(`Prix des options attendu : ${expectedOptionsPrice}€`);
    console.log(`Total attendu : ${expectedTotal}€`);
    console.log(`Prix des options calculé : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total calculé : ${testReservation.pricing.totalAmount}€`);
    
    if (testReservation.pricing.optionsPrice === expectedOptionsPrice && 
        testReservation.pricing.totalAmount === expectedTotal) {
      console.log('\n🎉 SUCCÈS : Le calcul des options pour les services fonctionne correctement !');
    } else {
      console.log('\n❌ ERREUR : Le calcul des options pour les services ne correspond pas aux attentes !');
    }

    // Nettoyer la base de données
    await Reservation.findByIdAndDelete(testReservation._id);
    await Service.findByIdAndDelete(testService._id);
    console.log('\n🧹 Données de test supprimées');

  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testServiceOptions();
