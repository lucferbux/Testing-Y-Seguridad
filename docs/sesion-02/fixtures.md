---
sidebar_position: 6
title: "Fixtures y Datos de Prueba"
---

# Fixtures y Datos de Prueba

## ¿Qué son Fixtures?

**Fixtures** son datos predefinidos usados en múltiples tests.

**Beneficios:**

- Reducen duplicación
- Consistencia entre tests
- Fácil mantenimiento
- Setup rápido

## Ejemplo: Fixtures de Usuarios

### Fixtures: src/__tests__/fixtures/users.ts

```typescript
export const validUser = {
  email: 'john.doe@example.com',
  name: 'John Doe',
};

export const invalidUsers = {
  noEmail: { name: 'No Email' },
  noName: { email: 'no-name@example.com' },
  invalidEmail: { email: 'not-an-email', name: 'Invalid Email' },
};

export const sampleUsers = [
  { email: 'alice@example.com', name: 'Alice' },
  { email: 'bob@example.com', name: 'Bob' },
  { email: 'charlie@example.com', name: 'Charlie' },
];

export function createMockUser(overrides = {}) {
  return {
    id: Date.now().toString(),
    email: 'mock@example.com',
    name: 'Mock User',
    ...overrides,
  };
}
```

## Uso en Tests

```typescript
import { validUser, sampleUsers, createMockUser } from './fixtures/users';

describe('Users with Fixtures', () => {
  it('debe crear usuario con datos válidos', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(validUser)
      .expect(201);

    expect(response.body).toMatchObject(validUser);
  });

  it('debe crear múltiples usuarios', async () => {
    for (const user of sampleUsers) {
      await request(app)
        .post('/api/users')
        .send(user)
        .expect(201);
    }

    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.body).toHaveLength(sampleUsers.length);
  });

  it('debe personalizar mock user', () => {
    const admin = createMockUser({ role: 'admin' });
    expect(admin.role).toBe('admin');
  });
});
```

## Factory Functions

```typescript
// src/__tests__/factories/userFactory.ts
let userId = 1;

export function buildUser(attrs = {}) {
  return {
    id: (userId++).toString(),
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    createdAt: new Date().toISOString(),
    ...attrs,
  };
}

export function buildUsers(count: number, attrs = {}) {
  return Array.from({ length: count }, () => buildUser(attrs));
}

// Uso
const user = buildUser({ email: 'custom@example.com' });
const users = buildUsers(5); // 5 usuarios
```
