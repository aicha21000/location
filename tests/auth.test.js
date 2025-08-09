const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/location-voitures-test');
  });

  afterAll(async () => {
    // Nettoyage et fermeture
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
    });

    it('should return error for invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return error for existing email', async () => {
      // Créer un utilisateur existant
      const existingUser = new User({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      });
      await existingUser.save();

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'jane.doe@example.com', // Email existant
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Un utilisateur avec cet email existe déjà');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      });
      await user.save();
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Identifiants invalides');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBe('Identifiants invalides');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Créer un utilisateur de test
      user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '0123456789',
        dateOfBirth: '1990-01-01',
        drivingLicense: {
          number: '123456789',
          expiryDate: '2025-01-01',
          category: 'B'
        },
        address: {
          street: '123 Main St',
          city: 'Paris',
          postalCode: '75001',
          country: 'France'
        }
      });
      await user.save();

      // Obtenir un token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123'
        });

      token = loginResponse.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', token)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'john.doe@example.com');
      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('lastName', 'Doe');
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('Accès refusé. Token manquant.');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('x-auth-token', 'invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Token invalide.');
    });
  });
}); 