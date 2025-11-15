---
sidebar_position: 4
title: "Testing de Custom Hooks"
---

# Testing de Custom Hooks

## Introducción

Los **custom hooks** son una de las características más poderosas de React. Nos permiten extraer lógica de componentes y reutilizarla en cualquier parte de nuestra aplicación. Sin embargo, esta reutilización trae un desafío importante: **¿cómo testeamos lógica que depende del ciclo de vida de React pero no es un componente visual?**

La respuesta es **React Hooks Testing Library**, una herramienta especializada que nos permite renderizar y testear hooks en aislamiento, sin necesidad de crear componentes dummy solo para probarlos. En esta sección aprenderemos a testear hooks desde los más simples (gestión de estado) hasta los más complejos (fetch de datos, efectos secundarios, integración con Context).

## ¿Por Qué Testear Hooks?

Los custom hooks encapsulan **lógica reutilizable** que puede ser crítica para tu aplicación. Imagina un hook `useAuth` que gestiona autenticación en 15 componentes diferentes. Si ese hook tiene un bug, **15 componentes fallan**. Por eso debemos testearlo independientemente.

### Ventajas de testear hooks por separado

1. **Aislamiento**: Testeamos la lógica pura sin interferencia de UI
2. **Reutilización de tests**: Un hook bien testeado da confianza en todos sus usos
3. **Debugging más fácil**: Si falla un test de hook, sabemos exactamente dónde está el problema
4. **Documentación**: Los tests muestran cómo usar el hook correctamente
5. **Refactoring seguro**: Podemos cambiar la implementación sin miedo a romper funcionalidad

### ¿Cuándo testear un hook como integración vs unitario?

| Escenario | Tipo de Test | Razón |
|-----------|--------------|-------|
| Hook puro (solo state) | Unitario | No depende de nada externo |
| Hook con Context | Integración | Necesita Provider real |
| Hook con fetch/API | Integración | Involucra efectos secundarios |
| Hook con localStorage | Integración | Interactúa con browser API |
| Hook que usa otros hooks | Integración | Verifica composición |

## React Hooks Testing Library

Para testear hooks necesitamos una librería especializada porque **no podemos llamar hooks directamente** en JavaScript regular (solo funcionan dentro de componentes React).

### Instalación

```bash
npm install --save-dev @testing-library/react-hooks
```

:::info Nota importante
A partir de **React Testing Library v13+**, `renderHook` está incluido en `@testing-library/react`, por lo que ya no necesitas instalar el paquete separado. Sin embargo, la API es la misma.
:::

### Conceptos clave

**`renderHook`**: Renderiza un hook en un componente test especial y retorna su resultado

```tsx
const { result } = renderHook(() => useCounter());
// result.current contiene el valor retornado por el hook
```

**`act`**: Envuelve actualizaciones de estado para simular el comportamiento de React

```tsx
act(() => {
  result.current.increment();
});
```

**`waitFor`**: Espera hasta que una condición se cumpla (útil para efectos asíncronos)

```tsx
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```



## Ejemplo Básico: useCounter Hook

Comenzamos con un hook simple para entender los conceptos fundamentales. `useCounter` es un hook que gestiona un contador con operaciones básicas: incrementar, decrementar, resetear y establecer un valor específico.

### ¿Por qué useCounter es un buen primer ejemplo?

- **Fácil de entender**: La lógica es simple y predecible
- **Introduce conceptos clave**: `renderHook`, `act`, `result.current`
- **Sin dependencias externas**: No hay API calls, Context ni efectos complejos
- **Útil en producción**: Muchas apps necesitan contadores (paginación, likes, carritos, etc.)

### Código: src/hooks/useCounter.ts

```typescript
import { useState, useCallback } from 'react';

export function useCounter(initialValue: number = 0) {
  // Estado interno del contador
  const [count, setCount] = useState(initialValue);

  // useCallback previene recreación innecesaria de funciones
  // Optimiza rendimiento si pasamos estas funciones como props
  const increment = useCallback(() => {
    setCount(c => c + 1); // Usamos función updater para evitar stale closures
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue); // Resetea al valor inicial, no a 0
  }, [initialValue]); // Dependencia: se recrea si initialValue cambia

  const setValue = useCallback((value: number) => {
    setCount(value);
  }, []);

  // Retornamos un objeto con estado y acciones
  return {
    count,
    increment,
    decrement,
    reset,
    setValue,
  };
}
```

### Análisis del diseño

Este hook demuestra **buenas prácticas**:

1. **Parámetro por defecto**: `initialValue = 0` hace el hook más flexible
2. **useCallback**: Optimiza rendimiento memorizando funciones
3. **Función updater**: `setCount(c => c + 1)` previene bugs de closures
4. **API consistente**: Todas las acciones siguen el mismo patrón
5. **TypeScript**: Tipos explícitos previenen errores

### Test: src/hooks/tests/useCounter.test.ts

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  
  it('debe iniciar con valor por defecto 0', () => {
    // renderHook ejecuta el hook y retorna un objeto con 'result'
    const { result } = renderHook(() => useCounter());
    
    // result.current contiene el valor actual retornado por el hook
    expect(result.current.count).toBe(0);
  });

  it('debe iniciar con valor inicial personalizado', () => {
    // Pasamos props al hook a través de la función
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('debe incrementar contador', () => {
    const { result } = renderHook(() => useCounter());
    
    // act() es necesario para cambios de estado
    // Garantiza que React procese el update antes de continuar
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('debe decrementar contador', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('debe resetear a valor inicial', () => {
    const { result } = renderHook(() => useCounter(10));
    
    // Podemos hacer múltiples acciones dentro de un solo act
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(12);
    
    // Ahora reseteamos
    act(() => {
      result.current.reset();
    });
    
    // Debe volver a 10 (el initial value), no a 0
    expect(result.current.count).toBe(10);
  });

  it('debe establecer valor específico', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.setValue(42);
    });
    
    expect(result.current.count).toBe(42);
  });

  it('debe manejar múltiples operaciones secuenciales', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment(); // 0 → 1
      result.current.increment(); // 1 → 2
      result.current.increment(); // 2 → 3
      result.current.decrement(); // 3 → 2
      result.current.setValue(10); // 2 → 10
    });
    
    expect(result.current.count).toBe(10);
  });
});
```

### Desglose de patrones de testing

#### 1. Estructura básica de test de hook

```tsx
// ✅ Patrón correcto
const { result } = renderHook(() => useCounter());
expect(result.current.count).toBe(0);

// ❌ NO puedes hacer esto
const counter = useCounter(); // Error: Hooks solo funcionan en componentes
```

#### 2. Cuándo usar `act`

```tsx
// ✅ Necesario: cuando cambias estado
act(() => {
  result.current.increment();
});

// ❌ NO necesario: cuando solo lees estado
expect(result.current.count).toBe(0); // Sin act, solo lectura
```

#### 3. Testear valores iniciales

```tsx
// Patrón: renderizar con diferentes props
const { result: result1 } = renderHook(() => useCounter(0));
const { result: result2 } = renderHook(() => useCounter(100));

expect(result1.current.count).toBe(0);
expect(result2.current.count).toBe(100);
```

:::tip Best Practice
Agrupa tests relacionados en describe blocks para mejor organización:

```tsx
describe('useCounter', () => {
  describe('initialization', () => {
    // Tests de valores iniciales
  });
  
  describe('increment/decrement', () => {
    // Tests de operaciones
  });
});
```
:::



## Ejemplo Avanzado: useFetch Hook

Ahora vamos a un caso más realista y complejo: un hook que hace fetching de datos desde una API. Este ejemplo introduce conceptos avanzados como:
- **Efectos secundarios** (useEffect)
- **Operaciones asíncronas** (fetch)
- **Manejo de errores** (try/catch)
- **Cleanup** (cancelación de requests)
- **Refetching** (recargar datos)

Este tipo de hook es **extremadamente común** en aplicaciones reales. Entender cómo testearlo te preparará para la mayoría de casos de uso que encontrarás.

### Código: src/hooks/useFetch.ts

```typescript
import { useState, useEffect } from 'react';

// Definimos la forma del resultado que retorna el hook
interface UseFetchResult<T> {
  data: T | null;        // Los datos obtenidos (null mientras carga)
  loading: boolean;      // Indica si está cargando
  error: Error | null;   // Error si hubo fallo (null si todo OK)
  refetch: () => void;   // Función para recargar datos
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Truco: incrementamos este índice para triggear refetch
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = () => {
    setRefetchIndex(prev => prev + 1);
  };

  useEffect(() => {
    // Flag para prevenir updates después de que el componente se desmonte
    let cancelled = false;

    setLoading(true);
    setError(null); // Limpiamos error anterior

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Solo actualizamos si el componente sigue montado
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    // Cleanup: marca como cancelado si el componente se desmonta
    // Esto previene el warning "Can't perform a React state update on an unmounted component"
    return () => {
      cancelled = true;
    };
  }, [url, refetchIndex]); // Re-ejecuta si cambia la URL o si llamamos refetch()

  return { data, loading, error, refetch };
}
```

### Análisis de patrones avanzados

Este hook demuestra **técnicas críticas** para hooks de producción:

#### 1. Manejo de Race Conditions

```tsx
let cancelled = false;

// ... fetch ...

if (!cancelled) {
  setData(data); // Solo actualiza si no se canceló
}

return () => {
  cancelled = true; // Marca como cancelado en cleanup
};
```

**¿Por qué importa?**: Si el componente se desmonta mientras el fetch está en progreso, intentar actualizar estado causaría un error. El flag `cancelled` lo previene.

#### 2. Estado de carga y errores

```tsx
// Antes de fetch
setLoading(true);
setError(null); // ¡Importante! Limpia errores previos

// Si hay error
setError(err);
setLoading(false);

// Si hay éxito
setData(data);
setLoading(false);
```

Esto permite mostrar **feedback visual preciso** al usuario: spinners, mensajes de error, etc.

#### 3. Refetch pattern

```tsx
const [refetchIndex, setRefetchIndex] = useState(0);

const refetch = () => {
  setRefetchIndex(prev => prev + 1); // Incrementa para triggear useEffect
};

useEffect(() => {
  // ... fetch ...
}, [url, refetchIndex]); // Dependencia en refetchIndex
```

Elegante solución para refrescar datos sin necesidad de props o Context adicional.

### Test: src/hooks/tests/useFetch.test.ts

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

// Mock global fetch - reemplazamos fetch del navegador con una versión mockeada
global.fetch = jest.fn();

describe('useFetch', () => {
  
  // Limpiamos el mock antes de cada test para evitar interferencias
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('debe retornar datos exitosamente', async () => {
    // Preparamos datos mock
    const mockData = { id: 1, name: 'Test' };
    
    // Configuramos fetch para retornar estos datos
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch('/api/test'));

    // Estado inicial: loading true, data null
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    // Esperamos a que termine el fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificamos que tenemos los datos
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar errores de red', async () => {
    // Simulamos un error de red (fetch rechazado)
    const mockError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useFetch('/api/test'));

    // Esperamos a que termine (con error)
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verificamos que tenemos el error
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
  });

  it('debe manejar errores HTTP', async () => {
    // Simulamos un 404 (fetch exitoso pero respuesta con error)
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useFetch('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Debe haber un error con información del status
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('404');
  });

  it('debe permitir refetch', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };

    // Configuramos fetch para retornar datos diferentes en cada llamada
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });

    const { result } = renderHook(() => useFetch('/api/test'));

    // Primera carga
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Llamamos refetch
    act(() => {
      result.current.refetch();
    });

    // Segunda carga - debe tener datos nuevos
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    // Verificamos que fetch se llamó dos veces
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('debe actualizar cuando cambia la URL', async () => {
    const mockData1 = { id: 1, name: 'First' };
    const mockData2 = { id: 2, name: 'Second' };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData2,
      });

    // Renderizamos con URL inicial
    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: '/api/test1' } }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Cambiamos la URL
    rerender({ url: '/api/test2' });

    // Debe fetchar con la nueva URL
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(fetch).toHaveBeenCalledWith('/api/test1');
    expect(fetch).toHaveBeenCalledWith('/api/test2');
  });

  it('debe limpiar estado al desmontar', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    // Creamos una Promise que controlamos manualmente
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });
    
    (fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    const { result, unmount } = renderHook(() => useFetch('/api/test'));

    // Verificamos que está loading
    expect(result.current.loading).toBe(true);

    // Desmontamos ANTES de que termine el fetch
    unmount();

    // Ahora resolvemos el fetch (simula respuesta tardía)
    resolveFetch!({
      ok: true,
      json: async () => mockData,
    });

    // Esperamos un poco para asegurar que no hay updates
    await new Promise(resolve => setTimeout(resolve, 100));

    // Si hubo cleanup correcto, no hubo errores en consola
    // (No podemos verificar directamente, pero el test pasará sin warnings)
  });
});
```

### Técnicas clave de este test

#### 1. Mockear fetch global

```tsx
global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockClear(); // Limpia calls anteriores
});
```

Esto reemplaza la función nativa `fetch` con una versión controlable.

#### 2. Simular respuestas diferentes

```tsx
// Respuesta exitosa
(fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => mockData,
});

// Error de red
(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

// Error HTTP
(fetch as jest.Mock).mockResolvedValueOnce({
  ok: false,
  status: 404,
});
```

#### 3. Testear cambios de props con `rerender`

```tsx
const { result, rerender } = renderHook(
  ({ url }) => useFetch(url),
  { initialProps: { url: '/api/test1' } }
);

// Cambiamos props
rerender({ url: '/api/test2' });
```

Esto simula cuando un componente recibe nuevas props y el hook debe reaccionar.

#### 4. Verificar cleanup con `unmount`

```tsx
const { unmount } = renderHook(() => useFetch('/api/test'));

// Desmontamos antes de que termine el fetch
unmount();

// Verificamos que no hay memory leaks ni warnings
```

:::warning Errores comunes
1. **No usar `waitFor` con operaciones asíncronas**: Los tests fallan intermitentemente
2. **No limpiar mocks entre tests**: Un test afecta a otro
3. **No testear edge cases**: (error después de éxito, múltiples refetch, etc.)
4. **No verificar estado de loading**: Solo testeas el resultado final, no el proceso
:::

## Resumen: Hooks Testing Best Practices

| Práctica | Razón | Ejemplo |
|----------|-------|---------|
| Usar `renderHook` | Hooks solo funcionan en componentes | `const { result } = renderHook(() => useCounter())` |
| Usar `act` para updates | Sincroniza updates de React | `act(() => { result.current.increment() })` |
| Usar `waitFor` para async | Espera a que se resuelvan Promises | `await waitFor(() => expect(...))` |
| Mockear dependencias externas | Aísla lógica del hook | `global.fetch = jest.fn()` |
| Limpiar mocks con `beforeEach` | Previene interferencia entre tests | `(fetch as jest.Mock).mockClear()` |
| Testear edge cases | Encuentra bugs ocultos | Error después de éxito, unmount durante fetch |
| Usar `rerender` para cambios | Simula props changes | `rerender({ newProp: 'value' })` |

:::tip Próximo paso
En la siguiente sección veremos cómo testear **integraciones con APIs reales** usando **Mock Service Worker (MSW)** para crear mocks más sofisticados y realistas.
:::

