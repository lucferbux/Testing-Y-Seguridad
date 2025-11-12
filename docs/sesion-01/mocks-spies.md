---
sidebar_position: 7
title: "Mocks y Spies"
---

El mocking es una técnica esencial en testing que nos permite aislar el código que estamos probando de sus dependencias externas. En esta sección profundizaremos en qué son los mocks, cuándo usarlos, y cómo implementarlos efectivamente con Jest usando ejemplos del proyecto **Taller-Testing-Security**.

## Contexto del Proyecto

En el proyecto Taller-Testing-Security encontramos varias dependencias que necesitan ser mockeadas:

- **localStorage**: Para gestión de tokens de autenticación
- **jwt-decode**: Librería externa para decodificar JWTs
- **fetch/API calls**: Llamadas HTTP al backend
- **Hooks de React**: useAuth, useToggle, etc.
- **Variables de entorno**: import.meta.env (Vite)

Estos son casos reales que encontrarás en cualquier aplicación moderna.

## ¿Qué son los Mocks?

Los mocks son **objetos o funciones simuladas** que reemplazan dependencias reales durante la ejecución de tests. Actúan como "dobles de prueba" que imitan el comportamiento de código real pero de forma controlada y predecible.

### ¿Por qué necesitamos mocks?

Imagina que estás testeando una función que:

1. Hace una petición HTTP a una API externa
2. Guarda datos en localStorage
3. Decodifica un JWT
4. Lee variables de entorno de Vite

Si ejecutas tests que hacen estas cosas realmente:

- ❌ **Lentos**: Operaciones I/O son órdenes de magnitud más lentas que código puro
- ❌ **Frágiles**: Dependen de servicios externos que pueden estar caídos
- ❌ **Impredecibles**: Respuestas pueden variar, haciendo tests no repetibles
- ❌ **Imposibles en Jest**: Cosas como `import.meta.env` no existen en Node.js
- ❌ **Efectos secundarios**: Pueden modificar datos reales

Con mocks, podemos:

- ✅ Ejecutar tests en milisegundos
- ✅ Tests completamente independientes de servicios externos
- ✅ Simular cualquier escenario (errores, timeouts, casos edge)
- ✅ Verificar que las dependencias se llaman correctamente
- ✅ Tests 100% repetibles y determinísticos

### Casos de uso en Taller-Testing-Security

#### 1. localStorage (ya visto en functions-testing.md)

```typescript
// En lugar de usar localStorage real (no existe en Jest)
localStorage.setItem('authToken', token);

// Mockeamos con un objeto simple
let localStorageMock = {};
Storage.prototype.setItem = jest.fn((key, value) => {
  localStorageMock[key] = value;
});
```

#### 2. jwt-decode (librería externa)

```typescript
// En lugar de decodificar JWTs reales
import jwt_decode from 'jwt-decode';
const payload = jwt_decode(token);

// Mockeamos para retornar payload controlado
jest.mock('jwt-decode', () => jest.fn(() => ({
  _id: '123',
  email: 'test@example.com',
  iat: 1609459200,
  exp: 1609545600,
})));
```

#### 3. Fetch API para llamadas HTTP

```typescript
// En lugar de hacer requests HTTP reales al backend
const response = await fetch(`${API_BASE_URI}/projects`);

// Mockeamos fetch para retornar datos de prueba
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => [{ _id: '1', title: 'Test Project' }]
});
```

#### 4. Hooks de React

```typescript
// En lugar de usar el contexto real de autenticación
import useAuth from '../../hooks/useAuth';
const { user } = useAuth();

// Mockeamos el hook completo
jest.mock('../../hooks/useAuth');
mockUseAuth.mockReturnValue({ 
  user: { _id: '1', email: 'test@test.com' },
  login: jest.fn(),
  logout: jest.fn()
});
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

## Ejemplo Real: Mockear fetch en API del Proyecto

Veamos un ejemplo realista del proyecto **Taller-Testing-Security** que hace llamadas HTTP al backend para obtener proyectos.

### Código: src/api/http-api-client.ts (simplificado)

```typescript
import { getAccessToken, removeAuthToken } from '../utils/auth';
import { Project } from '../model/project';

async function createApiError(response: Response): Promise<ApiError> {
  switch (response.status) {
    case 401:
      return new Unauthorized();
    case 404:
      return new NotFound();
    default:
      return new GenericError(response.status);
  }
}

const handleResponse = async <T>(func: () => Promise<T>): Promise<T> => {
  try {
    return await func();
  } catch (e) {
    if (e instanceof Unauthorized) {
      removeAuthToken();
      window.location.replace('/');
    }
    throw e;
  }
};

export default class HttpApiClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getProjects = (): Promise<Project[]> =>
    handleResponse(async () => {
      const response = await fetch(this.baseUrl + `/v1/projects/`, {
        method: 'GET',
        headers: {
          // Authorization header opcional
        }
      });
      if (!response.ok) {
        throw await createApiError(response);
      }
      return response.json();
    });

  async token(email: string, password: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      email: email,
      password: password
    });
    const response = await fetch(this.baseUrl + '/auth/login', {
      method: 'POST',
      body: body
    });
    if (!response.ok) {
      throw await createApiError(response);
    }
    return response.json();
  }
}
```

Esta clase es el cliente HTTP real del proyecto que:
- Hace peticiones `fetch` al backend
- Maneja autenticación con tokens
- Gestiona errores HTTP (401, 404, etc.)
- Retorna datos tipados de TypeScript

### Test: src/api/\__tests__/http-api-client.test.ts

```typescript
import HttpApiClient from '../http-api-client';
import { Project } from '../../model/project';
import * as auth from '../../utils/auth';

// Mock de fetch global
global.fetch = jest.fn();

// Mock del módulo auth
jest.mock('../../utils/auth');

describe('HttpApiClient', () => {
  let client: HttpApiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HttpApiClient('http://localhost:3000/api');
    
    // Mock de window.location.replace
    delete (window as any).location;
    window.location = { replace: jest.fn() } as any;
  });

  describe('getProjects', () => {
    it('debe retornar lista de proyectos exitosamente', async () => {
      const mockProjects: Project[] = [
        {
          _id: '1',
          title: 'Test Project 1',
          description: 'Description 1',
          version: 'v1.0',
          link: 'https://example.com',
          tag: 'React'
        },
        {
          _id: '2',
          title: 'Test Project 2',
          description: 'Description 2',
          version: 'v2.0',
          link: 'https://example2.com',
          tag: 'TypeScript'
        }
      ];

      // Mock de fetch con respuesta exitosa
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      } as Response);

      const result = await client.getProjects();

      // Verificar que fetch se llamó correctamente
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects/',
        {
          method: 'GET',
          headers: {}
        }
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verificar el resultado
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Test Project 1');
    });

    it('debe lanzar error 404 cuando no encuentra proyectos', async () => {
      // Mock de fetch con error 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(client.getProjects()).rejects.toThrow();
    });

    it('debe manejar error 401 y redirigir a login', async () => {
      // Mock de removeAuthToken
      const mockRemoveAuthToken = auth.removeAuthToken as jest.MockedFunction<
        typeof auth.removeAuthToken
      >;

      // Mock de fetch con error 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(client.getProjects()).rejects.toThrow();

      // Verificar que se llamó removeAuthToken
      expect(mockRemoveAuthToken).toHaveBeenCalled();
      
      // Verificar que se redirigió
      expect(window.location.replace).toHaveBeenCalledWith('/');
    });

    it('debe manejar errores de red', async () => {
      // Mock de fetch con error de red
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getProjects()).rejects.toThrow('Network error');
    });
  });

  describe('token (login)', () => {
    it('debe autenticar usuario exitosamente', async () => {
      const mockTokenResponse = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 3600
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await client.token('test@example.com', 'password123');

      // Verificar la llamada a fetch
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams)
        })
      );

      // Verificar que el body contiene email y password
      const call = mockFetch.mock.calls[0];
      const body = call[1]?.body as URLSearchParams;
      expect(body.get('email')).toBe('test@example.com');
      expect(body.get('password')).toBe('password123');

      expect(result).toEqual(mockTokenResponse);
    });

    it('debe lanzar error con credenciales incorrectas', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(
        client.token('wrong@example.com', 'wrongpass')
      ).rejects.toThrow();
    });
  });
});
```

### Análisis del Test Real

#### 1. Setup del entorno de testing

```typescript
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
  client = new HttpApiClient('http://localhost:3000/api');
});
```

**Por qué esto es importante:**

- Mockeamos `fetch` globalmente porque es una API del navegador
- Usamos type casting para obtener autocompletado de TypeScript
- Creamos una nueva instancia del cliente en cada test
- Limpiamos mocks para evitar contaminación entre tests

#### 2. Mock de window.location.replace

```typescript
delete (window as any).location;
window.location = { replace: jest.fn() } as any;
```

El código real hace `window.location.replace('/')` cuando hay error 401. En Jest (Node.js) `window.location` no existe, así que lo mockeamos.

**Patrón común**: Cuando el código usa APIs del navegador que no existen en Jest.

#### 3. Mock de respuesta HTTP completa

```typescript
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => mockProjects,
} as Response);
```

**Estructura del mock:**

- `ok: true` → Respuesta exitosa (status 200-299)
- `json: async () => ...` → Función que retorna los datos parseados
- `as Response` → Type assertion para TypeScript

Esto simula exactamente cómo funciona `fetch` real.

#### 4. Testing de diferentes escenarios HTTP

```typescript
// Éxito
mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data });

// Error 404
mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

// Error de red
mockFetch.mockRejectedValueOnce(new Error('Network error'));
```

**Cobertura completa**: Happy path + errores HTTP + errores de red.

#### 5. Verificación de llamadas con URLSearchParams

```typescript
const call = mockFetch.mock.calls[0];
const body = call[1]?.body as URLSearchParams;
expect(body.get('email')).toBe('test@example.com');
expect(body.get('password')).toBe('password123');
```

**Acceso a argumentos de llamadas:**

- `mockFetch.mock.calls[0]` → Primera llamada
- `call[1]` → Segundo argumento (options de fetch)
- `body as URLSearchParams` → Type casting para acceder a métodos

Esto verifica que el cuerpo de la petición se construyó correctamente.

#### 6. Testing de side effects (redirección)

```typescript
await expect(client.getProjects()).rejects.toThrow();

expect(mockRemoveAuthToken).toHaveBeenCalled();
expect(window.location.replace).toHaveBeenCalledWith('/');
```

No solo verificamos que lanza error, sino que también:
- Se eliminó el token de autenticación
- Se redirigió al usuario a la página de login

**Testing completo de comportamiento**: No solo el resultado, sino todos los efectos secundarios.

## Spies: Verificar sin Reemplazar

Los **spies** son diferentes a los mocks. Un spy **observa** una función sin reemplazar su implementación. Es como poner un micrófono para escuchar qué pasa, pero sin cambiar el comportamiento.

### Mock vs Spy: ¿Cuándo usar cada uno?

**Use Mock cuando:**

- Quieres reemplazar completamente el comportamiento
- La función original tiene efectos secundarios (API calls, localStorage)
- La función es lenta o depende de recursos externos
- Necesitas controlar exactamente qué retorna

**Use Spy cuando:**

- Quieres verificar que se llamó, pero ejecutar código real
- Necesitas verificar interacciones sin alterar comportamiento
- Estás testeando integración entre componentes
- Quieres verificar argumentos pero mantener lógica original

### Ejemplo Real: Spy en jwt_decode

En el proyecto Taller-Testing-Security usamos `jwt_decode` para decodificar JWTs. Veamos cómo usar un spy para verificar su uso sin mockearlo completamente.

```typescript
describe('setAuthToken con spy', () => {
  let decodeSpy: jest.SpyInstance;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Limpiar localStorage y mocks
    localStorage.clear();
    jest.clearAllMocks();
    
    // Spy en jwt_decode - podemos verificar llamadas Y ejecutar código real
    decodeSpy = jest.spyOn({ jwt_decode }, 'jwt_decode');
    
    // Mock de localStorage (sí necesita ser mockeado)
    localStorageMock = {};
    Storage.prototype.setItem = jest.fn((key, value) => {
      localStorageMock[key] = value;
    });
  });

  afterEach(() => {
    decodeSpy.mockRestore();
  });

  it('debe llamar jwt_decode con el token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTU0NTYwMH0.abc';
    
    // Limpiar el spy antes de la llamada para contar solo esta ejecución
    decodeSpy.mockClear();
    
    setAuthToken(token);
    
    // Verificar que jwt_decode se llamó con el token
    expect(decodeSpy).toHaveBeenCalledWith(token);
    expect(decodeSpy).toHaveBeenCalledTimes(1);
    
    // El spy ejecutó código real, así que localStorage tiene datos válidos
    const savedValue = localStorageMock[tokenKey];
    expect(savedValue).toBeDefined();
  });
});
```

### Spy temporal con mock

A veces quieres un spy que **temporalmente** cambia el comportamiento:

```typescript
describe('setAuthToken con spy mockeado', () => {
  it('puede mockear jwt_decode temporalmente', () => {
    // Crear spy y mockear su retorno
    const decodeSpy = jest.spyOn({ jwt_decode }, 'jwt_decode')
      .mockReturnValue({
        _id: 'test123',
        email: 'spy@example.com',
        iat: 1609459200,
        exp: 1609545600,
      });

    const token = 'any-token';
    setAuthToken(token);

    // Verificar que se llamó
    expect(decodeSpy).toHaveBeenCalledWith(token);

    // Restaurar comportamiento original
    decodeSpy.mockRestore();
  });
});
```

**Diferencia clave**: Con spy puedes alternar entre comportamiento real y mockeado. Con mock completo (`jest.mock()`), siempre está mockeado.

### Spy en console para tests silenciosos

Un uso muy común de spies es silenciar `console.log` o `console.error` en tests. Ya lo hicimos en `jest.setup.cjs`:

```javascript
// jest.setup.cjs
global.console = {
  ...console,
  error: jest.fn(),  // Spy que silencia errores
  warn: jest.fn(),   // Spy que silencia warnings
};
```

Esto es equivalente a:

```typescript
describe('Component with logs', () => {
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Espiar console.error y silenciarlo
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restaurar console.error original
    consoleErrorSpy.mockRestore();
  });
  
  it('maneja error sin ensuciar output', () => {
    // Código que llama console.error
    someFunction(); // Internamente hace console.error('Error!')
    
    // Verificar que se loggeó el error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error')
    );
    
    // Pero no vemos el error en el output del test
  });
});
```

**Beneficio**: Tests limpios sin spam de logs, pero aún podemos verificar que se llamaron.

## Mockear Módulos Completos con jest.mock()

Para dependencias más complejas, Jest permite mockear módulos enteros. Ya lo hemos usado varias veces en los ejemplos anteriores.

### Patrón 1: Mock automático (auto-mock)

```typescript
// Mock automático - todas las exports son jest.fn()
jest.mock('../utils/auth');

import { setAuthToken, removeAuthToken } from '../utils/auth';

// Ahora son funciones mockeadas vacías
expect(typeof setAuthToken).toBe('function');
expect(typeof removeAuthToken).toBe('function');
```

Jest reemplaza todas las exports con `jest.fn()`. Útil cuando solo quieres verificar llamadas sin implementación.

### Patrón 2: Mock manual con implementación

```typescript
// Mock con implementación personalizada
jest.mock('../utils/auth', () => ({
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
  isTokenActive: jest.fn(() => true),
  getAccessToken: jest.fn(() => 'mock-token'),
}));
```

Defines exactamente qué hace cada función. Lo usamos para `useAuth`:

```typescript
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Luego en cada test:
mockUseAuth.mockReturnValue({
  user: { _id: '1', email: 'test@test.com' },
  login: jest.fn(),
  logout: jest.fn()
});
```

### Patrón 3: Mock manual en __mocks__ folder

Ya lo hicimos con `config.ts`:

```
src/
  utils/
    config.ts              ← Archivo original
    __mocks__/
      config.ts            ← Mock manual
```

```typescript
// src/utils/__mocks__/config.ts
export const API_BASE_URI = 'http://localhost:3000/api';
```

```typescript
// En el test
jest.mock('../config');  // Automáticamente usa el archivo en __mocks__/
```

Jest busca primero en `__mocks__/` cuando usas `jest.mock()`.

### Patrón 4: Mock parcial (mantener algunas exports reales)

```typescript
jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),  // Mantener exports reales
  isTokenActive: jest.fn(() => false),      // Solo mockear esta
}));
```

Útil cuando solo necesitas mockear algunas funciones del módulo.

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
