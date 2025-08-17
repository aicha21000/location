// Configuration par défaut pour le développement
module.exports = {
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/location-voitures',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  
  // Stripe (clés de test par défaut)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_51H1234567890abcdefghijklmnopqrstuvwxyz',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_webhook_secret',
  
  // PayPal (Sandbox par défaut)
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Port
  PORT: process.env.PORT || 5000
};
