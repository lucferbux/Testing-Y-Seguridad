---
sidebar_position: 6
title: "Testing de Componentes React"
---

# Testing de Componentes React

## React Testing Library: Filosofía

React Testing Library promueve probar componentes **como lo haría un usuario**:

- ❌ No probar detalles de implementación (state, props internos)
- ✅ Probar comportamiento observable
- ✅ Usar selectores accesibles (roles, labels, text)

## Ejemplo 1: Componente Simple

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

### Test: src/components/__tests__/Button.test.tsx

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

## Ejemplo 2: Componente con Estado

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

### Test: src/components/__tests__/Counter.test.tsx

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

## Queries de Testing Library

### Prioridad de selectores (de mayor a menor)

**1. getByRole:** Más accesible

```tsx
screen.getByRole('button', { name: /submit/i });
```

**2. getByLabelText:** Para inputs con labels

```tsx
screen.getByLabelText('Email');
```

**3. getByPlaceholderText:** Para inputs con placeholder

```tsx
screen.getByPlaceholderText('Enter email');
```

**4. getByText:** Texto visible

```tsx
screen.getByText('Hello World');
```

**5. getByTestId:** Último recurso

```tsx
screen.getByTestId('custom-element');
```

### Variantes de queries

- **getBy**: Falla si no encuentra (uso más común)
- **queryBy**: Devuelve null si no encuentra (para verificar ausencia)
- **findBy**: Async, espera a que aparezca (para elementos que cargan)

```tsx
// Verificar que existe
expect(screen.getByText('Loaded')).toBeInTheDocument();

// Verificar que NO existe
expect(screen.queryByText('Loading')).not.toBeInTheDocument();

// Esperar elemento async
const element = await screen.findByText('Data loaded');
```
