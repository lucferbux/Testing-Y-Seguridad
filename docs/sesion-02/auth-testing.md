---
sidebar_position: 8
title: "Testing de Autenticación"
---

# Testing de Autenticación

## Flujo de Autenticación

```
┌─────────┐      POST /login       ┌─────────┐
│ Cliente │ ───────────────────────> │ Backend │
└─────────┘     email + password    └─────────┘
     ▲                                    │
     │                                    │ Verify credentials
     │                                    │ Generate JWT
     │          JWT Token                 ▼
     └────────────────────────────────────┘
```

## Backend: Auth Router

### authRouter.ts

```typescript
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const authRouter = Router();
const SECRET_KEY = 'test-secret';

// Mock user database
const users = [
  { id: '1', email: 'alice@example.com', password: 'password123' },
  { id: '2', email: 'bob@example.com', password: 'securepass' },
];

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ token, user: { id: user.id, email: user.email } });
});

export { authRouter };
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
