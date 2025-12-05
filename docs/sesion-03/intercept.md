---
sidebar_position: 8
title: "Intercepción de APIs"
---

`cy.intercept()` permite interceptar y mockear peticiones HTTP. Es fundamental para tests E2E porque controlas las respuestas del servidor.

## ¿Por qué Interceptar?

| Razón | Beneficio |
|-------|-----------|
| **Velocidad** | No esperas a servidor real |
| **Determinismo** | Siempre misma respuesta |
| **Edge cases** | Simulas errores, timeouts |
| **Aislamiento** | Test no depende de backend |

---

## APIs del Proyecto

El proyecto **Taller-Testing-Security** usa estas APIs:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Autenticación |
| `/api/v1/aboutme/` | GET | Información del perfil |
| `/api/v1/projects/` | GET | Lista de proyectos |
| `/api/v1/aboutme/:id` | PUT | Actualizar perfil |
| `/api/v1/projects/:id` | PUT/DELETE | CRUD proyectos |

---

## Sintaxis Básica

```typescript
// Interceptar GET
cy.intercept('GET', '/api/endpoint', { fixture: 'data.json' });

// Interceptar POST
cy.intercept('POST', '/api/endpoint', { statusCode: 200 });

// Con alias para esperar
cy.intercept('GET', '/api/endpoint', { fixture: 'data.json' }).as('getData');
cy.wait('@getData');
```

---

## Interceptar Login

### Mockear login exitoso

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('mockLoginApi', (options = { success: true }) => {
  if (options.success) {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0',
        user: {
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com'
        }
      }
    }).as('loginSuccess');
  } else {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: {
        error: 'Invalid credentials'
      }
    }).as('loginError');
  }
});
```

### Usar en test

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login', () => {
  
  it('debe hacer login exitoso', () => {
    cy.mockLoginApi({ success: true });
    
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[type="submit"]').click();
    
    // Esperar a que el mock responda
    cy.wait('@loginSuccess');
    
    // Verificar redirección
    cy.url().should('include', '/admin');
  });

  it('debe mostrar error con credenciales inválidas', () => {
    cy.mockLoginApi({ success: false });
    
    cy.visit('/login');
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginError');
    
    // Sigue en login con error
    cy.url().should('include', '/login');
    cy.contains(/invalid|error/i).should('be.visible');
  });
});
```

---

## Interceptar Dashboard APIs

### Mockear aboutme y projects

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('mockDashboardApi', (options = {}) => {
  const { delay = 0, error = false } = options;
  
  if (error) {
    cy.intercept('GET', '**/v1/aboutme/', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getAboutMe');
    
    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getProjects');
  } else {
    cy.intercept('GET', '**/v1/aboutme/', {
      statusCode: 200,
      body: { fixture: 'aboutme.json' },
      delay: delay
    }).as('getAboutMe');
    
    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 200,
      body: { fixture: 'projects.json' },
      delay: delay
    }).as('getProjects');
  }
});
```

### Usar fixtures

```json
// cypress/fixtures/aboutme.json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Lucas Fernandez",
  "bio": "Full Stack Developer",
  "location": "Madrid, Spain",
  "email": "lucas@example.com"
}
```

```json
// cypress/fixtures/projects.json
[
  {
    "_id": "60d5ecb54f3c2b001f8e4b1a",
    "title": "Taller Testing",
    "description": "Proyecto de testing E2E",
    "technologies": ["React", "Cypress", "TypeScript"]
  },
  {
    "_id": "60d5ecb54f3c2b001f8e4b1b",
    "title": "API Backend",
    "description": "API REST con Express",
    "technologies": ["Node.js", "Express", "MongoDB"]
  }
]
```

### Test del dashboard

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard', () => {
  
  beforeEach(() => {
    cy.mockDashboardApi();
  });

  it('debe cargar perfil y proyectos', () => {
    cy.visit('/dashboard');
    
    // Esperar ambas APIs
    cy.wait(['@getAboutMe', '@getProjects']);
    
    // Verificar datos cargados
    cy.contains('Lucas Fernandez').should('be.visible');
    cy.contains('Taller Testing').should('be.visible');
  });

  it('debe mostrar loading mientras carga', () => {
    cy.mockDashboardApi({ delay: 1000 });
    
    cy.visit('/dashboard');
    
    // Loading visible
    cy.contains(/loading|cargando/i).should('be.visible');
    
    // Esperar carga
    cy.wait(['@getAboutMe', '@getProjects']);
    
    // Loading desaparece
    cy.contains(/loading|cargando/i).should('not.exist');
  });

  it('debe manejar error de API', () => {
    cy.mockDashboardApi({ error: true });
    
    cy.visit('/dashboard');
    
    // Muestra error
    cy.contains(/error/i).should('be.visible');
  });
});
```

---

## Patrones de Intercepción

### Glob patterns

```typescript
// Cualquier método a /api/...
cy.intercept('**/api/**');

// Solo GET a v1
cy.intercept('GET', '**/v1/**');

// Endpoint específico con ID dinámico
cy.intercept('GET', '**/projects/*');
```

### Por regex

```typescript
// Endpoints que terminan en número
cy.intercept('GET', /\/projects\/\d+$/);

// Cualquier v1 o v2
cy.intercept('GET', /\/v[12]\//);
```

### Por RouteMatcher

```typescript
cy.intercept({
  method: 'GET',
  url: '**/api/projects*',
  query: {
    page: '1'
  }
}).as('getProjectsPage1');
```

---

## Respuestas Dinámicas

### Función de respuesta

```typescript
cy.intercept('POST', '**/auth/login', (req) => {
  // Verificar body de request
  if (req.body.email === 'admin@example.com') {
    req.reply({
      statusCode: 200,
      body: { token: 'admin-token', role: 'admin' }
    });
  } else {
    req.reply({
      statusCode: 200,
      body: { token: 'user-token', role: 'user' }
    });
  }
}).as('login');
```

### Modificar request

```typescript
cy.intercept('POST', '**/api/**', (req) => {
  // Agregar header
  req.headers['X-Test-Header'] = 'cypress';
  
  // Modificar body
  req.body.timestamp = Date.now();
  
  // Continuar con request modificada
  req.continue();
}).as('modifiedRequest');
```

### Modificar response

```typescript
cy.intercept('GET', '**/projects/', (req) => {
  req.continue((res) => {
    // Agregar proyecto extra
    res.body.push({
      _id: 'extra-1',
      title: 'Proyecto Extra',
      description: 'Agregado por Cypress'
    });
  });
}).as('projectsWithExtra');
```

---

## Verificar Requests

### Verificar que se envió request

```typescript
it('debe enviar las credenciales', () => {
  cy.mockLoginApi({ success: true });
  
  cy.visit('/login');
  cy.get('input[name="email"]').type('test@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('input[type="submit"]').click();
  
  // Verificar el request que se envió
  cy.wait('@loginSuccess').then((interception) => {
    expect(interception.request.body).to.deep.include({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### Sintaxis alternativa

```typescript
cy.wait('@loginSuccess').its('request.body').should('deep.include', {
  email: 'test@example.com'
});

cy.wait('@loginSuccess').its('response.statusCode').should('eq', 200);
```

---

## Simular Escenarios

### Network error

```typescript
cy.intercept('GET', '**/api/projects/', {
  forceNetworkError: true
}).as('networkError');
```

### Timeout

```typescript
cy.intercept('GET', '**/api/projects/', {
  delay: 30000,
  body: []
}).as('slowResponse');
```

### Diferentes status codes

```typescript
// 401 Unauthorized
cy.intercept('GET', '**/api/admin/**', {
  statusCode: 401,
  body: { error: 'Unauthorized' }
}).as('unauthorized');

// 404 Not Found
cy.intercept('GET', '**/api/users/999', {
  statusCode: 404,
  body: { error: 'Not found' }
}).as('notFound');

// 500 Server Error
cy.intercept('POST', '**/api/**', {
  statusCode: 500,
  body: { error: 'Internal server error' }
}).as('serverError');
```

---

## Orden de Interceptores

Los interceptores se evalúan en orden inverso (último primero):

```typescript
// Este se ignora para /projects/1
cy.intercept('GET', '**/projects/*', { fixture: 'projects.json' });

// Este tiene prioridad para /projects/1
cy.intercept('GET', '**/projects/1', { fixture: 'project-detail.json' });
```

---

## Ejemplos Completos

### Flujo completo de usuario

```typescript
// cypress/e2e/flows/complete-flow.cy.ts

describe('Flujo completo', () => {
  
  it('debe hacer login, ver dashboard y crear proyecto', () => {
    // Mockear login
    cy.mockLoginApi({ success: true });
    
    // Mockear dashboard
    cy.mockDashboardApi();
    
    // Mockear creación de proyecto
    cy.intercept('POST', '**/v1/projects/', {
      statusCode: 201,
      body: {
        _id: 'new-project-id',
        title: 'Nuevo Proyecto',
        description: 'Creado en test'
      }
    }).as('createProject');
    
    // Hacer login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginSuccess');
    cy.url().should('include', '/admin');
    
    // Crear proyecto
    cy.contains('button', /new|nuevo/i).click();
    cy.get('input[name="title"]').type('Nuevo Proyecto');
    cy.get('textarea[name="description"]').type('Creado en test');
    cy.contains('button', /save|guardar/i).click();
    
    // Verificar creación
    cy.wait('@createProject').its('request.body').should('include', {
      title: 'Nuevo Proyecto'
    });
  });
});
```

---

## Resumen

| Uso | Comando |
|-----|---------|
| Interceptar request | `cy.intercept('METHOD', 'URL', response)` |
| Usar fixture | `{ fixture: 'file.json' }` |
| Alias para wait | `.as('alias')` |
| Esperar request | `cy.wait('@alias')` |
| Verificar request | `cy.wait('@alias').its('request.body')` |
| Simular error | `{ statusCode: 500 }` |
| Simular delay | `{ delay: 1000 }` |
| Network error | `{ forceNetworkError: true }` |

---

## Próximos Pasos

Con la intercepción dominada:

1. **[Custom Commands](./custom-commands)** - Encapsular interceptores
