const mongoose = require('mongoose');
const ProductOrder = require('../models/ProductOrder');
const config = require('./config');

async function testProductOrders() {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connecté à MongoDB');

    // Test avec kit de déménagement
    const testProductOrder = new ProductOrder({
      user: new mongoose.Types.ObjectId(), // ID fictif pour le test
      product: {
        type: 'movingKit',
        name: 'Kit de déménagement complet',
        description: 'Cartons, ruban adhésif, papier bulle, marqueurs',
        price: 75,
        quantity: 1
      },
      delivery: {
        date: new Date('2024-01-14'),
        time: '14:00',
        address: '123 Kit Delivery Street',
        city: 'Test City',
        postalCode: '12345',
        instructions: 'Livrer à l\'entrée principale'
      },
      pricing: {
        productPrice: 75,
        deliveryFee: 0,
        totalAmount: 75
      },
      payment: {
        method: 'stripe',
        status: 'pending'
      }
    });

    // Sauvegarder la commande (le middleware va recalculer les prix)
    await testProductOrder.save();

    console.log('\n📦 Test des commandes de produits :');
    console.log('=====================================');
    console.log(`Produit : ${testProductOrder.product.name}`);
    console.log(`Type : ${testProductOrder.product.type}`);
    console.log(`Prix unitaire : ${testProductOrder.product.price}€`);
    console.log(`Quantité : ${testProductOrder.product.quantity}`);
    console.log(`Prix du produit : ${testProductOrder.pricing.productPrice}€`);
    console.log(`Frais de livraison : ${testProductOrder.pricing.deliveryFee}€`);
    console.log(`Total : ${testProductOrder.pricing.totalAmount}€`);
    
    console.log('\n🔍 Détail de la livraison :');
    console.log('=============================');
    console.log(`📦 Date de livraison : ${testProductOrder.delivery.date.toLocaleDateString()}`);
    console.log(`📦 Heure de livraison : ${testProductOrder.delivery.time}`);
    console.log(`📦 Adresse : ${testProductOrder.delivery.address}`);
    console.log(`📦 Ville : ${testProductOrder.delivery.city}`);
    console.log(`📦 Code postal : ${testProductOrder.delivery.postalCode}`);
    console.log(`📦 Instructions : ${testProductOrder.delivery.instructions}`);
    
    console.log('\n✅ Vérification du calcul :');
    console.log('===========================');
    const expectedProductPrice = testProductOrder.product.price * testProductOrder.product.quantity;
    const expectedTotal = expectedProductPrice + testProductOrder.pricing.deliveryFee;
    
    console.log(`Prix du produit attendu : ${expectedProductPrice}€`);
    console.log(`Total attendu : ${expectedTotal}€`);
    console.log(`Prix du produit calculé : ${testProductOrder.pricing.productPrice}€`);
    console.log(`Total calculé : ${testProductOrder.pricing.totalAmount}€`);
    
    if (testProductOrder.pricing.productPrice === expectedProductPrice && 
        testProductOrder.pricing.totalAmount === expectedTotal) {
      console.log('\n🎉 SUCCÈS : Les commandes de produits fonctionnent correctement !');
      console.log(`💰 Prix total : ${testProductOrder.pricing.totalAmount}€`);
      console.log(`📦 Informations de livraison sauvegardées : ${testProductOrder.delivery ? 'Oui' : 'Non'}`);
    } else {
      console.log('\n❌ ERREUR : Le calcul ne correspond pas aux attentes !');
    }

    // Test de la méthode canBeCancelled
    console.log('\n🔒 Test de la méthode canBeCancelled :');
    console.log('=======================================');
    console.log(`Statut actuel : ${testProductOrder.status}`);
    console.log(`Peut être annulée : ${testProductOrder.canBeCancelled() ? 'Oui' : 'Non'}`);

    // Test de la méthode calculateRefundAmount
    console.log('\n💰 Test de la méthode calculateRefundAmount :');
    console.log('=============================================');
    const refundAmount = testProductOrder.calculateRefundAmount();
    console.log(`Montant de remboursement : ${refundAmount}€`);

    // Nettoyer la base de données
    await ProductOrder.findByIdAndDelete(testProductOrder._id);
    console.log('\n🧹 Données de test supprimées');

  } catch (error) {
    console.error('❌ Erreur lors du test :', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testProductOrders();
