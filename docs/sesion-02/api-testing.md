---
sidebar_position: 5
title: "Testing de APIs Backend"
---

# Testing de APIs en Backend

## Setup: Express + Jest + Supertest

**Instalación:**

```bash
npm install --save-dev supertest @types/supertest
```

## Ejemplo: API de Usuarios

### Código: src/api/users.ts

```typescript
import express, { Router, Request, Response } from 'express';

interface User {
  id: string;
  email: string;
  name: string;
}

// Simulación de base de datos en memoria
let users: User[] = [];

export const usersRouter = Router();

// GET /users - Listar usuarios
usersRouter.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// GET /users/:id - Obtener usuario
usersRouter.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// POST /users - Crear usuario
usersRouter.post('/', (req: Request, res: Response) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }
  
  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

// Helper para tests: limpiar datos
export function clearUsers() {
  users = [];
}
```

### App: src/api/app.ts

```typescript
import express from 'express';
import { usersRouter } from './users';

export function createApp() {
  const app = express();
  
  app.use(express.json());
  app.use('/api/users', usersRouter);
  
  return app;
}
```

## Tests de Integración de API

### Test: src/api/__tests__/users.integration.test.ts

```typescript
import request from 'supertest';
import { createApp } from '../app';
import { clearUsers } from '../users';

describe('Users API Integration', () => {
  let app: Express.Application;

  beforeEach(() => {
    app = createApp();
    clearUsers();
  });

  describe('GET /api/users', () => {
    it('debe retornar array vacío inicialmente', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('debe retornar todos los usuarios', async () => {
      // Crear usuarios
      await request(app)
        .post('/api/users')
        .send({ email: 'user1@test.com', name: 'User 1' });
      
      await request(app)
        .post('/api/users')
        .send({ email: 'user2@test.com', name: 'User 2' });

      // Obtener todos
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /api/users', () => {
    it('debe crear usuario exitosamente', async () => {
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toMatchObject(newUser);
      expect(response.body).toHaveProperty('id');
    });

    it('debe retornar 400 sin email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(400);

      expect(response.body.error).toBe('Email and name are required');
    });
  });
});
```
