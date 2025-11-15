---
sidebar_position: 14
title: "Ejercicio Práctico"
---

## 12. Ejercicio Práctico: Auditoría de Seguridad

### Contexto

Se te proporciona una API Express con múltiples vulnerabilidades. Tu tarea es:
1. Identificar las vulnerabilidades
2. Implementar las correcciones
3. Escribir tests que verifiquen las correcciones

### Código vulnerable

```javascript
// ❌ VULNERABLE - NO USAR EN PRODUCCIÓN
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/myapp');

// Modelo de usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // Password en texto plano
  email: String,
  role: String,
});

const User = mongoose.model('User', UserSchema);

// 1. Login sin rate limiting, vulnerable a inyección NoSQL
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({
    username: username,
    password: password
  });
  
  if (user) {
    const token = jwt.sign(
      { id: user._id },
      'secret', // Secret débil
      { expiresIn: '7d' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Registro sin validación
app.post('/api/register', async (req, res) => {
  const user = new User(req.body); // Acepta cualquier campo
  await user.save();
  res.json(user); // Expone toda la información
});

// 3. Endpoint vulnerable a XSS
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Results for: ${query}</h1>`);
});

// 4. Middleware de autenticación débil
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  try {
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// 5. Sin validación de autorización
app.delete('/api/users/:id', authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// 6. Expone información sensible en errores
app.use((err, req, res, next) => {
  console.log(err.stack); // Log completo en consola
  res.status(500).json({
    error: err.message,
    stack: err.stack // Expone stack trace
  });
});

app.listen(3000);
```

### Tarea 1: Identificar vulnerabilidades

Enumera todas las vulnerabilidades que encuentres en el código anterior. Clasifícalas por severidad (Critical, High, Medium, Low).

**Pista**: Busca al menos 15 vulnerabilidades diferentes.

#### Tabla de Vulnerabilidades Encontradas

| # | Línea/Sección | Vulnerabilidad | Tipo OWASP | Severidad | Impacto |
|---|---------------|----------------|------------|-----------|---------|
| 1 | Login endpoint | NoSQL Injection | A03 | ⚠️ Critical | Bypass autenticación |
| 2 | Password storage | Plaintext passwords | A02 | ⚠️ Critical | Exposición masiva |
| 3 | JWT Secret | Hardcoded secret | A05 | 🔴 High | Tokens falsificados |
| 4 | Login endpoint | No rate limiting | A07 | 🔴 High | Brute force |
| 5 | Search endpoint | Reflected XSS | A03 | 🔴 High | Robo de sesiones |
| 6 | Register endpoint | No input validation | A04 | 🔴 High | Data corruption |
| 7 | Register endpoint | Mass assignment | A01 | 🔴 High | Privilege escalation |
| 8 | Register response | Expone password | A09 | 🔴 High | Info disclosure |
| 9 | Delete endpoint | No ownership check | A01 | ⚠️ Critical | Eliminar usuarios |
| 10 | Error handler | Stack trace exposure | A05 | 🟡 Medium | Info disclosure |
| 11 | MongoDB | No authentication | A05 | 🔴 High | DB compromise |
| 12 | Global | No HTTPS | A02 | 🔴 High | MITM attacks |
| 13 | Global | No Helmet.js | A05 | 🟡 Medium | Missing headers |
| 14 | Global | No CSRF | A01 | 🔴 High | CSRF attacks |
| 15 | Login | User enumeration | A07 | 🟡 Medium | Facilita ataques |

<details>
<summary><strong>Ver explicación detallada de cada vulnerabilidad</strong></summary>

#### 1. NoSQL Injection (⚠️ Critical)
```javascript
// Vulnerable
const user = await User.findOne({ username, password });

// Ataque
POST /api/login
{ "username": { "$ne": null }, "password": { "$ne": null } }
// Retorna el primer usuario sin verificar password
```

#### 2. Plaintext Passwords (⚠️ Critical)
```javascript
// Vulnerable: password en texto plano
const UserSchema = new mongoose.Schema({
  password: String, // ¡NO hasheado!
});

// Impacto: Si DB es comprometida, TODOS los passwords expuestos
```

#### 3. Hardcoded JWT Secret (🔴 High)
```javascript
// Vulnerable
jwt.sign({ id: user._id }, 'secret', { expiresIn: '7d' });

// Atacante puede generar tokens válidos
```

#### 4. No Rate Limiting (🔴 High)
```javascript
// Sin límite: 10,000 intentos/min posibles
app.post('/api/login', async (req, res) => {
  // Sin protección brute force
});
```

#### 5. Reflected XSS (🔴 High)
```javascript
// Vulnerable
res.send(`<h1>Results for: ${query}</h1>`);

// Ataque
GET /api/search?q=<script>alert(document.cookie)</script>
```

#### 6-9. Más vulnerabilidades...

</details>

---

### Tarea 2: Implementar correcciones

Reescribe el código aplicando **TODAS** las medidas de seguridad vistas en la sesión.

```typescript
// ✅ CÓDIGO SEGURO COMPLETO
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const app = express();

// ========== SEGURIDAD: HEADERS ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

app.disable('x-powered-by');

// ========== PARSEO ==========
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ========== SANITIZACIÓN ==========
app.use(mongoSanitize());

// ========== CSRF ==========
const csrfProtection = csrf({ cookie: true });

// ========== RATE LIMITING ==========
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// ========== LOGGING ==========
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// ========== MODELOS ==========
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', UserSchema);

// ========== VALIDACIÓN ==========
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
});

// ========== MIDDLEWARE ==========
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Authentication failed', { error: err });
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ========== RUTAS ==========

// Registro
app.post('/api/register', csrfProtection, async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ errors: error.details.map(d => d.message) });
    }
    
    const { username, email, password } = value;
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = new User({
      username,
      email,
      passwordHash,
      role: 'user', // Hardcoded, NO del request
    });
    
    await user.save();
    
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error('Registration error', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username }).select('+passwordHash');
    
    const dummyHash = '$2b$12$dummy.hash.to.prevent.timing';
    const validPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash);
    
    if (!user || !validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    res.json({ user, token });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Búsqueda
app.get('/api/search', (req, res) => {
  const query = req.query.q as string;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Invalid query' });
  }
  
  res.json({
    query,
    message: `Resultados para: ${query}`,
  });
});

// Eliminar usuario
app.delete('/api/users/:id', authenticate, csrfProtection, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUser = req.user;
    
    if (currentUser.id !== targetUserId && currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await User.findByIdAndDelete(targetUserId);
    
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  logger.error('Error', { error: err.message });
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

---

### Tarea 3: Tests de seguridad

```typescript
// tests/security.test.ts
import request from 'supertest';
import app from '../app';

describe('Security Tests', () => {
  describe('Security Headers', () => {
    it('debe incluir Helmet headers', async () => {
      const res = await request(app).get('/api/csrf-token');
      
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Rate Limiting', () => {
    it('debe bloquear después de 5 intentos fallidos', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/login').send({
          username: 'test',
          password: 'wrong',
        });
      }
      
      const res = await request(app).post('/api/login').send({
        username: 'test',
        password: 'wrong',
      });
      
      expect(res.status).toBe(429);
    });
  });

  describe('NoSQL Injection', () => {
    it('debe rechazar objetos en login', async () => {
      const res = await request(app).post('/api/login').send({
        username: { $ne: null },
        password: { $ne: null },
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('XSS Protection', () => {
    it('debe retornar JSON en search', async () => {
      const res = await request(app)
        .get('/api/search')
        .query({ q: '<script>alert(1)</script>' });
      
      expect(res.headers['content-type']).toContain('json');
    });
  });

  describe('Authorization', () => {
    it('debe impedir eliminar cuentas ajenas', async () => {
      const userToken = 'valid-user-token';
      const otherUserId = 'other-user-id';
      
      const res = await request(app)
        .delete(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('Password Security', () => {
    it('no debe exponer passwords', async () => {
      const res = await request(app).post('/api/register').send({
        username: 'test',
        email: 'test@example.com',
        password: 'SecurePass123!',
      });
      
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });
});
```

---

### Rúbrica de Evaluación

| Criterio | Puntos | Descripción |
|----------|--------|-------------|
| **Identificación** | 20 | 15+ vulnerabilidades con severidad correcta |
| **Implementación** | 40 | Código seguro con todas las protecciones |
| **Tests** | 30 | Suite completa cubriendo todas las protecciones |
| **Documentación** | 10 | Código comentado con README |

:::tip Enfoque Incremental
Trabaja por capas:
1. Headers (Helmet)
2. Autenticación (bcrypt, JWT)
3. Validación (Joi)
4. Rate limiting
5. CSRF
6. Autorización
7. Tests
:::
