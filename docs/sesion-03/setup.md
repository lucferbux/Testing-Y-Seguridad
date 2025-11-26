---
sidebar_position: 4
title: "Instalación y Configuración"
---

# Instalación y Configuración

## Instalación de Cypress

### Paso 1: Instalar Cypress via npm

Cypress se instala como dependencia de desarrollo en tu proyecto:

```bash
# Con npm
npm install --save-dev cypress

# Con yarn
yarn add --dev cypress

# Con pnpm
pnpm add -D cypress
```

**¿Por qué `--save-dev`?** Cypress es una herramienta de testing, no parte de tu código de producción. Se instala solo para desarrollo y CI/CD.

**Tamaño**: La instalación descarga ~450MB (incluye binario de Cypress con navegador Electron). La primera instalación puede tardar 1-3 minutos dependiendo de tu conexión.

### Paso 2: Abrir Cypress por Primera Vez

```bash
npx cypress open
```

Este comando:

1. **Crea la estructura de carpetas** automáticamente
2. **Abre el Cypress Test Runner** (interfaz gráfica)
3. **Genera archivos de ejemplo** para explorar

**Primera vez**: Cypress te preguntará qué tipo de testing quieres (E2E o Component Testing). Selecciona **E2E Testing**.

---

## Estructura de Carpetas Generada

Después de ejecutar `cypress open`, verás esta estructura:

```
proyecto/
├── cypress/
│   ├── e2e/                 # ← Tests E2E aquí
│   │   └── spec.cy.ts       # Test de ejemplo
│   ├── fixtures/            # ← Datos de prueba (JSON, CSV, etc.)
│   │   └── example.json
│   ├── support/             # ← Comandos custom y configuración
│   │   ├── commands.ts      # Custom commands (cy.login(), etc.)
│   │   └── e2e.ts           # Setup global (antes de todos los tests)
│   └── downloads/           # ← Archivos descargados durante tests
├── cypress.config.ts        # ← Configuración principal
└── package.json
```

### Explicación de Cada Carpeta

#### 📁 `cypress/e2e/`

**Propósito**: Almacena todos tus tests E2E.

**Ejemplo de estructura organizada**:

```
cypress/e2e/
├── auth/
│   ├── login.cy.ts
│   ├── logout.cy.ts
│   └── registration.cy.ts
├── products/
│   ├── product-list.cy.ts
│   └── product-detail.cy.ts
└── checkout/
    └── purchase-flow.cy.ts
```

**Convención de nombres**: Archivos terminan en `.cy.ts` o `.cy.js`

#### 📁 `cypress/fixtures/`

**Propósito**: Datos estáticos para tus tests (usuarios, productos, etc.)

**Ejemplo - `fixtures/users.json`**:

```json
{
  "validUser": {
    "email": "user@example.com",
    "password": "password123"
  },
  "adminUser": {
    "email": "admin@example.com",
    "password": "admin123"
  }
}
```

**Uso en tests**:

```typescript
cy.fixture('users').then((users) => {
  cy.get('[data-testid="email"]').type(users.validUser.email);
  cy.get('[data-testid="password"]').type(users.validUser.password);
});

// O con alias
cy.fixture('users').as('usersData');
cy.get('@usersData').then((users) => {
  // Usar users.validUser
});
```

#### 📁 `cypress/support/`

**Propósito**: Código compartido entre tests.

**`commands.ts`**: Custom commands reutilizables

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="submit"]').click();
  cy.url().should('not.include', '/login');
});

// TypeScript declaration
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
```

**`e2e.ts`**: Setup global antes de todos los tests

```typescript
// cypress/support/e2e.ts

// Importar commands
import './commands';

// Ejecutar antes de cada test
beforeEach(() => {
  // Limpiar cookies y localStorage
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Configurar intercepts globales
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir que tests fallen por errores de la app no relacionados
  if (err.message.includes('ResizeObserver')) {
    return false; // Ignorar este error
  }
  return true;
});
```

---

## Configuración: cypress.config.ts

Este archivo controla el comportamiento de Cypress.

### Configuración Básica

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base de tu aplicación
    baseUrl: 'http://localhost:3000',
    
    // Viewport por defecto (resolución de pantalla)
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeout por defecto (milisegundos)
    defaultCommandTimeout: 10000,  // 10 segundos para comandos
    requestTimeout: 10000,          // 10 segundos para requests
    pageLoadTimeout: 30000,         // 30 segundos para carga de página
    
    // Videos y screenshots
    video: true,                    // Grabar videos de tests
    screenshotOnRunFailure: true,   // Screenshot cuando test falla
    
    // Patron de archivos de test
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Setup de Node events
    setupNodeEvents(on, config) {
      // Implementa listeners aquí
      // Ejemplo: integración con plugins
    },
  },
});
```

### Configuración Avanzada

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    
    // Environment variables
    env: {
      apiUrl: 'http://localhost:4000/api',
      adminEmail: 'admin@test.com',
      adminPassword: 'admin123',
    },
    
    // Configuración de viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    pageLoadTimeout: 30000,
    responseTimeout: 30000,
    
    // Retry configuration
    retries: {
      runMode: 2,      // 2 reintentos en `cypress run`
      openMode: 0,     // 0 reintentos en `cypress open`
    },
    
    // Videos y screenshots
    video: true,
    videoCompression: 32,  // Nivel de compresión (0-51)
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    
    // Archivos de test
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    excludeSpecPattern: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
    
    // Navegador
    chromeWebSecurity: true,  // Habilitar same-origin policy
    
    // Configuración experimental
    experimentalStudio: false,  // Cypress Studio (grabar tests visualmente)
    
    setupNodeEvents(on, config) {
      // Ejemplo: custom task para limpiar DB
      on('task', {
        'db:clear': async () => {
          // Lógica para limpiar base de datos
          console.log('Database cleared');
          return null;
        },
        'db:seed': async () => {
          // Lógica para seed de datos
          console.log('Database seeded');
          return null;
        },
      });
      
      return config;
    },
  },
});
```

### Variables de Entorno

**Definir en config**:

```typescript
export default defineConfig({
  e2e: {
    env: {
      apiUrl: 'http://localhost:4000',
    },
  },
});
```

**Usar en tests**:

```typescript
cy.request(Cypress.env('apiUrl') + '/users');
```

**Sobrescribir desde CLI**:

```bash
cypress run --env apiUrl=https://staging.example.com
```

**Archivo `.env` (con plugin)**:

```bash
# .env
API_URL=http://localhost:4000
ADMIN_EMAIL=admin@test.com
```

```typescript
// cypress.config.ts con dotenv
import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  e2e: {
    env: {
      apiUrl: process.env.API_URL,
      adminEmail: process.env.ADMIN_EMAIL,
    },
  },
});
```

---

## Scripts en package.json

Agrega scripts para facilitar la ejecución de Cypress:

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:chrome": "cypress run --browser chrome",
    "cy:run:firefox": "cypress run --browser firefox",
    "cy:run:headed": "cypress run --headed",
    "cy:run:spec": "cypress run --spec",
    "test:e2e": "start-server-and-test dev http://localhost:3000 cy:run"
  }
}
```

### Explicación de Scripts

**`cy:open`**: Abre Test Runner interactivo

```bash
npm run cy:open
```

**`cy:run`**: Ejecuta tests en modo headless (CI/CD)

```bash
npm run cy:run
```

**`cy:run:chrome`**: Ejecuta en Chrome específicamente

```bash
npm run cy:run:chrome
```

**`cy:run:headed`**: Ejecuta con ventana visible (para debugging)

```bash
npm run cy:run:headed
```

**`cy:run:spec`**: Ejecuta test específico

```bash
npm run cy:run:spec cypress/e2e/login.cy.ts
```

**`test:e2e`**: Levanta servidor, espera que esté listo, ejecuta tests

```bash
npm run test:e2e
```

---

## start-server-and-test: Testing con Servidor Local

### Instalación

```bash
npm install --save-dev start-server-and-test
```

### Configuración en package.json

```json
{
  "scripts": {
    "dev": "next dev",           // O tu comando de dev
    "cy:run": "cypress run",
    "test:e2e": "start-server-and-test dev http://localhost:3000 cy:run"
  }
}
```

**¿Qué hace `start-server-and-test`?**

1. **Ejecuta `npm run dev`** (levanta tu aplicación)
2. **Espera** hasta que `http://localhost:3000` responda (polling cada 300ms)
3. **Ejecuta `npm run cy:run`** (corre tests)
4. **Detiene el servidor** al terminar

### Sintaxis

```bash
start-server-and-test <start-command> <url> <test-command>
```

**Ejemplos**:

```bash
# Esperar múltiples servicios
start-server-and-test \
  "npm run dev" http://localhost:3000 \
  "npm run api" http://localhost:4000 \
  "npm run cy:run"

# Con puerto específico
start-server-and-test dev:8080 http://localhost:8080 cy:run

# Esperar path específico
start-server-and-test dev http://localhost:3000/health cy:run
```

---

## Ejemplo Completo de Setup

### 1. Instalar Dependencias

```bash
npm install --save-dev cypress start-server-and-test
```

### 2. Configurar cypress.config.ts

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:4000/api',
    },
    setupNodeEvents(on, config) {
      // Custom tasks
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
});
```

### 3. Configurar package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "test:e2e": "start-server-and-test dev http://localhost:3000 cy:run"
  },
  "devDependencies": {
    "cypress": "^13.0.0",
    "start-server-and-test": "^2.0.0"
  }
}
```

### 4. Crear Custom Command

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', () => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(Cypress.env('adminEmail'));
  cy.get('[data-testid="password"]').type(Cypress.env('adminPassword'));
  cy.get('[data-testid="submit"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}
```

### 5. Crear Primer Test

```typescript
// cypress/e2e/homepage.cy.ts
describe('Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe cargar correctamente', () => {
    cy.get('h1').should('be.visible');
  });

  it('debe tener meta descripción', () => {
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
  });
});
```

### 6. Ejecutar Tests

```bash
# Modo interactivo
npm run cy:open

# Modo headless (CI/CD)
npm run test:e2e
```

---

## Configuración para CI/CD

### GitHub Actions

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
          wait-on: 'http://localhost:3000'
          browser: chrome
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
      
      - name: Upload videos
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-videos
          path: cypress/videos
```

---

## Ejemplo Real: Proyecto Taller-Testing-Security

A continuación se muestra la configuración real implementada en el proyecto **Taller-Testing-Security/ui**.

### Estructura de Archivos Creada

```
ui/
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   └── login.cy.ts        # Tests de autenticación
│   │   ├── dashboard/
│   │   │   └── dashboard.cy.ts    # Tests del dashboard
│   │   └── flows/
│   │       └── user-journey.cy.ts # Tests de flujos completos
│   ├── fixtures/
│   │   ├── users.json             # Datos de usuarios mock
│   │   ├── aboutme.json           # Datos de perfil mock
│   │   └── projects.json          # Datos de proyectos mock
│   ├── support/
│   │   ├── commands.ts            # Custom commands
│   │   └── e2e.ts                 # Setup global
│   └── tsconfig.json              # Config TypeScript para Cypress
└── cypress.config.ts              # Configuración principal
```

### cypress.config.ts (Real)

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base de la aplicación (Vite dev server)
    baseUrl: 'http://127.0.0.1:5173',
    
    // Configuración de viewports
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Reintentos en caso de fallos
    retries: {
      runMode: 2,      // En CI
      openMode: 0      // En desarrollo
    },
    
    // Configuración de screenshots y videos
    screenshotOnRunFailure: true,
    video: false,
    
    // Archivos de soporte
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'cypress/fixtures',
    
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
  
  // Variables de entorno
  env: {
    apiUrl: 'http://localhost:3000/api',
    testUser: {
      email: 'test@example.com',
      password: 'test123'
    }
  }
});
```

### Custom Commands Reales (cypress/support/commands.ts)

```typescript
/// <reference types="cypress" />

/**
 * Custom command para hacer login via UI
 */
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[type="submit"]').click();
  cy.url().should('include', '/admin');
});

/**
 * Custom command para mockear la API del dashboard
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

/**
 * Custom command para interceptar login
 */
Cypress.Commands.add('mockLoginApi', (options?: {
  success?: boolean;
  token?: string;
  delay?: number;
}) => {
  if (options?.success === false) {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError');
  } else {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { token: options?.token || 'mock-jwt-token-for-testing' },
      delay: options?.delay || 0
    }).as('loginSuccess');
  }
});

// Type declarations
declare global {
  namespace Cypress {
    interface Chainable {
      loginByUI(email: string, password: string): Chainable<void>;
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

### Scripts en package.json

```json
{
  "scripts": {
    "dev": "vite",
    "test": "jest",
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:headed": "cypress run --headed",
    "test:e2e": "cypress run",
    "test:e2e:dev": "cypress open"
  }
}
```

---

## Próximos Pasos

Ahora que tienes Cypress instalado y configurado, estás listo para:

1. **[Escribir tu primer test](./first-test)** - Aprende la sintaxis básica
2. **[Explorar selectores](./selectors)** - Estrategias para seleccionar elementos
3. **[Testear formularios](./forms)** - Interactuar con inputs y validaciones

:::tip Comando Útil
Ejecuta `npx cypress info` para ver información de tu instalación (versión, navegadores disponibles, paths, etc.)
:::

