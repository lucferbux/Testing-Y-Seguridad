---
sidebar_position: 3
title: "Testing con Context"
---

# Testing de Componentes con Context

## Introducción

El **Context API** de React es una de las herramientas más poderosas para gestionar estado global en aplicaciones modernas. Sin embargo, testar componentes que dependen de Context puede ser un desafío si no comprendemos bien cómo funcionan las dependencias y el flujo de datos. En esta sección, aprenderemos a crear **tests de integración robustos** que verifican no solo que un componente renderiza correctamente, sino que **interactúa correctamente con el estado compartido** a través de Context.

A diferencia de los tests unitarios que mockean el Context, los tests de integración verifican el **comportamiento real del sistema**: cómo los componentes consumen el Context, cómo responden a cambios de estado, y cómo múltiples componentes pueden compartir y modificar datos a través del mismo proveedor. Esto nos da mucha más confianza en que nuestra aplicación funcionará correctamente en producción.

## React Context: Recordatorio

React Context es una solución nativa para compartir datos entre componentes sin necesidad de pasar props manualmente a través de cada nivel del árbol de componentes (problema conocido como **prop drilling**). Imagina que tienes un tema (light/dark) que necesitas en 20 componentes diferentes. Sin Context, tendrías que pasar esta prop a través de todos los componentes intermedios, incluso si no la usan. Context elimina este problema.

### Anatomía del Context API

El Context API se compone de tres partes fundamentales:

```tsx
// 1. Crear Context - Define el "canal de comunicación"
// El valor undefined es el valor por defecto si no hay Provider
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. Proveer valor - El Provider envuelve componentes que necesitan el Context
// Todos los descendientes pueden acceder al valor sin importar su profundidad
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// 3. Consumir - Los componentes acceden al valor del Context más cercano
// useContext busca hacia arriba en el árbol hasta encontrar un Provider
const theme = useContext(ThemeContext);
```

### ¿Por qué necesitamos testar Context?

Testar componentes que usan Context es crucial porque:

1. **Verificar la integración completa**: Aseguramos que el Provider proporciona los valores correctos y que los componentes los consumen adecuadamente.

2. **Detectar errores de configuración**: Un componente puede renderizar correctamente en un test unitario mockeado, pero fallar en producción si el Provider no está configurado correctamente.

3. **Validar el flujo de datos**: Los cambios de estado en el Context deben propagarse correctamente a todos los consumidores.

4. **Prevenir errores en tiempo de ejecución**: Si un componente usa `useContext` fuera de un Provider, obtendrá `undefined` y probablemente crasheará. Los tests de integración detectan esto.

:::tip Regla de oro
Si un componente usa Context, **siempre renderízalo con su Provider real** en tests de integración. Solo mockea el Context en tests unitarios cuando quieres aislar la lógica del componente.
:::

## ¿Qué estamos testeando exactamente?

En tests de integración con Context, verificamos:

| Aspecto | Qué validamos | Por qué importa |
|---------|---------------|-----------------|
| **Renderizado inicial** | El componente recibe y muestra los valores correctos del Context | Asegura que la conexión Provider → Consumer funciona |
| **Actualizaciones de estado** | Los cambios en el Context se reflejan en todos los consumidores | Verifica que la reactividad funciona correctamente |
| **Interacciones del usuario** | Las acciones del usuario modifican el Context correctamente | Valida el flujo completo de datos bidireccional |
| **Múltiples consumidores** | Varios componentes comparten el mismo estado | Detecta problemas de sincronización |
| **Manejo de errores** | El componente falla gracefully si no hay Provider | Previene crashes inesperados |

## Ejemplo Práctico: Theme Context

Vamos a construir un sistema de temas (light/dark) completo para entender cómo testar Context desde cero. Este es un caso de uso muy común en aplicaciones reales: necesitamos que múltiples componentes accedan al tema actual y puedan cambiarlo globalmente.

### Anatomía del ThemeContext

Nuestro Context necesita proporcionar dos cosas:
1. **Estado actual** (`theme: 'light' | 'dark'`) - Para que los componentes sepan qué tema mostrar
2. **Función para cambiar** (`toggleTheme`) - Para que los componentes puedan modificar el tema

### Código: src/context/ThemeContext.tsx

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Definimos los tipos - TypeScript nos ayuda a prevenir errores
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;           // Estado actual
  toggleTheme: () => void; // Función para cambiar
}

// 2. Creamos el Context con valor por defecto undefined
// Esto nos permite detectar si alguien usa useTheme sin Provider
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 3. Componente Provider - Gestiona el estado y lo provee a los hijos
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Estado interno: comienza con 'light'
  const [theme, setTheme] = useState<Theme>('light');

  // Función que alterna entre light y dark
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Proveemos el valor a todos los descendientes
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 4. Custom Hook - Facilita el consumo y añade validación
export function useTheme() {
  const context = useContext(ThemeContext);
  
  // Si context es undefined, significa que useTheme se llamó fuera del Provider
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
}
```

### ¿Por qué esta estructura?

Este patrón (Provider + Custom Hook) es la mejor práctica porque:

- **Encapsulación**: Toda la lógica del tema está en un solo lugar
- **Validación automática**: El custom hook detecta errores de configuración
- **Type-safety**: TypeScript garantiza que usamos el Context correctamente
- **Reutilización**: Cualquier componente puede importar `useTheme()` y ya está

### Componente que usa Context: src/components/ThemeToggle.tsx

Ahora creamos un componente que **consume** el Context:

```tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  // Obtenemos theme y toggleTheme del Context
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`theme-toggle ${theme}`}>
      {/* Mostramos el tema actual */}
      <p>Current theme: {theme}</p>
      
      {/* Botón que llama a toggleTheme cuando se hace click */}
      <button onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'dark' : 'light'}
      </button>
    </div>
  );
}
```

Este componente es simple pero ilustra perfectamente la integración:
1. **Consume** el Context usando el custom hook
2. **Lee** el estado actual para mostrarlo
3. **Modifica** el estado llamando a `toggleTheme`

## Test de Integración con Context

Ahora viene la parte importante: **cómo testar esta integración**. No vamos a mockear el Context; vamos a usar el Provider real para verificar que todo funciona como en producción.

### Patrón: Helper de Renderizado

Es una buena práctica crear una función helper que envuelve componentes con el Provider:

```tsx
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}
```

**¿Por qué es útil?**
- **DRY (Don't Repeat Yourself)**: No repetimos el Provider en cada test
- **Mantenibilidad**: Si cambiamos el Provider, solo actualizamos un lugar
- **Claridad**: El intent del test queda más claro

### Test: src/components/tests/ThemeToggle.integration.test.tsx

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

// Helper para renderizar con Provider - centraliza la configuración
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

describe('ThemeToggle Integration', () => {
  
  it('debe iniciar con tema light', () => {
    // Renderizamos el componente con su Provider real
    renderWithTheme(<ThemeToggle />);
    
    // Verificamos que el estado inicial sea 'light'
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
  });

  it('debe cambiar a dark al hacer click', () => {
    renderWithTheme(<ThemeToggle />);
    
    // Encontramos el botón y simulamos un click
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Verificamos que el estado cambió a 'dark'
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    
    // Y que el texto del botón también cambió
    expect(screen.getByText('Switch to light')).toBeInTheDocument();
  });

  it('debe alternar entre temas múltiples veces', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Probamos múltiples toggles para verificar la consistencia
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

### ¿Qué estamos validando?

Estos tests verifican **tres aspectos críticos** de la integración:

1. **Estado inicial**: El Provider proporciona el valor inicial correcto (`light`)
2. **Flujo unidireccional**: Cuando llamamos `toggleTheme`, el estado se actualiza y el componente re-renderiza
3. **Consistencia**: El toggle funciona correctamente múltiples veces sin romper el estado

:::tip Diferencia clave con tests unitarios
En un test unitario, mockearíamos `useTheme()` así:
```tsx
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn() })
}));
```

Pero en integración **usamos el Provider real** para verificar que la integración completa funciona.
:::



## Ejemplo Complejo: Auth Context

El ejemplo del tema es simple y didáctico, pero las aplicaciones reales necesitan Context más sofisticados. Vamos a construir un **sistema de autenticación completo** que maneja:
- Estado del usuario (logueado o no)
- Proceso de login asíncrono
- Validaciones de credenciales
- Manejo de errores

Este ejemplo es mucho más cercano a lo que encontrarás en producción y demuestra patrones avanzados de testing con Context.

### Código: src/context/AuthContext.tsx

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Modelo del usuario autenticado
interface User {
  id: string;
  email: string;
  name: string;
}

// El Context proporciona tanto el estado como las acciones
interface AuthContextType {
  user: User | null;                    // Usuario actual (null si no está logueado)
  login: (email: string, password: string) => Promise<void>; // Función asíncrona de login
  logout: () => void;                   // Función de logout
  isAuthenticated: boolean;             // Computed value para facilitar checks
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Login asíncrono - simula llamada a API
  const login = async (email: string, password: string) => {
    // Validación básica de credenciales
    if (email && password.length >= 6) {
      // En producción, esto haría un fetch a tu backend
      // Simulamos un delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setUser({
        id: '123',
        email,
        name: email.split('@')[0], // Extraemos nombre del email
      });
    } else {
      // Si las credenciales son inválidas, lanzamos error
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
        isAuthenticated: !!user  // Convertimos user a boolean
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

### ¿Qué hace especial este Context?

A diferencia del ThemeContext simple, aquí tenemos:

1. **Operaciones asíncronas**: `login()` retorna una Promise porque simula una llamada API
2. **Manejo de errores**: Lanzamos excepciones si las credenciales son inválidas
3. **Estado derivado**: `isAuthenticated` se calcula automáticamente desde `user`
4. **Modelo de datos complejo**: `User` es un objeto con múltiples propiedades

Estos son patrones que verás en **todas las aplicaciones reales** con autenticación.

### Componente: src/components/LoginForm.tsx

Ahora creamos un formulario de login que utiliza el AuthContext:

```tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginForm() {
  // Estado local del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estado global de autenticación
  const { login, isAuthenticated, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpiamos errores previos
    
    try {
      await login(email, password); // Intentamos login
    } catch (err) {
      setError('Invalid credentials'); // Mostramos error si falla
    }
  };

  // Si el usuario ya está autenticado, mostramos mensaje de bienvenida
  if (isAuthenticated && user) {
    return <div>Welcome, {user.name}!</div>;
  }

  // Si no, mostramos el formulario
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

### Análisis del flujo de datos

Este componente demuestra **varios patrones importantes**:

1. **Estado local + Estado global**: 
   - `email` y `password` son locales (solo el formulario los necesita)
   - `user` e `isAuthenticated` son globales (múltiples componentes los necesitan)

2. **Renderizado condicional**: 
   - Si está autenticado → muestra bienvenida
   - Si no → muestra formulario

3. **Manejo de errores**: 
   - Capturamos errores del Context con try/catch
   - Mostramos mensajes al usuario

4. **Accesibilidad**: 
   - Usamos `aria-label` para screen readers
   - Usamos `role="alert"` para errores

## Test de Integración del Auth Flow

Ahora testeamos el **flujo completo de autenticación**. Estos tests son complejos porque involucran:
- Interacciones del usuario (typing, clicks)
- Operaciones asíncronas (login)
- Cambios de estado globales
- Manejo de errores

### Test Completo: src/components/tests/LoginForm.integration.test.tsx

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from '../LoginForm';

// Helper que envuelve con AuthProvider
function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm Integration', () => {
  
  it('debe hacer login exitosamente', async () => {
    // userEvent.setup() es necesario para simular interacciones realistas
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Llenar formulario - userEvent simula el typing real del usuario
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    
    // Submit - buscamos el botón por su rol y texto
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificar que el mensaje de bienvenida aparece
    // waitFor es crucial porque login es asíncrono
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
    
    // Verificación adicional: el formulario desapareció
    expect(screen.queryByLabelText('email')).not.toBeInTheDocument();
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123'); // Password muy corto
    
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Esperamos a que aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    
    // Verificamos que el formulario sigue visible (no hubo login)
    expect(screen.getByLabelText('email')).toBeInTheDocument();
  });

  it('debe permitir login después de error', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // ========== PRIMER INTENTO (FALLIDO) ==========
    await user.type(screen.getByLabelText('email'), 'user@example.com');
    await user.type(screen.getByLabelText('password'), '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificamos que apareció el error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // ========== SEGUNDO INTENTO (EXITOSO) ==========
    const passwordInput = screen.getByLabelText('password');
    await user.clear(passwordInput);  // Limpiamos el campo
    await user.type(passwordInput, 'password123'); // Password correcto
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificamos que ahora sí se logueó
    await waitFor(() => {
      expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
    });
    
    // Y que el error desapareció
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('debe limpiar el error al reintentar después de fallo', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm />);
    
    // Primer intento fallido
    await user.type(screen.getByLabelText('email'), 'bad@example.com');
    await user.type(screen.getByLabelText('password'), '12');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Modificamos el password (aún incorrecto)
    const passwordInput = screen.getByLabelText('password');
    await user.clear(passwordInput);
    await user.type(passwordInput, '123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // El error debe seguir ahí, pero el mensaje debe actualizarse
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });
});
```

### Desglose de técnicas avanzadas

Estos tests demuestran **técnicas cruciales** para testing de integración:

#### 1. `userEvent` vs `fireEvent`

```tsx
// ❌ Menos realista
fireEvent.change(input, { target: { value: 'texto' } });

// ✅ Más realista - simula typing character por character
await user.type(input, 'texto');
```

`userEvent` simula las interacciones **exactamente como un usuario real**, incluyendo:
- Focus/blur automático
- Eventos de teclado individuales
- Validaciones de formulario
- Timing realista

#### 2. `waitFor` para operaciones asíncronas

```tsx
// ❌ Falla porque el login aún no terminó
expect(screen.getByText('Welcome, user!')).toBeInTheDocument();

// ✅ Espera hasta que el elemento aparezca
await waitFor(() => {
  expect(screen.getByText('Welcome, user!')).toBeInTheDocument();
});
```

`waitFor` es **esencial** cuando:
- Haces llamadas asíncronas (API, login, etc.)
- Esperas cambios de estado que disparan re-renders
- Tienes animaciones o transiciones

#### 3. Queries negativas con `queryBy`

```tsx
// ❌ getByLabelText lanza error si no encuentra el elemento
expect(screen.getByLabelText('email')).not.toBeInTheDocument(); // ¡FALLA!

// ✅ queryByLabelText retorna null si no encuentra
expect(screen.queryByLabelText('email')).not.toBeInTheDocument(); // ✓
```

Regla general:
- **`getBy*`**: Cuando **esperas** que el elemento exista (falla si no está)
- **`queryBy*`**: Cuando **verificas ausencia** (retorna null si no está)
- **`findBy*`**: Cuando **esperas que aparezca** asincrónicamente (equivale a `waitFor` + `getBy`)

:::warning Errores comunes
1. **No usar `await` con `waitFor`**: El test pasa aunque falle
2. **Usar `getBy` para verificar ausencia**: Lanza error en lugar de pasar
3. **No limpiar estado entre tests**: Los tests se afectan mutuamente
:::

### ¿Por qué estos tests son valiosos?

Estos tests de integración nos dan **confianza total** en que:

1. **El Context funciona**: El AuthProvider proporciona correctamente las funciones y estado
2. **El flujo es correcto**: Login → Update state → Re-render → Show welcome
3. **Los errores se manejan**: Credenciales inválidas muestran mensajes apropiados
4. **El estado es consistente**: Después de un error, podemos intentar de nuevo
5. **La UX es correcta**: Los elementos aparecen/desaparecen en el momento adecuado

Si estos tests pasan, podemos estar **99% seguros** de que el login funcionará en producción.

:::tip Próximos pasos
En la siguiente sección veremos cómo testar **custom hooks** que usan Context, como `useFetchUser` que combina `useAuth` con llamadas API.
:::

