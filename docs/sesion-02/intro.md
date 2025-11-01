---
sidebar_position: 1
title: "Testing de Integración"
---

**Duración:** 1.5 horas  
**Objetivos:** Dominar el testing de integración entre componentes y APIs, validando la interacción completa del sistema

---

## 📋 Índice

1. [Introducción al Testing de Integración](#introducción-al-testing-de-integración)
2. [Testing de Componentes con Context](#testing-de-componentes-con-context)
3. [Testing de Custom Hooks](#testing-de-custom-hooks)
4. [Testing de APIs en Backend](#testing-de-apis-en-backend)
5. [Fixtures y Datos de Prueba](#fixtures-y-datos-de-prueba)
6. [Mock Service Worker (MSW)](#mock-service-worker-msw)
7. [Testing de Autenticación](#testing-de-autenticación)
8. [Ejercicio Práctico](#ejercicio-práctico)
9. [Recursos Adicionales](#recursos-adicionales)

---

## Introducción al Testing de Integración

### ¿Qué es Testing de Integración?

Los tests de integración verifican que **múltiples unidades trabajen correctamente juntas**.

**Diferencias con Tests Unitarios:**

| Aspecto | Tests Unitarios | Tests de Integración |
|---------|----------------|---------------------|
| **Alcance** | Una función/componente | Múltiples componentes |
| **Dependencias** | Todas mockeadas | Algunas reales |
| **Velocidad** | Muy rápidos | Moderados |
| **Fragilidad** | Baja | Media |
| **Cobertura** | Específica | Amplia |

### ¿Cuándo Usar Tests de Integración?

**✅ Usar cuando:**
- Varios componentes interactúan
- Hay lógica de negocio compartida
- Se usa Context o estado global
- Se comunica con APIs
- Hay flujos de usuario completos

**❌ No usar cuando:**
- Una función pura simple
- Ya hay tests unitarios suficientes
- El tiempo de ejecución es crítico

### Estrategia de Testing

```
Tests Unitarios (70%)
    ↓
Tests de Integración (20%)  ← Esta sesión
    ↓
Tests E2E (10%)
```

---

## Testing de Componentes con Context

### React Context: Recordatorio

React Context permite compartir estado sin prop drilling:

```tsx
// 1. Crear Context
const ThemeContext = createContext();

// 2. Proveer valor
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// 3. Consumir
const theme = useContext(ThemeContext);
```

### Ejemplo: Theme Context

**Código: src/context/ThemeContext.tsx**

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

**Componente que usa Context: src/components/ThemeToggle.tsx**

```tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`theme-toggle ${theme}`}>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'}
      </button>
    </div>
  );
}
```

### Test de Integración con Context

**Test: src/components/__tests__/ThemeToggle.integration.test.tsx**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

// Helper para renderizar con Provider
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

describe('ThemeToggle Integration', () => {
  
  it('debe iniciar con tema light', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
  });

  it('debe cambiar a dark al hacer click', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    expect(screen.getByText('Switch to light')).toBeInTheDocument();
  });

  it('debe alternar entre temas múltiples veces', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Light → Dark
    fireEvent.click(button);
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    
    // Dark → Light
    fireEvent.click(button);
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
    
    // Light → Dark
    fireEvent.click(button);
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
  });
});
```

### Ejemplo Complejo: Auth Context

**Código: src/context/AuthContext.tsx**

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Simulación de API call
    if (email && password.length >= 6) {
      setUser({
        id: '123',
        email,
        name: email.split('@')[0],
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Componente: src/components/LoginForm.tsx**

```tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  if (isAuthenticated && user) {
    return <div>Welcome, {user.name}!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="password"
      />
      <button type="submit">Login</button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}
```

**Test de Integración:**

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from '../LoginForm';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm Integration', () => {
  
  it('debe hacer login exitosamente', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Llenar formulario
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificar mensaje de bienvenida
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123'); // Muy corto
    
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('debe permitir login después de error', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Primer intento fallido
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Corregir password
    const passwordInput = screen.getByLabelText('password');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
  });
});
```

---

## Testing de Custom Hooks

### ¿Por Qué Testear Hooks?

Los custom hooks encapsulan **lógica reutilizable**. Deben testearse independientemente.

### React Hooks Testing Library

```bash
npm install --save-dev @testing-library/react-hooks
```

### Ejemplo: useCounter Hook

**Código: src/hooks/useCounter.ts**

```typescript
import { useState, useCallback } from 'react';

export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const setValue = useCallback((value: number) => {
    setCount(value);
  }, []);

  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
}
```

**Test: src/hooks/__tests__/useCounter.test.ts**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  
  it('debe iniciar con valor por defecto 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('debe iniciar con valor inicial personalizado', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('debe incrementar contador', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('debe decrementar contador', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('debe resetear a valor inicial', () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(12);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(10);
  });

  it('debe establecer valor específico', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.setValue(42);
    });
    
    expect(result.current.count).toBe(42);
  });
});
```

### Ejemplo: useFetch Hook

**Código: src/hooks/useFetch.ts**

```typescript
import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = () => {
    setRefetchIndex(prev => prev + 1);
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, refetchIndex]);

  return { data, loading, error, refetch };
}
```

**Test: src/hooks/__tests__/useFetch.test.ts**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

// Mock global fetch
global.fetch = jest.fn();

describe('useFetch', () => {
  
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('debe retornar datos exitosamente', async () => {
    const mockData = { id: 1, name: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch('/api/test'));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar errores de red', async () => {
    const mockError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useFetch('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
  });

  it('debe manejar errores HTTP', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useFetch('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('404');
  });

  it('debe permitir refetch', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });

    const { result } = renderHook(() => useFetch('/api/test'));

    // Primera carga
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
```

---

## Testing de APIs en Backend

### Setup: Express + Jest + Supertest

**Instalación:**

```bash
npm install --save-dev supertest @types/supertest
```

### Ejemplo: API de Usuarios

**Código: src/api/users.ts**

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

// PUT /users/:id - Actualizar usuario
usersRouter.put('/:id', (req: Request, res: Response) => {
  const { email, name } = req.body;
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[userIndex] = { ...users[userIndex], email, name };
  res.json(users[userIndex]);
});

// DELETE /users/:id - Eliminar usuario
usersRouter.delete('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.status(204).send();
});

// Helper para tests: limpiar datos
export function clearUsers() {
  users = [];
}
```

**App: src/api/app.ts**

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

### Tests de Integración de API

**Test: src/api/__tests__/users.integration.test.ts**

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
      expect(response.body[0].email).toBe('user1@test.com');
      expect(response.body[1].email).toBe('user2@test.com');
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

    it('debe retornar 400 sin name', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and name are required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('debe obtener usuario por ID', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      const userId = createResponse.body.id;

      // Obtener por ID
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('test@example.com');
    });

    it('debe retornar 404 con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('debe actualizar usuario existente', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'old@example.com', name: 'Old Name' });

      const userId = createResponse.body.id;

      // Actualizar
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: 'new@example.com', name: 'New Name' })
        .expect(200);

      expect(response.body.email).toBe('new@example.com');
      expect(response.body.name).toBe('New Name');
    });

    it('debe retornar 404 con ID inexistente', async () => {
      await request(app)
        .put('/api/users/999999')
        .send({ email: 'test@example.com', name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('debe eliminar usuario existente', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      const userId = createResponse.body.id;

      // Eliminar
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // Verificar que no existe
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('debe retornar 404 con ID inexistente', async () => {
      await request(app)
        .delete('/api/users/999999')
        .expect(404);
    });
  });
});
```

---

## Fixtures y Datos de Prueba

### ¿Qué son Fixtures?

**Fixtures** son datos predefinidos usados en múltiples tests.

**Beneficios:**
- Reducen duplicación
- Consistencia entre tests
- Fácil mantenimiento
- Setup rápido

### Ejemplo: Fixtures de Usuarios

**Fixtures: src/__tests__/fixtures/users.ts**

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

**Uso en Tests:**

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

### Factory Functions

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

---

## Mock Service Worker (MSW)

### ¿Qué es MSW?

**Mock Service Worker** intercepta peticiones HTTP a nivel de red, proporcionando mocks realistas.

**Ventajas:**
- Mocks más realistas que jest.fn()
- Funciona en tests y browser
- No modifica código de producción
- Intercepta fetch y XMLHttpRequest

### Instalación

```bash
npm install --save-dev msw
```

### Configuración

**Setup: src/mocks/handlers.ts**

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

**Setup: src/mocks/server.ts**

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Setup Jest: src/setupTests.ts**

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

### Usar MSW en Tests

**Test con MSW:**

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

---

## Testing de Autenticación

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
2. Frontend envía POST /auth/login
3. Backend valida y genera JWT
4. Frontend almacena token
5. Peticiones subsiguientes incluyen token
```

### Ejemplo Completo

**Backend: src/api/auth.ts**

```typescript
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret';

interface LoginRequest {
  email: string;
  password: string;
}

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Validación simple
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Validar credenciales (simplificado)
  if (password.length < 6) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generar token
  const token = jwt.sign({ email }, SECRET, { expiresIn: '1h' });

  res.json({
    token,
    user: { email, name: email.split('@')[0] },
  });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// Middleware de autenticación
export function authMiddleware(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Test de Autenticación:**

```typescript
import request from 'supertest';
import { createApp } from '../app';

describe('Authentication Integration', () => {
  let app: Express.Application;

  beforeEach(() => {
    app = createApp();
  });

  describe('POST /auth/login', () => {
    it('debe hacer login exitosamente', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('user@example.com');
    });

    it('debe fallar sin email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.error).toBe('Email and password required');
    });

    it('debe fallar con contraseña corta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: '123',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Protected Routes', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      token = response.body.token;
    });

    it('debe acceder a ruta protegida con token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('debe rechazar sin token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);

      expect(response.body.error).toBe('No token provided');
    });

    it('debe rechazar con token inválido', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Full Auth Flow', () => {
    it('debe completar flujo login → request → logout', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = loginResponse.body.token;

      // 2. Request autenticado
      await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 3. Logout
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
```

---

## Ejercicio Práctico

### Objetivo

Implementar tests de integración para flujos completos de usuario en el proyecto Docusaurus.

### Parte 1: Context de Navegación (40 min)

**Crear NavigationContext:**

```tsx
// src/context/NavigationContext.tsx
interface NavigationContextType {
  currentPage: string;
  history: string[];
  navigate: (page: string) => void;
  goBack: () => void;
  canGoBack: boolean;
}
```

**Tareas:**
1. Implementar NavigationProvider completo
2. Crear componente Navigation que use el context
3. Escribir tests de integración que verifiquen:
   - Navegación entre páginas
   - Historial correcto
   - Botón "Back" habilitado/deshabilitado
   - Múltiples navegaciones consecutivas

### Parte 2: API de Posts (50 min)

**Crear API REST:**

- `GET /api/posts` - Listar posts
- `POST /api/posts` - Crear post
- `GET /api/posts/:id` - Obtener post
- `PUT /api/posts/:id` - Actualizar post
- `DELETE /api/posts/:id` - Eliminar post

**Tareas:**
1. Implementar todos los endpoints
2. Añadir validación (título requerido, min 3 caracteres)
3. Crear fixtures de posts
4. Escribir tests de integración para:
   - CRUD completo
   - Validaciones
   - Casos edge (ID inexistente, etc.)
   - Flujo completo: crear → listar → actualizar → eliminar

### Parte 3: Autenticación Completa (30 min)

**Tareas:**
1. Integrar auth con API de posts (solo users autenticados pueden crear/actualizar/eliminar)
2. Tests de integración:
   - Login → crear post → logout
   - Intentar crear post sin autenticación (debe fallar)
   - Token expirado
   - Refresh token (bonus)

### Criterios de Evaluación

- ✅ Tests de integración cubren flujo completo
- ✅ Tests con Context funcionan correctamente
- ✅ API tests cubren todos los endpoints
- ✅ Tests de autenticación validanseguridad
- ✅ Coverage >70% en código nuevo
- ✅ Tests independientes y repetibles

---

## Recursos Adicionales

### Documentación Oficial

- [Testing Library - Integration Tests](https://testing-library.com/docs/react-testing-library/example-intro)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MSW Documentation](https://mswjs.io/docs/)
- [React Hooks Testing Library](https://react-hooks-testing-library.com/)

### Artículos Recomendados

- [Integration Testing Best Practices](https://kentcdodds.com/blog/integration-tests)
- [Testing Context Providers](https://kentcdodds.com/blog/how-to-test-react-context)
- [API Testing with Supertest](https://www.albertgao.xyz/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/)

### Herramientas

- [Nock](https://github.com/nock/nock) - HTTP mocking alternative
- [Jest Extended](https://jest-extended.jestcommunity.dev/) - Additional matchers
- [Faker.js](https://fakerjs.dev/) - Generate fake data for fixtures

### Próxima Sesión

En la **Sesión 3: Testing E2E con Cypress** veremos:
- Configuración de Cypress
- Tests de flujos completos de usuario
- Testing visual y screenshots
- Time-travel debugging
- Best practices de E2E testing

---

**¡Excelente trabajo!** Has completado la sesión de Testing de Integración. Ahora puedes testear la interacción entre múltiples componentes y validar APIs completas.
