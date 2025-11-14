---
sidebar_position: 5
title: "Testing de Funciones"
---

El testing unitario de funciones es la base de una suite de tests sólida. En esta sección aprenderemos a testear diferentes tipos de funciones del proyecto **Taller-Testing-Security**, desde funciones puras simples hasta funciones que interactúan con localStorage y decodifican JWTs.

## Contexto: Módulo auth.ts

El archivo `src/utils/auth.ts` del proyecto contiene la lógica de autenticación de la aplicación. Incluye funciones para:

- Guardar y recuperar tokens JWT
- Decodificar tokens
- Validar expiración de tokens
- Gestionar el estado de autenticación

Estas funciones son **críticas** para la seguridad de la aplicación, por lo que es esencial testearlas exhaustivamente.

:::warning Nota sobre import.meta en Jest
El proyecto usa Vite, que utiliza `import.meta.env` para variables de entorno. Jest no puede transformar esta sintaxis directamente. Para testear módulos que usan `import.meta.env`, debemos crear mocks manuales en `src/utils/__mocks__/`.

**Ejemplo**: Para testear `config.ts`, creamos `src/utils/__mocks__/config.ts`:

```typescript
// Mock del módulo config.ts para tests
export const API_BASE_URI = 'http://localhost:3000/api';
```

Luego en el test usamos `jest.mock('../config')` para cargar el mock automáticamente.
:::

## Ejemplo 1: Testing de Configuración Simple

Empecemos con algo sencillo: testear el módulo de configuración que expone la URL de la API.

### Código: src/utils/config.ts

```typescript
const baseUrl = import.meta.env.VITE_BASE_URI;
let apiBaseUrl = import.meta.env.VITE_API_URI;

if (baseUrl) {
  apiBaseUrl = baseUrl + '/_/api';
}

export const API_BASE_URI = apiBaseUrl;
```

Esta es una función muy simple que lee variables de entorno y exporta una constante. Aunque simple, es importante testearla porque toda la aplicación depende de ella para hacer llamadas a la API.

### Test: `src/utils/__tests__/config.test.ts`

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

### Análisis del test

#### jest.mock('../config')

Esta línea es crucial. Le dice a Jest que use el mock manual de `config.ts` en lugar del archivo real. El mock está en `src/utils/__mocks__/config.ts` y exporta valores fijos para testing.

**¿Por qué necesitamos esto?**

- `import.meta.env` es específico de Vite y no funciona en Jest (entorno Node.js)
- ts-jest no puede transformar `import.meta` correctamente
- El mock nos da control total sobre los valores en tests

#### expect.toBeDefined()

```typescript
expect(API_BASE_URI).toBeDefined();
```

Verifica que la exportación existe. Es útil para detectar:

- Typos en nombres de exports
- Problemas de importación
- Configuración incorrecta del módulo

#### Testing de valores exactos

```typescript
expect(API_BASE_URI).toBe('http://localhost:3000/api');
```

Verificamos el valor exacto que definimos en el mock. Esto asegura que:

- El mock se está cargando correctamente  
- La configuración de Jest funciona
- Otros tests pueden confiar en esta URL

:::tip Ventaja del mock manual
Al usar un mock manual, todos los tests que importen `config.ts` usarán automáticamente los valores mockeados. No necesitas mockear en cada archivo de test.
:::

## Ejemplo 2: Testing con localStorage y jwt-decode

Ahora vamos a testear funciones más complejas que tienen **dependencias externas**: localStorage para persistencia y jwt-decode para decodificar tokens.

### Código: src/utils/auth.ts

```typescript
import jwt_decode from 'jwt-decode';

interface Token {
  accessToken: string;
  notBeforeTimestampInMillis: number;
  expirationTimestampInMillis: number;
}

interface JWTPayload {
  _id: string;
  email: string;
  iat: number; // issued at (segundos)
  exp: number; // expiration (segundos)
}

export function setAuthToken(accessToken: string) {
  const tokenPayload = jwt_decode<JWTPayload>(accessToken);
  const token: Token = {
    accessToken: accessToken,
    notBeforeTimestampInMillis: tokenPayload.iat * 1000, // Convertir a milisegundos
    expirationTimestampInMillis: tokenPayload.exp * 1000
  };
  localStorage.setItem('authToken', JSON.stringify(token));
}

export function removeAuthToken() {
  localStorage.removeItem('authToken');
}
```

### Test: src/utils/\__tests__/auth.test.ts

```typescript
import { setAuthToken, removeAuthToken } from '../auth';
import { tokenKey } from '../../constants/config';

// Mock de jwt-decode
jest.mock('jwt-decode', () => {
  return jest.fn(() => ({
    _id: '123456',
    email: 'test@example.com',
    iat: 1609459200, // 2021-01-01 00:00:00 UTC (segundos)
    exp: 1609545600, // 2021-01-02 00:00:00 UTC (segundos)
  }));
});

describe('auth.ts - Utilidades de autenticación', () => {
  // Mock de localStorage
  let localStorageMock: { [key: string]: string };
  
  beforeEach(() => {
    // Crear un objeto para simular localStorage
    localStorageMock = {};

    // Mockear métodos de localStorage
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  describe('setAuthToken', () => {
    it('debe guardar el token en localStorage', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setAuthToken(mockToken);

      // Verificar que setItem fue llamado
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        tokenKey,
        expect.any(String)
      );
    });

    it('debe convertir timestamps de segundos a milisegundos', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      setAuthToken(mockToken);

      const savedValue = localStorageMock[tokenKey];
      const parsedToken = JSON.parse(savedValue);

      // JWT usa timestamps en segundos, debemos convertir a milisegundos
      // Verificar que el número es razonable (timestamp en milisegundos es mucho mayor)
      expect(parsedToken.notBeforeTimestampInMillis).toBeGreaterThan(1000000000000);
      expect(parsedToken.expirationTimestampInMillis).toBeGreaterThan(1000000000000);
    });
  });

  describe('removeAuthToken', () => {
    it('debe eliminar el token de localStorage', () => {
      // Primero guardamos un token
      localStorage.setItem(tokenKey, JSON.stringify({
        accessToken: 'test-token',
        notBeforeTimestampInMillis: Date.now(),
        expirationTimestampInMillis: Date.now() + 3600000,
      }));

      expect(localStorage.getItem(tokenKey)).toBeTruthy();

      // Removemos el token
      removeAuthToken();

      expect(localStorage.getItem(tokenKey)).toBeNull();
    });

    it('debe funcionar aunque no haya token', () => {
      expect(localStorage.getItem(tokenKey)).toBeNull();

      // No debe lanzar error
      expect(() => removeAuthToken()).not.toThrow();
    });
  });

});
```

### Análisis del test

#### Testing de constantes exportadas

Aunque `API_BASE_URI` es solo una constante, testearla es útil porque:

- Verifica que la configuración de jest.setup.js funciona correctamente
- Documenta qué valor se espera en tests
- Detecta si alguien cambia accidentalmente la lógica de configuración

#### Uso de toBeDefined() y toBe()

```typescript
expect(API_BASE_URI).toBeDefined();
expect(typeof API_BASE_URI).toBe('string');
```

Primero verificamos que existe, luego que es del tipo correcto. Esto es útil para detectar errores de configuración temprano.

#### Validación con regex

```typescript
expect(API_BASE_URI).toMatch(/^https?:\/\//);
```

El matcher `toMatch()` acepta expresiones regulares, permitiendo validar formatos complejos como URLs.

## Ejemplo 3: Testing de Validación de Tokens

En este ejemplo vamos a testear la función `isTokenActive()` del archivo `src/utils/auth.ts`, que verifica si un token JWT es válido comprobando sus timestamps de expiración y activación.

### Función a testear

```typescript
// src/utils/auth.ts
function isTokenActive(): boolean {
  const token = getToken();
  const currentTimestamp = Date.now();

  return !!(
    token &&
    token.expirationTimestampInMillis - currentTimestamp > 0 &&
    token.notBeforeTimestampInMillis <= currentTimestamp
  );
}
```

Esta función:

1. Obtiene el token del localStorage
2. Comprueba que el token exista
3. Verifica que no haya expirado (`expirationTimestampInMillis > ahora`)
4. Verifica que ya esté activo (`notBeforeTimestampInMillis <= ahora`)

### Test: src/utils/\__tests__/auth-validation.test.ts

```typescript
describe('isTokenActive', () => {
  let localStorageMock: { [key: string]: string };
  const FIXED_TIME = 1609459200000; // 2021-01-01 00:00:00 UTC (milisegundos)

  beforeEach(() => {
    // Limpiar mocks primero
    jest.clearAllMocks();
    
    // Mock completo de localStorage
    localStorageMock = {};
    
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });

    // Mockear Date.now() DESPUÉS de clearAllMocks para evitar condiciones de carrera
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
  });

  afterEach(() => {
    // Restaurar Date.now()
    jest.restoreAllMocks();
  });

  it('debe retornar false cuando no hay token', () => {
    // localStorage vacío
    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar true cuando el token es válido', () => {
    // Token válido: activo y no expirado
    const validToken = {
      accessToken: 'valid-token',
      notBeforeTimestampInMillis: FIXED_TIME - 3600000, // Activo desde hace 1 hora
      expirationTimestampInMillis: FIXED_TIME + 3600000, // Expira en 1 hora
    };

    localStorageMock[tokenKey] = JSON.stringify(validToken);

    expect(isTokenActive()).toBe(true);
  });

  it('debe retornar false cuando el token ha expirado', () => {
    // Token expirado
    const expiredToken = {
      accessToken: 'expired-token',
      notBeforeTimestampInMillis: FIXED_TIME - 7200000, // Activo desde hace 2 horas
      expirationTimestampInMillis: FIXED_TIME - 3600000, // Expiró hace 1 hora
    };

    localStorageMock[tokenKey] = JSON.stringify(expiredToken);

    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar false cuando el token aún no está activo', () => {
    // Token que será activo en el futuro
    const futureToken = {
      accessToken: 'future-token',
      notBeforeTimestampInMillis: FIXED_TIME + 3600000, // Se activa en 1 hora
      expirationTimestampInMillis: FIXED_TIME + 7200000, // Expira en 2 horas
    };

    localStorageMock[tokenKey] = JSON.stringify(futureToken);

    expect(isTokenActive()).toBe(false);
  });

  it('debe retornar true cuando el token está en el límite de expiración', () => {
    // Token que expira en 1 milisegundo (edge case)
    const aboutToExpireToken = {
      accessToken: 'about-to-expire',
      notBeforeTimestampInMillis: FIXED_TIME - 3600000,
      expirationTimestampInMillis: FIXED_TIME + 1, // Expira en 1ms
    };

    localStorageMock[tokenKey] = JSON.stringify(aboutToExpireToken);

    expect(isTokenActive()).toBe(true);
  });

  it('debe retornar true cuando el token acaba de activarse', () => {
    // Token recién activado (edge case)
    const justActivatedToken = {
      accessToken: 'just-activated',
      notBeforeTimestampInMillis: FIXED_TIME, // Activado justo ahora
      expirationTimestampInMillis: FIXED_TIME + 3600000,
    };

    localStorageMock[tokenKey] = JSON.stringify(justActivatedToken);

    expect(isTokenActive()).toBe(true);
  });
});
```

### Análisis detallado del test

#### Testing de lógica temporal

```typescript
it('debe retornar false cuando el token ha expirado', () => {
  const now = Date.now();
  const expiredToken = {
    expirationTimestampInMillis: now - 3600000, // Expiró hace 1 hora
  };
  // ...
});
```

Para testear lógica con tiempo:

- **Usamos `Date.now()`** como referencia
- **Calculamos timestamps relativos** (now + X, now - X)
- **Probamos casos límite**: justo antes/después de expirar

#### Testing de condiciones booleanas compuestas

```typescript
return !!(
  token &&
  token.expirationTimestampInMillis - currentTimestamp > 0 &&
  token.notBeforeTimestampInMillis <= currentTimestamp
);
```

Esta función tiene 3 condiciones AND. Para testearla completamente necesitamos:

1. **Token null/undefined** → false
2. **Token expirado** → false
3. **Token no activo aún** → false
4. **Token válido** → true

Cada test aísla una condición específica.

#### Edge Cases importantes

```typescript
it('debe retornar true cuando el token está en el límite de expiración', () => {
  // Expira en 1 segundo
  expirationTimestampInMillis: now + 1000
});
```

Los **edge cases** son valores límite que pueden exponer bugs:

- Token que expira en 1ms
- Token que se activa en el mismo momento
- Token con timestamps exactamente iguales

#### Cobertura completa de branches

Para lograr 100% de cobertura en esta función, necesitamos tests que:

- ✅ Token inexistente (`token === null`)
- ✅ Token expirado (`expirationTimestamp <= now`)
- ✅ Token no activo (`notBeforeTimestamp > now`)
- ✅ Token válido (todas las condiciones cumplen)

---

## Matchers Comunes de Jest

Jest proporciona una amplia gama de **matchers** (funciones de aserción) que hacen los tests más expresivos y legibles. Aquí están los más importantes organizados por categoría:

### Matchers de Igualdad

```typescript
// Igualdad estricta (===)
expect(value).toBe(4);
expect(value).toBe('hello');

// Igualdad profunda (objetos y arrays)
expect(object).toEqual({ a: 1, b: 2 });
expect(array).toEqual([1, 2, 3]);
```

**¿Cuándo usar `toBe` vs `toEqual`?**

- **`toBe`**: Usa `===` (identidad de referencia). Para primitivos (numbers, strings, booleans)
- **`toEqual`**: Compara valores recursivamente. Para objetos y arrays

```typescript
// ✅ Correcto
expect(5).toBe(5);
expect({ a: 1 }).toEqual({ a: 1 });

// ❌ Incorrecto
expect({ a: 1 }).toBe({ a: 1 }); // Falla! Diferentes referencias
```

### Matchers de Truthiness

```typescript
// true, 1, "string", {}, []
expect(value).toBeTruthy();

// false, 0, "", null, undefined, NaN
expect(value).toBeFalsy();

// Específicamente null
expect(value).toBeNull();

// Específicamente undefined
expect(value).toBeUndefined();

// No undefined (puede ser null u otro valor)
expect(value).toBeDefined();
```

Estos matchers son útiles para verificar valores booleanos o verificar existencia de valores.

### Matchers Numéricos

```typescript
expect(value).toBeGreaterThan(3);         // value > 3
expect(value).toBeGreaterThanOrEqual(3);  // value >= 3
expect(value).toBeLessThan(5);            // value < 5
expect(value).toBeLessThanOrEqual(5);     // value <= 5

// Para números de punto flotante
expect(0.1 + 0.2).toBeCloseTo(0.3);      // ~0.3 (evita errores de precisión)
```

**Importante**: Siempre usa `toBeCloseTo` para números de punto flotante para evitar problemas de precisión:

```typescript
// ❌ Puede fallar por precisión de punto flotante
expect(0.1 + 0.2).toBe(0.3);

// ✅ Usa toBeCloseTo
expect(0.1 + 0.2).toBeCloseTo(0.3);
```

### Matchers de Strings

```typescript
// Match con regex
expect('team').toMatch(/tea/);
expect('team').toMatch(/^tea/); // Inicia con "tea"

// No match
expect('team').not.toMatch(/I/);

// Substring (alternativa más simple)
expect('Hello World').toContain('World');
```

### Matchers de Arrays

```typescript
// Contiene elemento
expect(['a', 'b', 'c']).toContain('a');
expect([1, 2, 3]).toContain(2);

// Longitud
expect([1, 2, 3]).toHaveLength(3);
expect([]).toHaveLength(0);

// Array específico (orden y valores)
expect([1, 2, 3]).toEqual([1, 2, 3]);
```

### Matchers de Excepciones

```typescript
// Verifica que lanza error
expect(() => fn()).toThrow();

// Error de tipo específico
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow(TypeError);

// Con mensaje específico
expect(() => fn()).toThrow('error message');
expect(() => fn()).toThrow(/error/);
```

**Recuerda**: Siempre envuelve la función en una arrow function cuando testees excepciones.

### Matchers de Objetos

```typescript
// Tiene propiedad
expect(obj).toHaveProperty('key');

// Tiene propiedad con valor específico
expect(obj).toHaveProperty('key', 'value');

// Nested property
expect(obj).toHaveProperty('user.name', 'John');

// Estructura parcial
expect(user).toEqual(
  expect.objectContaining({
    name: 'John',
    // No importan otras propiedades
  })
);
```

### Negación con `.not`

Cualquier matcher puede negarse con `.not`:

```typescript
expect(value).not.toBe(5);
expect(value).not.toBeNull();
expect(array).not.toContain('x');
expect(() => fn()).not.toThrow();
```

### Matchers avanzados

```typescript
// Cualquier cosa excepto null/undefined
expect(value).toBeAnything();

// Instancia de clase
expect(new Date()).toBeInstanceOf(Date);

// Array contiene elemento que cumple condición
expect([1, 2, 3]).toEqual(
  expect.arrayContaining([2, 3])
);

// String matching parcial
expect('Hello World').toEqual(
  expect.stringContaining('World')
);
```

:::tip Consejo
Usa el matcher más específico posible. `expect(array).toHaveLength(3)` es más claro que `expect(array.length).toBe(3)`.
:::
