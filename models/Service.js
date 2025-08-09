const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du service est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['demenagement', 'remorque', 'materiel', 'kit', 'livraison']
  },
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  duration: {
    type: Number,
    min: [1, 'La durée doit être d\'au moins 1 heure'],
    default: 1
  },
  unit: {
    type: String,
    enum: ['heure', 'jour', 'semaine', 'mois', 'unite'],
    default: 'heure'
  },
  features: [{
    type: String,
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  specifications: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    capacity: Number,
    materials: [String]
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    stock: {
      type: Number,
      default: 0
    },
    minOrder: {
      type: Number,
      default: 1
    },
    maxOrder: {
      type: Number,
      default: 10
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'L\'adresse est requise']
    },
    city: {
      type: String,
      required: [true, 'La ville est requise']
    },
    postalCode: {
      type: String,
      required: [true, 'Le code postal est requis']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  requirements: [{
    type: String,
    trim: true
  }],
  included: [{
    type: String,
    trim: true
  }],
  excluded: [{
    type: String,
    trim: true
  }],
  terms: {
    type: String,
    maxlength: [2000, 'Les conditions ne peuvent pas dépasser 2000 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
serviceSchema.index({ category: 1, type: 1 });
serviceSchema.index({ isAvailable: 1, isActive: 1 });
serviceSchema.index({ price: 1 });

// Méthode pour vérifier la disponibilité
serviceSchema.methods.isAvailableForQuantity = function(quantity) {
  if (!this.availability.isAvailable) return false;
  if (this.availability.stock > 0 && quantity > this.availability.stock) return false;
  if (quantity < this.availability.minOrder || quantity > this.availability.maxOrder) return false;
  return true;
};

// Méthode pour calculer le prix total
serviceSchema.methods.calculateTotalPrice = function(quantity = 1, duration = 1) {
  let totalPrice = this.price;
  
  if (this.unit === 'heure') {
    totalPrice *= duration;
  } else if (this.unit === 'jour') {
    totalPrice *= Math.ceil(duration / 24);
  } else if (this.unit === 'semaine') {
    totalPrice *= Math.ceil(duration / (24 * 7));
  } else if (this.unit === 'mois') {
    totalPrice *= Math.ceil(duration / (24 * 30));
  }
  
  return totalPrice * quantity;
};

module.exports = mongoose.model('Service', serviceSchema); 