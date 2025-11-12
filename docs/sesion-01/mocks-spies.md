---
sidebar_position: 7
title: "Mocks y Spies"
---

El mocking es una técnica esencial en testing que nos permite aislar el código que estamos probando de sus dependencias externas. En esta sección profundizaremos en qué son los mocks, cuándo usarlos, y cómo implementarlos efectivamente con Jest.

## ¿Qué son los Mocks?

Los mocks son **objetos o funciones simuladas** que reemplazan dependencias reales durante la ejecución de tests. Actúan como "dobles de prueba" que imitan el comportamiento de código real pero de forma controlada y predecible.

### ¿Por qué necesitamos mocks?

Imagina que estás testeando una función que:

1. Hace una petición HTTP a una API externa
2. Escribe en una base de datos
3. Envía un email
4. Lee archivos del sistema

Si ejecutas tests que hacen estas cosas realmente:

- ❌ **Lentos**: Operaciones I/O son órdenes de magnitud más lentas que código puro
- ❌ **Frágiles**: Dependen de servicios externos que pueden estar caídos
- ❌ **Costosos**: Pueden consumir recursos reales (emails, API calls con límites)
- ❌ **Impredecibles**: Respuestas pueden variar, haciendo tests no repetibles
- ❌ **Efectos secundarios**: Pueden modificar datos reales

Con mocks, podemos:

- ✅ Ejecutar tests en milisegundos
- ✅ Tests completamente independientes de servicios externos
- ✅ Simular cualquier escenario (errores, timeouts, casos edge)
- ✅ Verificar que las dependencias se llaman correctamente
- ✅ Tests 100% repetibles

### Casos de uso principales

#### APIs externas

```typescript
// En lugar de hacer peticiones HTTP reales
fetch('https://api.example.com/users')
  .then(res => res.json())

// Mockeamos fetch para retornar datos controlados
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve([{ id: 1, name: 'John' }])
});
```

#### Bases de datos

```typescript
// En lugar de conectar a BD real
const users = await database.query('SELECT * FROM users');

// Mockeamos las queries
database.query = jest.fn().mockResolvedValue([
  { id: 1, name: 'John' }
]);
```

#### Módulos complejos

```typescript
// En lugar de usar librería real con lógica compleja
import { heavyComputation } from 'complex-library';

// Mockeamos el módulo entero
jest.mock('complex-library');
```

#### Funciones de terceros

```typescript
// En lugar de enviar emails reales
sendEmail(user.email, 'Welcome!');

// Mockeamos para verificar que se llamó correctamente
sendEmail = jest.fn();
```

## Jest Mock Functions

Jest proporciona `jest.fn()` para crear funciones mockeadas con superpoderes. Estas funciones no solo pueden simular comportamiento, sino que también **registran** cómo fueron llamadas, permitiéndonos verificar interacciones.

### Crear una mock function básica

```typescript
// Crear mock function vacía
const mockFn = jest.fn();

mockFn('hello', 'world');
mockFn(42);

// Verificar llamadas
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('hello', 'world');
expect(mockFn).toHaveBeenLastCalledWith(42);
```

La mock function registra automáticamente:

- Si fue llamada
- Cuántas veces
- Con qué argumentos
- Qué retornó

### Mock con implementación personalizada

```typescript
// Mock que ejecuta lógica personalizada
const mockFn = jest.fn((x) => x * 2);

const result = mockFn(5);
console.log(result); // 10

expect(mockFn).toHaveBeenCalledWith(5);
```

Útil cuando necesitas que el mock haga algo específico pero controlado.

### Mock con valor de retorno fijo

```typescript
// Retorna siempre el mismo valor
const mockFn = jest.fn().mockReturnValue(42);

console.log(mockFn()); // 42
console.log(mockFn('cualquier arg')); // 42
```

La forma más simple cuando solo necesitas un valor constante.

### Mock con múltiples retornos

```typescript
// Retorna valores diferentes en cada llamada
const mockFn = jest.fn()
  .mockReturnValueOnce('primero')
  .mockReturnValueOnce('segundo')
  .mockReturnValue('resto');

console.log(mockFn()); // 'primero'
console.log(mockFn()); // 'segundo'
console.log(mockFn()); // 'resto'
console.log(mockFn()); // 'resto'
```

Perfecto para simular comportamiento que cambia con el tiempo.

### Mock con promesas

```typescript
// Promise que resuelve
const mockFn = jest.fn().mockResolvedValue({ data: 'success' });

const result = await mockFn();
console.log(result); // { data: 'success' }

// Promise que rechaza
const mockFnError = jest.fn().mockRejectedValue(new Error('Failed'));

await expect(mockFnError()).rejects.toThrow('Failed');
```

Esencial para mockear funciones async como fetch, API calls, etc.

### Verificaciones detalladas

```typescript
const mockFn = jest.fn();

mockFn('arg1', 'arg2');
mockFn('arg3');

// Verificar que fue llamada
expect(mockFn).toHaveBeenCalled();

// Verificar número de veces
expect(mockFn).toHaveBeenCalledTimes(2);

// Verificar argumentos de cualquier llamada
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

// Verificar argumentos de la última llamada
expect(mockFn).toHaveBeenLastCalledWith('arg3');

// Verificar argumentos de la primera llamada
expect(mockFn).toHaveBeenNthCalledWith(1, 'arg1', 'arg2');

// Acceder a todas las llamadas
expect(mockFn.mock.calls).toEqual([
  ['arg1', 'arg2'],
  ['arg3']
]);

// Acceder a todos los resultados
expect(mockFn.mock.results).toHaveLength(2);
```

### Resetear y limpiar mocks

```typescript
const mockFn = jest.fn();

mockFn('test');
expect(mockFn).toHaveBeenCalledTimes(1);

// Limpiar registro de llamadas (mantiene implementación)
mockFn.mockClear();
expect(mockFn).toHaveBeenCalledTimes(0);

// Resetear implementación (vuelve a jest.fn() vacío)
mockFn.mockReset();

// Restaurar implementación original (solo para spies)
mockFn.mockRestore();
```

**Cuándo usar cada uno:**

- `mockClear()`: En `beforeEach` para limpiar entre tests
- `mockReset()`: Cuando necesitas redefinir el mock completamente
- `mockRestore()`: Solo para spies, restaura función original

## Ejemplo: Mockear Módulo Completo

Veamos un ejemplo realista de cómo mockear `fetch` para testear una función que consume una API.

### Código: src/utils/api.ts

```typescript
export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
```

Esta función hace una petición HTTP y parsea la respuesta JSON. En tests, no queremos hacer peticiones reales.

### Test con Mock

```typescript
import { fetchUserData } from '../api';

// Mockear fetch global
global.fetch = jest.fn();

describe('fetchUserData', () => {
  
  beforeEach(() => {
    // Reset mock antes de cada test para independencia
    (fetch as jest.Mock).mockClear();
  });

  it('debe llamar fetch con URL correcta', async () => {
    const mockResponse = { id: '123', name: 'John' };
    
    // Configurar mock de fetch
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await fetchUserData('123');

    // Verificar que fetch se llamó correctamente
    expect(fetch).toHaveBeenCalledWith('/api/users/123');
    expect(fetch).toHaveBeenCalledTimes(1);
    
    // Verificar que el resultado es correcto
    expect(result).toEqual(mockResponse);
  });

  it('debe manejar errores de red', async () => {
    // Simular error de red
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Verificar que lanza el error
    await expect(fetchUserData('123')).rejects.toThrow('Network error');
  });

  it('debe manejar respuestas HTTP no-ok', async () => {
    // Simular respuesta 404
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchUserData('123')).rejects.toThrow('HTTP error! status: 404');
  });
});
```

### Análisis del ejemplo

#### Setup en beforeEach

```typescript
beforeEach(() => {
  (fetch as jest.Mock).mockClear();
});
```

Limpiamos el mock antes de cada test para asegurar que los tests son independientes. Sin esto, las llamadas de un test afectarían las verificaciones del siguiente.

#### Mockear respuesta completa

```typescript
(fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue(mockResponse),
});
```

Simulamos tanto la respuesta de fetch como el método `json()`. Esto replica la estructura real de la API de fetch.

#### Testear casos de error

Los mocks nos permiten simular fácilmente errores que serían difíciles de provocar en la realidad:

- Errores de red
- Respuestas HTTP específicas (404, 500, etc.)
- Timeouts
- Respuestas malformadas

## Spies: Espiar Funciones Reales

Los **spies** son similares a los mocks, pero con una diferencia clave: **ejecutan la implementación original** mientras registran las llamadas.

### ¿Cuándo usar spy vs mock?

**Use Mock cuando:**

- Quieres reemplazar completamente el comportamiento
- La función original tiene efectos secundarios
- La función es lenta o depende de recursos externos

**Use Spy cuando:**

- Quieres verificar que se llamó, pero ejecutar código real
- Necesitas verificar interacciones sin alterar comportamiento
- Estás testeando integración entre componentes

### Crear un spy

```typescript
// Espiar método de objeto
const spy = jest.spyOn(object, 'method');

// Ejecutar código real y verificar
object.method();
expect(spy).toHaveBeenCalled();

// Restaurar implementación original
spy.mockRestore();
```

### Ejemplo práctico con spy

```typescript
import * as mathUtils from '../math';

describe('Math with Spy', () => {
  it('debe espiar multiply', () => {
    // Crear spy - multiply sigue funcionando normalmente
    const multiplySpy = jest.spyOn(mathUtils, 'multiply');
    
    // Ejecutar función real
    const result = mathUtils.multiply(3, 4);
    
    // Verificar que se llamó
    expect(multiplySpy).toHaveBeenCalledWith(3, 4);
    
    // El resultado es real, no mockeado
    expect(result).toBe(12);
    
    // Limpiar
    multiplySpy.mockRestore();
  });
  
  it('puede mockear un spy temporalmente', () => {
    const multiplySpy = jest.spyOn(mathUtils, 'multiply');
    
    // Ahora sí mockeamos la implementación
    multiplySpy.mockReturnValue(999);
    
    const result = mathUtils.multiply(3, 4);
    expect(result).toBe(999); // Retorna valor mockeado
    
    // Restaurar para que vuelva a funcionar normalmente
    multiplySpy.mockRestore();
    
    expect(mathUtils.multiply(3, 4)).toBe(12); // Vuelve a funcionar
  });
});
```

### Spy en console para tests silenciosos

Un uso común de spies es silenciar `console.log` o `console.error` en tests:

```typescript
describe('Component with logs', () => {
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Espiar console.error y silenciarlo
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restaurar console.error original
    consoleErrorSpy.mockRestore();
  });
  
  it('maneja error sin ensuciar output', () => {
    // Código que llama console.error
    processData(invalidData);
    
    // Verificar que se loggeó el error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid data')
    );
  });
});
```

## Mockear Módulos Completos

Para dependencias más complejas, puedes mockear módulos enteros con `jest.mock()`.

### Mockear módulo automáticamente

```typescript
// Al inicio del archivo de test
jest.mock('../api');

import { fetchUserData } from '../api';

// Ahora fetchUserData es automáticamente un mock
(fetchUserData as jest.Mock).mockResolvedValue({ name: 'John' });
```

### Mockear módulo con implementación personalizada

```typescript
jest.mock('../api', () => ({
  fetchUserData: jest.fn().mockResolvedValue({ name: 'John' }),
  fetchUserPosts: jest.fn().mockResolvedValue([]),
}));
```

### Mock parcial (mantener algunas funciones reales)

```typescript
jest.mock('../mathUtils', () => ({
  ...jest.requireActual('../mathUtils'), // Mantener funciones reales
  expensiveCalculation: jest.fn().mockReturnValue(42), // Mockear solo esta
}));
```

## Best Practices

### 1. No mockear en exceso

```typescript
// ❌ Mal: Mockear todo hace tests menos valiosos
jest.mock('./utils');
jest.mock('./api');
jest.mock('./validators');
jest.mock('./helpers');

// ✅ Bien: Solo mockear dependencias externas
jest.mock('./api'); // Externa, lenta
// utils, validators, helpers se ejecutan realmente
```

### 2. Mockear en el nivel correcto

```typescript
// ❌ Mal: Mockear implementación interna
const component = { _privateMethod: jest.fn() };

// ✅ Bien: Mockear dependencias externas
jest.mock('axios');
```

### 3. Resetear mocks entre tests

```typescript
describe('Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Limpiar todos los mocks
  });
  
  // Tests...
});
```

### 4. Usar tipos para mocks en TypeScript

```typescript
import { fetchUserData } from '../api';

// ✅ Bien: Type-safe mocking
const mockFetchUserData = fetchUserData as jest.MockedFunction<typeof fetchUserData>;
mockFetchUserData.mockResolvedValue({ name: 'John' });
```

:::tip Regla de oro
Mockea dependencias **externas** y **lentas**. Ejecuta tu propio código cuando sea posible. Los tests que ejecutan código real son más valiosos que los que mockean todo.
:::
