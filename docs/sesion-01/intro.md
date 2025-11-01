---
sidebar_position: 1
title: "Fundamentos y Testing Unitario con Jest"
---

**Duración:** 1.5 horas  
**Objetivos:** Comprender la importancia del testing y dominar los fundamentos de testing unitario con Jest

---

## 📋 Índice

1. [Introducción al Testing](#introducción-al-testing)
2. [Conceptos Fundamentales](#conceptos-fundamentales)
3. [Jest: Configuración e Introducción](#jest-configuración-e-introducción)
4. [Testing Unitario de Funciones](#testing-unitario-de-funciones)
5. [Testing de Componentes React](#testing-de-componentes-react)
6. [Mocks y Spies](#mocks-y-spies)
7. [Coverage y Buenas Prácticas](#coverage-y-buenas-prácticas)
8. [Ejercicio Práctico](#ejercicio-práctico)
9. [Recursos Adicionales](#recursos-adicionales)

---

## Introducción al Testing

### ¿Por qué necesitamos testing?

El testing es una parte fundamental del desarrollo de software moderno. Nos proporciona:

**1. Confianza en el código**
- Garantiza que el código funciona como se espera
- Permite refactorizar sin miedo a romper funcionalidad
- Detecta errores antes de que lleguen a producción

**2. Documentación viva**
- Los tests describen cómo debe comportarse el código
- Sirven como ejemplos de uso
- Se mantienen actualizados con el código

**3. ROI (Return on Investment)**
- Reduce tiempo de debugging
- Menor coste de mantenimiento
- Menos bugs en producción

**4. Mejor diseño de código**
- Fuerza a pensar en casos edge
- Promueve código modular y testeable
- Facilita el principio de responsabilidad única

### La Pirámide de Testing

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integración\
              /--------------\
             /                \
            /     Unitarios    \
           /____________________\
```

**Tests Unitarios (Base - 70%)**
- Rápidos de ejecutar (milisegundos)
- Fáciles de escribir y mantener
- Prueban unidades individuales de código
- Gran cantidad, alta especificidad

**Tests de Integración (Medio - 20%)**
- Prueban la interacción entre componentes
- Tiempo de ejecución moderado
- Balance entre cobertura y velocidad

**Tests E2E (Punta - 10%)**
- Prueban el sistema completo
- Lentos de ejecutar
- Frágiles y costosos de mantener
- Validan flujos críticos de usuario

### Tipos de Testing

**Testing Manual**
- Ejecutado por humanos
- Lento y propenso a errores
- Necesario para UX y exploración

**Testing Automatizado**
- Ejecutado por máquinas
- Rápido y repetible
- Foco de esta sesión

**TDD (Test-Driven Development)**
```
Red → Green → Refactor
```
1. Escribir test (falla)
2. Escribir código mínimo para pasar
3. Refactorizar

---

## Conceptos Fundamentales

### Anatomía de un Test

```typescript
describe('NombreDeLaFuncionalidad', () => {
  
  // Setup: Preparar el entorno
  beforeEach(() => {
    // Se ejecuta antes de cada test
  });

  // Test individual
  it('debe hacer algo específico', () => {
    // 1. Arrange: Preparar datos
    const input = 'valor';
    
    // 2. Act: Ejecutar la función
    const result = funcionATestear(input);
    
    // 3. Assert: Verificar resultado
    expect(result).toBe('esperado');
  });

  // Limpieza
  afterEach(() => {
    // Se ejecuta después de cada test
  });
});
```

### AAA Pattern (Arrange, Act, Assert)

**Arrange (Preparar)**
- Configurar datos de prueba
- Inicializar objetos
- Configurar mocks

**Act (Actuar)**
- Ejecutar la función/método
- Realizar la acción a testear

**Assert (Afirmar)**
- Verificar el resultado
- Comprobar efectos secundarios

### Características de un Buen Test

**FIRST Principles:**

- **F**ast: Rápidos de ejecutar
- **I**ndependent: No dependen de otros tests
- **R**epeatable: Resultados consistentes
- **S**elf-validating: Pasa o falla sin intervención manual
- **T**imely: Escritos a tiempo (idealmente antes del código)

---

## Jest: Configuración e Introducción

### ¿Qué es Jest?

Jest es un framework de testing de JavaScript creado por Facebook, diseñado para:

- **Zero-config:** Funciona out-of-the-box
- **Snapshot testing:** Para componentes React
- **Coverage integrado:** Sin configuración adicional
- **Mocking potente:** Sistema de mocks incluido
- **Paralelización:** Tests en paralelo por defecto

### Instalación en Proyecto Docusaurus

```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

### Configuración: jest.config.js

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

### Setup: jest.setup.js

```javascript
import '@testing-library/jest-dom';

// Configuración global para todos los tests
global.console = {
  ...console,
  error: jest.fn(), // Silenciar errores en tests
  warn: jest.fn(),  // Silenciar warnings en tests
};
```

### Scripts en package.json

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

---

## Testing Unitario de Funciones

### Ejemplo 1: Función Pura Simple

**Código: src/utils/math.ts**

```typescript
export function sum(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}
```

**Test: src/utils/__tests__/math.test.ts**

```typescript
import { sum, multiply, divide } from '../math';

describe('Math Utils', () => {
  
  describe('sum', () => {
    it('debe sumar dos números positivos', () => {
      expect(sum(2, 3)).toBe(5);
    });

    it('debe sumar números negativos', () => {
      expect(sum(-2, -3)).toBe(-5);
    });

    it('debe sumar número positivo y negativo', () => {
      expect(sum(5, -3)).toBe(2);
    });

    it('debe sumar con cero', () => {
      expect(sum(5, 0)).toBe(5);
    });
  });

  describe('multiply', () => {
    it('debe multiplicar dos números', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('debe devolver 0 al multiplicar por 0', () => {
      expect(multiply(5, 0)).toBe(0);
    });
  });

  describe('divide', () => {
    it('debe dividir dos números', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('debe lanzar error al dividir por cero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });
});
```

### Ejemplo 2: Validación de Strings

**Código: src/utils/validators.ts**

```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, una mayúscula, una minúscula, un número
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .substring(0, 200);   // Limitar longitud
}
```

**Test: src/utils/__tests__/validators.test.ts**

```typescript
import { isValidEmail, isStrongPassword, sanitizeInput } from '../validators';

describe('Validators', () => {
  
  describe('isValidEmail', () => {
    it('debe validar email correcto', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('debe rechazar email sin @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('debe rechazar email sin dominio', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('debe rechazar email con espacios', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('debe rechazar string vacío', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('debe validar contraseña fuerte', () => {
      expect(isStrongPassword('Password123')).toBe(true);
    });

    it('debe rechazar contraseña corta', () => {
      expect(isStrongPassword('Pass1')).toBe(false);
    });

    it('debe rechazar sin mayúscula', () => {
      expect(isStrongPassword('password123')).toBe(false);
    });

    it('debe rechazar sin minúscula', () => {
      expect(isStrongPassword('PASSWORD123')).toBe(false);
    });

    it('debe rechazar sin número', () => {
      expect(isStrongPassword('Password')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('debe eliminar espacios al inicio y final', () => {
      expect(sanitizeInput('  texto  ')).toBe('texto');
    });

    it('debe eliminar etiquetas HTML', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('scriptalert("xss")/script');
    });

    it('debe limitar longitud a 200 caracteres', () => {
      const longText = 'a'.repeat(300);
      expect(sanitizeInput(longText).length).toBe(200);
    });
  });
});
```

### Matchers Comunes de Jest

```typescript
// Igualdad
expect(value).toBe(4);                    // Igualdad estricta (===)
expect(object).toEqual({ a: 1, b: 2 });   // Igualdad profunda

// Truthiness
expect(value).toBeTruthy();               // true, 1, "string"
expect(value).toBeFalsy();                // false, 0, "", null, undefined
expect(value).toBeNull();                 // null
expect(value).toBeUndefined();            // undefined
expect(value).toBeDefined();              // not undefined

// Números
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(5);
expect(0.1 + 0.2).toBeCloseTo(0.3);      // Flotantes

// Strings
expect('team').toMatch(/tea/);
expect('team').not.toMatch(/I/);

// Arrays
expect(['a', 'b']).toContain('a');
expect([1, 2, 3]).toHaveLength(3);

// Excepciones
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow('error message');

// Objetos
expect(obj).toHaveProperty('key');
expect(obj).toHaveProperty('key', 'value');
```

---

## Testing de Componentes React

### React Testing Library: Filosofía

React Testing Library promueve probar componentes **como lo haría un usuario**:

- ❌ No probar detalles de implementación (state, props internos)
- ✅ Probar comportamiento observable
- ✅ Usar selectores accesibles (roles, labels, text)

### Ejemplo 1: Componente Simple

**Código: src/components/Button.tsx**

```tsx
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  label, 
  onClick, 
  disabled = false,
  variant = 'primary' 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

**Test: src/components/__tests__/Button.test.tsx**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  
  it('debe renderizar con el label correcto', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('debe llamar onClick cuando se hace click', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('no debe llamar onClick cuando está disabled', () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('debe tener la clase primary por defecto', () => {
    render(<Button label="Click" onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('debe aplicar variant secondary', () => {
    render(<Button label="Click" onClick={() => {}} variant="secondary" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary');
  });

  it('debe estar disabled cuando se pasa la prop', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Ejemplo 2: Componente con Estado

**Código: src/components/Counter.tsx**

```tsx
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
}
```

**Test: src/components/__tests__/Counter.test.tsx**

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Counter } from '../Counter';

describe('Counter', () => {
  
  it('debe empezar en 0', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('debe incrementar al hacer click en Increment', () => {
    render(<Counter />);
    
    const incrementButton = screen.getByText('Increment');
    fireEvent.click(incrementButton);
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('debe decrementar al hacer click en Decrement', () => {
    render(<Counter />);
    
    const decrementButton = screen.getByText('Decrement');
    fireEvent.click(decrementButton);
    
    expect(screen.getByText('Count: -1')).toBeInTheDocument();
  });

  it('debe resetear al hacer click en Reset', () => {
    render(<Counter />);
    
    // Incrementar varias veces
    const incrementButton = screen.getByText('Increment');
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    
    // Verificar que cuenta es 3
    expect(screen.getByText('Count: 3')).toBeInTheDocument();
    
    // Reset
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});
```

### Queries de Testing Library

**Prioridad de selectores (de mayor a menor):**

1. **getByRole**: Más accesible
```tsx
screen.getByRole('button', { name: /submit/i });
```

2. **getByLabelText**: Para inputs con labels
```tsx
screen.getByLabelText('Email');
```

3. **getByPlaceholderText**: Para inputs con placeholder
```tsx
screen.getByPlaceholderText('Enter email');
```

4. **getByText**: Texto visible
```tsx
screen.getByText('Hello World');
```

5. **getByTestId**: Último recurso
```tsx
screen.getByTestId('custom-element');
```

**Variantes de queries:**

- **getBy**: Falla si no encuentra (uso más común)
- **queryBy**: Devuelve null si no encuentra (para verificar ausencia)
- **findBy**: Async, espera a que aparezca (para elementos que cargan)

```tsx
// Verificar que existe
expect(screen.getByText('Loaded')).toBeInTheDocument();

// Verificar que NO existe
expect(screen.queryByText('Loading')).not.toBeInTheDocument();

// Esperar elemento async
const element = await screen.findByText('Data loaded');
```

---

## Mocks y Spies

### ¿Qué son los Mocks?

Los mocks son **objetos simulados** que reemplazan dependencias reales durante los tests.

**Casos de uso:**
- APIs externas
- Bases de datos
- Módulos complejos
- Funciones de terceros

### Jest Mock Functions

```typescript
// Crear mock function
const mockFn = jest.fn();

// Mock con implementación
const mockFn = jest.fn((x) => x * 2);

// Mock con retorno
const mockFn = jest.fn().mockReturnValue(42);

// Mock con promesa
const mockFn = jest.fn().mockResolvedValue({ data: 'success' });

// Verificaciones
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('lastArg');
```

### Ejemplo: Mockear Módulo Completo

**Código: src/utils/api.ts**

```typescript
export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

**Test con Mock:**

```typescript
import { fetchUserData } from '../api';

// Mockear fetch global
global.fetch = jest.fn();

describe('fetchUserData', () => {
  
  beforeEach(() => {
    // Reset mock antes de cada test
    (fetch as jest.Mock).mockClear();
  });

  it('debe llamar fetch con URL correcta', async () => {
    const mockResponse = { id: '123', name: 'John' };
    
    (fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await fetchUserData('123');

    expect(fetch).toHaveBeenCalledWith('/api/users/123');
    expect(result).toEqual(mockResponse);
  });

  it('debe manejar errores de red', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(fetchUserData('123')).rejects.toThrow('Network error');
  });
});
```

### Spies: Espiar Funciones Reales

```typescript
// Espiar método de objeto
const spy = jest.spyOn(object, 'method');

// Ejecutar y verificar
object.method();
expect(spy).toHaveBeenCalled();

// Restaurar implementación original
spy.mockRestore();
```

**Ejemplo práctico:**

```typescript
import * as mathUtils from '../math';

describe('Math with Spy', () => {
  it('debe espiar multiply', () => {
    const multiplySpy = jest.spyOn(mathUtils, 'multiply');
    
    const result = mathUtils.multiply(3, 4);
    
    expect(multiplySpy).toHaveBeenCalledWith(3, 4);
    expect(result).toBe(12);
    
    multiplySpy.mockRestore();
  });
});
```

---

## Coverage y Buenas Prácticas

### Code Coverage

**¿Qué es coverage?**
Porcentaje de código ejecutado durante los tests.

**Métricas:**
- **Statements**: Líneas ejecutadas
- **Branches**: Ramas if/else cubiertas
- **Functions**: Funciones llamadas
- **Lines**: Líneas de código cubiertas

### Ejecutar Coverage

```bash
npm run test:coverage
```

**Output:**
```
 PASS  src/utils/__tests__/math.test.ts
 PASS  src/components/__tests__/Button.test.tsx

--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.71 |    83.33 |   87.50 |   85.71 |
 utils/math.ts      |   100   |    100   |   100   |   100   |
 components/        |   80.00 |    75.00 |   83.33 |   80.00 |
--------------------|---------|----------|---------|---------|
```

### Configurar Coverage Thresholds

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### ¿Cuánto Coverage es Suficiente?

- **70-80%**: Objetivo realista para mayoría de proyectos
- **90-100%**: Para código crítico (finanzas, salud)
- **100%**: Difícil de mantener, rendimiento decreciente

⚠️ **Importante**: Coverage alto no garantiza buenos tests. Calidad > Cantidad.

### Buenas Prácticas

**1. Tests descriptivos**
```typescript
// ❌ Mal
it('works', () => { ... });

// ✅ Bien
it('debe mostrar mensaje de error cuando email es inválido', () => { ... });
```

**2. Un concepto por test**
```typescript
// ❌ Mal: Test hace demasiado
it('debe hacer todo', () => {
  // testea validación
  // testea guardado
  // testea navegación
});

// ✅ Bien: Tests separados
it('debe validar email', () => { ... });
it('debe guardar usuario', () => { ... });
it('debe navegar a dashboard', () => { ... });
```

**3. No testear detalles de implementación**
```typescript
// ❌ Mal: Testea state interno
expect(component.state.count).toBe(5);

// ✅ Bien: Testea comportamiento observable
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

**4. Tests independientes**
```typescript
// ❌ Mal: Tests dependen del orden
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); });

// ✅ Bien: Cada test es independiente
it('test 1', () => {
  const state = 'value';
  expect(state).toBe('value');
});
```

**5. Setup y Teardown**
```typescript
describe('UserService', () => {
  let mockDB;

  beforeEach(() => {
    mockDB = createMockDB();
  });

  afterEach(() => {
    mockDB.cleanup();
  });

  it('debe crear usuario', () => {
    // mockDB ya está disponible
  });
});
```

---

## Ejercicio Práctico

### Objetivo

Implementar tests unitarios para componentes y utilidades del proyecto Docusaurus, alcanzando un coverage mínimo del 80%.

### Parte 1: Tests de Utilidades (30 minutos)

Crear archivo `src/utils/formatters.ts`:

```typescript
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

**Tareas:**
1. Crear `src/utils/__tests__/formatters.test.ts`
2. Escribir tests para cada función
3. Cubrir casos edge (textos vacíos, null, caracteres especiales)
4. Verificar coverage con `npm run test:coverage`

### Parte 2: Tests de Componentes (45 minutos)

Crear componente `src/components/SearchBox.tsx`:

```tsx
import React, { useState } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBox({ onSearch, placeholder = 'Search...' }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="search-input"
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

**Tareas:**
1. Crear `src/components/__tests__/SearchBox.test.tsx`
2. Testear renderizado
3. Testear cambio de input
4. Testear submit del formulario
5. Testear que no se llama onSearch con query vacío
6. Verificar accesibilidad (roles, labels)

### Parte 3: Tests Avanzados con Mocks (30 minutos)

Crear `src/utils/storage.ts`:

```typescript
export class LocalStorageService {
  static get(key: string): string | null {
    return localStorage.getItem(key);
  }

  static set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}
```

**Tareas:**
1. Crear `src/utils/__tests__/storage.test.ts`
2. Mockear localStorage
3. Testear todos los métodos
4. Verificar que se llaman los métodos correctos

### Criterios de Evaluación

- ✅ Mínimo 10 tests unitarios
- ✅ Coverage >80% en archivos testeados
- ✅ Tests pasan sin errores
- ✅ Nombres descriptivos
- ✅ Uso correcto de matchers
- ✅ Tests independientes y repetibles

---

## Recursos Adicionales

### Documentación Oficial

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

### Tutoriales y Guías

- [Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)

### Herramientas

- [Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)
- [Testing Library Playground](https://testing-playground.com/)
- [Which Query Should I Use?](https://testing-library.com/docs/queries/about/#priority)

### Próxima Sesión

En la **Sesión 2: Testing de Integración** veremos:
- Tests de componentes con Context
- Tests de custom hooks
- Testing de APIs con Supertest
- Gestión de fixtures y datos de prueba
- Tests end-to-end del flujo completo

---

**¡Excelente trabajo!** Has completado la primera sesión de Testing. Ahora tienes las bases para escribir tests unitarios efectivos con Jest y React Testing Library.
