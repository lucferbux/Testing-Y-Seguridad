---
sidebar_position: 8
title: "Coverage y Buenas Prácticas"
---

# Coverage y Buenas Prácticas

## Code Coverage

### ¿Qué es coverage?

Porcentaje de código ejecutado durante los tests.

### Métricas

- **Statements**: Líneas ejecutadas
- **Branches**: Ramas if/else cubiertas
- **Functions**: Funciones llamadas
- **Lines**: Líneas de código cubiertas

## Ejecutar Coverage

```bash
npm run test:coverage
```

### Output

```text
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

## Configurar Coverage Thresholds

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

## ¿Cuánto Coverage es Suficiente?

- **70-80%**: Objetivo realista para mayoría de proyectos
- **90-100%**: Para código crítico (finanzas, salud)
- **100%**: Difícil de mantener, rendimiento decreciente

⚠️ **Importante**: Coverage alto no garantiza buenos tests. Calidad > Cantidad.

## Buenas Prácticas

### 1. Tests descriptivos

```typescript
// ❌ Mal
it('works', () => { ... });

// ✅ Bien
it('debe mostrar mensaje de error cuando email es inválido', () => { ... });
```

### 2. Un concepto por test

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

### 3. No testear detalles de implementación

```typescript
// ❌ Mal: Testea state interno
expect(component.state.count).toBe(5);

// ✅ Bien: Testea comportamiento observable
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 4. Tests independientes

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

### 5. Setup y Teardown

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
