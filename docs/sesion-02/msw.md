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

## Análisis del Proyecto: Endpoints Reales

Antes de configurar MSW, analicemos los endpoints del proyecto **Taller-Testing-Security**:

### API Endpoints (Backend)

El backend expone los siguientes endpoints en `/v1`:

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/auth/login` | POST | No | Login con email/password, retorna JWT |
| `/v1/aboutme/` | GET | No | Información del perfil (AboutMe) |
| `/v1/projects/` | GET | No | Lista de todos los proyectos |
| `/v1/projects` | POST | ✅ JWT | Crear nuevo proyecto |
| `/v1/projects` | PUT | ✅ JWT | Actualizar proyecto existente |
| `/v1/projects` | DELETE | ✅ JWT | Eliminar proyecto por ID |

### Cliente API (Frontend)

El frontend usa `HttpApiClient` que implementa estos métodos:

```typescript
// ui/src/api/http-api-client.ts
export default class HttpApiClient implements ApiClient {
  // Autenticación
  token(email: string, password: string): Promise<TokenResponse>
  
  // AboutMe
  getAboutMe(): Promise<AboutMe>
  
  // Projects
  getProjects(): Promise<Project[]>
  getDashboardInfo(): Promise<DashboardInfo>  // Combina aboutMe + projects
  postProject(project: Project): Promise<ProjectResponse>
  updateProject(project: Project): Promise<ProjectResponse>
  createOrUpdateProject(project: Project): Promise<ProjectResponse>
  deleteProject(projectId: string): Promise<ProjectResponse>
}
```

### Modelos de Datos

#### AboutMe
```typescript
interface AboutMe {
  _id: string;
  name: string;
  birthday?: number;
  nationality?: string;
  job?: string;
  github?: string;
}
```

#### Project
```typescript
interface Project {
  _id?: string;
  title: string;
  description: string;
  version?: string;
  link?: string;
  tag?: string;
  timestamp?: number;
}
```

#### TokenResponse
```typescript
interface TokenResponse {
  token: string;
}
```

### Paso 1: Definir Handlers - src/mocks/handlers.ts

Los **handlers** interceptan requests específicos y retornan respuestas mockeadas basadas en los endpoints reales del proyecto:

```typescript
import { http, HttpResponse } from 'msw';
import { Project } from '../model/project';
import { AboutMe } from '../model/aboutme';

// ==================== DATOS MOCK ====================

const mockAboutMe: AboutMe = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Lucas Fernandez',
  birthday: 631152000000, // 1990-01-01
  nationality: 'Spanish',
  job: 'Software Developer',
  github: 'https://github.com/lucferbux'
};

const mockProjects: Project[] = [
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Taller Testing & Security',
    description: 'Proyecto educativo sobre testing y seguridad en aplicaciones web',
    version: '1.0.0',
    link: 'https://github.com/lucferbux/Taller-Testing-Security',
    tag: 'education',
    timestamp: Date.now()
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'React Dashboard',
    description: 'Dashboard administrativo con React y TypeScript',
    version: '2.1.0',
    link: 'https://github.com/lucferbux/react-dashboard',
    tag: 'react',
    timestamp: Date.now() - 86400000
  }
];

// ==================== HANDLERS ====================

export const handlers = [
  
  // POST /auth/login - Autenticación
  http.post('/auth/login', async ({ request }) => {
    const body = await request.formData();
    const email = body.get('email');
    const password = body.get('password');
    
    // Simulamos validación de credenciales
    if (email === 'user@test.com' && password === 'password123') {
      return HttpResponse.json({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-jwt-token'
      });
    }
    
    // Credenciales inválidas
    return new HttpResponse(null, { status: 401 });
  }),
  
  // GET /v1/aboutme/ - Obtener información del perfil
  http.get('/v1/aboutme/', () => {
    return HttpResponse.json(mockAboutMe);
  }),
  
  // GET /v1/projects/ - Listar todos los proyectos
  http.get('/v1/projects/', () => {
    return HttpResponse.json(mockProjects);
  }),
  
  // POST /v1/projects - Crear nuevo proyecto
  http.post('/v1/projects', async ({ request }) => {
    const newProject = await request.json() as Project;
    
    // Verificamos que el token esté presente
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Simulamos la creación (agregamos _id y timestamp)
    const createdProject: Project = {
      ...newProject,
      _id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    
    return HttpResponse.json(createdProject);
  }),
  
  // PUT /v1/projects - Actualizar proyecto existente
  http.put('/v1/projects', async ({ request }) => {
    const updatedProject = await request.json() as Project;
    
    // Verificamos autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Verificamos que el proyecto exista
    if (!updatedProject._id) {
      return new HttpResponse(null, { status: 400 });
    }
    
    // Retornamos el proyecto actualizado
    return HttpResponse.json({
      ...updatedProject,
      timestamp: Date.now()
    });
  }),
  
  // DELETE /v1/projects - Eliminar proyecto
  http.delete('/v1/projects', async ({ request }) => {
    const body = await request.json() as { id: string };
    
    // Verificamos autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    
    // Verificamos que el ID esté presente
    if (!body.id) {
      return new HttpResponse(null, { status: 400 });
    }
    
    // Confirmamos eliminación
    return HttpResponse.json({ 
      message: 'Project deleted successfully',
      id: body.id 
    });
  }),
];
```

**Características importantes de estos handlers**:

1. **Validación de auth**: Los endpoints protegidos verifican el header `Authorization`
2. **Datos realistas**: Usamos los modelos exactos del proyecto (AboutMe, Project)
3. **Códigos de estado apropiados**: 401 para no autenticado, 400 para bad request
4. **FormData para login**: El endpoint `/auth/login` espera FormData, no JSON
5. **IDs automáticos**: Generamos `_id` para proyectos nuevos

### Patrones de Handlers

#### 1. Acceso al body del request

```typescript
http.post('/v1/projects', async ({ request }) => {
  const newProject = await request.json() as Project;
  // Usamos el body parseado
});
```

#### 2. Validación de headers (Auth)

```typescript
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new HttpResponse(null, { status: 401 });
}
```

#### 3. FormData para login

```typescript
http.post('/auth/login', async ({ request }) => {
  const body = await request.formData();
  const email = body.get('email');
  const password = body.get('password');
  // ...
});
```

#### 4. Simulación de delays (opcional)

```typescript
http.get('/v1/slow-endpoint', async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return HttpResponse.json({ message: 'Slow response' });
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

### Ejemplo: Componente ProjectList

Veamos cómo testear un componente que consume la API del proyecto usando `useFetchData`:

```typescript
// src/components/ProjectList.tsx
import React from 'react';
import { useFetchData } from '../hooks/useFetchData';
import { Project } from '../model/project';
import httpApiClient from '../api/http-api-client';

export function ProjectList() {
  const { data: projects, loading, error } = useFetchData<Project[]>(
    () => httpApiClient.getProjects(),
    []
  );

  if (loading) return <div>Cargando proyectos...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (projects.length === 0) return <div>No hay proyectos disponibles</div>;

  return (
    <ul role="list">
      {projects.map(project => (
        <li key={project._id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          {project.version && <span>v{project.version}</span>}
          {project.tag && <span className="tag">{project.tag}</span>}
        </li>
      ))}
    </ul>
  );
}
```

### Tests con MSW

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ProjectList } from '../ProjectList';
import { server, http, HttpResponse } from '../mocks/server';

describe('ProjectList con MSW', () => {
  
  // ==================== HAPPY PATH ====================
  
  it('debe mostrar loading inicialmente', () => {
    render(<ProjectList />);
    
    expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();
  });

  it('debe cargar y mostrar proyectos desde la API', async () => {
    render(<ProjectList />);

    // Esperamos a que desaparezca el loading
    await waitFor(() => {
      expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
    });

    // Verificamos que los proyectos mockeados aparecen
    // Estos datos vienen del handler GET /v1/projects/ en src/mocks/handlers.ts
    expect(screen.getByText('Taller Testing & Security')).toBeInTheDocument();
    expect(screen.getByText('React Dashboard')).toBeInTheDocument();
  });

  it('debe mostrar todos los detalles de cada proyecto', async () => {
    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando proyectos...')).not.toBeInTheDocument();
    });

    // Verificamos descripción, versión y tag
    expect(screen.getByText(/Proyecto educativo sobre testing/)).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('education')).toBeInTheDocument();
  });

  // ==================== ERROR HANDLING ====================

  it('debe manejar errores de servidor (500)', async () => {
    // OVERRIDE: Sobrescribimos el handler solo para este test
    server.use(
      http.get('/v1/projects/', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    render(<ProjectList />);

    // Esperamos a que aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    // Verificamos que NO hay proyectos mostrados
    expect(screen.queryByText('Taller Testing & Security')).not.toBeInTheDocument();
  });

  it('debe manejar errores de red', async () => {
    // Simulamos un error de red (request falla completamente)
    server.use(
      http.get('/v1/projects/', () => {
        return HttpResponse.error();
      })
    );

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('debe manejar respuesta vacía', async () => {
    // Handler que retorna array vacío
    server.use(
      http.get('/v1/projects/', () => {
        return HttpResponse.json([]);
      })
    );

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText('No hay proyectos disponibles')).toBeInTheDocument();
    });

    // No debería haber elementos en la lista
    const list = screen.queryByRole('list');
    expect(list).not.toBeInTheDocument();
  });

  // ==================== DELAYS Y TIMEOUTS ====================

  it('debe manejar respuestas lentas', async () => {
    // Simulamos un endpoint lento
    server.use(
      http.get('/v1/projects/', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json([
          {
            _id: 'slow-id',
            title: 'Slow Loading Project',
            description: 'Este proyecto tardó en cargar',
            tag: 'slow'
          }
        ]);
      })
    );

    render(<ProjectList />);

    // Loading debe estar presente durante el delay
    expect(screen.getByText('Cargando proyectos...')).toBeInTheDocument();

    // Esperamos a que cargue
    await waitFor(() => {
      expect(screen.getByText('Slow Loading Project')).toBeInTheDocument();
    });
  });
});
```

### Ejemplo: Testear Login con Autenticación

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { server, http, HttpResponse } from '../mocks/server';

describe('LoginForm con MSW', () => {
  
  it('debe autenticarse correctamente con credenciales válidas', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    render(<LoginForm onSuccess={onSuccess} />);

    // Rellenamos el formulario
    await user.type(screen.getByLabelText(/email/i), 'user@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Esperamos a que el handler procese el request
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        token: expect.stringContaining('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      });
    });
  });

  it('debe manejar credenciales inválidas (401)', async () => {
    const user = userEvent.setup();
    
    // Override para simular credenciales incorrectas
    server.use(
      http.post('/auth/login', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Verificamos mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });
});
```

### Técnicas Avanzadas con MSW

#### 1. Override de Handlers por Test

```typescript
it('debe crear un proyecto con autenticación', async () => {
  // Este override solo afecta a este test
  // Después de este test, server.resetHandlers() restaura el handler original
  server.use(
    http.post('/v1/projects', ({ request }) => {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        return new HttpResponse(null, { status: 401 });
      }
      
      return HttpResponse.json({
        _id: 'new-project-id',
        title: 'Test Project',
        description: 'Created in test',
        timestamp: Date.now()
      });
    })
  );
  
  // ... resto del test
});
```

#### 2. Verificar Request Recibido

```typescript
it('debe enviar el JWT token en el header Authorization', async () => {
  let receivedHeaders: Headers | null = null;

  server.use(
    http.get('/v1/projects/', ({ request }) => {
      receivedHeaders = request.headers;
      return HttpResponse.json([]);
    })
  );

  // Simular que el usuario está autenticado
  localStorage.setItem('token', 'test-jwt-token');
  
  render(<ProjectList />);

  await waitFor(() => {
    expect(receivedHeaders).not.toBeNull();
  });

  // Verificar que el header Authorization se envió correctamente
  expect(receivedHeaders!.get('Authorization')).toBe('Bearer test-jwt-token');
});
```

#### 3. Handlers con Estado

```typescript
describe('Gestión de estado en handlers', () => {
  it('debe simular creación y actualización de proyecto', async () => {
    let projectsDB: Project[] = [];

    // Handler POST que agrega al "estado"
    server.use(
      http.post('/v1/projects', async ({ request }) => {
        const newProject = await request.json() as Project;
        const created = {
          ...newProject,
          _id: `id-${Date.now()}`,
          timestamp: Date.now()
        };
        projectsDB.push(created);
        return HttpResponse.json(created);
      }),
      
      // Handler GET que retorna el "estado"
      http.get('/v1/projects/', () => {
        return HttpResponse.json(projectsDB);
      })
    );

    // Test que crea proyecto y verifica que aparece en la lista
    // ...
  });
});
```

#### 4. Simular Diferentes Escenarios de Delay

```typescript
it('debe manejar timeout de API', async () => {
  // Simulamos una API que nunca responde
  server.use(
    http.get('/v1/projects/', async () => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
      return HttpResponse.json([]);
    })
  );

  render(<ProjectList />);

  // Verificamos que el componente maneja el timeout apropiadamente
  await waitFor(() => {
    expect(screen.getByText(/tiempo de espera agotado/i)).toBeInTheDocument();
  }, { timeout: 5000 }); // Timeout de 5 segundos para el test
});
```

## Comparación: MSW vs Jest Mock

Veamos el **antes y después** de usar MSW en el contexto del proyecto:

### ❌ Antes (con jest.mock)

```typescript
// Tenemos que mockear HttpApiClient manualmente
jest.mock('../api/http-api-client', () => ({
  getProjects: jest.fn(),
  getAboutMe: jest.fn(),
  token: jest.fn(),
}));

import httpApiClient from '../api/http-api-client';

it('test con mocks manuales', async () => {
  // Setup complejo del mock
  (httpApiClient.getProjects as jest.Mock).mockResolvedValueOnce([
    {
      _id: '1',
      title: 'Test Project',
      description: 'Description',
      timestamp: Date.now()
    }
  ]);

  render(<ProjectList />);

  // ... assertions
});
```

**Problemas**:

- Mock global de `httpApiClient` afecta todos los tests
- Hay que mockear cada método individualmente
- Difícil simular errores HTTP (status codes, headers)
- No funciona en el browser (solo tests)
- Rompe la abstracción: no testeas la capa HTTP real

### ✅ Después (con MSW)

```typescript
// Los handlers ya están definidos en src/mocks/handlers.ts
// HTTP requests reales pasan por MSW automáticamente

it('test con MSW', async () => {
  render(<ProjectList />);

  await waitFor(() => {
    expect(screen.getByText('Taller Testing & Security')).toBeInTheDocument();
  });
});
```

**Ventajas**:

- Handlers reutilizables en todos los tests
- API HTTP realista (fetch/axios reales)
- Funciona en tests **Y** browser (development)
- Override fácil cuando es necesario
- Simula autenticación JWT de forma realista

## MSW en el Browser (Bonus)

MSW también puede usarse en **development** para mockear APIs mientras desarrollas, sin necesidad de backend:

### Setup para Browser: src/mocks/browser.ts

```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Iniciar en Development: src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Solo en development
if (process.env.NODE_ENV === 'development') {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass', // Deja pasar requests sin handler
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Con esto configurado, **todas las requests HTTP de tu aplicación** serán interceptadas por MSW durante el desarrollo, permitiéndote:

- Desarrollar frontend sin backend funcionando
- Simular diferentes escenarios (errores, delays, datos específicos)
- Ver requests HTTP reales en DevTools
- Cambiar handlers en caliente sin recargar

:::tip Uso en desarrollo
MSW es especialmente útil cuando:
- El backend aún no está listo
- Quieres testear edge cases (errores 500, timeouts, etc.)
- Desarrollas offline
- Necesitas datos específicos que son difíciles de generar en el backend
:::

## Resumen

**Mock Service Worker (MSW)** es la solución moderna para mockear APIs en tests y desarrollo:

1. **Define handlers reutilizables** en `src/mocks/handlers.ts`
   - Usa endpoints reales del proyecto (`/v1/projects/`, `/auth/login`, etc.)
   - Simula autenticación con JWT Bearer tokens
   - Valida requests (headers, body, params)

2. **Crea el server** en `src/mocks/server.ts`
   - `setupServer(...handlers)` para Node.js (tests)
   - Export para usar en tests con overrides

3. **Configura Jest** en `src/setupTests.ts`
   - `beforeAll()` → iniciar server
   - `afterEach()` → resetear handlers
   - `afterAll()` → cerrar server

4. **Escribe tests realistas** que:
   - Hacen requests HTTP reales con `fetch` o `httpApiClient`
   - Verifican loading, success y error states
   - Usan `server.use()` para overrides específicos
   - Simulan delays, timeouts y errores de red

5. **(Opcional) Usa en browser** para desarrollo
   - `setupWorker(...handlers)` en `src/mocks/browser.ts`
   - Iniciar en `src/main.tsx` solo en development
   - Desarrolla frontend sin backend

### Ventajas Clave

✅ **Realismo**: Intercepta HTTP real, no mocks de funciones  
✅ **Reutilización**: Handlers compartidos entre tests  
✅ **Type Safety**: TypeScript completo en requests/responses  
✅ **Debugging**: Requests visibles en DevTools  
✅ **Flexibilidad**: Override fácil por test  
✅ **Cross-environment**: Funciona en tests Y browser  

### Cuándo Usar MSW

| Escenario | ¿Usar MSW? |
|-----------|-----------|
| Testear componentes con fetch/API | ✅ Sí |
| Testear lógica de autenticación | ✅ Sí |
| Testear error handling HTTP | ✅ Sí |
| Desarrollar sin backend | ✅ Sí (browser mode) |
| Testear funciones puras sin HTTP | ❌ No (usa Jest) |
| Testear hooks sin side effects | ❌ No (usa Jest) |

MSW se integra perfectamente con el **Taller Testing & Security**, permitiendo testear toda la capa de API (`/v1/projects/`, `/v1/aboutme/`, `/auth/login`) de forma realista y mantenible.

---

**Referencias**:

- [Documentación oficial de MSW](https://mswjs.io/)
---

**Referencias**:

- [Documentación oficial de MSW](https://mswjs.io/)
- [MSW con React Testing Library](https://mswjs.io/docs/integrations/react)
- [Ejemplos de handlers](https://mswjs.io/docs/basics/response-resolver)

