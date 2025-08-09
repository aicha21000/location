const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'La réservation est requise']
  },
  method: {
    type: String,
    required: [true, 'La méthode de paiement est requise'],
    enum: ['paypal', 'stripe', 'cash']
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant ne peut pas être négatif']
  },
  currency: {
    type: String,
    required: [true, 'La devise est requise'],
    enum: ['EUR', 'USD'],
    default: 'EUR'
  },
  status: {
    type: String,
    required: [true, 'Le statut est requis'],
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    maxlength: [500, 'La raison du remboursement ne peut pas dépasser 500 caractères']
  },
  refundedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Méthode pour vérifier si le paiement peut être remboursé
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'paid' && this.amount > 0;
};

// Méthode pour calculer le montant restant disponible pour remboursement
paymentSchema.methods.getRemainingAmount = function() {
  return this.amount - this.refundAmount;
};

// Méthode pour vérifier si le paiement est complet
paymentSchema.methods.isComplete = function() {
  return this.status === 'paid' || this.status === 'refunded';
};

module.exports = mongoose.model('Payment', paymentSchema); 