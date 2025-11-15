---
sidebar_position: 7
title: "Mock Service Worker (MSW)"
---

# Mock Service Worker (MSW)

## Introducción

Cuando testeamos componentes que hacen requests HTTP, tenemos varias opciones para mockear las respuestas:

1. **jest.fn() manual**: Mockeamos `fetch` directamente
2. **axios-mock-adapter**: Librería específica para Axios
3. **Mock Service Worker (MSW)**: Intercepta requests a nivel de red

**MSW es la opción más moderna y realista** porque intercepta requests HTTP reales usando Service Workers, exactamente como funcionan en el navegador. Esto significa que tus tests se comportan **idénticamente** a como se comportaría el código en producción.

## ¿Qué es MSW?

**Mock Service Worker** es una librería que intercepta peticiones HTTP (fetch, XMLHttpRequest, Axios) a nivel de red y retorna respuestas mockeadas. Funciona tanto en **tests (Node.js)** como en **el navegador** para development.

### Ventajas de MSW sobre Jest Mocks

| Aspecto | jest.fn() | MSW |
|---------|-----------|-----|
| **Realismo** | Mockea la función directamente | Intercepta HTTP real |
| **Código de prod** | Requiere modificaciones | Zero cambios |
| **Mantenimiento** | Un mock por test | Handlers reutilizables |
| **Type safety** | ⚠️ Depende de tu código | ✅ Request/Response tipos |
| **Browser** | ❌ Solo Node.js | ✅ Funciona en browser también |
| **Debugging** | Difícil (abstracción rota) | Fácil (requests reales en DevTools) |

### ¿Cómo funciona MSW?

```
┌──────────────┐
│ Tu Componente│
└──────┬───────┘
       │ fetch('/api/users')
       ▼
┌──────────────────┐
│  MSW Interceptor │ ← Captura el request
└──────┬───────────┘
       │
       ├─ ¿Match handler? ─► Sí → Retorna mock response
       │
       └─ No ───────────────► Deja pasar el request real (o error)
```



## Instalación

MSW es una dependencia de desarrollo que solo usamos en tests y durante el desarrollo:

```bash
# Instalar MSW
npm install --save-dev msw

# Para TypeScript (tipos incluidos en el paquete principal)
# No necesitas @types/msw
```

:::info Versión recomendada
Este tutorial usa MSW v2.x. Si usas v1.x, la API es ligeramente diferente (usa `rest` en lugar de `http`). Revisa la [documentación oficial](https://mswjs.io/) para detalles de migración.
:::

## Configuración Completa

La configuración de MSW tiene tres partes:
1. **Handlers**: Definen qué requests interceptar y qué responder
2. **Server**: Instancia del servidor de mocks para Node.js (tests)
3. **Setup**: Integración con Jest para iniciar/detener el servidor




### Paso 1: Definir Handlers - src/mocks/handlers.ts

Los **handlers** son funciones que interceptan requests específicos y retornan respuestas mockeadas. Cada handler define:
- **Método HTTP**: GET, POST, PUT, DELETE, etc.
- **URL/Pattern**: Qué endpoint interceptar
- **Response**: Qué datos retornar

```typescript
import { http, HttpResponse } from 'msw';

// ==================== HANDLERS DE USUARIOS ====================

export const handlers = [
  
  // GET /api/users - Listar todos los usuarios
  http.get('/api/users', () => {
    // Simulamos una respuesta exitosa con datos mock
    return HttpResponse.json([
      { id: '1', email: 'alice@example.com', name: 'Alice', role: 'admin' },
      { id: '2', email: 'bob@example.com', name: 'Bob', role: 'user' },
      { id: '3', email: 'charlie@example.com', name: 'Charlie', role: 'user' },
    ]);
  }),

  // POST /api/users - Crear nuevo usuario
  http.post('/api/users', async ({ request }) => {
    // Parseamos el body del request
    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    // Simulamos validación
    if (!email || !name) {
      return HttpResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Simulamos validación de email
    if (!email.includes('@')) {
      return HttpResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Respuesta exitosa
    return HttpResponse.json(
      {
        id: Date.now().toString(),
        email,
        name,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // GET /api/users/:id - Obtener usuario específico
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;

    // Simulamos usuario no encontrado
    if (id === '999') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Respuesta exitosa con datos del usuario
    return HttpResponse.json({
      id,
      email: `user${id}@example.com`,
      name: `User ${id}`,
      role: 'user',
    });
  }),

  // PUT /api/users/:id - Actualizar usuario
  http.put('/api/users/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json();

    if (id === '999') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }),

  // DELETE /api/users/:id - Eliminar usuario
  http.delete('/api/users/:id', ({ params }) => {
    const { id } = params;

    if (id === '999') {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 204 No Content para delete exitoso
    return new HttpResponse(null, { status: 204 });
  }),

  // ==================== SIMULACIÓN DE DELAYS ====================

  // Handler con delay para simular latencia de red
  http.get('/api/slow-endpoint', async () => {
    // Esperamos 2 segundos para simular respuesta lenta
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return HttpResponse.json({ message: 'This was slow!' });
  }),

  // ==================== SIMULACIÓN DE ERRORES ====================

  // Handler que siempre falla (útil para testear error handling)
  http.get('/api/failing-endpoint', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
];
```

### Análisis de patrones en handlers

#### 1. Acceso a parámetros de ruta

```typescript
// URL: /api/users/123
http.get('/api/users/:id', ({ params }) => {
  const { id } = params; // id = '123'
  // ...
});
```

#### 2. Acceso al body del request

```typescript
http.post('/api/users', async ({ request }) => {
  const body = await request.json(); // Parse JSON body
  const { email, name } = body;
  // ...
});
```

#### 3. Query parameters

```typescript
// URL: /api/users?role=admin&limit=10
http.get('/api/users', ({ request }) => {
  const url = new URL(request.url);
  const role = url.searchParams.get('role'); // 'admin'
  const limit = url.searchParams.get('limit'); // '10'
  // ...
});
```

#### 4. Headers

```typescript
http.get('/api/protected', ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  // ...
});
```

### Paso 2: Crear el Server - src/mocks/server.ts

El **server** es la instancia de MSW que usa los handlers para interceptar requests en Node.js (ambiente de tests):

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Creamos el server con todos los handlers
export const server = setupServer(...handlers);

// Export para usar en tests específicos
export { http, HttpResponse } from 'msw';
```

:::tip Organización de handlers
Si tienes muchos handlers, considera organizarlos en archivos separados:

```typescript
// src/mocks/handlers/users.ts
export const userHandlers = [
  http.get('/api/users', ...),
  http.post('/api/users', ...),
];

// src/mocks/handlers/posts.ts
export const postHandlers = [
  http.get('/api/posts', ...),
];

// src/mocks/handlers/index.ts
export const handlers = [
  ...userHandlers,
  ...postHandlers,
];
```
:::

### Paso 3: Integrar con Jest - src/setupTests.ts

Este archivo se ejecuta **antes de todos los tests** y configura MSW globalmente:

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Establecer servidor antes de ejecutar todos los tests
beforeAll(() => {
  server.listen({
    // Si un request no tiene handler, muestra warning en lugar de error
    onUnhandledRequest: 'warn',
  });
});

// Resetear handlers después de cada test
// Esto previene que overrides en un test afecten a otros
afterEach(() => {
  server.resetHandlers();
});

// Cerrar servidor después de todos los tests
afterAll(() => {
  server.close();
});
```

### Opciones de configuración

```typescript
server.listen({
  // 'warn': muestra warning pero continúa
  // 'error': lanza error si request no tiene handler
  // 'bypass': ignora requests sin handler (pasan al servidor real)
  onUnhandledRequest: 'warn',
});
```




## Usar MSW en Tests

Ahora que tenemos MSW configurado, podemos escribir tests que hacen requests HTTP reales. MSW interceptará estos requests y retornará las respuestas mockeadas que definimos.

### Ejemplo: Componente UserList

Primero, el componente que vamos a testear:

```typescript
// src/components/UserList.tsx
import React, { useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} ({user.email}) - {user.role}
        </li>
      ))}
    </ul>
  );
}
```

### Tests con MSW

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { UserList } from '../UserList';
import { server, http, HttpResponse } from '../mocks/server';

describe('UserList with MSW', () => {
  
  // ==================== HAPPY PATH ====================
  
  it('debe mostrar loading inicialmente', () => {
    render(<UserList />);
    
    // El componente muestra "Loading..." mientras hace fetch
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('debe cargar y mostrar usuarios desde la API', async () => {
    render(<UserList />);

    // Esperamos a que desaparezca el loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verificamos que los usuarios mockeados aparecen
    // Estos datos vienen del handler definido en src/mocks/handlers.ts
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it('debe mostrar todos los datos de cada usuario', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verificamos que muestra email y role además del nombre
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
  });

  // ==================== ERROR HANDLING ====================

  it('debe manejar errores de servidor (500)', async () => {
    // OVERRIDE: Sobrescribimos el handler solo para este test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    render(<UserList />);

    // Esperamos a que aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    // Verificamos que NO hay usuarios mostrados
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('debe manejar errores de red', async () => {
    // Simulamos un error de red (request falla completamente)
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.error();
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('debe manejar respuesta vacía', async () => {
    // Handler que retorna array vacío
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json([]);
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // No debería haber elementos <li> en la lista
    const listItems = screen.queryAllByRole('listitem');
    expect(listItems).toHaveLength(0);
  });

  // ==================== DELAYS Y TIMEOUTS ====================

  it('debe manejar respuestas lentas', async () => {
    // Simulamos un endpoint lento
    server.use(
      http.get('/api/users', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json([
          { id: '1', email: 'slow@example.com', name: 'Slow User', role: 'user' }
        ]);
      })
    );

    render(<UserList />);

    // Loading debe estar presente durante el delay
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Esperamos a que cargue
    await waitFor(() => {
      expect(screen.getByText(/Slow User/)).toBeInTheDocument();
    });
  });
});
```

### Técnicas avanzadas con MSW

#### 1. Override de handlers por test

```typescript
it('test específico con comportamiento diferente', async () => {
  // Este override solo afecta a este test
  // Después de este test, server.resetHandlers() restaura el handler original
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: '99', name: 'Special User' }]);
    })
  );
  
  // ... resto del test
});
```

#### 2. Múltiples overrides en un test

```typescript
it('debe manejar flujo completo', async () => {
  // Primera llamada retorna lista vacía
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([]);
    })
  );

  render(<UserList />);
  
  // Verificar lista vacía...

  // Cambiar handler para siguiente llamada
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: '1', name: 'New User' }]);
    })
  );

  // Refetch...
  // Verificar nuevo usuario...
});
```

#### 3. Handlers con estado

```typescript
// Mantener estado entre requests
let callCount = 0;

server.use(
  http.get('/api/users', () => {
    callCount++;
    
    if (callCount === 1) {
      return HttpResponse.json([]);
    } else {
      return HttpResponse.json([{ id: '1', name: 'User' }]);
    }
  })
);
```

#### 4. Verificar request recibido

```typescript
it('debe enviar los headers correctos', async () => {
  let receivedHeaders: Headers | null = null;

  server.use(
    http.get('/api/users', ({ request }) => {
      receivedHeaders = request.headers;
      return HttpResponse.json([]);
    })
  );

  render(<UserList />);

  await waitFor(() => {
    expect(receivedHeaders).not.toBeNull();
  });

  // Verificar que el header Authorization se envió
  expect(receivedHeaders!.get('Authorization')).toBe('Bearer token');
});
```

## Comparación: MSW vs Jest Mock

Veamos el **antes y después** de usar MSW:

### ❌ Antes (con jest.mock)

```typescript
// Tenemos que mockear fetch globalmente
global.fetch = jest.fn();

it('test con fetch mock', async () => {
  // Setup del mock
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: '1', name: 'User' }],
  });

  render(<UserList />);

  // ... assertions
});
```

**Problemas**:
- Mock global afecta todos los tests
- Hay que simular toda la Response API (`ok`, `json()`, etc.)
- No funciona en el browser (solo tests)
- Difícil testear diferentes status codes

### ✅ Después (con MSW)

```typescript
// Los handlers ya están definidos en src/mocks/handlers.ts
// No necesitamos setup en cada test

it('test con MSW', async () => {
  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText('User')).toBeInTheDocument();
  });
});
```

**Ventajas**:
- Handlers reutilizables
- API realista (Response real)
- Funciona en tests Y browser
- Override fácil cuando es necesario

## MSW en el Browser (Bonus)

MSW también puede usarse en **development** para mockear APIs mientras desarrollas:

### Setup para browser: src/mocks/browser.ts

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Iniciar en development: src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Solo en development
if (process.env.NODE_ENV === 'development') {
  const { worker } = await import('./mocks/browser');
  await worker.start();
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

Ahora cuando ejecutas `npm run dev`, MSW intercepta requests en el browser y puedes desarrollar sin necesidad de un backend funcionando.

## Resumen

En esta sección aprendimos:

1. **Qué es MSW**: Interceptor de requests HTTP a nivel de red
2. **Ventajas**: Más realista que jest mocks, funciona en tests y browser
3. **Configuración**: Handlers → Server → Setup Jest
4. **Uso en tests**: Override de handlers, simulación de errores, delays
5. **Técnicas avanzadas**: Estado, verificación de requests, múltiples overrides
6. **Browser**: Usar MSW en development para mockear APIs

:::tip Best Practices
1. **Define handlers reutilizables** en `src/mocks/handlers.ts`
2. **Usa `server.use()` para overrides** específicos de test
3. **Siempre resetea handlers** con `afterEach(() => server.resetHandlers())`
4. **Simula escenarios reales**: delays, errores 500, 404, etc.
5. **Organiza handlers por feature** cuando tengas muchos
:::

:::info Próximo paso
En la siguiente sección veremos **auth-testing.md**, donde aplicaremos MSW para testear flujos completos de autenticación con tokens JWT.
:::

