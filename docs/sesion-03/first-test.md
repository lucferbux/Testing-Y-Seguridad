---
sidebar_position: 5
title: "Primer Test"
---

Vamos a crear nuestros primeros tests E2E para el proyecto **Taller-Testing-Security**.

## Estructura de un Test

Cypress usa la sintaxis de Mocha/Chai. Un test tiene esta estructura:

```typescript
describe('Nombre del grupo de tests', () => {
  
  beforeEach(() => {
    // Se ejecuta ANTES de cada test
  });
  
  it('debe hacer algo específico', () => {
    // Test individual
  });
  
  it('debe hacer otra cosa', () => {
    // Otro test
  });
});
```

| Bloque | Propósito |
|--------|-----------|
| `describe()` | Agrupa tests relacionados |
| `beforeEach()` | Setup antes de cada test |
| `it()` | Define un test individual |
| `afterEach()` | Cleanup después de cada test |

---

## Test 1: Landing Page

Creamos nuestro primer test para verificar que la landing page carga correctamente.

### Crear el archivo

```typescript
// cypress/e2e/landing.cy.ts

describe('Landing Page', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe cargar la página correctamente', () => {
    // Verificar que estamos en la URL correcta
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Verificar que existe un título
    cy.get('h1').should('be.visible');
  });

  it('debe mostrar navegación', () => {
    // Verificar links de navegación
    cy.contains(/home|inicio/i).should('be.visible');
    cy.contains(/dashboard/i).should('be.visible');
  });
});
```

### Ejecutar el test

```bash
# Modo interactivo
npm run test:e2e:open

# Modo headless
npm run test:e2e
```

---

## Test 2: Formulario de Login

El login es una funcionalidad crítica. Vamos a testear varios escenarios.

### Archivo de test

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login Page', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Elementos del formulario', () => {
    
    it('debe mostrar los campos del formulario', () => {
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[type="submit"]').should('be.visible');
    });
  });

  describe('Validación', () => {
    
    it('debe mostrar error con campos vacíos', () => {
      // Submit sin llenar
      cy.get('input[type="submit"]').click();
      
      // Debe mostrar mensaje de error
      cy.contains(/username|password|email/i).should('be.visible');
    });

    it('debe mostrar error solo con email', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[type="submit"]').click();
      
      // Error porque falta password
      cy.contains(/password|contraseña/i).should('be.visible');
    });
  });

  describe('Login con API mockeada', () => {
    
    it('debe hacer login exitoso', () => {
      // Mockear respuesta de la API
      cy.mockLoginApi({ success: true });
      
      // Llenar formulario
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar respuesta
      cy.wait('@loginSuccess');
      
      // Verificar redirección
      cy.url().should('include', '/admin');
    });

    it('debe mostrar error con credenciales inválidas', () => {
      // Mockear error
      cy.mockLoginApi({ success: false });
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpass');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Seguimos en login
      cy.url().should('include', '/login');
      
      // Muestra error
      cy.contains(/invalid|error/i).should('be.visible');
    });
  });
});
```

:::info Custom Command
`cy.mockLoginApi()` es un custom command que definimos en `cypress/support/commands.ts`. Simplifica el mockeo de la API de login.
:::

---

## Test 3: Dashboard

El dashboard carga datos de dos APIs: `aboutme` y `projects`.

### Test de Dashboard

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard Page', () => {
  
  describe('Carga de datos', () => {
    
    beforeEach(() => {
      // Mockear las APIs del dashboard
      cy.mockDashboardApi();
    });

    it('debe cargar y mostrar el perfil', () => {
      cy.visit('/dashboard');
      
      // Esperar a que las APIs respondan
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que se muestra la información
      cy.contains('Test User').should('be.visible');
    });

    it('debe mostrar los proyectos', () => {
      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que hay al menos un proyecto
      cy.contains('Test Project').should('be.visible');
    });
  });

  describe('Estados de carga', () => {
    
    it('debe mostrar loading mientras carga', () => {
      // Mockear con delay
      cy.mockDashboardApi({ delay: 1000 });
      
      cy.visit('/dashboard');
      
      // Verificar que aparece el loader
      cy.contains(/loading|cargando/i).should('be.visible');
      
      // Esperar a que termine
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Loader desaparece
      cy.contains(/loading|cargando/i).should('not.exist');
    });
  });

  describe('Manejo de errores', () => {
    
    it('debe mostrar error cuando la API falla', () => {
      // Mockear error
      cy.mockDashboardApi({ error: true });
      
      cy.visit('/dashboard');
      
      // Verificar mensaje de error
      cy.contains(/error/i).should('be.visible');
    });
  });
});
```

---

## Test 4: Flujo Completo de Usuario

Este test simula el journey completo de un usuario.

### Test de User Journey

```typescript
// cypress/e2e/flows/user-journey.cy.ts

describe('Flujo de Usuario', () => {

  describe('Usuario anónimo', () => {
    
    it('debe navegar de landing a dashboard', () => {
      // Mockear APIs
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');
      
      // Empezar en landing
      cy.visit('/');
      
      // Click en Dashboard
      cy.contains(/dashboard/i).click();
      
      // Verificar navegación
      cy.url().should('include', '/dashboard');
      
      // Esperar datos
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar contenido
      cy.contains('Lucas Fernandez').should('be.visible');
    });
  });

  describe('Usuario autenticado', () => {
    
    beforeEach(() => {
      cy.mockLoginApi({ success: true });
      cy.mockDashboardApi();
    });

    it('debe hacer login y acceder a admin', () => {
      // Ir a login
      cy.visit('/login');
      
      // Hacer login
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar login
      cy.wait('@loginSuccess');
      
      // Verificar que estamos en admin
      cy.url().should('include', '/admin');
    });
  });
});
```

---

## Usar Fixtures

Los fixtures son datos mock en formato JSON que puedes reutilizar.

### Archivo de fixture

```json
// cypress/fixtures/users.json
{
  "validUser": {
    "email": "test@example.com",
    "password": "test123"
  },
  "invalidUser": {
    "email": "wrong@example.com",
    "password": "wrongpass"
  }
}
```

### Usar en tests

```typescript
it('debe usar datos de fixture', () => {
  cy.mockLoginApi({ success: true });
  
  // Cargar fixture
  cy.fixture('users').then((users) => {
    cy.get('input[name="email"]').type(users.validUser.email);
    cy.get('input[name="password"]').type(users.validUser.password);
    cy.get('input[type="submit"]').click();
  });
  
  cy.wait('@loginSuccess');
});
```

---

## Debugging

### Pausar ejecución

```typescript
it('debug test', () => {
  cy.visit('/');
  cy.pause(); // Pausa aquí - puedes continuar paso a paso
  cy.get('h1').should('be.visible');
});
```

### Inspeccionar elemento

```typescript
it('debug element', () => {
  cy.get('[data-testid="user"]').debug(); // Abre DevTools
});
```

### Logs personalizados

```typescript
it('with logs', () => {
  cy.log('🚀 Iniciando test');
  cy.visit('/');
  cy.log('✅ Página cargada');
});
```

### Screenshots

```typescript
it('take screenshots', () => {
  cy.visit('/');
  cy.screenshot('homepage-inicial');
  
  cy.get('button').click();
  cy.screenshot('despues-de-click');
});
```

---

## Errores Comunes

### Element not found

```typescript
// ❌ El elemento no existe o no ha cargado
cy.get('[data-testid="user"]').click();

// ✅ Aumentar timeout
cy.get('[data-testid="user"]', { timeout: 10000 }).click();

// ✅ Esperar a que algo desaparezca primero
cy.get('[data-testid="loading"]').should('not.exist');
cy.get('[data-testid="user"]').click();
```

### Element not visible

```typescript
// ❌ Elemento existe pero está oculto
cy.get('button').click();

// ✅ Forzar click (usar con cuidado)
cy.get('button').click({ force: true });
```

### No uses waits fijos

```typescript
// ❌ Wait arbitrario
cy.wait(5000);

// ✅ Wait inteligente - esperar a que elemento exista
cy.get('[data-testid="result"]', { timeout: 10000 }).should('exist');

// ✅ Wait a request
cy.wait('@apiRequest');
```

---

## Resumen de Comandos Básicos

| Comando | Descripción |
|---------|-------------|
| `cy.visit('/')` | Navegar a URL |
| `cy.get('selector')` | Obtener elemento |
| `cy.contains('texto')` | Buscar por texto |
| `cy.click()` | Click en elemento |
| `cy.type('texto')` | Escribir texto |
| `cy.should('be.visible')` | Verificar estado |
| `cy.wait('@alias')` | Esperar request |
| `cy.url()` | Obtener URL actual |

---

## Próximos Pasos

Ahora que sabes escribir tests básicos:

1. **[Selectores](./selectors)** - Estrategias para encontrar elementos
2. **[Formularios](./forms)** - Testing de inputs y validaciones
3. **[Intercepción](./intercept)** - Mockear APIs
