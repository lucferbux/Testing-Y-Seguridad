---
sidebar_position: 1
title: "Testing End-to-End con Cypress"
---

**Duración:** 1.5 horas  
**Objetivos:** Dominar el testing E2E con Cypress para validar flujos completos de usuario desde la perspectiva del usuario final

---

## 📋 Índice

1. [Introducción al Testing E2E](#introducción-al-testing-e2e)
2. [¿Qué es Cypress?](#qué-es-cypress)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Primer Test con Cypress](#primer-test-con-cypress)
5. [Selectores y Comandos](#selectores-y-comandos)
6. [Testing de Formularios](#testing-de-formularios)
7. [Testing de Navegación](#testing-de-navegación)
8. [Intercepción de Requests](#intercepción-de-requests)
9. [Custom Commands](#custom-commands)
10. [Best Practices](#best-practices)
11. [Ejercicio Práctico](#ejercicio-práctico)
12. [Recursos Adicionales](#recursos-adicionales)

---

## Introducción al Testing E2E

### ¿Qué es Testing End-to-End?

El testing E2E valida el **flujo completo de la aplicación** desde la perspectiva del usuario final.

**Características:**
- Simula usuario real en navegador real
- Prueba toda la stack (frontend + backend + BD)
- Valida flujos críticos de negocio
- Detecta problemas de integración

### E2E en la Pirámide de Testing

```
                /\
               /  \
              / E2E \  ← Esta sesión (10%)
             /--------\
            /          \
           / Integración\  (20%)
          /--------------\
         /                \
        /    Unitarios     \  (70%)
       /____________________\
```

**¿Por qué solo 10%?**
- Son lentos (segundos vs milisegundos)
- Frágiles (cambios UI rompen tests)
- Costosos de mantener
- Difíciles de debug

**¿Cuándo usar E2E?**
- ✅ Flujos críticos de negocio (checkout, login, registro)
- ✅ Happy paths principales
- ✅ Smoke tests de producción
- ❌ Validaciones detalladas (usar unitarios)
- ❌ Casos edge complejos (usar integración)

---

## ¿Qué es Cypress?

### Cypress vs Otras Herramientas

| Característica | Cypress | Selenium | Playwright |
|---------------|---------|----------|------------|
| **Velocidad** | Rápido | Lento | Rápido |
| **Debug** | Excelente | Difícil | Bueno |
| **Setup** | Simple | Complejo | Moderado |
| **Multi-browser** | Limitado | Sí | Sí |
| **Time-travel** | Sí | No | No |
| **Auto-wait** | Sí | No | Sí |

### Ventajas de Cypress

**1. Developer Experience**
- Setup simple (npm install)
- Time-travel debugging
- Screenshots y videos automáticos
- Test runner visual

**2. Arquitectura Única**
- Corre en el mismo loop que la app
- Acceso directo al DOM
- Control completo del navegador
- Sin Selenium WebDriver

**3. Features Potentes**
- Auto-retry de comandos
- Auto-wait de elementos
- Network stubbing/spying
- Real-time reloading

### Limitaciones

- ❌ Solo un navegador a la vez
- ❌ No soporta multi-tabs nativamente
- ❌ No puede hacer iframe testing complejo
- ❌ Limitaciones con Safari

---

## Instalación y Configuración

### Instalación

```bash
# Instalar Cypress
npm install --save-dev cypress

# Abrir Cypress por primera vez
npx cypress open
```

Esto crea la estructura:

```
cypress/
├── e2e/              # Tests E2E
├── fixtures/         # Datos de prueba
├── support/          # Commands y setup
│   ├── commands.ts
│   └── e2e.ts
└── downloads/        # Archivos descargados
```

### Configuración: cypress.config.ts

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base de la aplicación
    baseUrl: 'http://localhost:3000',
    
    // Viewport por defecto
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    
    // Videos y screenshots
    video: true,
    screenshotOnRunFailure: true,
    
    // Setup
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
  },
});
```

### Scripts en package.json

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:headed": "cypress run --headed",
    "test:e2e": "start-server-and-test dev http://localhost:3000 cy:run"
  }
}
```

### Instalación de start-server-and-test

```bash
npm install --save-dev start-server-and-test
```

---

## Primer Test con Cypress

### Estructura Básica

```typescript
describe('Mi primer test', () => {
  it('debe visitar la página', () => {
    cy.visit('/');
    cy.contains('Welcome');
  });
});
```

### Ejemplo: Test de Homepage

**Test: cypress/e2e/homepage.cy.ts**

```typescript
describe('Homepage', () => {
  
  beforeEach(() => {
    // Visitar homepage antes de cada test
    cy.visit('/');
  });

  it('debe cargar correctamente', () => {
    // Verificar título
    cy.title().should('include', 'Docusaurus');
    
    // Verificar elemento principal
    cy.get('[data-testid="hero"]').should('be.visible');
  });

  it('debe mostrar navegación', () => {
    // Verificar links de navegación
    cy.get('nav').should('be.visible');
    cy.get('nav').find('a').should('have.length.at.least', 3);
  });

  it('debe tener meta descripción', () => {
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
  });

  it('debe responder en menos de 3 segundos', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
        const measure = win.performance.getEntriesByName('pageLoad')[0];
        expect(measure.duration).to.be.lessThan(3000);
      },
    });
  });
});
```

### Ejecutar Tests

```bash
# Modo interactivo (recomendado para desarrollo)
npm run cy:open

# Modo headless (CI/CD)
npm run cy:run

# Con navegador específico
npm run cy:run:chrome
```

---

## Selectores y Comandos

### Estrategia de Selectores

**Prioridad (de mejor a peor):**

1. **data-testid** (Recomendado)
```typescript
cy.get('[data-testid="submit-button"]');
```

2. **data-cy** (Alternativa)
```typescript
cy.get('[data-cy="user-name"]');
```

3. **Roles ARIA**
```typescript
cy.findByRole('button', { name: 'Submit' });
```

4. **ID únicos**
```typescript
cy.get('#username-input');
```

5. **Clases (evitar)**
```typescript
cy.get('.btn-primary'); // Frágil!
```

### Comandos Esenciales de Cypress

**Navegación:**
```typescript
cy.visit('/about');           // Navegar a URL
cy.go('back');               // Ir atrás
cy.go('forward');            // Ir adelante
cy.reload();                 // Recargar página
```

**Selección:**
```typescript
cy.get('.selector');         // Obtener elemento
cy.contains('text');         // Elemento con texto
cy.find('.child');           // Buscar hijo
cy.first();                  // Primer elemento
cy.last();                   // Último elemento
cy.eq(2);                    // Elemento por índice
cy.parent();                 // Elemento padre
cy.siblings();               // Hermanos
```

**Acciones:**
```typescript
cy.click();                  // Click
cy.dblclick();              // Doble click
cy.rightclick();            // Click derecho
cy.type('texto');           // Escribir
cy.clear();                 // Limpiar input
cy.check();                 // Check checkbox
cy.uncheck();               // Uncheck checkbox
cy.select('option');        // Select dropdown
cy.scrollTo('bottom');      // Scroll
```

**Aserciones:**
```typescript
.should('exist');           // Existe
.should('be.visible');      // Visible
.should('not.exist');       // No existe
.should('have.text', 'x');  // Tiene texto
.should('have.value', 'x'); // Tiene valor
.should('have.class', 'x'); // Tiene clase
.should('have.attr', 'x');  // Tiene atributo
.should('contain', 'x');    // Contiene texto
```

### Ejemplo Completo: Navegación

```typescript
describe('Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe navegar a la página de documentación', () => {
    // Click en link
    cy.get('[data-testid="nav-docs"]').click();
    
    // Verificar URL
    cy.url().should('include', '/docs');
    
    // Verificar contenido
    cy.contains('Documentation').should('be.visible');
  });

  it('debe mantener estado al navegar', () => {
    // Cambiar tema
    cy.get('[data-testid="theme-toggle"]').click();
    
    // Navegar
    cy.visit('/docs');
    
    // Verificar que tema persiste
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });

  it('debe usar breadcrumbs', () => {
    cy.visit('/docs/tutorial/basics');
    
    // Verificar breadcrumb
    cy.get('[aria-label="breadcrumb"]')
      .should('be.visible')
      .and('contain', 'Tutorial')
      .and('contain', 'Basics');
    
    // Click en breadcrumb
    cy.get('[aria-label="breadcrumb"]')
      .contains('Tutorial')
      .click();
    
    cy.url().should('include', '/docs/tutorial');
  });
});
```

---

## Testing de Formularios

### Ejemplo: Formulario de Búsqueda

**Test: cypress/e2e/search.cy.ts**

```typescript
describe('Search Functionality', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe buscar y mostrar resultados', () => {
    // Abrir búsqueda
    cy.get('[data-testid="search-button"]').click();
    
    // Escribir en input
    cy.get('[data-testid="search-input"]')
      .should('be.focused')
      .type('testing');
    
    // Verificar sugerencias
    cy.get('[data-testid="search-results"]')
      .should('be.visible')
      .find('li')
      .should('have.length.at.least', 1);
    
    // Click en resultado
    cy.get('[data-testid="search-results"]')
      .find('li')
      .first()
      .click();
    
    // Verificar navegación
    cy.url().should('include', '/docs');
  });

  it('debe mostrar mensaje cuando no hay resultados', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('asdfghjklñ');
    
    cy.get('[data-testid="search-results"]')
      .should('contain', 'No results found');
  });

  it('debe limpiar búsqueda', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('testing');
    
    // Click en botón limpiar
    cy.get('[data-testid="search-clear"]').click();
    
    // Verificar que input está vacío
    cy.get('[data-testid="search-input"]').should('have.value', '');
  });

  it('debe cerrar con tecla Escape', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('{esc}');
    
    // Verificar que modal está cerrado
    cy.get('[data-testid="search-modal"]').should('not.exist');
  });
});
```

### Ejemplo: Formulario de Contacto

**Test: cypress/e2e/contact-form.cy.ts**

```typescript
describe('Contact Form', () => {
  
  beforeEach(() => {
    cy.visit('/contact');
  });

  it('debe enviar formulario correctamente', () => {
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="message-textarea"]').type('This is a test message');
    
    // Aceptar términos
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Submit
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar mensaje de éxito
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain', 'Thank you');
  });

  it('debe validar email inválido', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar error
    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'valid email');
  });

  it('debe validar campos requeridos', () => {
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar errores
    cy.get('[data-testid="name-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="message-error"]').should('be.visible');
  });

  it('debe deshabilitar submit mientras envía', () => {
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="message-textarea"]').type('Message');
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Submit
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar que botón está disabled
    cy.get('[data-testid="submit-button"]')
      .should('be.disabled');
  });

  it('debe mostrar contador de caracteres', () => {
    const message = 'Hello world';
    cy.get('[data-testid="message-textarea"]').type(message);
    
    cy.get('[data-testid="char-count"]')
      .should('contain', message.length);
  });
});
```

---

## Testing de Navegación

### Ejemplo: Sidebar Navigation

**Test: cypress/e2e/sidebar.cy.ts**

```typescript
describe('Sidebar Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/docs');
  });

  it('debe expandir/colapsar categorías', () => {
    // Verificar categoría colapsada
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'false');
    
    // Expandir
    cy.get('[data-testid="category-tutorial"]').click();
    
    // Verificar expandida
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'true');
    
    // Verificar items visibles
    cy.get('[data-testid="category-tutorial"]')
      .parent()
      .find('ul li')
      .should('have.length.at.least', 1)
      .and('be.visible');
  });

  it('debe resaltar página actual', () => {
    cy.visit('/docs/intro');
    
    cy.get('[data-testid="sidebar-item-intro"]')
      .should('have.class', 'active')
      .or('have.attr', 'aria-current', 'page');
  });

  it('debe mantener scroll position', () => {
    // Scroll hasta abajo
    cy.get('[data-testid="sidebar"]').scrollTo('bottom');
    
    // Click en link
    cy.get('[data-testid="sidebar"]')
      .find('a')
      .last()
      .click();
    
    // Volver atrás
    cy.go('back');
    
    // Verificar que mantiene posición (aproximada)
    cy.get('[data-testid="sidebar"]')
      .should(($el) => {
        const scrollTop = $el[0].scrollTop;
        expect(scrollTop).to.be.greaterThan(100);
      });
  });

  it('debe ser responsive', () => {
    // Mobile viewport
    cy.viewport('iphone-x');
    
    // Sidebar debe estar oculto
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
    
    // Abrir menu mobile
    cy.get('[data-testid="mobile-menu-button"]').click();
    
    // Sidebar debe aparecer
    cy.get('[data-testid="sidebar"]').should('be.visible');
  });
});
```

### Ejemplo: Paginación

**Test: cypress/e2e/pagination.cy.ts**

```typescript
describe('Pagination', () => {
  
  beforeEach(() => {
    cy.visit('/blog');
  });

  it('debe navegar entre páginas', () => {
    // Verificar página 1
    cy.get('[data-testid="current-page"]').should('contain', '1');
    
    // Click en siguiente
    cy.get('[data-testid="next-page"]').click();
    
    // Verificar página 2
    cy.url().should('include', 'page=2');
    cy.get('[data-testid="current-page"]').should('contain', '2');
    
    // Verificar contenido cambió
    cy.get('[data-testid="blog-posts"]')
      .find('[data-testid="post"]')
      .should('have.length.at.least', 1);
  });

  it('debe deshabilitar botón en primera/última página', () => {
    // Primera página: previous disabled
    cy.get('[data-testid="prev-page"]').should('be.disabled');
    
    // Navegar a última página
    cy.get('[data-testid="last-page"]').click();
    
    // Última página: next disabled
    cy.get('[data-testid="next-page"]').should('be.disabled');
  });

  it('debe permitir salto directo a página', () => {
    cy.get('[data-testid="page-3"]').click();
    
    cy.url().should('include', 'page=3');
    cy.get('[data-testid="current-page"]').should('contain', '3');
  });
});
```

---

## Intercepción de Requests

### cy.intercept()

Interceptar requests HTTP para:
- Mockear respuestas
- Verificar requests
- Simular errores
- Control de timing

### Ejemplo: Mockear API

```typescript
describe('API Mocking', () => {
  
  it('debe cargar usuarios desde API', () => {
    // Interceptar request y mockear respuesta
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }).as('getUsers');
    
    cy.visit('/users');
    
    // Esperar a que request se complete
    cy.wait('@getUsers');
    
    // Verificar que datos se muestran
    cy.contains('Alice').should('be.visible');
    cy.contains('Bob').should('be.visible');
  });

  it('debe manejar error de API', () => {
    cy.intercept('GET', '/api/users', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('getUsersError');
    
    cy.visit('/users');
    cy.wait('@getUsersError');
    
    // Verificar mensaje de error
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Error loading users');
  });

  it('debe verificar payload de POST', () => {
    cy.intercept('POST', '/api/users').as('createUser');
    
    cy.visit('/users/new');
    
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('Charlie');
    cy.get('[data-testid="email-input"]').type('charlie@example.com');
    cy.get('[data-testid="submit"]').click();
    
    // Verificar request
    cy.wait('@createUser').its('request.body').should('deep.equal', {
      name: 'Charlie',
      email: 'charlie@example.com',
    });
  });
});
```

### Ejemplo: Simular Latencia

```typescript
describe('Loading States', () => {
  
  it('debe mostrar loading durante fetch', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.reply((res) => {
        // Delay de 2 segundos
        res.delay = 2000;
        res.send({
          statusCode: 200,
          body: [{ id: 1, name: 'Alice' }],
        });
      });
    }).as('getUsers');
    
    cy.visit('/users');
    
    // Verificar loading
    cy.get('[data-testid="loading"]').should('be.visible');
    
    // Esperar respuesta
    cy.wait('@getUsers');
    
    // Verificar loading desapareció
    cy.get('[data-testid="loading"]').should('not.exist');
    cy.contains('Alice').should('be.visible');
  });
});
```

### Fixtures

```typescript
// cypress/fixtures/users.json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  },
  {
    "id": 2,
    "name": "Bob",
    "email": "bob@example.com"
  }
]
```

```typescript
describe('Using Fixtures', () => {
  
  it('debe usar datos de fixture', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
    
    cy.visit('/users');
    cy.wait('@getUsers');
    
    cy.contains('Alice').should('be.visible');
    cy.contains('Bob').should('be.visible');
  });
});
```

---

## Custom Commands

### Crear Custom Commands

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

### Más Custom Commands Útiles

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

## Best Practices

### 1. Don't Test External Sites

```typescript
// ❌ Mal
it('should link to GitHub', () => {
  cy.visit('https://github.com/facebook/react');
  cy.contains('React');
});

// ✅ Bien
it('should have GitHub link', () => {
  cy.get('[data-testid="github-link"]')
    .should('have.attr', 'href')
    .and('include', 'github.com');
});
```

### 2. Use data-testid

```typescript
// ❌ Mal: Selector frágil
cy.get('.btn.btn-primary.submit-button');

// ✅ Bien: Selector estable
cy.get('[data-testid="submit-button"]');
```

### 3. No Uses Waits Fijos

```typescript
// ❌ Mal
cy.wait(5000); // Espera arbitraria

// ✅ Bien
cy.get('[data-testid="data"]', { timeout: 10000 }).should('exist');
```

### 4. Agrupa Tests Relacionados

```typescript
describe('User Authentication', () => {
  describe('Login', () => {
    it('debe hacer login exitoso', () => {});
    it('debe mostrar error con credenciales incorrectas', () => {});
  });

  describe('Logout', () => {
    it('debe hacer logout', () => {});
  });
});
```

### 5. Limpia Estado Entre Tests

```typescript
describe('Tests', () => {
  
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearDatabase(); // Custom command
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### 6. Tests Independientes

```typescript
// ❌ Mal: Tests dependen del orden
it('creates user', () => {
  cy.createUser('John');
});

it('finds user', () => {
  cy.findUser('John'); // Depende del test anterior
});

// ✅ Bien: Cada test es independiente
it('finds user', () => {
  cy.createUser('John');
  cy.findUser('John');
});
```

### 7. Usa Aliases

```typescript
it('should work with aliases', () => {
  cy.get('[data-testid="user-list"]').as('userList');
  cy.get('[data-testid="search-input"]').as('searchInput');
  
  cy.get('@searchInput').type('Alice');
  cy.get('@userList').should('contain', 'Alice');
});
```

### 8. Screenshots en Errores

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    screenshotOnRunFailure: true,
    video: true,
  },
});
```

### 9. Organiza Tests por Feature

```
cypress/e2e/
├── auth/
│   ├── login.cy.ts
│   ├── logout.cy.ts
│   └── registration.cy.ts
├── blog/
│   ├── posts-list.cy.ts
│   └── post-detail.cy.ts
└── search/
    └── search.cy.ts
```

### 10. Page Object Pattern (Opcional)

```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email: string) {
    cy.get('[data-testid="email-input"]').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('[data-testid="password-input"]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-testid="submit-button"]').click();
    return this;
  }

  login(email: string, password: string) {
    this.fillEmail(email).fillPassword(password).submit();
  }
}

// Uso
import { LoginPage } from '../support/pages/LoginPage';

describe('Login', () => {
  const loginPage = new LoginPage();

  it('should login', () => {
    loginPage.visit();
    loginPage.login('user@example.com', 'password123');
  });
});
```

---

## Ejercicio Práctico

### Objetivo

Crear suite completa de tests E2E para el proyecto Docusaurus, cubriendo los flujos más importantes.

### Parte 1: Flujo de Navegación (30 min)

**Tareas:**
1. Test de navegación principal (Home → Docs → Blog → Home)
2. Test de sidebar con categorías expandibles
3. Test de búsqueda con resultados
4. Test responsive (mobile y desktop)

**Criterios:**
- Usar data-testid
- Tests independientes
- Sin waits fijos
- Screenshots en fallos

### Parte 2: Flujo de Documentación (35 min)

**Tareas:**
1. Test de lectura de docs (navegación entre páginas)
2. Test de "Next/Previous" pagination
3. Test de tabla de contenidos (TOC)
4. Test de cambio de tema (light/dark)
5. Test de código copiable (copy button)

**Funcionalidades a validar:**
- URLs correctas
- Scroll to section con hash
- Persistencia de tema
- Feedback visual del copy button

### Parte 3: Flujo de Blog (25 min)

**Tareas:**
1. Test de listado de posts
2. Test de paginación de blog
3. Test de lectura de post individual
4. Test de tags/categorías
5. Test de autores

**Intercepción de APIs:**
- Mockear carga de posts
- Simular latencia
- Simular error 404

### Criterios de Evaluación

- ✅ Mínimo 15 tests E2E
- ✅ Coverage de 3 flujos principales
- ✅ Uso de custom commands
- ✅ Intercepción de requests
- ✅ Tests pasan sin errores
- ✅ Uso de best practices
- ✅ Fixtures para datos

---

## Recursos Adicionales

### Documentación Oficial

- [Cypress Docs](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Reference](https://docs.cypress.io/api/table-of-contents)
- [Examples](https://docs.cypress.io/examples/examples/recipes)

### Tutoriales y Guías

- [Real World App](https://github.com/cypress-io/cypress-realworld-app) - App completa con tests
- [Cypress Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
- [Test Automation University - Cypress](https://testautomationu.applitools.com/cypress-tutorial/)

### Plugins Útiles

- [cypress-axe](https://github.com/component-driven/cypress-axe) - Accessibility testing
- [cypress-file-upload](https://github.com/abramenal/cypress-file-upload) - Upload files
- [cypress-iframe](https://github.com/kuceb/cypress-iframe) - iFrame testing
- [@testing-library/cypress](https://testing-library.com/docs/cypress-testing-library/intro/) - Testing Library queries

### Herramientas

- [Cypress Dashboard](https://www.cypress.io/dashboard) - Test recording y analytics
- [Percy](https://percy.io/) - Visual regression testing
- [Sorry Cypress](https://sorry-cypress.dev/) - Open source dashboard

### Próxima Sesión

En la **Sesión 4: Seguridad y Desarrollo Seguro** veremos:
- OWASP Top 10
- Vulnerabilidades comunes (XSS, CSRF, Injection)
- Buenas prácticas de seguridad
- Helmet.js y headers de seguridad
- Testing de seguridad
- Auditoría con npm audit

---

**¡Felicidades!** Has completado el módulo de Testing E2E con Cypress. Ahora puedes crear tests robustos que validan el comportamiento completo de tus aplicaciones desde la perspectiva del usuario.
