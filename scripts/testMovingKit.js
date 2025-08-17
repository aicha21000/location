const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Service = require('../models/Service');
const config = require('./config');

async function testMovingKit() {
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

    // Test avec kit de déménagement uniquement
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
        insurance: false,
        packing: false,
        unpacking: false,
        furniture: false,
        delivery: false,
        setup: false,
        movingKit: true // 75€ fixe (kit physique)
      },
      movingKitDelivery: {
        date: new Date('2024-01-14'),
        time: '14:00',
        address: '456 Kit Delivery Avenue',
        city: 'Kit City',
        postalCode: '54321',
        instructions: 'Livrer à l\'interphone, code 1234'
      },
      payment: {
        method: 'stripe',
        status: 'pending'
      }
    });

    // Sauvegarder la réservation (le middleware va recalculer les prix)
    await testReservation.save();

    console.log('\n📦 Test du kit de déménagement :');
    console.log('=================================');
    console.log(`Service : ${testService.name}`);
    console.log(`Catégorie : ${testService.category}`);
    console.log(`Prix de base : ${testService.price}€/jour`);
    console.log(`Durée : ${testReservation.pricing.totalDays} jour`);
    console.log(`Prix de base total : ${testReservation.pricing.subtotal}€`);
    console.log(`Prix des options : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total : ${testReservation.pricing.totalAmount}€`);
    
    console.log('\n🔍 Détail du kit de déménagement :');
    console.log('===================================');
    console.log(`Kit de déménagement (75€ fixe) : ${testReservation.options.movingKit ? 'Oui' : 'Non'}`);
    
    if (testReservation.options.movingKit && testReservation.movingKitDelivery) {
      console.log(`📦 Date de livraison : ${testReservation.movingKitDelivery.date.toLocaleDateString()}`);
      console.log(`📦 Heure de livraison : ${testReservation.movingKitDelivery.time || 'Non spécifiée'}`);
      console.log(`📦 Adresse : ${testReservation.movingKitDelivery.address}`);
      console.log(`📦 Ville : ${testReservation.movingKitDelivery.city}`);
      console.log(`📦 Code postal : ${testReservation.movingKitDelivery.postalCode}`);
      console.log(`📦 Instructions : ${testReservation.movingKitDelivery.instructions}`);
    }

    // Calcul manuel pour vérification
    const expectedOptionsPrice = testReservation.options.movingKit ? 75 : 0;
    const expectedTotal = testReservation.pricing.subtotal + expectedOptionsPrice;

    console.log('\n✅ Vérification du calcul :');
    console.log('===========================');
    console.log(`Prix du kit attendu : ${expectedOptionsPrice}€`);
    console.log(`Total attendu : ${expectedTotal}€`);
    console.log(`Prix des options calculé : ${testReservation.pricing.optionsPrice}€`);
    console.log(`Total calculé : ${testReservation.pricing.totalAmount}€`);
    
    if (testReservation.pricing.optionsPrice === expectedOptionsPrice && 
        testReservation.pricing.totalAmount === expectedTotal) {
      console.log('\n🎉 SUCCÈS : Le kit de déménagement est correctement calculé !');
      console.log(`💰 Prix total avec kit : ${testReservation.pricing.totalAmount}€`);
      console.log(`📦 Informations de livraison sauvegardées : ${testReservation.movingKitDelivery ? 'Oui' : 'Non'}`);
    } else {
      console.log('\n❌ ERREUR : Le calcul du kit ne correspond pas aux attentes !');
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
testMovingKit();
