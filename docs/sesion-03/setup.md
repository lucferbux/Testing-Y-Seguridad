---
sidebar_position: 4
title: "Instalación y Configuración"
---

# Instalación y Configuración

Esta guía te llevará paso a paso para configurar Cypress en el proyecto **Taller-Testing-Security/ui**.

## Paso 1: Instalar Dependencias

```bash
npm install --save-dev cypress start-server-and-test
```

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| `cypress` | ^15.7.0 | Framework de testing E2E |
| `start-server-and-test` | ^2.1.3 | Levanta el servidor antes de ejecutar tests |

:::info ¿Por qué start-server-and-test?
Cypress necesita que tu aplicación esté corriendo para poder testearla. `start-server-and-test` automatiza esto:
1. Ejecuta `npm run dev` (levanta Vite)
2. Espera a que `http://localhost:5173` responda
3. Ejecuta los tests de Cypress
4. Cierra el servidor al terminar
:::

---

## Paso 2: Configurar Scripts en package.json

Añade estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:headed": "cypress run --headed",
    "test:e2e": "start-server-and-test dev http://localhost:5173 cy:run",
    "test:e2e:open": "start-server-and-test dev http://localhost:5173 cy:open"
  }
}
```

### ¿Qué hace cada script?

| Script | Comando | Uso |
|--------|---------|-----|
| `cy:open` | `cypress open` | Abre interfaz gráfica (requiere servidor manual) |
| `cy:run` | `cypress run` | Ejecuta tests en terminal (requiere servidor manual) |
| `cy:run:headed` | `cypress run --headed` | Ejecuta tests con navegador visible |
| `test:e2e` | Servidor + tests | **Recomendado para CI/CD** - Todo automático |
| `test:e2e:open` | Servidor + interfaz | **Recomendado para desarrollo** - Todo automático |

---

## Paso 3: Inicializar Cypress

```bash
npx cypress open
```

Esto abre el Test Runner y te pregunta qué tipo de testing quieres. Selecciona **E2E Testing** y el navegador de tu preferencia.

Cypress creará automáticamente esta estructura:

```text
ui/
├── cypress/
│   ├── e2e/                 # Tests E2E
│   ├── fixtures/            # Datos mock (JSON)
│   ├── support/
│   │   ├── commands.ts      # Custom commands
│   │   └── e2e.ts           # Setup global
│   └── tsconfig.json        # Config TypeScript
└── cypress.config.ts        # Configuración principal
```

---

## Paso 4: Crear cypress.config.ts

Reemplaza el contenido generado con esta configuración:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base - Vite usa puerto 5173 por defecto
    baseUrl: 'http://localhost:5173',
    
    // Tamaño de ventana del navegador
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts (en milisegundos)
    defaultCommandTimeout: 10000,  // Espera máxima para comandos
    requestTimeout: 10000,          // Espera máxima para requests
    responseTimeout: 30000,         // Espera máxima para respuestas
    
    // Reintentos automáticos en caso de fallo
    retries: {
      runMode: 2,   // 2 reintentos en CI/CD (cypress run)
      openMode: 0   // Sin reintentos en desarrollo (cypress open)
    },
    
    // Screenshots y videos
    screenshotOnRunFailure: true,  // Captura cuando falla un test
    video: false,                   // Desactivado para ahorrar espacio
    
    // Archivos
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'cypress/fixtures',
    
    // Tareas personalizadas
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
  
  // Variables de entorno accesibles con Cypress.env('nombre')
  env: {
    apiUrl: 'http://localhost:3000/api',
    testUser: {
      email: 'test@example.com',
      password: 'test123'
    }
  }
});
```

### Opciones Importantes Explicadas

| Opción | Valor | Explicación |
|--------|-------|-------------|
| `baseUrl` | `http://localhost:5173` | URL donde corre Vite. Permite usar `cy.visit('/')` en vez de URL completa |
| `defaultCommandTimeout` | `10000` | Si un elemento no aparece en 10s, el test falla |
| `retries.runMode` | `2` | En CI/CD, reintenta tests flaky hasta 2 veces |
| `video` | `false` | Los videos ocupan mucho espacio; actívalo solo si necesitas debugging |

---

## Paso 5: Configurar Support Files

### cypress/support/e2e.ts

Este archivo se ejecuta antes de cada test:

```typescript
// Importar custom commands
import './commands';

// Manejar errores no capturados de la aplicación
Cypress.on('uncaught:exception', (err) => {
  // Ignorar errores de ResizeObserver (comunes en React)
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});
```

### cypress/support/commands.ts

Custom commands reutilizables en todos los tests:

```typescript
/// <reference types="cypress" />

/**
 * Login via UI - útil para testear el flujo de login
 */
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[type="submit"]').click();
  cy.url().should('include', '/admin');
});

/**
 * Logout - limpia sesión y redirige a home
 */
Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage('token');
  cy.visit('/');
});

/**
 * Selector por data-testid - más resistente a cambios de UI
 */
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

/**
 * Mock de login API
 * 
 * IMPORTANTE: Usa un JWT válido porque la app usa jwt_decode
 * para extraer fechas de expiración del token.
 */
Cypress.Commands.add('mockLoginApi', (options?: {
  success?: boolean;
  token?: string;
  delay?: number;
}) => {
  // JWT válido que expira en 2030
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

/**
 * Mock de APIs del dashboard
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

  const defaultProjects = [{
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Project',
    description: 'Description',
    version: '1.0.0',
    link: 'https://github.com/test/project',
    tag: 'testing',
    timestamp: Date.now()
  }];

  if (options?.error) {
    cy.intercept('GET', '**/v1/aboutme/', { statusCode: 500 }).as('getAboutMeError');
    cy.intercept('GET', '**/v1/projects/', { statusCode: 500 }).as('getProjectsError');
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

// Declaraciones TypeScript para autocompletado
declare global {
  namespace Cypress {
    interface Chainable {
      loginByUI(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      mockLoginApi(options?: { success?: boolean; token?: string; delay?: number }): Chainable<void>;
      mockDashboardApi(options?: { aboutMe?: object; projects?: object[]; delay?: number; error?: boolean }): Chainable<void>;
    }
  }
}

export {};
```

---

## Paso 6: Crear Fixtures

Los fixtures son datos mock que puedes reutilizar en tus tests.

### cypress/fixtures/users.json

```json
{
  "validUser": {
    "email": "test@example.com",
    "password": "test123"
  },
  "invalidUser": {
    "email": "wrong@example.com",
    "password": "wrongpass"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "admin123"
  }
}
```

### cypress/fixtures/aboutme.json

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Lucas Fernandez",
  "birthday": 631152000000,
  "nationality": "Spanish",
  "job": "Software Developer",
  "github": "https://github.com/lucferbux"
}
```

### cypress/fixtures/projects.json

```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Taller Testing & Security",
    "description": "Proyecto educativo sobre testing y seguridad",
    "version": "1.0.0",
    "link": "https://github.com/lucferbux/Taller-Testing-Security",
    "tag": "education",
    "timestamp": 1700000000000
  }
]
```

**Uso en tests:**

```typescript
// Cargar fixture directamente
cy.fixture('users').then((users) => {
  cy.get('input[name="email"]').type(users.validUser.email);
});

// Usar fixture en intercept
cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' });
```

---

## Paso 7: Organizar Tests

Estructura recomendada para el proyecto:

```
cypress/e2e/
├── auth/
│   └── login.cy.ts          # Tests de autenticación
├── dashboard/
│   └── dashboard.cy.ts      # Tests del dashboard
└── flows/
    └── user-journey.cy.ts   # Tests de flujos completos
```

---

## Paso 8: Ejecutar Tests

### Desarrollo (con interfaz gráfica)

```bash
# Opción 1: Automático (levanta servidor + abre Cypress)
npm run test:e2e:open

# Opción 2: Manual (si ya tienes el servidor corriendo)
npm run dev          # Terminal 1
npm run cy:open      # Terminal 2
```

### CI/CD (headless)

```bash
npm run test:e2e
```

---

## Configuración para GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          start: npm run dev
          wait-on: 'http://localhost:5173'
          browser: chrome
      
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## Resumen de Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `cypress.config.ts` | Configuración principal de Cypress |
| `cypress/support/e2e.ts` | Setup global antes de cada test |
| `cypress/support/commands.ts` | Custom commands reutilizables |
| `cypress/fixtures/*.json` | Datos mock para tests |
| `cypress/e2e/**/*.cy.ts` | Archivos de test |

---

## Próximos Pasos

Con Cypress configurado, continúa con:

1. **[Escribir tu primer test](./first-test)** - Sintaxis básica de Cypress
2. **[Selectores](./selectors)** - Cómo encontrar elementos en el DOM
3. **[Testing de formularios](./forms)** - Interactuar con inputs

:::tip Comando Útil
```bash
npx cypress info
```
Muestra información de tu instalación: versión, navegadores disponibles, paths, etc.
:::

