---
sidebar_position: 7
title: "Mock Service Worker (MSW)"
---

# Mock Service Worker (MSW)

## ¿Qué es MSW?

**Mock Service Worker** intercepta peticiones HTTP a nivel de red, proporcionando mocks realistas.

**Ventajas:**

- Mocks más realistas que jest.fn()
- Funciona en tests y browser
- No modifica código de producción
- Intercepta fetch y XMLHttpRequest

## Instalación

```bash
npm install --save-dev msw
```

## Configuración

### Setup: src/mocks/handlers.ts

```typescript
import { rest } from 'msw';

export const handlers = [
  // GET /api/users
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', email: 'alice@example.com', name: 'Alice' },
        { id: '2', email: 'bob@example.com', name: 'Bob' },
      ])
    );
  }),

  // POST /api/users
  rest.post('/api/users', async (req, res, ctx) => {
    const { email, name } = await req.json();

    if (!email || !name) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Email and name required' })
      );
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: Date.now().toString(),
        email,
        name,
      })
    );
  }),

  // GET /api/users/:id
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;

    if (id === '999') {
      return res(
        ctx.status(404),
        ctx.json({ error: 'User not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        id,
        email: `user${id}@example.com`,
        name: `User ${id}`,
      })
    );
  }),
];
```

### Setup: src/mocks/server.ts

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Setup Jest: src/setupTests.ts

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

## Usar MSW en Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { UserList } from '../UserList';

describe('UserList with MSW', () => {
  
  it('debe cargar y mostrar usuarios', async () => {
    render(<UserList />);

    // Loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for users
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('debe manejar errores de red', async () => {
    // Override handler for this test
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```
