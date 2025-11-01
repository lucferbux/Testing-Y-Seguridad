---
sidebar_position: 5
title: "Testing de Funciones"
---

# Testing Unitario de Funciones

## Ejemplo 1: Función Pura Simple

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

## Ejemplo 2: Validación de Strings

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

### Test: src/utils/__tests__/validators.test.ts

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

## Matchers Comunes de Jest

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
