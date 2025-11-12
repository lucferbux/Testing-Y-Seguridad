---
sidebar_position: 5
title: "Testing de Funciones"
---

El testing unitario de funciones es la base de una suite de tests sólida. En esta sección aprenderemos a testear diferentes tipos de funciones, desde las más simples hasta las más complejas, aplicando las mejores prácticas y patrones que hemos aprendido.

## Ejemplo 1: Función Pura Simple

Las funciones puras son las más fáciles de testear porque:

- No tienen efectos secundarios
- Siempre devuelven el mismo resultado para los mismos parámetros
- No dependen de estado externo

Comencemos con un ejemplo clásico: funciones matemáticas.

### Código: src/utils/math.ts

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

Estas funciones son **puras**: dado el mismo input, siempre producen el mismo output, sin efectos secundarios. Son ideales para testing unitario.

### Test: src/utils/__tests__/math.test.ts

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

### Análisis del test

**Organización con `describe` anidados**

Nota cómo usamos `describe` anidados para organizar los tests:
- El `describe` principal agrupa todas las funciones de math utils
- Cada función tiene su propio `describe`
- Dentro, cada `it` testea un comportamiento específico

Esto genera output legible:

```text
Math Utils
  sum
    ✓ debe sumar dos números positivos
    ✓ debe sumar números negativos
    ✓ debe sumar número positivo y negativo
    ✓ debe sumar con cero
  multiply
    ✓ debe multiplicar dos números
    ✓ debe devolver 0 al multiplicar por 0
  divide
    ✓ debe dividir dos números
    ✓ debe lanzar error al dividir por cero
```

### Testing de casos edge

Observa que no solo probamos el "happy path" (casos normales), sino también **casos edge**:

- Números negativos
- Cero
- Combinaciones de positivos y negativos

Esto asegura que la función es robusta y maneja todos los casos correctamente.

### Testing de excepciones

Para testear que una función lanza un error, envolvemos la llamada en una arrow function:

```typescript
expect(() => divide(10, 0)).toThrow('Division by zero');
```

Esto es necesario porque si llamáramos `divide(10, 0)` directamente, el error se lanzaría inmediatamente y el test fallaría antes de poder capturarlo.

## Ejemplo 2: Validación de Strings

Las funciones de validación son extremadamente comunes en aplicaciones web. Validar datos de usuario es crucial para la seguridad y la experiencia de usuario. Veamos cómo testear validadores de forma exhaustiva.

### Código: src/utils/validators.ts

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

Estas funciones son más complejas que las matemáticas porque:

- **isValidEmail**: Usa regex para validar formato
- **isStrongPassword**: Tiene múltiples condiciones que deben cumplirse
- **sanitizeInput**: Transforma el input (no solo lo valida)

### Test: src/utils/\__tests__/validators.test.ts

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

### Análisis de los tests de validación

**Testing exhaustivo de `isValidEmail`**

Para una función de validación, es crucial testear tanto casos válidos como inválidos. Nota cómo testeamos:

- ✅ Email válido típico: `user@example.com`
- ❌ Sin @: detecta formato incorrecto básico
- ❌ Sin dominio: detecta emails incompletos
- ❌ Con espacios: detecta caracteres inválidos
- ❌ String vacío: maneja casos edge

**Estrategia para `isStrongPassword`**

Para una función con múltiples condiciones, testea cada condición individualmente:

```typescript
it('debe validar contraseña fuerte', () => {
  expect(isStrongPassword('Password123')).toBe(true); // Happy path
});

it('debe rechazar contraseña corta', () => {
  expect(isStrongPassword('Pass1')).toBe(false); // Falla: longitud
});

it('debe rechazar sin mayúscula', () => {
  expect(isStrongPassword('password123')).toBe(false); // Falla: mayúscula
});

// ... un test por cada condición
```

Esto hace que cuando un test falla, sepas **exactamente** qué condición no se cumple.

### Testing de transformaciones

`sanitizeInput` no solo valida, sino que **transforma** el input. Los tests verifican cada transformación:

- Trim de espacios
- Remoción de caracteres peligrosos (`<>`)
- Limitación de longitud

:::tip Buena práctica
Cuando una función tiene múltiples responsabilidades (como `sanitizeInput`), considera si debería dividirse en funciones más pequeñas. Por ejemplo: `trim()`, `removeHtmlChars()`, `limitLength()`. Esto haría el código más testeable y mantenible.
:::

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
