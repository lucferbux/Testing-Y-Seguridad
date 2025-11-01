---
sidebar_position: 7
title: "Mocks y Spies"
---

# Mocks y Spies

## ¿Qué son los Mocks?

Los mocks son **objetos simulados** que reemplazan dependencias reales durante los tests.

**Casos de uso:**

- APIs externas
- Bases de datos
- Módulos complejos
- Funciones de terceros

## Jest Mock Functions

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

## Ejemplo: Mockear Módulo Completo

### Código: src/utils/api.ts

```typescript
export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
```

### Test con Mock

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

## Spies: Espiar Funciones Reales

```typescript
// Espiar método de objeto
const spy = jest.spyOn(object, 'method');

// Ejecutar y verificar
object.method();
expect(spy).toHaveBeenCalled();

// Restaurar implementación original
spy.mockRestore();
```

### Ejemplo práctico

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
