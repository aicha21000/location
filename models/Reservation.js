const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Le véhicule est requis']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date de début doit être dans le futur'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, 'L\'adresse de retrait est requise']
    },
    city: {
      type: String,
      required: [true, 'La ville de retrait est requise']
    },
    postalCode: {
      type: String,
      required: [true, 'Le code postal de retrait est requis']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  returnLocation: {
    address: {
      type: String,
      required: [true, 'L\'adresse de retour est requise']
    },
    city: {
      type: String,
      required: [true, 'La ville de retour est requise']
    },
    postalCode: {
      type: String,
      required: [true, 'Le code postal de retour est requis']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pricing: {
    dailyRate: {
      type: Number,
      required: true
    },
    totalDays: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    insurance: {
      type: Number,
      default: 0
    },
    deposit: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    }
  },
  options: {
    insurance: {
      type: Boolean,
      default: false
    },
    gps: {
      type: Boolean,
      default: false
    },
    childSeat: {
      type: Boolean,
      default: false
    },
    additionalDriver: {
      type: Boolean,
      default: false
    },
    unlimitedMileage: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected'],
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
  documents: [{
    type: {
      type: String,
      enum: ['permis-conduire', 'carte-identite', 'justificatif-domicile', 'assurance', 'autre']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
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
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

// Middleware pour calculer automatiquement les prix
reservationSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate') || this.isModified('pricing.dailyRate')) {
    const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    this.pricing.totalDays = days;
    this.pricing.subtotal = days * this.pricing.dailyRate;
    
    // Calcul de l'assurance si activée
    if (this.options.insurance) {
      this.pricing.insurance = days * 15; // 15€ par jour d'assurance
    }
    
    // Calcul du total
    this.pricing.totalAmount = this.pricing.subtotal + this.pricing.insurance - this.pricing.discount;
  }
  next();
});

// Méthode pour vérifier si la réservation peut être annulée
reservationSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60);
  return this.status === 'confirmed' && hoursUntilStart > 24;
};

// Méthode pour calculer le montant de remboursement
reservationSchema.methods.calculateRefundAmount = function() {
  if (!this.canBeCancelled()) return 0;
  
  const now = new Date();
  const daysUntilStart = Math.ceil((this.startDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilStart > 7) {
    return this.pricing.totalAmount * 0.9; // 90% de remboursement
  } else if (daysUntilStart > 3) {
    return this.pricing.totalAmount * 0.5; // 50% de remboursement
  } else {
    return 0; // Pas de remboursement
  }
};

module.exports = mongoose.model('Reservation', reservationSchema); 