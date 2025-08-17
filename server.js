const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Définir les variables d'environnement par défaut si elles n'existent pas
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'location-voitures-jwt-secret-2024-super-securise';
  console.log('⚠️  JWT_SECRET non défini, utilisation de la valeur par défaut');
}

const app = express();

// Middleware de sécurité
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser - DOIT être avant les routes !
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Plus permissif en développement
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes en secondes
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting à toutes les routes API sauf l'auth
app.use('/api/', limiter);

// Rate limiting plus permissif pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Plus permissif en développement
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
    retryAfter: Math.ceil(15 * 60 / 1000)
  }
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/product-orders', require('./routes/productOrders'));
app.use('/api/products', require('./routes/products'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({ 
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? error.message : {}
  });
});

// Connexion MongoDB avec gestion d'erreurs
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
      socketTimeoutMS: 45000, // Timeout socket
    });
    console.log('✅ Connexion MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    console.log('💡 Pour résoudre ce problème :');
    console.log('1. Installez MongoDB : https://docs.mongodb.com/manual/installation/');
    console.log('2. Ou utilisez MongoDB Atlas : https://www.mongodb.com/atlas');
    console.log('3. Ou définissez MONGODB_URI dans votre fichier .env');
    console.log('🔄 Le serveur continue sans base de données...');
  }
};

// Connexion à la base de données
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
}); 