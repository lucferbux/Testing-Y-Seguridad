---
sidebar_position: 9
title: "Custom Commands"
---

Los Custom Commands permiten encapsular lógica reutilizable. Esto hace los tests más legibles y mantenibles.

## ¿Por qué Custom Commands?

| Problema | Solución |
|----------|----------|
| Código repetido en cada test | Extraer a command reutilizable |
| Tests difíciles de leer | Comandos con nombres descriptivos |
| Cambios requieren editar muchos tests | Cambiar solo el command |

---

## Custom Commands del Proyecto

El proyecto **Taller-Testing-Security** tiene estos custom commands:

| Command | Propósito |
|---------|-----------|
| `cy.mockLoginApi()` | Mockea la API de login |
| `cy.mockDashboardApi()` | Mockea las APIs del dashboard |
| `cy.loginByUI()` | Hace login llenando el formulario |
| `cy.logout()` | Hace logout |
| `cy.getByTestId()` | Selecciona por data-testid |

---

## Estructura de Archivos

```text
cypress/
├── support/
│   ├── commands.ts      # Definición de custom commands
│   ├── e2e.ts           # Setup global (importa commands)
│   └── index.d.ts       # Tipos TypeScript
├── fixtures/
│   ├── users.json
│   ├── aboutme.json
│   └── projects.json
└── e2e/
    └── ...
```

---

## Implementación de Commands

### Paso 1: Definir los commands

```typescript
// cypress/support/commands.ts

/// <reference types="cypress" />

// Token JWT válido (expira en 2030)
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';

// ============================================
// SELECTOR COMMANDS
// ============================================

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// ============================================
// MOCK API COMMANDS
// ============================================

interface MockLoginOptions {
  success?: boolean;
}

Cypress.Commands.add('mockLoginApi', (options: MockLoginOptions = { success: true }) => {
  if (options.success) {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        token: MOCK_TOKEN,
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

interface MockDashboardOptions {
  delay?: number;
  error?: boolean;
}

Cypress.Commands.add('mockDashboardApi', (options: MockDashboardOptions = {}) => {
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
      fixture: 'aboutme.json',
      delay: delay
    }).as('getAboutMe');
    
    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 200,
      fixture: 'projects.json',
      delay: delay
    }).as('getProjects');
  }
});

// ============================================
// AUTH COMMANDS
// ============================================

interface LoginOptions {
  email?: string;
  password?: string;
}

Cypress.Commands.add('loginByUI', (options: LoginOptions = {}) => {
  const { 
    email = 'test@example.com', 
    password = 'password123' 
  } = options;
  
  cy.mockLoginApi({ success: true });
  cy.mockDashboardApi();
  
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[type="submit"]').click();
  
  cy.wait('@loginSuccess');
  cy.url().should('include', '/admin');
});

Cypress.Commands.add('logout', () => {
  // Limpiar localStorage
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
  });
  
  // Navegar a home
  cy.visit('/');
});

// Export vacío para TypeScript
export {};
```

### Paso 2: Declarar tipos TypeScript

```typescript
// cypress/support/index.d.ts

/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Selecciona un elemento por su data-testid
     * @param testId - El valor del atributo data-testid
     * @example cy.getByTestId('login-button')
     */
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    
    /**
     * Mockea la API de login
     * @param options - { success: boolean }
     * @example cy.mockLoginApi({ success: true })
     */
    mockLoginApi(options?: { success?: boolean }): Chainable<null>;
    
    /**
     * Mockea las APIs del dashboard (aboutme y projects)
     * @param options - { delay?: number, error?: boolean }
     * @example cy.mockDashboardApi({ delay: 1000 })
     */
    mockDashboardApi(options?: { delay?: number; error?: boolean }): Chainable<null>;
    
    /**
     * Hace login mediante la UI
     * @param options - { email?: string, password?: string }
     * @example cy.loginByUI({ email: 'user@test.com', password: 'pass123' })
     */
    loginByUI(options?: { email?: string; password?: string }): Chainable<void>;
    
    /**
     * Hace logout limpiando el token
     * @example cy.logout()
     */
    logout(): Chainable<void>;
  }
}
```

### Paso 3: Importar en e2e.ts

```typescript
// cypress/support/e2e.ts

import './commands';

// Opcional: configuración adicional
Cypress.on('uncaught:exception', () => {
  // Prevenir fallo por errores no capturados
  return false;
});
```

---

## Usar Custom Commands en Tests

### Test de login simplificado

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login', () => {
  
  it('debe hacer login exitoso', () => {
    // Usa el custom command
    cy.loginByUI();
    
    // Verifica que estamos en admin
    cy.url().should('include', '/admin');
  });

  it('debe hacer login con usuario específico', () => {
    cy.loginByUI({
      email: 'admin@example.com',
      password: 'adminpass'
    });
    
    cy.url().should('include', '/admin');
  });
});
```

### Test de dashboard simplificado

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard', () => {
  
  beforeEach(() => {
    cy.mockDashboardApi();
  });

  it('debe cargar datos', () => {
    cy.visit('/dashboard');
    cy.wait(['@getAboutMe', '@getProjects']);
    
    cy.getByTestId('user-profile').should('be.visible');
    cy.getByTestId('projects-list').should('be.visible');
  });

  it('debe mostrar loading', () => {
    cy.mockDashboardApi({ delay: 1000 });
    
    cy.visit('/dashboard');
    cy.getByTestId('loading').should('be.visible');
    
    cy.wait(['@getAboutMe', '@getProjects']);
    cy.getByTestId('loading').should('not.exist');
  });

  it('debe manejar errores', () => {
    cy.mockDashboardApi({ error: true });
    
    cy.visit('/dashboard');
    cy.contains(/error/i).should('be.visible');
  });
});
```

### Test de flujo completo

```typescript
// cypress/e2e/flows/admin-flow.cy.ts

describe('Flujo de Admin', () => {
  
  beforeEach(() => {
    cy.loginByUI();
  });

  afterEach(() => {
    cy.logout();
  });

  it('debe editar perfil', () => {
    // Mockear update
    cy.intercept('PUT', '**/v1/aboutme/**', {
      statusCode: 200
    }).as('updateProfile');
    
    cy.getByTestId('edit-profile-button').click();
    cy.get('input[name="name"]').clear().type('Nuevo Nombre');
    cy.getByTestId('save-button').click();
    
    cy.wait('@updateProfile');
    cy.contains('Nuevo Nombre').should('be.visible');
  });

  it('debe crear proyecto', () => {
    cy.intercept('POST', '**/v1/projects/', {
      statusCode: 201,
      body: { _id: 'new-id', title: 'Proyecto Nuevo' }
    }).as('createProject');
    
    cy.getByTestId('new-project-button').click();
    cy.get('input[name="title"]').type('Proyecto Nuevo');
    cy.getByTestId('save-button').click();
    
    cy.wait('@createProject');
  });
});
```

---

## Crear Commands Adicionales

### Command para verificar toast/notificación

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('shouldShowToast', (message: string, type: 'success' | 'error' = 'success') => {
  cy.get(`[data-testid="toast-${type}"]`)
    .should('be.visible')
    .and('contain', message);
});
```

### Command para llenar formulario completo

```typescript
Cypress.Commands.add('fillProjectForm', (project: {
  title: string;
  description: string;
  technologies?: string[];
}) => {
  cy.get('input[name="title"]').clear().type(project.title);
  cy.get('textarea[name="description"]').clear().type(project.description);
  
  if (project.technologies) {
    project.technologies.forEach(tech => {
      cy.get('input[name="technology"]').type(tech);
      cy.getByTestId('add-tech-button').click();
    });
  }
});
```

### Usar los nuevos commands

```typescript
it('debe crear proyecto', () => {
  cy.intercept('POST', '**/v1/projects/', { statusCode: 201 }).as('create');
  
  cy.fillProjectForm({
    title: 'Mi Proyecto',
    description: 'Descripción del proyecto',
    technologies: ['React', 'TypeScript']
  });
  
  cy.getByTestId('save-button').click();
  cy.wait('@create');
  cy.shouldShowToast('Proyecto creado', 'success');
});
```

---

## Commands que Retornan Valores

### Obtener token del localStorage

```typescript
Cypress.Commands.add('getToken', () => {
  return cy.window().then((win) => {
    return win.localStorage.getItem('token');
  });
});

// Uso
cy.getToken().then((token) => {
  expect(token).to.not.be.null;
});
```

### Obtener estado de la app

```typescript
Cypress.Commands.add('getAppState', () => {
  return cy.window().its('__APP_STATE__');
});

// Uso
cy.getAppState().then((state) => {
  expect(state.user).to.exist;
});
```

---

## Child Commands

Child commands operan sobre el subject anterior:

```typescript
Cypress.Commands.add(
  'shouldBeVisible',
  { prevSubject: 'element' },
  (subject) => {
    return cy.wrap(subject).should('be.visible');
  }
);

// Uso
cy.getByTestId('button').shouldBeVisible();
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// Nombres descriptivos
cy.loginByUI();
cy.mockDashboardApi();

// Opciones con defaults
cy.mockLoginApi({ success: true });
cy.mockDashboardApi({ delay: 100 });

// Documentar con JSDoc
/**
 * Hace login mediante la UI
 * @param options - Credenciales opcionales
 */
Cypress.Commands.add('loginByUI', ...);
```

### ❌ Evitar

```typescript
// Nombres genéricos
cy.doLogin();
cy.setup();

// Hardcodear valores
Cypress.Commands.add('login', () => {
  cy.get('input').type('test@test.com'); // No configurable
});

// Commands que hacen demasiado
cy.setupEverything(); // Muy acoplado
```

---

## Debugging Commands

```typescript
// Ver qué hace el command
cy.log('🔐 Ejecutando loginByUI');
cy.loginByUI();

// Pausar para debug
Cypress.Commands.add('loginByUI', () => {
  cy.log('Starting login...');
  cy.pause(); // Debug
  // ...resto del command
});
```

---

## Resumen

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| Parent command | `cy.loginByUI()` | Inicia chain |
| Child command | `.shouldBeVisible()` | Requiere subject |
| Mock command | `cy.mockLoginApi()` | Prepara interceptores |
| Selector command | `cy.getByTestId()` | Simplifica selección |

---

## Archivos del Proyecto

Los archivos de soporte están en:

| Archivo | Propósito |
|---------|-----------|
| `cypress/support/commands.ts` | Definición de commands |
| `cypress/support/index.d.ts` | Tipos TypeScript |
| `cypress/support/e2e.ts` | Setup que importa todo |
| `cypress/fixtures/*.json` | Datos mock |
