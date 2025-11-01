---
sidebar_position: 4
title: "Instalación y Configuración"
---

# Instalación y Configuración

## Instalación

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

## Configuración: cypress.config.ts

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

## Scripts en package.json

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

## Instalación de start-server-and-test

```bash
npm install --save-dev start-server-and-test
```
