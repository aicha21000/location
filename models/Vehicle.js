const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du véhicule est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['citadine', 'touristique', 'utilitaire', 'sans-permis', 'remorque', 'materiel']
  },
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    enum: ['voiture', 'camion', 'fourgon', 'remorque', 'materiel']
  },
  brand: {
    type: String,
    required: [true, 'La marque est requise'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Le modèle est requis'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'L\'année est requise'],
    min: [1900, 'Année invalide'],
    max: [new Date().getFullYear() + 1, 'Année invalide']
  },
  fuelType: {
    type: String,
    enum: ['essence', 'diesel', 'hybride', 'electrique', 'gpl'],
    required: function() { return this.type === 'voiture' || this.type === 'camion' || this.type === 'fourgon'; }
  },
  transmission: {
    type: String,
    enum: ['manuelle', 'automatique'],
    required: function() { return this.type === 'voiture' || this.type === 'camion' || this.type === 'fourgon'; }
  },
  seats: {
    type: Number,
    min: [1, 'Nombre de places invalide'],
    required: function() { return this.type === 'voiture' || this.type === 'camion' || this.type === 'fourgon'; }
  },
  doors: {
    type: Number,
    min: [2, 'Nombre de portes invalide'],
    required: function() { return this.type === 'voiture'; }
  },
  engineSize: {
    type: Number,
    min: [0.5, 'Cylindrée invalide'],
    required: function() { return this.type === 'voiture' || this.type === 'camion' || this.type === 'fourgon'; }
  },
  power: {
    type: Number,
    min: [1, 'Puissance invalide'],
    required: function() { return this.type === 'voiture' || this.type === 'camion' || this.type === 'fourgon'; }
  },
  mileage: {
    type: Number,
    required: [true, 'Le kilométrage est requis'],
    min: [0, 'Kilométrage invalide']
  },
  licensePlate: {
    type: String,
    required: [true, 'La plaque d\'immatriculation est requise'],
    unique: true,
    trim: true
  },
  color: {
    type: String,
    required: [true, 'La couleur est requise'],
    trim: true
  },
  features: [{
    type: String,
    enum: [
      'climatisation', 'gps', 'bluetooth', 'camera-recul', 'siege-bebe',
      'toit-ouvrant', 'cuir', 'allumage-sans-cle', 'regulateur-vitesse',
      'limiteur-vitesse', 'abs', 'esp', 'airbags', 'isofix'
    ]
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
  pricing: {
    dailyRate: {
      type: Number,
      required: [true, 'Le tarif journalier est requis'],
      min: [0, 'Tarif invalide']
    },
    weeklyRate: {
      type: Number,
      required: [true, 'Le tarif hebdomadaire est requis'],
      min: [0, 'Tarif invalide']
    },
    monthlyRate: {
      type: Number,
      required: [true, 'Le tarif mensuel est requis'],
      min: [0, 'Tarif invalide']
    },
    deposit: {
      type: Number,
      required: [true, 'La caution est requise'],
      min: [0, 'Caution invalide']
    },
    insurance: {
      type: Number,
      required: [true, 'Le tarif d\'assurance est requis'],
      min: [0, 'Tarif invalide']
    }
  },
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    maintenanceUntil: {
      type: Date,
      default: null
    },
    nextMaintenance: {
      type: Date,
      default: null
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
  description: {
    type: String,
    required: [true, 'La description est requise'],
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  specifications: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    maxLoad: Number,
    fuelCapacity: Number,
    consumption: Number
  },
  documents: [{
    type: {
      type: String,
      enum: ['carte-grise', 'assurance', 'controle-technique', 'permis-conduire']
    },
    url: String,
    expiryDate: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
vehicleSchema.index({ category: 1, type: 1 });
vehicleSchema.index({ isAvailable: 1, isActive: 1 });
// Index géospatial supprimé car la structure de localisation n'est pas GeoJSON

// Méthode pour vérifier la disponibilité
vehicleSchema.methods.isAvailableForDates = function(startDate, endDate) {
  if (!this.availability.isAvailable) return false;
  if (this.availability.maintenanceUntil && this.availability.maintenanceUntil > startDate) return false;
  return true;
};

// Méthode pour calculer le prix total
vehicleSchema.methods.calculateTotalPrice = function(startDate, endDate, includeInsurance = false) {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  let totalPrice = 0;
  
  if (days <= 7) {
    totalPrice = days * this.pricing.dailyRate;
  } else if (days <= 30) {
    totalPrice = Math.ceil(days / 7) * this.pricing.weeklyRate;
  } else {
    totalPrice = Math.ceil(days / 30) * this.pricing.monthlyRate;
  }
  
  if (includeInsurance) {
    totalPrice += days * this.pricing.insurance;
  }
  
  return totalPrice;
};

module.exports = mongoose.model('Vehicle', vehicleSchema); 