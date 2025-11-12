---
sidebar_position: 6
title: "Testing de Componentes React"
---

El testing de componentes React es fundamental para asegurar que nuestra interfaz de usuario funciona correctamente. En esta sección aprenderemos a testear componentes usando React Testing Library, siguiendo las mejores prácticas de la industria.

## React Testing Library: Filosofía

React Testing Library (RTL) fue creado por Kent C. Dodds con una filosofía muy clara: **testear componentes de la misma forma que los usuarios los usan**.

### Principios fundamentales

#### ❌ No probar detalles de implementación

Los detalles de implementación son aspectos internos del componente que el usuario no ve ni le importan. Por ejemplo:

- **State interno**: Cómo el componente gestiona su estado
- **Nombres de funciones**: Qué funciones se llaman internamente
- **Estructura de props**: Cómo se pasan props entre componentes hijos

**¿Por qué evitar testear implementación?**

Cuando testeas detalles de implementación, tus tests se vuelven **frágiles**. Cualquier refactorización rompe los tests, incluso si el comportamiento visible no cambia.

```tsx
// ❌ Mal: Testea state interno
it('incrementa contador', () => {
  const { container } = render(<Counter />);
  expect(container.state.count).toBe(0); // Detalles internos!
});

// ✅ Bien: Testea comportamiento observable
it('incrementa contador', () => {
  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### ✅ Probar comportamiento observable

El comportamiento observable es lo que el usuario **ve y experimenta**:

- Texto renderizado en pantalla
- Botones que puede hacer click
- Inputs donde puede escribir
- Navegación que ocurre
- Mensajes de error o éxito

Testear comportamiento hace tus tests más **resilientes** a refactorizaciones y más **valiosos** porque verifican lo que realmente importa.

#### ✅ Usar selectores accesibles

RTL promueve usar selectores que **mejoran la accesibilidad**. Si tu test no puede encontrar un elemento usando selectores accesibles, probablemente tampoco pueda un lector de pantalla.

**Jerarquía de selectores (de mejor a peor):**

1. `getByRole`: Elementos por rol ARIA
2. `getByLabelText`: Inputs con labels asociados
3. `getByPlaceholderText`: Por placeholder
4. `getByText`: Por texto visible
5. `getByTestId`: Como último recurso

Esta filosofía no solo mejora tus tests, sino también la **accesibilidad de tu aplicación**.

## Ejemplo 1: Componente Simple

Comencemos con un componente Button simple pero completo que demuestra los conceptos fundamentales de testing en React.

### Código: src/components/Button.tsx

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

Este componente es un botón reutilizable con:

- **label**: Texto que muestra el botón
- **onClick**: Callback cuando se hace click
- **disabled**: Opcional, deshabilita el botón
- **variant**: Opcional, cambia el estilo visual

### Test: src/components/\__tests__/Button.test.tsx

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

### Desglosando el test

**`render()` - Renderizar el componente**

```tsx
render(<Button label="Click me" onClick={() => {}} />);
```

`render()` es la función principal de RTL. Renderiza el componente en un DOM virtual donde podemos interactuar con él. No necesitas un navegador real.

**`screen` - Acceder al DOM renderizado**

```tsx
screen.getByText('Click me')
screen.getByRole('button')
```

`screen` es un objeto que proporciona queries para encontrar elementos en el DOM renderizado. Es el punto de entrada principal para todas las queries.

**`fireEvent` - Simular eventos del usuario**

```tsx
fireEvent.click(button);
```

`fireEvent` dispara eventos del DOM. Aunque funciona, para interacciones más realistas es mejor usar `@testing-library/user-event`:

```tsx
import userEvent from '@testing-library/user-event';

await userEvent.click(button);  // Más realista
```

**`jest.fn()` - Mock functions**

```tsx
const handleClick = jest.fn();
```

Creamos una función mockeada para pasar como onClick. Esto nos permite verificar si fue llamada y cuántas veces.

### Matchers de jest-dom

```tsx
expect(element).toBeInTheDocument();
expect(element).toHaveClass('btn-primary');
expect(element).toBeDisabled();
```

Estos matchers vienen de `@testing-library/jest-dom` y hacen los tests más legibles.

## Ejemplo 2: Componente con Estado

Ahora veamos un componente más interesante que maneja su propio estado interno. Este es un caso clásico donde **no debemos testear el estado directamente**, sino el comportamiento observable.

### Código: src/components/Counter.tsx

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

Este componente:

- Mantiene un contador en estado local con `useState`
- Muestra el contador actual
- Tiene botones para incrementar, decrementar y resetear

Nota que el **estado es completamente privado** al componente. Como usuarios y testers, no nos importa cómo se implementa internamente.

### Test: src/components/\__tests__/Counter.test.tsx

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

### Lecciones del test de Counter

#### No testeamos el estado interno

Nota que nunca accedemos directamente a `count`. En lugar de eso, verificamos lo que el usuario ve: el texto "Count: X".

```tsx
// ❌ No hacer (no podemos acceder al estado así)
expect(component.state.count).toBe(1);

// ✅ Hacer
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

#### Simulamos interacciones reales

Hacemos click en botones tal como lo haría un usuario, y verificamos que el texto cambia. No nos importa que internamente use `useState`, podría usar `useReducer` o cualquier otra cosa.

#### Tests son independientes

Cada test renderiza el componente desde cero. No dependen del estado de tests anteriores.

## Queries de Testing Library

Las **queries** son la forma de encontrar elementos en el DOM. Elegir la query correcta no solo hace tus tests más robustos, sino que también mejora la accesibilidad de tu aplicación.

### Prioridad de selectores

RTL recomienda usar selectores en este orden (de mejor a peor):

#### 1. getByRole - El más accesible

```tsx
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('heading', { level: 1 });
```

**Por qué es el mejor:**

- Refleja cómo usuarios con lectores de pantalla encuentran elementos
- Fuerza a usar HTML semántico correcto
- Verifica que los elementos tienen los roles ARIA apropiados

**Roles comunes:**

- `button`: `<button>`, `<input type="button">`
- `textbox`: `<input type="text">`, `<textarea>`
- `checkbox`: `<input type="checkbox">`
- `link`: `<a href="...">`
- `heading`: `<h1>`, `<h2>`, etc.
- `listitem`: `<li>`

```tsx
// Encontrar button con texto específico
screen.getByRole('button', { name: 'Submit' });

// Encontrar input por su label asociado
screen.getByRole('textbox', { name: 'Username' });

// Encontrar heading específico
screen.getByRole('heading', { name: 'Welcome', level: 1 });
```

#### 2. getByLabelText - Para formularios

```tsx
screen.getByLabelText('Email');
screen.getByLabelText(/password/i);
```

**Cuándo usar:**

- Inputs de formularios con `<label>` asociado
- Verifica que inputs son accesibles

```tsx
// HTML
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// Test
const emailInput = screen.getByLabelText('Email Address');
expect(emailInput).toBeInTheDocument();
```

#### 3. getByPlaceholderText - Con moderación

```tsx
screen.getByPlaceholderText('Enter email');
```

**Cuándo usar:**

- Cuando el placeholder es la única forma de identificar el input
- **Precaución**: Placeholders no son muy accesibles, mejor usar labels

```tsx
// Aceptable como última opción
screen.getByPlaceholderText('Search...');
```

#### 4. getByText - Para contenido visible

```tsx
screen.getByText('Hello World');
screen.getByText(/hello/i);  // Case insensitive
screen.getByText((content, element) => content.startsWith('Hello'));
```

**Cuándo usar:**

- Texto visible en la página
- Muy útil para verificar contenido renderizado

```tsx
// Texto exacto
expect(screen.getByText('Login successful')).toBeInTheDocument();

// Regex para case-insensitive
expect(screen.getByText(/loading/i)).toBeInTheDocument();

// Función para matching complejo
const element = screen.getByText((content) => {
  return content.includes('items') && content.includes('5');
});
```

#### 5. getByTestId - Último recurso

```tsx
screen.getByTestId('custom-element');
```

**Cuándo usar:**

- Cuando ningún otro selector funciona
- Para elementos que no tienen texto o rol significativo
- Para componentes de terceros difíciles de seleccionar

```tsx
// En el componente
<div data-testid="loading-spinner">
  {/* Spinner complejo */}
</div>

// En el test
expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
```

**Por qué es último recurso:**

- No refleja cómo usuarios encuentran elementos
- No verifica accesibilidad
- Añade atributos solo para tests (acopla tests con implementación)

### Variantes de queries

Cada query (`getBy`, `queryBy`, `findBy`) tiene un comportamiento diferente cuando el elemento no se encuentra:

#### getBy - Uso más común

```tsx
const button = screen.getByRole('button');
```

- **Lanza error** si no encuentra el elemento
- **Lanza error** si encuentra más de uno
- **Síncrono**: retorna inmediatamente
- **Uso**: Cuando esperas que el elemento exista

```tsx
// ✅ Elemento existe
expect(screen.getByText('Hello')).toBeInTheDocument();

// ❌ Lanza error si no existe
screen.getByText('Goodbye'); // Error: Unable to find...
```

#### queryBy - Para verificar ausencia

```tsx
const button = screen.queryByRole('button');
```

- **Retorna null** si no encuentra el elemento
- **Lanza error** si encuentra más de uno
- **Síncrono**: retorna inmediatamente
- **Uso**: Cuando quieres verificar que algo NO existe

```tsx
// Verificar que elemento no existe
expect(screen.queryByText('Error message')).not.toBeInTheDocument();

// ✅ Funciona - retorna null
const missing = screen.queryByText('Not there');
expect(missing).toBeNull();

// ❌ No usar getBy para verificar ausencia
expect(screen.getByText('Not there')).not.toBeInTheDocument(); // Lanza error!
```

#### findBy - Para elementos asíncronos

```tsx
const element = await screen.findByText('Loaded data');
```

- **Retorna Promise** que resuelve cuando encuentra el elemento
- **Rechaza** si no encuentra después de timeout (1000ms por defecto)
- **Asíncrono**: espera a que el elemento aparezca
- **Uso**: Elementos que cargan asíncronamente (APIs, lazy loading, etc.)

```tsx
// Esperar a que aparezca dato cargado de API
it('muestra datos después de cargar', async () => {
  render(<UserProfile userId="123" />);
  
  // Elemento aparecerá después de fetch
  const userName = await screen.findByText('John Doe');
  expect(userName).toBeInTheDocument();
});

// Con timeout personalizado
await screen.findByText('Data', {}, { timeout: 3000 });
```

### getAllBy, queryAllBy, findAllBy

Para cuando esperas **múltiples elementos**:

```tsx
// Retorna array de elementos
const buttons = screen.getAllByRole('button');
expect(buttons).toHaveLength(3);

// queryAllBy - retorna array vacío si no encuentra
const items = screen.queryAllByRole('listitem');
expect(items).toHaveLength(0);

// findAllBy - async para múltiples elementos
const loadedItems = await screen.findAllByRole('listitem');
expect(loadedItems).toHaveLength(5);
```

### Resumen de cuándo usar cada variante

| Variante | Cuándo usar | Retorna | Async |
|----------|-------------|---------|-------|
| `getBy` | Elemento debe existir | Elemento (o error) | No |
| `queryBy` | Verificar ausencia | Elemento o null | No |
| `findBy` | Elemento aparece async | Promise\<Elemento\> | Sí |
| `getAllBy` | Múltiples elementos existen | Array (o error) | No |
| `queryAllBy` | Verificar ausencia de múltiples | Array (vacío si no hay) | No |
| `findAllBy` | Múltiples elementos async | Promise\<Array\> | Sí |

:::tip Consejo Práctico
Si tu test falla con "Unable to find element", verifica:

1. ¿El elemento existe? Usa `screen.debug()` para ver el DOM
2. ¿El elemento se carga asíncronamente? Usa `findBy` en lugar de `getBy`
3. ¿Estás usando el selector correcto? Intenta con `screen.getByRole`

:::

```tsx
// Verificar que existe
expect(screen.getByText('Loaded')).toBeInTheDocument();

// Verificar que NO existe
expect(screen.queryByText('Loading')).not.toBeInTheDocument();

// Esperar elemento async
const element = await screen.findByText('Data loaded');
```
