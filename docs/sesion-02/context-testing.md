---
sidebar_position: 3
title: "Testing con Context"
---

# Testing de Componentes con Context

## React Context: Recordatorio

React Context permite compartir estado sin prop drilling:

```tsx
// 1. Crear Context
const ThemeContext = createContext();

// 2. Proveer valor
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// 3. Consumir
const theme = useContext(ThemeContext);
```

## Ejemplo: Theme Context

### Código: src/context/ThemeContext.tsx

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Componente que usa Context: src/components/ThemeToggle.tsx

```tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`theme-toggle ${theme}`}>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'}
      </button>
    </div>
  );
}
```

## Test de Integración con Context

### Test: src/components/__tests__/ThemeToggle.integration.test.tsx

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

// Helper para renderizar con Provider
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

describe('ThemeToggle Integration', () => {
  
  it('debe iniciar con tema light', () => {
    renderWithTheme(<ThemeToggle />);
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
  });

  it('debe cambiar a dark al hacer click', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    expect(screen.getByText('Switch to light')).toBeInTheDocument();
  });

  it('debe alternar entre temas múltiples veces', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Light → Dark
    fireEvent.click(button);
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    
    // Dark → Light
    fireEvent.click(button);
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
    
    // Light → Dark
    fireEvent.click(button);
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
  });
});
```

## Ejemplo Complejo: Auth Context

### Código: src/context/AuthContext.tsx

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Simulación de API call
    if (email && password.length >= 6) {
      setUser({
        id: '123',
        email,
        name: email.split('@')[0],
      });
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Componente: src/components/LoginForm.tsx

```tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  if (isAuthenticated && user) {
    return <div>Welcome, {user.name}!</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="password"
      />
      <button type="submit">Login</button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}
```

### Test de Integración

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from '../LoginForm';

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm Integration', () => {
  
  it('debe hacer login exitosamente', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Llenar formulario
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificar mensaje de bienvenida
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123'); // Muy corto
    
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('debe permitir login después de error', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Primer intento fallido
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Corregir password
    const passwordInput = screen.getByLabelText('password');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
  });
});
```
