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

## Próximos Pasos

Ahora que tienes Cypress instalado y configurado, estás listo para:

1. **[Escribir tu primer test](./first-test)** - Aprende la sintaxis básica
2. **[Explorar selectores](./selectors)** - Estrategias para seleccionar elementos
3. **[Testear formularios](./forms)** - Interactuar con inputs y validaciones

:::tip Comando Útil
Ejecuta `npx cypress info` para ver información de tu instalación (versión, navegadores disponibles, paths, etc.)
:::

