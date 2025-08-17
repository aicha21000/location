const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['movingKit', 'packingMaterials', 'furnitureProtection', 'other'],
    required: [true, 'Le type de produit est requis']
  },
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
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
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Le stock ne peut pas être négatif']
  },
  minStock: {
    type: Number,
    default: 5,
    min: [0, 'Le stock minimum ne peut pas être négatif']
  },
  category: {
    type: String,
    enum: ['movingKit', 'packingMaterials', 'furnitureProtection', 'other'],
    required: [true, 'La catégorie est requise']
  },
  features: [{
    type: String,
    maxlength: [200, 'Chaque fonctionnalité ne peut pas dépasser 200 caractères']
  }],
  images: [{
    url: {
      type: String,
      required: [true, 'L\'URL de l\'image est requise']
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    material: String,
    brand: String,
    model: String
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
productSchema.index({ type: 1, category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Middleware pour s'assurer qu'une seule image est principale
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Garder seulement la première comme principale
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    } else if (primaryImages.length === 0 && this.images.length > 0) {
      // Si aucune image principale, définir la première
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Méthode pour vérifier si le stock est faible
productSchema.methods.isLowStock = function() {
  return this.stock <= this.minStock;
};

// Méthode pour ajouter une image
productSchema.methods.addImage = function(imageData) {
  const isFirstImage = this.images.length === 0;
  const newImage = {
    ...imageData,
    isPrimary: isFirstImage,
    order: this.images.length
  };
  
  this.images.push(newImage);
  return this.save();
};

// Méthode pour définir l'image principale
productSchema.methods.setPrimaryImage = function(imageIndex) {
  this.images.forEach((img, index) => {
    img.isPrimary = index === imageIndex;
  });
  return this.save();
};

// Méthode pour réorganiser les images
productSchema.methods.reorderImages = function(newOrder) {
  this.images = newOrder.map((img, index) => ({
    ...img,
    order: index
  }));
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
