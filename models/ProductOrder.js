const mongoose = require('mongoose');

const productOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Le produit est requis']
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'La quantité doit être au moins 1']
  },
  delivery: {
    date: {
      type: Date,
      required: [true, 'La date de livraison est requise'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'La date de livraison doit être dans le futur'
      }
    },
    time: {
      type: String,
      required: [true, 'L\'heure de livraison est requise']
    },
    address: {
      type: String,
      required: [true, 'L\'adresse de livraison est requise']
    },
    city: {
      type: String,
      required: [true, 'La ville est requise']
    },
    postalCode: {
      type: String,
      required: [true, 'Le code postal est requis']
    },
    instructions: {
      type: String,
      maxlength: [500, 'Les instructions ne peuvent pas dépasser 500 caractères']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pricing: {
    productPrice: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['paypal', 'stripe', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  notes: {
    customer: {
      type: String,
      maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
    },
    admin: {
      type: String,
      maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
    }
  },
  cancellation: {
    requestedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      maxlength: [200, 'La raison ne peut pas dépasser 200 caractères']
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
productOrderSchema.index({ user: 1, status: 1 });
productOrderSchema.index({ 'delivery.date': 1, status: 1 });
productOrderSchema.index({ status: 1, createdAt: -1 });
productOrderSchema.index({ product: 1 });

// Middleware pour calculer automatiquement les prix
productOrderSchema.pre('save', async function(next) {
  if (this.isModified('quantity') || this.isModified('pricing.deliveryFee')) {
    try {
      // Populate le produit pour récupérer le prix
      await this.populate('product');
      if (this.product) {
        this.pricing.productPrice = this.product.price * this.quantity;
        this.pricing.totalAmount = this.pricing.productPrice + this.pricing.deliveryFee;
      }
    } catch (error) {
      console.error('Erreur lors du calcul des prix:', error);
    }
  }
  next();
});

// Méthode pour vérifier si la commande peut être annulée
productOrderSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilDelivery = (this.delivery.date - now) / (1000 * 60 * 60);
  return this.status === 'pending' || this.status === 'confirmed' && hoursUntilDelivery > 24;
};

// Méthode pour calculer le montant de remboursement
productOrderSchema.methods.calculateRefundAmount = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const daysUntilDelivery = Math.ceil((this.delivery.date - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDelivery > 7) {
    return this.pricing.totalAmount * 0.9; // 90% de remboursement
  } else if (daysUntilDelivery > 3) {
    return this.pricing.totalAmount * 0.5; // 50% de remboursement
  } else {
    return 0; // Pas de remboursement
  }
};

module.exports = mongoose.model('ProductOrder', productOrderSchema);
