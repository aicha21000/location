const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  type: {
    type: String,
    required: [true, 'Le type de document est requis'],
    enum: ['permis-conduire', 'carte-identite', 'justificatif-domicile', 'assurance', 'autre']
  },
  description: {
    type: String,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    default: ''
  },
  fileName: {
    type: String,
    required: [true, 'Le nom du fichier est requis']
  },
  fileSize: {
    type: Number,
    required: [true, 'La taille du fichier est requise'],
    min: [0, 'La taille du fichier ne peut pas être négative']
  },
  mimeType: {
    type: String,
    required: [true, 'Le type MIME est requis']
  },
  url: {
    type: String,
    required: [true, 'L\'URL du fichier est requise']
  },
  status: {
    type: String,
    required: [true, 'Le statut est requis'],
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'La raison du rejet ne peut pas dépasser 500 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
documentSchema.index({ user: 1, type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ createdAt: -1 });

// Méthode pour vérifier si le document peut être approuvé
documentSchema.methods.canBeApproved = function() {
  return this.status === 'pending';
};

// Méthode pour vérifier si le document peut être rejeté
documentSchema.methods.canBeRejected = function() {
  return this.status === 'pending';
};

// Méthode pour obtenir le statut lisible
documentSchema.methods.getStatusText = function() {
  const statusMap = {
    'pending': 'En attente',
    'approved': 'Approuvé',
    'rejected': 'Rejeté'
  };
  return statusMap[this.status] || this.status;
};

// Méthode pour obtenir le type lisible
documentSchema.methods.getTypeText = function() {
  const typeMap = {
    'permis-conduire': 'Permis de conduire',
    'carte-identite': 'Carte d\'identité',
    'justificatif-domicile': 'Justificatif de domicile',
    'assurance': 'Assurance',
    'autre': 'Autre'
  };
  return typeMap[this.type] || this.type;
};

module.exports = mongoose.model('Document', documentSchema); 