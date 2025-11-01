---
sidebar_position: 8
title: "Rate Limiting"
---

## 6. Rate Limiting: Protección contra fuerza bruta

### 6.1 ¿Por qué rate limiting?

Previene:
- Ataques de fuerza bruta en login
- Abuso de APIs
- DDoS básicos
- Web scraping agresivo

### 6.2 Implementación con express-rate-limit

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta más tarde',
  standardHeaders: true, // Envía info en headers RateLimit-*
  legacyHeaders: false, // Deshabilita headers X-RateLimit-*
});

app.use('/api/', generalLimiter);

// Rate limit estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  skipSuccessfulRequests: true, // No cuenta intentos exitosos
  message: 'Demasiados intentos de login, intenta en 15 minutos',
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Lógica de login
});

// Rate limit para APIs públicas
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 peticiones por minuto
});

app.use('/api/public/', apiLimiter);
```

### 6.3 Rate limiting avanzado

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Usar Redis para aplicaciones distribuidas
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Prefijo para keys de Redis
  }),
});

// Rate limit por usuario autenticado
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    // Usar user ID si está autenticado, sino IP
    return req.user?.id || req.ip;
  },
});
```

### 6.4 Testing de rate limiting

```typescript
// tests/rate-limit.test.ts
import request from 'supertest';
import app from '../app';

describe('Rate Limiting', () => {
  it('debe bloquear después de 5 intentos de login', async () => {
    const credentials = { username: 'test', password: 'wrong' };
    
    // Primeros 5 intentos deben responder 401
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);
      expect(res.status).toBe(401);
    }
    
    // Sexto intento debe ser bloqueado con 429
    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);
      
    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Demasiados intentos');
  });
  
  it('debe respetar límite de API general', async () => {
    // Hacer 100 peticiones
    const promises = Array(100).fill(null).map(() =>
      request(app).get('/api/users')
    );
    
    await Promise.all(promises);
    
    // La petición 101 debe fallar
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(429);
  });
});
```
