const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Service = require('../models/Service');
const config = require('./config');

async function testServicePricing() {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Créer un service de test
    const testService = new Service({
      name: 'Service de test',
      category: 'demenagement',
      type: 'remorque',
      description: 'Service de test pour vérifier le calcul des prix',
      price: 30, // 30€/jour
      unit: 'jour',
      availability: {
        isAvailable: true,
        stock: 5
      }
    });

    await testService.save();
    console.log('✅ Service de test créé');

    // Créer une réservation de service de test avec options
    const testReservation = new Reservation({
      user: new mongoose.Types.ObjectId(), // ID fictif pour le test
      service: testService._id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-17'), // 2 jours
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
        dailyRate: 30, // 30€/jour
        totalDays: 2,
        subtotal: 60, // 2 * 30€
        optionsPrice: 0,
        deposit: 0,
        totalAmount: 60,
        discount: 0
      },
      options: {
        delivery: true, // 50€ fixe
        pickup: true, // 50€ fixe
        setup: false,
        packing: false,
        unpacking: false,
        furniture: false
      },
      payment: {
        method: 'stripe',
        status: 'pending'
      }
    });

    // Sauvegarder la réservation (le middleware va recalculer les prix)
    await testReservation.save();

    console.log('\n📊 Résultats du test de calcul des prix pour service :');
    console.log('=====================================================');
    console.log(`Service : ${testService.name}`);
    console.log(`Prix de base : ${testService.price}€/jour`);
    console.log(`Durée : ${testReservation.pricing.totalDays} jours`);
    console.log(`Prix de base total : ${testReservation.pricing.subtotal}€`);
    console.log(`Prix des options : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total : ${testReservation.pricing.totalAmount}€`);
    
    console.log('\n🔍 Détail des options :');
    console.log('======================');
    console.log(`Livraison (50€ fixe) : ${testReservation.options.delivery ? 'Oui' : 'Non'}`);
    console.log(`Reprise (50€ fixe) : ${testReservation.options.pickup ? 'Oui' : 'Non'}`);
    console.log(`Installation (40€ fixe) : ${testReservation.options.setup ? 'Oui' : 'Non'}`);
    console.log(`Emballage (200€ fixe) : ${testReservation.options.packing ? 'Oui' : 'Non'}`);
    console.log(`Déballage (150€ fixe) : ${testReservation.options.unpacking ? 'Oui' : 'Non'}`);
    console.log(`Démontage meubles (100€ fixe) : ${testReservation.options.furniture ? 'Oui' : 'Non'}`);

    // Calcul manuel pour vérification
    const expectedOptionsPrice = 
      (testReservation.options.delivery ? 50 : 0) +
      (testReservation.options.pickup ? 50 : 0) +
      (testReservation.options.setup ? 40 : 0) +
      (testReservation.options.packing ? 200 : 0) +
      (testReservation.options.unpacking ? 150 : 0) +
      (testReservation.options.furniture ? 100 : 0);

    const expectedTotal = testReservation.pricing.subtotal + expectedOptionsPrice;

    console.log('\n✅ Vérification :');
    console.log('================');
    console.log(`Prix des options attendu : ${expectedOptionsPrice}€`);
    console.log(`Total attendu : ${expectedTotal}€`);
    console.log(`Prix des options calculé : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total calculé : ${testReservation.pricing.totalAmount}€`);
    
    if (testReservation.pricing.optionsPrice === expectedOptionsPrice && 
        testReservation.pricing.totalAmount === expectedTotal) {
      console.log('\n🎉 SUCCÈS : Le calcul des prix pour les services fonctionne correctement !');
    } else {
      console.log('\n❌ ERREUR : Le calcul des prix pour les services ne correspond pas aux attentes !');
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
testServicePricing();
