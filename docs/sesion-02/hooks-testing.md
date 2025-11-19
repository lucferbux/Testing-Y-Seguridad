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

Para testear hooks necesitamos una librería especializada porque **no podemos llamar hooks directamente** en JavaScript regular (solo funcionan dentro de componentes React), para ello usaremos `renderHook` dentro de `react-testing-library`.

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



## Análisis de Hooks del Proyecto: Taller-Testing-Security

Vamos a testear los custom hooks reales del proyecto **Taller-Testing-Security** ubicados en `ui/src/hooks/`. Este proyecto tiene 5 hooks personalizados:

### Estructura de Hooks del Proyecto

```
ui/src/hooks/
├── useAuth.ts                    # Hook para acceder a AuthContext
├── useProject.ts                 # Hook para acceder a ProjectContext  
├── useFetchData.ts               # Hook genérico para fetch de datos
├── useCreateOrUpdateProject.ts   # Hook para crear/actualizar proyectos
└── useToogle.ts                  # Hook para toggle de boolean
```

**Complejidad por tipo**:

| Hook | Tipo | Depende de | Complejidad |
|------|------|-----------|-------------|
| `useAuth` | Context wrapper | AuthContext | Baja |
| `useProject` | Context wrapper | ProjectContext | Baja |
| `useToogle` | State management | Ninguno | Baja |
| `useFetchData` | Async + Effects | API fetch | Media |
| `useCreateOrUpdate` | Async + State | API mutation | Media |

### React Hooks Testing Library

Para testear hooks necesitamos `renderHook` que está incluido en React Testing Library v13+:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Conceptos Clave

**`renderHook`**: Renderiza un hook en un componente test especial

```tsx
const { result } = renderHook(() => useAuth());
// result.current contiene el valor retornado por el hook
```

**`act`**: Envuelve actualizaciones de estado

```tsx
act(() => {
  result.current.toggle();
});
```

**`waitFor`**: Espera hasta que una condición se cumpla (útil para async)

```tsx
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```



## Ejemplo 1: useAuth Hook (Context Wrapper)

Comenzamos con el hook más simple: `useAuth` solo accede a `AuthContext` y valida que se use dentro del Provider.

### Código Real: ui/src/hooks/useAuth.ts

```typescript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
```

**Qué hace**:
- Accede a `AuthContext` con `useContext`
- Valida que el hook se use dentro de `<AuthProvider>`
- Retorna el context completo (user, login, logout, etc.)

### ¿Por Qué es un Buen Primer Ejemplo?

- **Simple**: Solo 4 líneas de lógica
- **Patrón común**: Casi todos los proyectos tienen wrappers de Context
- **Introduce testing con Provider**: Necesitamos mockear el Context
- **Validación de errores**: Testea el error cuando falta el Provider

### Test: ui/src/hooks/__tests__/useAuth.test.tsx

```typescript
import { renderHook } from '@testing-library/react';
import useAuth from '../useAuth';
import AuthContext from '../../context/AuthContext';
import { ReactNode } from 'react';

jest.mock('../../api/api-client-factory');

describe('useAuth', () => {
  it('debe retornar el contexto de autenticación', () => {
    // Mock del valor del context
    const mockContextValue = {
      user: { _id: '1', email: 'test@example.com', active: true },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      loadUser: jest.fn()
    };

    // Wrapper que provee el Context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    // Renderizar hook con el wrapper
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verificar que retorna el context completo
    expect(result.current).toEqual(mockContextValue);
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('debe lanzar error si se usa fuera del AuthProvider', () => {
    // Sin wrapper (sin Provider)
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
```

### Análisis del Test

#### 1. **Testing con Wrapper Provider**

```typescript
// ✅ Patrón correcto para hooks que usan Context
const wrapper = ({ children }) => (
  <AuthContext.Provider value={mockValue}>
    {children}
  </AuthContext.Provider>
);

const { result } = renderHook(() => useAuth(), { wrapper });
```

**Por qué funciona**: `renderHook` acepta una opción `wrapper` que envuelve el hook en un componente. Esto simula el Provider real.

#### 2. **Testing de Validación de Errores**

```typescript
// ✅ Verificar que lanza error
expect(() => {
  renderHook(() => useAuth());
}).toThrow('useAuth must be used within an AuthProvider');
```

**Por qué es importante**: Previene bugs difíciles de debuggear cuando alguien usa el hook fuera del Provider.

#### 3. **Mock del Context Value**

```typescript
const mockContextValue = {
  user: { id: '1', email: 'test@example.com' },
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  loadUser: jest.fn()
};
```

**Ventajas**:

- Control total sobre el estado del context
- Podemos verificar que las funciones se llaman correctamente
- No dependemos de la implementación real del AuthContext

## Ejemplo 2: useFetchData Hook (Async + Effects)

Ahora vamos a un caso más complejo: un hook genérico que hace fetch de datos con manejo de loading, errores y recarga.

### Código Real: ui/src/hooks/useFetchData.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { GenericError } from '../api/api-client';

type FetchDataResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | GenericError | null;
  reload: () => void;
};

export default function useFetchData<T>(
  fetchFunction: () => Promise<T>
): FetchDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | GenericError | null>(null);
  const [reloadCount, setReloadCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchFunction();
        setData(result);
      } catch (err) {
        if (err instanceof GenericError || err instanceof Error) {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchFunction, reloadCount]);

  const reload = useCallback(() => {
    setReloadCount((prevCount) => prevCount + 1);
  }, []);

  return { data, isLoading, error, reload };
}
```

**Características**:
- **Genérico**: Funciona con cualquier tipo de datos `<T>`
- **Loading state**: `isLoading` mientras hace fetch
- **Error handling**: Captura errores de la API
- **Reload**: Función para refetch manual
- **useEffect**: Se ejecuta automáticamente y cuando cambia `reloadCount`

### Test: ui/src/hooks/\_\_tests\_\_/useFetchData.test.tsx

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';
import { GenericError } from '../../api/api-client';

describe('useFetchData', () => {
  it('debe cargar datos exitosamente', async () => {
    // Mock de función fetch que retorna datos
    const mockFetch = jest.fn().mockResolvedValue({
      id: 1,
      title: 'Test Project'
    });

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Estado inicial: loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Esperar a que termine el fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar datos cargados
    expect(result.current.data).toEqual({
      id: 1,
      title: 'Test Project'
    });
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('debe manejar errores de fetch', async () => {
    // Mock que falla
    const mockError = new Error('Network error');
    const mockFetch = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verificar estado de error
    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('debe manejar GenericError de la API', async () => {
    const genericError = new GenericError('API error', 500);
    const mockFetch = jest.fn().mockRejectedValue(genericError);

    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(genericError);
  });

  it('debe permitir recargar datos con reload()', async () => {
    let callCount = 0;
    const mockFetch = jest.fn().mockImplementation(async () => {
      callCount++;
      return { id: callCount, title: `Project ${callCount}` };
    });

    const { result } = renderHook(() => useFetchData(mockFetch));

    // Primera carga
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ id: 1, title: 'Project 1' });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Recargar
    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2, title: 'Project 2' });
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

### Análisis del Test

#### 1. **Testing de Estados Asíncronos con waitFor**

```typescript
// Estado inicial
expect(result.current.isLoading).toBe(true);

// Esperar a que termine
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

**Por qué `waitFor`**: Los hooks con `useEffect` y operaciones async no actualizan el estado instantáneamente. `waitFor` reintentalas assertion hasta que pase o timeout.

#### 2. **Mock de Funciones Async**

```typescript
// ✅ Mock que resuelve exitosamente
const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });

// ✅ Mock que falla
const mockFetch = jest.fn().mockRejectedValue(new Error('Failed'));

// ✅ Mock con lógica dinámica
const mockFetch = jest.fn().mockImplementation(async () => {
  callCount++;
  return { id: callCount };
});
```

#### 3. **Testing de Reload/Refetch**

```typescript
// Primera carga
await waitFor(() => expect(result.current.isLoading).toBe(false));

// Trigger reload
act(() => {
  result.current.reload();
});

// Verificar segunda carga
await waitFor(() => {
  expect(result.current.data).toEqual(newData);
});
```

**Patrón importante**: `act()` para ejecutar la función + `waitFor()` para esperar el efecto.



## Ejemplo 3: useCreateOrUpdate Hook (Mutations)

Ahora vamos a testear un hook para **mutaciones** (crear/actualizar datos), que tiene un patrón diferente a fetch de datos.

### Código Real: ui/src/hooks/useCreateOrUpdateProject.ts

```typescript
import { useState, useCallback } from 'react';
import { ProjectResponse } from '../api/api-client';

type UpdateResult<T> = {
  createOrUpdate: (data: T, errorMessage?: string) => Promise<void>;
  status: Status;
  error: Error | undefined;
};

type Status = 'success' | 'loading' | undefined;

export function useCreateOrUpdate<T>(
  createOrUpdateFunction: (data: T) => Promise<ProjectResponse>
): UpdateResult<T> {
  const [status, setStatus] = useState<Status>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const createOrUpdate = useCallback(
    async (data: T, errorMessage?: string) => {
      // Validación temprana con error custom
      if (errorMessage) {
        setError(new Error(errorMessage));
        return;
      }

      setStatus('loading');
      try {
        await createOrUpdateFunction(data);
        setStatus('success');
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Unknown error'));
        }
        setStatus(undefined);
      }
    },
    [createOrUpdateFunction]
  );

  return { createOrUpdate, status, error };
}
```

**Características**:
- **Mutations**: Para crear/actualizar, no para fetch
- **Status tracking**: `loading` → `success` o `undefined` (si error)
- **Error handling**: Maneja errores de la API y custom
- **useCallback**: Memoriza la función para evitar recreaciones

### Test: ui/src/hooks/\_\_tests\_\_/useCreateOrUpdate.test.tsx

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCreateOrUpdate } from '../useCreateOrUpdateProject';
import { ProjectResponse } from '../../api/api-client';

describe('useCreateOrUpdate', () => {
  it('debe crear/actualizar exitosamente', async () => {
    const mockResponse: ProjectResponse = {
      _id: '123',
      title: 'New Project',
      description: 'Test'
    };

    const mockFunction = jest.fn().mockResolvedValue(mockResponse);

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    // Estado inicial
    expect(result.current.status).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Ejecutar mutation
    await act(async () => {
      await result.current.createOrUpdate({
        title: 'New Project',
        description: 'Test'
      });
    });

    // Verificar resultado
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeUndefined();
    expect(mockFunction).toHaveBeenCalledWith({
      title: 'New Project',
      description: 'Test'
    });
  });

  it('debe establecer status "loading" durante la operación', async () => {
    // Mock con delay para ver el loading state
    const mockFunction = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    // Iniciar operación sin esperar
    act(() => {
      result.current.createOrUpdate({ title: 'Test' });
    });

    // Verificar loading inmediatamente
    expect(result.current.status).toBe('loading');

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });

  it('debe manejar errores de la API', async () => {
    const mockError = new Error('API Error');
    const mockFunction = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    await act(async () => {
      await result.current.createOrUpdate({ title: 'Test' });
    });

    expect(result.current.status).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it('debe manejar errorMessage custom', async () => {
    const mockFunction = jest.fn();

    const { result } = renderHook(() => 
      useCreateOrUpdate(mockFunction)
    );

    await act(async () => {
      await result.current.createOrUpdate(
        { title: 'Test' },
        'Custom validation error'
      );
    });

    // No debe llamar la función si hay errorMessage
    expect(mockFunction).not.toHaveBeenCalled();
    expect(result.current.error?.message).toBe('Custom validation error');
    expect(result.current.status).toBeUndefined();
  });
});
```

### Análisis del Test

#### 1. **Testing de Mutations vs Queries**

```typescript
// Queries (useFetchData): Se ejecutan automáticamente
const { result } = renderHook(() => useFetchData(mockFetch));
// Ya está fetching...

// Mutations (useCreateOrUpdate): Se ejecutan manualmente
const { result } = renderHook(() => useCreateOrUpdate(mockFn));
await act(async () => {
  await result.current.createOrUpdate(data); // Manual
});
```

#### 2. **Testing de Loading State**

```typescript
// Mock con delay para capturar loading
const mockFunction = jest.fn().mockImplementation(
  () => new Promise(resolve => setTimeout(() => resolve({}), 100))
);

// Ejecutar sin await
act(() => {
  result.current.createOrUpdate(data);
});

// Verificar loading inmediatamente
expect(result.current.status).toBe('loading');
```

#### 3. **Testing de Validación Custom**

```typescript
await act(async () => {
  await result.current.createOrUpdate(
    data,
    'Custom validation error' // Segundo parámetro
  );
});

expect(mockFunction).not.toHaveBeenCalled();
expect(result.current.error?.message).toBe('Custom validation error');
```



## Resumen

En esta sección aprendimos a testear custom hooks del proyecto Taller-Testing-Security:

1. **useAuth**: Hook wrapper de Context con validación de Provider
2. **useFetchData**: Hook genérico para fetch con loading/error states
3. **useCreateOrUpdate**: Hook para mutations (crear/actualizar)

### Conceptos Clave

- **renderHook**: Ejecuta hooks en aislamiento
- **act**: Envuelve actualizaciones de estado
- **waitFor**: Espera condiciones asíncronas
- **Wrapper Provider**: Necesario para hooks que usan Context
- **Mock de funciones async**: `mockResolvedValue` y `mockRejectedValue`

### Patrones de Testing

| Patrón | Cuándo Usar | Ejemplo |
|--------|-------------|---------|
| `renderHook` básico | Hooks sin Context | `useToggle`, `useCounter` |
| `renderHook` con wrapper | Hooks con Context | `useAuth`, `useProject` |
| `waitFor` + async | Hooks con useEffect | `useFetchData` |
| `act` + async | Mutations manuales | `useCreateOrUpdate` |
| Mock con delay | Testear loading state | `setTimeout` en mock |

:::tip Best Practices

1. **Testea el comportamiento, no la implementación**: Verifica qué retorna el hook, no cómo lo hace internamente
2. **Usa waitFor para async**: Nunca uses `setTimeout` en tests
3. **Mock las dependencias**: API calls, Context values, etc.
4. **Testea edge cases**: Errores, loading states, datos vacíos
5. **Agrupa tests**: Usa `describe` blocks para organización

:::

:::info Próximo paso

En la siguiente sección veremos **testing de Context** completo, incluyendo AuthContext y ProjectContext del proyecto.

:::

