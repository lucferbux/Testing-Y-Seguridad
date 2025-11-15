---
sidebar_position: 4
title: "Configuración de Jest"
---

Jest es el framework de testing más popular para JavaScript y TypeScript, especialmente en el ecosistema de React. En esta sección aprenderemos qué es Jest, por qué es tan popular, y cómo configurarlo en el proyecto **Taller-Testing-Security**, específicamente en su frontend ubicado en la carpeta `ui/`.

## Contexto del Proyecto

El proyecto **Taller-Testing-Security** es una aplicación web completa disponible en [GitHub](https://github.com/lucferbux/Proyecto-Testing-Y-Seguridad) que incluye:

- **API Backend** en `api/`: Node.js + Express + MongoDB
- **Frontend** en `ui/`: React + TypeScript + Vite + Styled Components

En esta sesión nos enfocaremos en configurar testing para el **frontend**, que es una aplicación React moderna construida con:

- **Vite**: Build tool y dev server ultra-rápido
- **React 18**: Con hooks y functional components
- **TypeScript**: Para type safety
- **Styled Components**: Para estilos CSS-in-JS
- **React Router**: Para navegación
- **i18next**: Para internacionalización

La aplicación es un portfolio personal con funcionalidades de:

- Landing page pública
- Sistema de autenticación (Login)
- Dashboard privado con proyectos
- Panel de administración

## ¿Qué es Jest?

Jest es un **framework de testing de JavaScript** creado y mantenido por Facebook (ahora Meta). Fue diseñado originalmente para testear aplicaciones React, pero se ha expandido para ser la solución de testing estándar para todo tipo de proyectos JavaScript/TypeScript.

### Características principales

#### Zero-config: Funciona out-of-the-box

Una de las mayores ventajas de Jest es que requiere **configuración mínima** para empezar. En muchos casos, simplemente instalas Jest y puedes comenzar a escribir tests sin configurar nada. Esto contrasta con frameworks anteriores que requerían configuración compleja con múltiples herramientas (test runner, assertion library, mocking library, etc.).

```bash
# Instalar Jest
npm install --save-dev jest

# Ejecutar tests - ¡ya funciona!
npx jest
```

Jest viene con configuraciones sensatas por defecto que funcionan para la mayoría de proyectos.

#### Snapshot testing: Para componentes React

Jest introdujo el concepto de **snapshot testing**, una forma de verificar que el output de tus componentes no cambie inesperadamente. Cuando ejecutas un snapshot test por primera vez, Jest guarda el output renderizado. En ejecuciones futuras, compara el output actual con el snapshot guardado y falla si hay diferencias.

Esto es especialmente útil para componentes React donde quieres asegurar que cambios en el código no alteran accidentalmente la UI.

```typescript
it('renderiza correctamente', () => {
  const tree = renderer.create(<Button label="Click me" />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

#### Coverage integrado: Sin configuración adicional

Jest incluye herramientas de **code coverage** sin necesidad de instalar nada más. Con un simple flag `--coverage`, Jest te muestra qué porcentaje de tu código está cubierto por tests.

```bash
npm test -- --coverage
```

Esto genera reportes detallados mostrando exactamente qué líneas, funciones, branches y statements están cubiertos.

#### Mocking potente: Sistema de mocks incluido

Jest tiene un **sistema de mocking** muy potente y fácil de usar integrado. Puedes mockear funciones, módulos completos, timers, y más sin dependencias externas.

```typescript
// Mockear función
const mockFn = jest.fn();

// Mockear módulo
jest.mock('./api');

// Mockear timers
jest.useFakeTimers();
```

#### Paralelización: Tests en paralelo por defecto

Jest ejecuta tests **en paralelo** automáticamente, aprovechando todos los cores de tu CPU. Esto hace que las suites de tests grandes se ejecuten mucho más rápido que si se ejecutaran secuencialmente.

### ¿Por qué Jest es tan popular?

1. **Developer Experience superior**: Jest prioriza la experiencia del desarrollador con mensajes de error claros, watch mode interactivo, y configuración simple.

2. **Ecosistema de React**: Como fue creado por Facebook para React, tiene integración excelente con el ecosistema React (React Testing Library, etc.).

3. **All-in-one**: No necesitas combinar múltiples librerías. Jest es test runner, assertion library, mocking framework, y más, todo en uno.

## Desafíos Especiales en el Proyecto

Al implementar Jest en **Taller-Testing-Security/ui**, enfrentamos varios desafíos típicos de proyectos React modernos:

### 1. Compatibilidad con Vite

Vite usa **ESM (ES Modules)** por defecto y `import.meta.env` para variables de entorno, mientras que Jest tradicionalmente trabaja con CommonJS. Esto requiere configuración especial:

- Usar **ts-jest** para transformar TypeScript
- Mockear `import.meta.env` globalmente
- Configurar archivos `.cjs` para Jest en proyectos type="module"

### 2. Mocking de APIs Web en jsdom

jsdom (el DOM simulado que usa Jest) no implementa todas las APIs del navegador. En nuestro proyecto necesitamos mockear:

- `window.matchMedia`: Usado para responsive design
- `window.location.replace`: Para redirecciones (jsdom no soporta navegación)
- `localStorage`: Para persistencia de tokens

### 3. Clases de Error Personalizadas

El proyecto usa clases de error personalizadas (`Unauthorized`, `NotFound`, etc.) que **no heredan de Error**. Esto causa que `jest.fn().rejects.toThrow()` no funcione como esperado. La solución es usar `.rejects.toMatchObject({})` en su lugar.

### 4. Testing de Código Asíncrono con Fetch

Mockear `fetch` correctamente requiere:

- Crear objetos Response completos con métodos `.json()`, `.text()`
- Manejar promesas en los tests
- Simular diferentes códigos de estado HTTP

1. **Comunidad grande**: Siendo tan popular, hay toneladas de recursos, plugins, y ayuda disponible.

2. **Mantenimiento activo**: Meta lo usa internalmente y lo mantiene activamente.

## Instalación en Taller-Testing-Security

Ahora vamos a configurar Jest en el proyecto **Taller-Testing-Security/ui**. Aunque Vite no incluye Jest por defecto (usa Vitest), podemos configurar Jest sin problemas siguiendo estos pasos.

:::info Ubicación
Todos los comandos siguientes se ejecutan desde la carpeta `Taller-Testing-Security/ui/`:

```bash
cd Taller-Testing-Security/ui
```

:::

### Paquetes necesarios

Necesitamos instalar varios paquetes para tener un entorno de testing completo compatible con Vite + React + TypeScript:

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event identity-obj-proxy
```

Vamos a desglosar qué hace cada paquete:

**jest**: El framework de testing principal. Es el motor que ejecuta los tests, proporciona las funciones `describe`, `it`, `expect`, etc.

**@types/jest**: Definiciones de tipos TypeScript para Jest. Esto permite que tu IDE y TypeScript entiendan las funciones de Jest y proporcionen autocompletado y verificación de tipos.

**ts-jest**: Un preprocessor de TypeScript para Jest. Permite que Jest entienda y ejecute archivos TypeScript (`.ts`, `.tsx`) sin necesidad de compilarlos manualmente primero.

**jest-environment-jsdom**: Entorno de testing que simula un navegador. En versiones recientes de Jest, jsdom no viene incluido por defecto y debe instalarse separadamente.

**@testing-library/react**: Utilidades para testear componentes React. Proporciona funciones como `render()` para renderizar componentes en tests y `screen` para query elementos.

**@testing-library/jest-dom**: Matchers adicionales de Jest específicos para el DOM. Añade matchers útiles como `toBeInTheDocument()`, `toHaveClass()`, `toBeVisible()`, etc.

**@testing-library/user-event**: Librería para simular interacciones de usuario de forma más realista que `fireEvent`. Por ejemplo, `userEvent.type()` simula escribir letra por letra con los eventos correctos.

**identity-obj-proxy**: Mock para imports de CSS/SCSS. Retorna el nombre de la clase como string, útil cuando tus componentes importan estilos.

### ¿Por qué `--save-dev`?

El flag `--save-dev` instala los paquetes como **dependencias de desarrollo**. Esto significa que solo se necesitan durante el desarrollo y testing, no en producción. Cuando builds tu aplicación para producción, estas dependencias no se incluyen, manteniendo el bundle pequeño.

## Configuración: jest.config.cjs

El archivo `jest.config.cjs` en la carpeta `ui/` define cómo Jest debe ejecutar tus tests. Para proyectos Vite con TypeScript y React necesitamos configuración específica.

:::warning Extensión .cjs
Usamos la extensión `.cjs` (CommonJS) en lugar de `.js` porque el proyecto tiene `"type": "module"` en `package.json`. Esto le indica a Node.js que `jest.config.cjs` usa sintaxis CommonJS (`module.exports`) mientras el resto del proyecto usa ES modules.
:::

Crea el archivo `jest.config.cjs` en `Taller-Testing-Security/ui/`:

```javascript
module.exports = {
  // Entorno de ejecución
  testEnvironment: 'jsdom',
  
  // Preset para TypeScript
  preset: 'ts-jest',
  
  // Paths de módulos - Mapear imports de Vite
  moduleNameMapper: {
    // CSS Modules y estilos
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Assets (imágenes, SVGs, etc.)
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.cjs',
    
    // Alias de Vite (si los usas en vite.config.ts)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Archivos de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  
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
    '!src/main.tsx',           // Entry point
    '!src/vite-env.d.ts',      // Vite types
    '!src/**/*.stories.tsx',   // Storybook (si lo tienes)
  ],
  
  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  
  // Transformaciones
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
        },
      },
    ],
  },
};
```

### Explicación de cada opción

**`testEnvironment: 'jsdom'`**

Define el **entorno de ejecución** de los tests. Para React necesitamos `'jsdom'` que simula un navegador usando jsdom, una implementación en JavaScript del DOM. Esto es esencial para testear componentes React que renderizan elementos HTML y usan APIs del navegador como `localStorage`, `window`, etc.

**`preset: 'ts-jest'`**

Configura Jest para usar el preset de **ts-jest**, que permite ejecutar archivos TypeScript directamente. Sin esto, Jest no entendería sintaxis de TypeScript y fallaría al intentar ejecutar archivos `.ts` o `.tsx`.

**`transform`**

Define cómo transformar archivos antes de ejecutarlos. La configuración:

```javascript
transform: {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
      },
    },
  ],
}
```

- `jsx: 'react'`: Indica cómo procesar JSX (React 17+ usa automatic, pero para compatibilidad usamos 'react')
- `esModuleInterop: true`: Permite imports de CommonJS como `import React from 'react'`

:::info Nueva sintaxis de ts-jest
En versiones modernas de ts-jest (v29+), la configuración se pasa en el array `transform` en lugar de en `globals`. Esta es la forma recomendada y evita warnings de deprecación.
:::

**`moduleNameMapper`**

Este objeto mapea **import paths** a archivos reales o mocks. Es crucial para proyectos Vite:

- `'\\.(css|less|scss|sass)$': 'identity-obj-proxy'`: Mockea imports de estilos. Como Taller-Testing-Security usa Styled Components (CSS-in-JS), esto aplica principalmente si tienes imports de CSS regulares.

- `'\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.cjs'`: Mockea imports de assets. Vite permite importar imágenes como módulos, pero Jest necesita mockearlas.

- `'^@/(.*)$': '<rootDir>/src/$1'`: Alias para imports más limpios (si configuras `@` en vite.config.ts).

**`setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs']`**

Especifica archivos que se ejecutan **una vez después de configurar el entorno de testing** pero antes de ejecutar los tests. Es ideal para importar `@testing-library/jest-dom` y otras configuraciones globales.

**`collectCoverageFrom`**

Define qué archivos incluir al calcular **code coverage**:

- `'src/**/*.{ts,tsx}'`: Incluye todos los archivos TypeScript en `src`
- `'!src/**/*.d.ts'`: Excluye archivos de definiciones de tipos
- `'!src/main.tsx'`: Excluye el entry point de Vite
- `'!src/vite-env.d.ts'`: Excluye tipos de Vite

**`testPathIgnorePatterns`**

Patrones de paths que Jest debe **ignorar completamente**:

- `'/node_modules/'`: No ejecutar tests dentro de dependencias
- `'/dist/'`: Ignorar archivos build de Vite
- `'/build/'`: Otro posible directorio de output

## Setup: jest.setup.cjs

El archivo `jest.setup.cjs` se ejecuta una vez antes de todos los tests y es el lugar ideal para configuración global.

Crea el archivo `jest.setup.cjs` en `Taller-Testing-Security/ui/`:

```javascript
// Importar matchers de @testing-library/jest-dom
require('@testing-library/jest-dom');

// Configuración global para todos los tests
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores en tests
  warn: jest.fn(),  // Silenciar warnings en tests
};

// Mock de window.matchMedia (usado por algunos componentes)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de import.meta.env (variables de entorno de Vite)
if (typeof global.import === 'undefined') {
  global.import = {};
}
global.import.meta = {
  env: {
    VITE_API_URI: 'http://localhost:3000/api',
    VITE_BASE_URI: 'http://localhost:5173',
  },
};
```

### ¿Qué hace este setup?

**`require('@testing-library/jest-dom')`**

Esta línea importa los **custom matchers** de `@testing-library/jest-dom` usando CommonJS (`require` en lugar de `import`). Esto es necesario porque el archivo usa extensión `.cjs`.

Estos matchers extienden las capacidades de Jest con aserciones específicas para el DOM que hacen los tests más expresivos y legibles.

Sin este import, solo tendrías matchers básicos de Jest. Con él, obtienes matchers como:

```typescript
// Sin jest-dom
expect(element.getAttribute('class')).toContain('active');

// Con jest-dom (más legible)
expect(element).toHaveClass('active');
```

Otros matchers útiles:

- `toBeInTheDocument()`: Verifica que un elemento exists en el DOM
- `toBeVisible()`: Verifica que un elemento es visible
- `toBeDisabled()`: Verifica que un input/button está deshabilitado
- `toHaveTextContent()`: Verifica el texto de un elemento
- `toHaveAttribute()`: Verifica atributos HTML

### Silenciar consola en tests

```javascript
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
```

Esta configuración **mockea** `console.error` y `console.warn` para que no ensucien el output de los tests. En desarrollo, warnings y errors de React pueden ser útiles, pero en tests suelen ser ruido que dificulta leer los resultados.

Si necesitas ver estos mensajes durante desarrollo de tests, puedes comentar estas líneas temporalmente.

### Mock de window.matchMedia

```javascript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(...)
});
```

`window.matchMedia` es una API del navegador para media queries CSS. No existe en jsdom por defecto, pero algunos componentes pueden usarla (por ejemplo, para detectar dark mode o responsive breakpoints).

Este mock proporciona una implementación básica que previene errores cuando componentes usan `matchMedia`.

### Mock de import.meta.env

```javascript
if (typeof global.import === 'undefined') {
  global.import = {};
}
global.import.meta = {
  env: {
    VITE_API_URI: 'http://localhost:3000/api',
    VITE_BASE_URI: 'http://localhost:5173',
  },
};
```

Vite usa `import.meta.env` para acceder a variables de entorno (definidas en `.env`). En el proyecto Taller-Testing-Security, archivos como `src/utils/config.ts` usan estas variables:

```typescript
// src/utils/config.ts
const baseUrl = import.meta.env.VITE_BASE_URI;
let apiBaseUrl = import.meta.env.VITE_API_URI;

if (baseUrl) {
  apiBaseUrl = baseUrl + '/_/api';
}

export const API_BASE_URI = apiBaseUrl;
```

El mock proporciona valores por defecto para testing. Sin embargo, **este mock tiene limitaciones**: solo funciona para código que se ejecuta después de que el setup se carga. Para módulos que usan `import.meta.env` directamente al importarse (como `config.ts`), necesitamos crear mocks manuales en `src/utils/__mocks__/`.

:::info Mocks manuales de módulos
Para testear módulos que usan `import.meta.env`, crea un archivo mock en `src/utils/__mocks__/[nombre-del-archivo].ts`. Jest automáticamente usará este mock cuando llames a `jest.mock('../nombre-del-archivo')` en tus tests. Ver **functions-testing.md** para ejemplos detallados.
:::

:::warning Precaución
Los valores mockeados deben coincidir con tu entorno de desarrollo. Ajústalos si tus puertos o URLs son diferentes.
:::

## Mock de Assets: `__mocks__/fileMock.cjs`

Para manejar imports de imágenes y otros assets, necesitamos un mock simple.

Crea el archivo `__mocks__/fileMock.cjs` en `Taller-Testing-Security/ui/`:

```javascript
module.exports = 'test-file-stub';
```

Este archivo es referenciado en `jest.config.cjs` para mockear imports de imágenes:

```javascript
// Cuando un componente hace:
import logo from './logo.png';

// Jest lo reemplaza con:
const logo = 'test-file-stub';
```

Esto es suficiente para la mayoría de tests donde solo necesitas verificar que la imagen se renderiza, sin importar su contenido real.

### Ejemplo de uso en componente

El componente `Loader.tsx` del proyecto importa un SVG:

```typescript
// src/components/elements/Loader.tsx
import icnLoader from './loader.svg';

const Loader = ({ message }: LoaderProps) => (
  <LoaderWrapper>
    <LoaderCard>
      <LoaderImg src={icnLoader} alt={message} />
      <LoaderMsg>{message}</LoaderMsg>
    </LoaderCard>
  </LoaderWrapper>
);
```

En tests, `icnLoader` será `'test-file-stub'`:

```typescript
// Loader.test.tsx
it('renderiza con la imagen correcta', () => {
  render(<Loader message="Cargando..." />);
  const img = screen.getByAltText('Cargando...');
  expect(img).toHaveAttribute('src', 'test-file-stub');
});
```

## Scripts en package.json

Para facilitar la ejecución de tests, agrega estos scripts a tu `package.json` en `Taller-Testing-Security/ui/`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

### Explicación de cada script

**`"test": "jest"`**

Ejecuta **todos los tests** una vez y termina. Este es el comando que normalmente se ejecuta en CI/CD.

```bash
npm test
```

Output esperado:

```text
PASS  src/components/cards/__tests__/ProjectCard.test.tsx
PASS  src/components/elements/__tests__/Loader.test.tsx
PASS  src/api/__tests__/http-api-client.test.ts
PASS  src/utils/__tests__/auth.test.ts
PASS  src/utils/__tests__/config.test.ts

Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        1.523 s
```

:::note Estado Actual
Con todos los ejemplos implementados, el proyecto tiene:
- **47 tests** en total (16 auth + 17 http-api-client + 2 config + 4 Loader + 8 ProjectCard)
- **5 archivos de test** completamente funcionales
- **100% coverage** en Loader.tsx y ProjectCard.tsx
:::

**`"test:watch": "jest --watch"`**

Ejecuta Jest en **modo watch**: los tests se re-ejecutan automáticamente cuando guardas cambios en archivos. Es el modo ideal para desarrollo porque obtienes feedback instantáneo.

```bash
npm run test:watch
```

Features del watch mode:

- Re-ejecuta solo tests relacionados con archivos cambiados
- Menu interactivo para filtrar tests
- Actualización automática
- Modo focused con `f` para ejecutar solo tests que fallaron

**`"test:coverage": "jest --coverage"`**

Ejecuta tests y genera un **reporte de cobertura de código** mostrando qué porcentaje de tu código está cubierto por tests.

```bash
npm run test:coverage
```

Genera un reporte como:

```text
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   30.86 |    28.85 |   31.25 |   30.57 |
 src/utils                |   55.22 |    52.38 |   42.10 |   55.73 |
  auth.ts                 |   84.09 |    73.33 |   80.00 |   82.92 |
  config.ts               |    0.00 |     0.00 |  100.00 |    0.00 |
 src/components/elements  |  100.00 |   100.00 |  100.00 |  100.00 |
  Loader.tsx              |  100.00 |   100.00 |  100.00 |  100.00 |
 src/components/cards     |   56.33 |    48.00 |   70.00 |   56.33 |
  ProjectCard.tsx         |  100.00 |    92.30 |  100.00 |  100.00 |
 src/api                  |   77.52 |    55.55 |   88.88 |   77.52 |
  http-api-client.ts      |   88.05 |    66.66 |  100.00 |   88.05 |
--------------------------|---------|----------|---------|---------|
```

:::tip Mejora en Coverage
Con la implementación de todos los tests documentados, hemos alcanzado **100% de coverage** en los componentes testeados (Loader y ProjectCard). Esto demuestra que los ejemplos de testing cubren completamente la funcionalidad de estos componentes.

El coverage global es bajo porque solo hemos implementado tests para algunos módulos como ejercicio didáctico. En un proyecto real, se extendería el testing a todos los componentes y utilidades.
:::

También genera un reporte HTML en `coverage/lcov-report/index.html` que puedes abrir en el navegador para ver visualmente qué líneas están cubiertas.

**`"test:verbose": "jest --verbose"`**

Ejecuta tests con **output detallado**, mostrando cada test individual incluso si pasa.

```bash
npm run test:verbose
```

Útil para debugging o cuando quieres ver exactamente qué tests están corriendo.

### Flags adicionales útiles

Puedes combinar flags para personalizar la ejecución:

```bash
# Ejecutar solo tests que matchean un patrón (por ejemplo, solo tests de Loader)
npm test -- Loader

# Ejecutar solo tests en una carpeta específica
npm test -- src/utils

# Actualizar snapshots
npm test -- -u

# Ejecutar con coverage y actualizar snapshots
npm run test:coverage -- -u

# Modo watch con coverage
npm run test:watch -- --coverage
```

:::tip Consejo
Durante desarrollo, usa `npm run test:watch` para feedback instantáneo. Antes de hacer commit, ejecuta `npm run test:coverage` para verificar cobertura.
:::

## Primer Test de Verificación: config.ts

Ahora que tienes Jest configurado, vamos a crear un primer test simple para verificar que todo funciona correctamente.

### Contexto: config.ts y import.meta

El módulo `src/utils/config.ts` usa `import.meta.env` de Vite para acceder a variables de entorno:

```typescript
// src/utils/config.ts
const baseUrl = import.meta.env.VITE_BASE_URI;
let apiBaseUrl = import.meta.env.VITE_API_URI;

if (baseUrl) {
  apiBaseUrl = baseUrl + '/_/api';
}

export const API_BASE_URI = apiBaseUrl;
```

**Problema**: Jest (Node.js) no puede transformar `import.meta.env` directamente. La solución es crear un **mock manual** del módulo.

### Paso 1: Crear el mock manual

Crea el archivo `src/utils/__mocks__/config.ts`:

```typescript
// Mock del módulo config.ts para tests
export const API_BASE_URI = 'http://localhost:3000/api';
```

Este mock proporciona un valor fijo para testing. Jest automáticamente usará este archivo cuando llamemos a `jest.mock('../config')`.

### Paso 2: Crear el test

Crea el archivo `src/utils/__tests__/config.test.ts`:

```typescript
// Mock del módulo config para evitar problemas con import.meta
jest.mock('../config');

import { API_BASE_URI } from '../config';

describe('Config Module', () => {
  it('exports API_BASE_URI', () => {
    expect(API_BASE_URI).toBeDefined();
  });

  it('API_BASE_URI contains localhost URL', () => {
    expect(API_BASE_URI).toBe('http://localhost:3000/api');
  });
});
```

### Paso 3: Ejecutar el test

```bash
cd Taller-Testing-Security/ui
npm test
```

Si todo está configurado correctamente, deberías ver:

```text
PASS  src/utils/__tests__/config.test.ts
  Config Module
    ✓ exports API_BASE_URI (1 ms)
    ✓ API_BASE_URI contains localhost URL

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.593 s
```

¡Configuración completa! 🎉

### ¿Por qué este enfoque?

**jest.mock('../config')** le dice a Jest que use el mock manual en lugar del archivo real. Esto evita que Jest intente transformar `import.meta.env`, que causaría un error de sintaxis.

**Ventajas**:
- Valores consistentes en todos los tests
- No necesitas mockear en cada archivo de test
- Evita problemas de transformación de Vite-specific syntax

**Desventajas**:
- No puedes testear la lógica del archivo real
- Debes mantener el mock sincronizado con el archivo original

Para testing de lógica compleja, este enfoque es aceptable porque `config.ts` es principalmente configuración estática.

¡Felicidades! 🎉 Jest está funcionando correctamente.

:::tip Tests más complejos
Este test simple verifica que la configuración funciona. Para ejemplos completos de testing de funciones con mocks de localStorage, jwt-decode, y validación de tokens, consulta la sección **[Testing de Funciones](./functions-testing)** donde se detalla paso a paso cómo testear el módulo `auth.ts` completo con 14 tests.
:::
