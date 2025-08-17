const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const config = require('./config');

async function testPricing() {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Créer une réservation de test avec options
    const testReservation = new Reservation({
      user: new mongoose.Types.ObjectId(), // ID fictif pour le test
      vehicle: new mongoose.Types.ObjectId(), // ID fictif pour le test
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
        dailyRate: 50, // 50€/jour
        totalDays: 2,
        subtotal: 100, // 2 * 50€
        optionsPrice: 0,
        deposit: 200,
        totalAmount: 100,
        discount: 0
      },
      options: {
        insurance: true, // 15€/jour
        gps: true, // 8€/jour
        childSeat: true, // 25€ fixe
        additionalDriver: false,
        unlimitedMileage: false
      },
      payment: {
        method: 'stripe',
        status: 'pending'
      }
    });

    // Sauvegarder la réservation (le middleware va recalculer les prix)
    await testReservation.save();

    console.log('\n📊 Résultats du test de calcul des prix :');
    console.log('==========================================');
    console.log(`Durée : ${testReservation.pricing.totalDays} jours`);
    console.log(`Prix de base : ${testReservation.pricing.subtotal}€`);
    console.log(`Prix des options : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total : ${testReservation.pricing.totalAmount}€`);
    
    console.log('\n🔍 Détail des options :');
    console.log('======================');
    console.log(`Assurance (15€/jour) : ${testReservation.options.insurance ? 'Oui' : 'Non'}`);
    console.log(`GPS (8€/jour) : ${testReservation.options.gps ? 'Oui' : 'Non'}`);
    console.log(`Siège enfant (25€ fixe) : ${testReservation.options.childSeat ? 'Oui' : 'Non'}`);
    console.log(`Conducteur supplémentaire (10€/jour) : ${testReservation.options.additionalDriver ? 'Oui' : 'Non'}`);
    console.log(`Kilométrage illimité (12€/jour) : ${testReservation.options.unlimitedMileage ? 'Oui' : 'Non'}`);

    // Calcul manuel pour vérification
    const expectedOptionsPrice = 
      (testReservation.options.insurance ? 2 * 15 : 0) +
      (testReservation.options.gps ? 2 * 8 : 0) +
      (testReservation.options.childSeat ? 25 : 0) +
      (testReservation.options.additionalDriver ? 2 * 10 : 0) +
      (testReservation.options.unlimitedMileage ? 2 * 12 : 0);

    const expectedTotal = testReservation.pricing.subtotal + expectedOptionsPrice;

    console.log('\n✅ Vérification :');
    console.log('================');
    console.log(`Prix des options attendu : ${expectedOptionsPrice}€`);
    console.log(`Total attendu : ${expectedTotal}€`);
    console.log(`Prix des options calculé : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total calculé : ${testReservation.pricing.totalAmount}€`);
    
    if (testReservation.pricing.optionsPrice === expectedOptionsPrice && 
        testReservation.pricing.totalAmount === expectedTotal) {
      console.log('\n🎉 SUCCÈS : Le calcul des prix fonctionne correctement !');
    } else {
      console.log('\n❌ ERREUR : Le calcul des prix ne correspond pas aux attentes !');
    }

    // Nettoyer la base de données
    await Reservation.findByIdAndDelete(testReservation._id);
    console.log('\n🧹 Réservation de test supprimée');

  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testPricing();
