---
sidebar_position: 8
title: "Testing de Autenticación"
---

# Testing de Autenticación

## Introducción

La autenticación es uno de los **aspectos más críticos** de cualquier aplicación. Un bug en el sistema de autenticación puede significar:
- **Brechas de seguridad**: Usuarios no autorizados acceden a datos sensibles
- **Pérdida de confianza**: Los usuarios abandonan la aplicación
- **Problemas legales**: Violación de regulaciones (GDPR, etc.)

Por eso, testear autenticación exhaustivamente no es opcional—es **esencial**. En esta sección aprenderemos a testear:

1. **Login/Register**: Verificar que las credenciales se validan correctamente
2. **JWT Tokens**: Asegurar que los tokens se generan y verifican bien
3. **Rutas protegidas**: Validar que solo usuarios autenticados pueden acceder
4. **Middleware de auth**: Testear la lógica de autenticación aisladamente
5. **Flujos completos**: Login → Acceso a recursos → Logout

## Flujo de Autenticación Típico

Antes de comenzar con los tests, entendamos cómo funciona la autenticación con JWT (JSON Web Tokens):

```
┌──────────┐                                           ┌──────────┐
│ Cliente  │                                           │ Backend  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │  1. POST /api/auth/login                             │
     │     { email, password }                              │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                                  2. Verify credentials
     │                                     in database      │
     │                                         │            │
     │                                         ▼            │
     │                                  3. Generate JWT     │
     │                                     token            │
     │                                         │            │
     │  4. Response                            │            │
     │     { token: "eyJhbG...", user: {...} } │            │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
     │  5. Store token (localStorage, cookie, etc.)         │
     │                                                      │
     │  6. Request to protected endpoint                    │
     │     GET /api/profile                                 │
     │     Authorization: Bearer eyJhbG...                  │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                                  7. Verify token     │
     │                                     signature        │
     │                                         │            │
     │                                         ▼            │
     │  8. Response with protected data                     │
     │     { user: { id, email, ... } }                     │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
```

### Componentes clave

1. **Login endpoint**: Acepta credenciales y retorna JWT
2. **JWT Token**: String encriptado que contiene info del usuario
3. **Auth middleware**: Verifica el token en cada request
4. **Protected routes**: Solo accesibles con token válido



## Implementación: Backend Auth Router

Vamos a construir un sistema de autenticación completo con Express y JWT.

### Instalación de dependencias

```bash
npm install jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

### Código: authRouter.ts

```typescript
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const authRouter = Router();

// En producción, esto viene de variables de entorno
const SECRET_KEY = process.env.JWT_SECRET || 'test-secret-key';
const TOKEN_EXPIRY = '24h';

// ==================== MOCK DATABASE ====================
// En producción, esto estaría en MongoDB, PostgreSQL, etc.
interface User {
  id: string;
  email: string;
  password: string; // Hash, nunca en texto plano
  name: string;
  role: 'user' | 'admin';
}

const users: User[] = [
  { 
    id: '1', 
    email: 'alice@example.com', 
    // Hash de 'password123' con bcrypt
    password: '$2b$10$YourHashedPasswordHere',
    name: 'Alice Smith',
    role: 'admin'
  },
  { 
    id: '2', 
    email: 'bob@example.com', 
    password: '$2b$10$AnotherHashedPassword',
    name: 'Bob Johnson',
    role: 'user'
  },
];

// ==================== ENDPOINTS ====================

/**
 * POST /api/auth/login
 * Autentica usuario y retorna JWT token
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password required' 
    });
  }

  // Buscar usuario por email
  const user = users.find((u) => u.email === email);

  if (!user) {
    // No revelar si el email existe o no (seguridad)
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Verificar password con bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }

  // Generar JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role 
    },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );

  // Retornar token y datos del usuario (SIN password)
  res.json({ 
    token,
    user: { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role
    } 
  });
});

/**
 * POST /api/auth/register
 * Registra nuevo usuario
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validaciones
  if (!email || !password || !name) {
    return res.status(400).json({ 
      error: 'Email, password, and name required' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters' 
    });
  }

  // Verificar si el usuario ya existe
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ 
      error: 'Email already exists' 
    });
  }

  // Hash del password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear nuevo usuario
  const newUser: User = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    name,
    role: 'user', // Por defecto
  };

  users.push(newUser);

  // Generar token para el nuevo usuario
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
  });
});

/**
 * POST /api/auth/verify
 * Verifica si un token es válido
 */
authRouter.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export { authRouter };
```

### Análisis de seguridad

Este código implementa **best practices de seguridad**:

#### 1. Nunca almacenar passwords en texto plano

```typescript
// ❌ MAL: Password visible
const user = { password: 'password123' };

// ✅ BIEN: Password hasheado con bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
const user = { password: hashedPassword };
```

#### 2. Mensajes de error genéricos

```typescript
// ❌ MAL: Revela información
if (!user) return res.json({ error: 'Email not found' });
if (!validPassword) return res.json({ error: 'Wrong password' });

// ✅ BIEN: Mensaje genérico
return res.status(401).json({ error: 'Invalid credentials' });
```

Esto previene **user enumeration attacks** (adivinar qué emails existen).

#### 3. Tokens con expiración

```typescript
jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
```

Los tokens expiran automáticamente, limitando el daño si se roban.

#### 4. No retornar password en response

```typescript
// ❌ MAL
res.json({ user }); // Incluye password hash

// ✅ BIEN
res.json({ 
  user: { id: user.id, email: user.email, name: user.name } 
});
```



## Middleware de Autenticación

### authMiddleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'test-secret';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Tests de Autenticación

### authRouter.test.ts

```typescript
import request from 'supertest';
import express from 'express';
import { authRouter } from '../authRouter';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/login', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
  });

  it('debe hacer login con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toEqual({
      id: '1',
      email: 'alice@example.com',
    });
  });

  it('debe rechazar credenciales inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'wrongpassword',
      })
      .expect(401);

    expect(response.body.error).toBe('Invalid credentials');
  });

  it('debe requerir email y password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com' })
      .expect(400);

    expect(response.body.error).toBe('Email and password required');
  });
});
```

## Tests de Rutas Protegidas

### protectedRoutes.test.ts

```typescript
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../authMiddleware';

const SECRET_KEY = 'test-secret';

function createApp() {
  const app = express();
  app.use(express.json());

  // Protected route
  app.get('/api/profile', authMiddleware, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  return app;
}

describe('Protected Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
  });

  it('debe acceder con token válido', async () => {
    const token = jwt.sign(
      { id: '1', email: 'alice@example.com' },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toEqual({
      id: '1',
      email: 'alice@example.com',
    });
  });

  it('debe rechazar sin token', async () => {
    const response = await request(app)
      .get('/api/profile')
      .expect(401);

    expect(response.body.error).toBe('No token provided');
  });

  it('debe rechazar token inválido', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.error).toBe('Invalid token');
  });
});
```

## Test de Flujo Completo

```typescript
describe('Full Auth Flow', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp(); // App with auth routes and protected routes
  });

  it('debe completar flujo login -> acceso -> logout', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123',
      })
      .expect(200);

    const { token } = loginResponse.body;

    // 2. Access protected resource
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 3. Access another protected resource
    await request(app)
      .get('/api/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```
