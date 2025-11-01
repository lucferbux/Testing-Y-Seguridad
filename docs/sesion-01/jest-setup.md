---
sidebar_position: 4
title: "Configuración de Jest"
---

# Jest: Configuración e Introducción

## ¿Qué es Jest?

Jest es un framework de testing de JavaScript creado por Facebook, diseñado para:

- **Zero-config:** Funciona out-of-the-box
- **Snapshot testing:** Para componentes React
- **Coverage integrado:** Sin configuración adicional
- **Mocking potente:** Sistema de mocks incluido
- **Paralelización:** Tests en paralelo por defecto

## Instalación en Proyecto Docusaurus

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

## Configuración: jest.config.js

```javascript
module.exports = {
  // Entorno de ejecución
  testEnvironment: 'jsdom',
  
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Paths de módulos
  moduleNameMapper: {
    '^@site/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Archivos de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Extensiones de archivos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Patrones de tests
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  
  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/.docusaurus/'],
};
```

## Setup: jest.setup.js

```javascript
import '@testing-library/jest-dom';

// Configuración global para todos los tests
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores en tests
  warn: jest.fn(),  // Silenciar warnings en tests
};
```

## Scripts en package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```
