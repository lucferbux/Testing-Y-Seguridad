---
sidebar_position: 10
title: "Custom Commands"
---

# Custom Commands

## Crear Custom Commands

**Archivo: cypress/support/commands.ts**

```typescript
// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="submit-button"]').click();
  cy.url().should('not.include', '/login');
});

// Type declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
```

**Uso:**

```typescript
describe('Dashboard', () => {
  
  beforeEach(() => {
    cy.login('user@example.com', 'password123');
  });

  it('debe mostrar dashboard después de login', () => {
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });
});
```

## Más Custom Commands Útiles

```typescript
// Drag and drop
Cypress.Commands.add('drag', (sourceSelector: string, targetSelector: string) => {
  cy.get(sourceSelector).trigger('dragstart');
  cy.get(targetSelector).trigger('drop');
});

// Take screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name: string) => {
  const timestamp = new Date().getTime();
  cy.screenshot(`${name}-${timestamp}`);
});

// Wait for element and click
Cypress.Commands.add('waitAndClick', (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible').click();
});

// Seed database (requires backend endpoint)
Cypress.Commands.add('seedDatabase', () => {
  cy.request('POST', '/api/test/seed');
});

// Clear database
Cypress.Commands.add('clearDatabase', () => {
  cy.request('POST', '/api/test/clear');
});

declare global {
  namespace Cypress {
    interface Chainable {
      drag(source: string, target: string): Chainable<void>;
      screenshotWithTimestamp(name: string): Chainable<void>;
      waitAndClick(selector: string, timeout?: number): Chainable<void>;
      seedDatabase(): Chainable<void>;
      clearDatabase(): Chainable<void>;
    }
  }
}
```

---

## Ejemplo Real: Proyecto Taller-Testing-Security

El proyecto **Taller-Testing-Security** implementa varios custom commands útiles para testing de APIs y autenticación.

### Custom Commands del Proyecto

```typescript
// cypress/support/commands.ts

/// <reference types="cypress" />

/**
 * Custom command para hacer login via UI
 * Útil para tests que específicamente testean el flujo de login
 */
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[type="submit"]').click();
  cy.url().should('include', '/admin');
});

/**
 * Custom command para logout
 */
Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage('token');
  cy.visit('/');
});

/**
 * Custom command para interceptar y mockear la API de dashboard
 */
Cypress.Commands.add('mockDashboardApi', (options?: { 
  aboutMe?: object; 
  projects?: object[];
  delay?: number;
  error?: boolean;
}) => {
  const defaultAboutMe = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    birthday: 631152000000,
    nationality: 'Spanish',
    job: 'Software Developer',
    github: 'https://github.com/test'
  };

  const defaultProjects = [
    {
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Project 1',
      description: 'Description for test project 1',
      version: '1.0.0',
      link: 'https://github.com/test/project1',
      tag: 'testing',
      timestamp: Date.now()
    }
  ];

  if (options?.error) {
    cy.intercept('GET', '**/v1/aboutme/', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('getAboutMeError');
    
    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('getProjectsError');
  } else {
    cy.intercept('GET', '**/v1/aboutme/', {
      statusCode: 200,
      body: options?.aboutMe || defaultAboutMe,
      delay: options?.delay || 0
    }).as('getAboutMe');

    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 200,
      body: options?.projects || defaultProjects,
      delay: options?.delay || 0
    }).as('getProjects');
  }
});

/**
 * Custom command para interceptar login
 * 
 * IMPORTANTE: El token debe ser un JWT válido porque la app usa jwt_decode
 * para extraer las fechas de expiración. Usamos un JWT pre-generado que expira
 * en 2030 para evitar problemas en los tests.
 */
Cypress.Commands.add('mockLoginApi', (options?: {
  success?: boolean;
  token?: string;
  delay?: number;
}) => {
  // JWT válido que expira en 2030
  // Payload: { "_id": "507f1f77bcf86cd799439011", "email": "test@example.com", "iat": 1700000000, "exp": 1900000000 }
  const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';
  
  if (options?.success === false) {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError');
  } else {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { token: options?.token || validJwtToken },
      delay: options?.delay || 0
    }).as('loginSuccess');
  }
});

// ==================== TYPE DECLARATIONS ====================

declare global {
  namespace Cypress {
    interface Chainable {
      loginByUI(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      mockDashboardApi(options?: { 
        aboutMe?: object; 
        projects?: object[];
        delay?: number;
        error?: boolean;
      }): Chainable<void>;
      mockLoginApi(options?: {
        success?: boolean;
        token?: string;
        delay?: number;
      }): Chainable<void>;
    }
  }
}

export {};
```

### Uso de Custom Commands en Tests

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard Page', () => {
  
  describe('Con Custom Commands', () => {
    
    beforeEach(() => {
      // Usar custom command para mockear
      cy.mockDashboardApi();
    });

    it('debe cargar datos usando custom command', () => {
      cy.visit('/dashboard');
      cy.wait(['@getAboutMe', '@getProjects']);
      cy.contains('Test User').should('be.visible');
    });

    it('debe simular loading con delay', () => {
      cy.mockDashboardApi({ delay: 1000 });
      cy.visit('/dashboard');
      cy.contains(/loading|cargando/i).should('be.visible');
    });

    it('debe manejar errores', () => {
      cy.mockDashboardApi({ error: true });
      cy.visit('/dashboard');
      cy.contains(/error/i).should('be.visible');
    });
  });
});
```

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login con Custom Commands', () => {
  
  it('debe hacer login exitoso', () => {
    cy.mockLoginApi({ success: true, token: 'my-token' });
    cy.visit('/login');
    
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginSuccess');
    cy.url().should('include', '/admin');
  });

  it('debe manejar login fallido', () => {
    cy.mockLoginApi({ success: false });
    cy.visit('/login');
    
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrong');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginError');
    cy.contains(/invalid|error/i).should('be.visible');
  });
});
```

### Ventajas de Custom Commands

| Sin Custom Commands | Con Custom Commands |
|---------------------|---------------------|
| Código repetitivo en cada test | Código reutilizable |
| Difícil de mantener | Fácil de actualizar en un solo lugar |
| Tests largos y confusos | Tests concisos y legibles |
| Sin intellisense/autocompletado | TypeScript con tipos definidos |

:::tip Buenas Prácticas
1. **Un comando = una acción**: Cada comando debe hacer una cosa bien
2. **Nombres descriptivos**: `mockLoginApi` es mejor que `setupLogin`
3. **Documentación**: Usa JSDoc para documentar parámetros
4. **TypeScript**: Define tipos para autocompletado
:::
