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

## Análisis del Proyecto: Context en Taller-Testing-Security

El proyecto utiliza **dos Context principales** para gestionar estado global:

| Context | Propósito | Estado gestionado | Acciones |
|---------|-----------|-------------------|----------|
| **AuthContext** | Autenticación de usuarios | `user: User \| undefined`<br/>`isLoading: boolean` | `login()`, `logout()`, `loadUser()` |
| **ProjectContext** | Gestión del proyecto actual | `project: Project \| undefined` | `addProject()`, `removeProject()` |

### 1. AuthContext - Autenticación con JWT

Este Context maneja **todo el ciclo de vida de autenticación**:
- Login con username/password
- Almacenamiento del token JWT
- Carga automática del usuario desde el token
- Logout y limpieza de sesión
- Validación de tokens expirados

#### Código: ui/src/context/AuthContext.tsx

```tsx
import { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import createApiClient from '../api/api-client-factory';
import { User } from '../model/user';
import {
  getCurrentUser,
  isTokenActive,
  setLogoutIfExpiredHandler,
  logout as logoutService,
  setAuthToken
} from '../utils/auth';

type AuthContextType = {
  user: User | undefined;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  loadUser: () => {}
});

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | undefined>(getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadUser = useCallback(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // Al montar, verificamos si hay un token válido
  useEffect(() => {
    if (isTokenActive()) {
      setLogoutIfExpiredHandler(setUser);
      loadUser();
    } else {
      logoutService();
      setUser(undefined);
    }
  }, [loadUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const api = createApiClient();
      setIsLoading(true);
      try {
        const result = await api.token(username, password);
        setAuthToken(result.token);
        setLogoutIfExpiredHandler(setUser);
        loadUser();
      } catch (apiError) {
        throw new Error();
      } finally {
        setIsLoading(false);
      }
    },
    [setUser, loadUser]
  );

  const logout = useCallback(async () => {
    logoutService();
    setUser(undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
```

**Características clave de AuthContext**:

1. **Persistencia de sesión**: Lee el usuario desde el token JWT almacenado en localStorage al iniciar
2. **Validación automática**: El `useEffect` verifica si el token está activo y configura un handler para logout automático si expira
3. **Estado de carga**: `isLoading` permite mostrar spinners durante el login
4. **useCallback**: Optimiza las funciones para evitar re-renders innecesarios
5. **Separación de responsabilidades**: Delega lógica de token a `utils/auth` y llamadas API a `api-client-factory`

### 2. ProjectContext - Gestión del proyecto actual

Context más simple que maneja qué proyecto está activo en la aplicación:

#### Código: ui/src/context/ProjectContext.tsx

```tsx
import { createContext, ReactNode, useCallback, useState } from 'react';
import { Project } from '../model/project';

type ProjectcontextType = {
  project: Project | undefined;
  addProject: (newProject: Project) => void;
  removeProject: () => void;
};

const ProjectContext = createContext<ProjectcontextType>({
  project: undefined,
  addProject: () => {},
  removeProject: () => {}
});

interface Props {
  children: ReactNode;
}

export function ProjectProvider({ children }: Props) {
  const [project, setProject] = useState<Project | undefined>(undefined);

  const addProject = useCallback(
    (newProject: Project) => {
      setProject(newProject);
    },
    [setProject]
  );

  const removeProject = useCallback(() => {
    setProject(undefined);
  }, [setProject]);

  return (
    <ProjectContext.Provider value={{ project, addProject, removeProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export default ProjectContext;
```

**ProjectContext es más simple pero igualmente importante**:
- Almacena el proyecto actualmente seleccionado
- Otros componentes pueden acceder a `project` para mostrar detalles
- `addProject` y `removeProject` permiten cambiar el proyecto activo

### Modelos de datos

#### User (ui/src/model/user.ts)
```tsx
export interface User {
  active: boolean;
  _id: string;
  email: string;
}
```

#### Project (ui/src/model/project.ts)
```tsx
export interface Project {
  _id?: string;
  title: string;
  description: string;
  // ... más propiedades
}
```

## Test de Integración con Context

Ahora viene la parte importante: **cómo testar esta integración con los Context reales del proyecto**. No vamos a mockear el Context; vamos a usar los Provider reales para verificar que todo funciona como en producción.

### Patrón: Helper de Renderizado

Es una buena práctica crear funciones helper que envuelven componentes con los Providers:

```tsx
// Helper para AuthContext
function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
}

// Helper para ProjectContext
function renderWithProject(ui: React.ReactElement) {
  return render(
    <ProjectProvider>
      {ui}
    </ProjectProvider>
  );
}

// Helper combinado (para componentes que necesitan ambos)
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <ProjectProvider>
        {ui}
      </ProjectProvider>
    </AuthProvider>
  );
}
```

**¿Por qué es útil?**

- **DRY (Don't Repeat Yourself)**: No repetimos el Provider en cada test
- **Mantenibilidad**: Si cambiamos el Provider, solo actualizamos un lugar
- **Claridad**: El intent del test queda más claro

### Test 1: ProjectContext - Gestión de proyecto

Primero testeamos el Context más simple para entender los conceptos básicos:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectProvider } from '../../context/ProjectContext';
import { useProject } from '../../hooks/useProject';
import { Project } from '../../model/project';

// Componente de prueba que consume ProjectContext
function ProjectDisplay() {
  const { project, addProject, removeProject } = useProject();
  
  const handleAdd = () => {
    const newProject: Project = {
      _id: '123',
      title: 'Test Project',
      description: 'A test project'
    };
    addProject(newProject);
  };

  return (
    <div>
      {project ? (
        <>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <button onClick={removeProject}>Remove Project</button>
        </>
      ) : (
        <>
          <p>No project</p>
          <button onClick={handleAdd}>Add Project</button>
        </>
      )}
    </div>
  );
}

describe('ProjectContext Integration', () => {
  
  it('debe iniciar sin proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );
    
    expect(screen.getByText('No project')).toBeInTheDocument();
  });

  it('debe agregar un proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );
    
    // Click en agregar
    fireEvent.click(screen.getByText('Add Project'));
    
    // Verificamos que el proyecto se agregó
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
  });

  it('debe remover el proyecto', () => {
    render(
      <ProjectProvider>
        <ProjectDisplay />
      </ProjectProvider>
    );
    
    // Agregamos proyecto
    fireEvent.click(screen.getByText('Add Project'));
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    
    // Removemos proyecto
    fireEvent.click(screen.getByText('Remove Project'));
    expect(screen.getByText('No project')).toBeInTheDocument();
  });
});
```

**¿Qué estamos validando?**

1. **Estado inicial**: El Provider inicia con `project: undefined`
2. **addProject**: Actualiza el estado y re-renderiza componentes
3. **removeProject**: Limpia el estado correctamente

:::tip Diferencia clave con tests unitarios
En un test unitario, mockearíamos `useProject()` así:
```tsx
jest.mock('../../hooks/useProject', () => ({
  useProject: () => ({ 
    project: undefined, 
    addProject: jest.fn(),
    removeProject: jest.fn()
  })
}));
```

Pero en integración **usamos el Provider real** para verificar que la integración completa funciona.
:::

### Test 2: AuthContext - Login y gestión de sesión

AuthContext es más complejo porque maneja **operaciones asíncronas** y **llamadas API**. Necesitamos mockear las dependencias externas pero usar el Context real:

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import * as authUtils from '../../utils/auth';
import createApiClient from '../../api/api-client-factory';

// Mockeamos dependencias externas
jest.mock('../../utils/auth');
jest.mock('../../api/api-client-factory');

// Componente de prueba
function AuthStatus() {
  const { user, isLoading, login, logout } = useAuth();
  
  const handleLogin = () => {
    login('testuser', 'password123');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <>
          <p>User: {user.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button onClick={handleLogin}>Login</button>
        </>
      )}
    </div>
  );
}

describe('AuthContext Integration', () => {
  
  beforeEach(() => {
    // Reseteamos todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Configuramos comportamiento por defecto de auth utils
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(undefined);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(false);
  });

  it('debe iniciar sin usuario si no hay token', () => {
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });

  it('debe hacer login exitosamente', async () => {
    // Mock del API client
    const mockToken = jest.fn().mockResolvedValue({ token: 'fake-jwt-token' });
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    // Mock de getCurrentUser después del login
    const mockUser = { _id: '123', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Hacemos click en login
    fireEvent.click(screen.getByText('Login'));
    
    // Verificamos loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Esperamos a que termine el login
    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
    
    // Verificamos que se llamó al API correctamente
    expect(mockToken).toHaveBeenCalledWith('testuser', 'password123');
    expect(authUtils.setAuthToken).toHaveBeenCalledWith('fake-jwt-token');
  });

  it('debe manejar errores de login', async () => {
    // Mock que simula error de API
    const mockToken = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Intentamos login
    fireEvent.click(screen.getByText('Login'));
    
    // Esperamos a que termine (con error)
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
    
    // El loading debe desaparecer
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('debe hacer logout correctamente', async () => {
    // Configuramos estado inicial con usuario logueado
    const mockUser = { _id: '123', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(true);
    
    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );
    
    // Verificamos que está logueado
    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    
    // Hacemos logout
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
    
    // Verificamos que se llamó al servicio de logout
    expect(authUtils.logout).toHaveBeenCalled();
  });
});
```

**Conceptos clave de este test**:

1. **Mock de dependencias externas**: Mockeamos `auth utils` y `api-client` pero **NO** el AuthContext
2. **Estado de carga**: Verificamos que `isLoading` funciona correctamente
3. **Operaciones asíncronas**: Usamos `waitFor` para esperar cambios de estado
4. **Configuración de estado inicial**: Podemos simular usuario ya logueado con `mockReturnValue`

### Test 3: Múltiples consumidores compartiendo Context

Un test importante es verificar que **múltiples componentes** pueden compartir el mismo Context y sincronizarse correctamente:

```tsx
function UserDisplay() {
  const { user } = useAuth();
  return <div>{user ? `Logged as: ${user.email}` : 'Not logged'}</div>;
}

function LoginButton() {
  const { login, isLoading } = useAuth();
  
  return (
    <button 
      onClick={() => login('user@test.com', 'pass123')}
      disabled={isLoading}
    >
      {isLoading ? 'Logging in...' : 'Login'}
    </button>
  );
}

describe('Multiple consumers sharing AuthContext', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(undefined);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(false);
    
    const mockUser = { _id: '1', email: 'user@test.com', active: true };
    const mockToken = jest.fn().mockResolvedValue({ token: 'token' });
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
  });

  it('debe sincronizar múltiples componentes', async () => {
    render(
      <AuthProvider>
        <UserDisplay />
        <LoginButton />
      </AuthProvider>
    );
    
    // Estado inicial: ambos componentes muestran "no logueado"
    expect(screen.getByText('Not logged')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Click en login desde LoginButton
    fireEvent.click(screen.getByText('Login'));
    
    // Ambos componentes deben mostrar estado de carga
    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    
    // Después del login, UserDisplay debe actualizarse automáticamente
    await waitFor(() => {
      expect(screen.getByText('Logged as: user@test.com')).toBeInTheDocument();
    });
    
    // Y LoginButton debe volver al estado normal
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
```

**¿Por qué este test es valioso?**

- Verifica que el Context **realmente comparte estado** entre componentes
- Detecta problemas de sincronización o renders innecesarios
- Simula cómo se usa el Context en la aplicación real (múltiples componentes consumiendo)

## Ejemplo Complejo: Testing con Formularios

El siguiente patrón común es testar formularios que usan Context. Veamos un componente de login más real con formulario controlado:

### Componente: LoginForm con estado local y Context

```tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  // Estado local del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estado global de autenticación
  const { login, isLoading, user } = useAuth();

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
  if (user) {
    return <div>Welcome, {user.email}!</div>;
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div role="alert">{error}</div>}
    </form>
  );
}
```

### Análisis del flujo de datos

Este componente demuestra **varios patrones importantes**:

1. **Estado local + Estado global**:

   - `email` y `password` son locales (solo el formulario los necesita)
   - `user` e `isLoading` son globales (múltiples componentes los necesitan)

2. **Renderizado condicional**:

   - Si está autenticado → muestra bienvenida
   - Si no → muestra formulario

3. **Manejo de errores**:

   - Capturamos errores del Context con try/catch
   - Mostramos mensajes al usuario

4. **Accesibilidad**:

   - Usamos `aria-label` para screen readers
   - Usamos `role="alert"` para errores

## Tests completos del LoginForm

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from '../LoginForm';
import * as authUtils from '../../utils/auth';
import createApiClient from '../../api/api-client-factory';

jest.mock('../../utils/auth');
jest.mock('../../api/api-client-factory');

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LoginForm Integration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(undefined);
    (authUtils.isTokenActive as jest.Mock).mockReturnValue(false);
  });

  it('debe renderizar el formulario inicialmente', () => {
    renderWithAuth(<LoginForm />);
    
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('debe hacer login exitosamente', async () => {
    const user = userEvent.setup();
    
    // Mock exitoso
    const mockToken = jest.fn().mockResolvedValue({ token: 'jwt-token' });
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    const mockUser = { _id: '1', email: 'test@example.com', active: true };
    (authUtils.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    
    renderWithAuth(<LoginForm />);
    
    // Llenar formulario
    await user.type(screen.getByLabelText('email'), 'test@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    
    // Submit
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Verificar mensaje de bienvenida
    await waitFor(() => {
      expect(screen.getByText('Welcome, test@example.com!')).toBeInTheDocument();
    });
    
    // El formulario debe desaparecer
    expect(screen.queryByLabelText('email')).not.toBeInTheDocument();
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    const user = userEvent.setup();
    
    // Mock que falla
    const mockToken = jest.fn().mockRejectedValue(new Error());
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'bad@example.com');
    await user.type(screen.getByLabelText('password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // Esperar error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    
    // Formulario sigue visible
    expect(screen.getByLabelText('email')).toBeInTheDocument();
  });

  it('debe deshabilitar el botón durante login', async () => {
    const user = userEvent.setup();
    
    // Mock que demora
    const mockToken = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    (createApiClient as jest.Mock).mockReturnValue({ token: mockToken });
    
    renderWithAuth(<LoginForm />);
    
    await user.type(screen.getByLabelText('email'), 'test@example.com');
    await user.type(screen.getByLabelText('password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    // El botón debe estar deshabilitado y mostrar texto de carga
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Logging in...');
  });
});
```

### ¿Qué técnicas nuevas vemos aquí?

1. **userEvent vs fireEvent**:

   - `userEvent` simula interacciones más realistas (typing completo, focus, blur)
   - `fireEvent` dispara eventos directamente (más rápido pero menos realista)

2. **Testing de estados de UI**:

   - Botón deshabilitado durante loading
   - Texto del botón cambia
- Focus/blur automático

3. **Manejo de Promises demoradas**:

   - Simulamos delays de red para testear loading states

## Cuándo usar qué estrategia

Ahora que vimos varios enfoques, ¿cuándo usar cada uno?

### Tests unitarios con Context mockeado

**Cuándo**:

- Haces llamadas asíncronas (API, login, etc.)
- Solo te importa la lógica del componente (no la integración)
- Quieres tests rápidos y aislados

**Cómo**:
```tsx
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ 
    user: mockUser,
    login: mockLogin,
    // ...
  })
}));
```

### Tests de integración con Provider real

**Cuándo**:

- Quieres verificar el flujo completo (Provider → Consumer)
- Testeas múltiples componentes interactuando
- Verificas sincronización de estado entre componentes

**Cómo**:
```tsx
render(
  <AuthProvider>
    <YourComponent />
  </AuthProvider>
);
```

### Guía rápida de queries

Al buscar elementos en tests con Context, usa estas queries según el caso:

- **`getBy*`**: Cuando **esperas** que el elemento exista (falla si no está)
- **`queryBy*`**: Cuando **verificas ausencia** (retorna null si no está)
- **`findBy*`**: Cuando **esperas que aparezca** asincrónicamente (equivale a `waitFor` + `getBy`)

```tsx
// Ejemplo de uso de queries
const button = screen.getByRole('button', { name: 'Login' });  // Falla si no existe
const error = screen.queryByRole('alert');  // Retorna null si no existe
const welcome = await screen.findByText('Welcome!');  // Espera hasta que aparezca
```

:::warning Errores comunes
1. **No usar `await` con `waitFor`**: El test pasa aunque falle
2. **Usar `getBy` para verificar ausencia**: Lanza error en lugar de pasar
3. **No limpiar estado entre tests**: Los tests se afectan mutuamente
4. **No mockear dependencias externas**: Los tests fallan por problemas de red/API
:::

## Resumen: Context Testing Best Practices

Hemos cubierto testing de **AuthContext** y **ProjectContext** del proyecto Taller-Testing-Security. Estos son los patrones clave:

| Concepto | Descripción | Ejemplo |
|----------|-------------|---------|
| **Helper de renderizado** | Función que envuelve componentes con Provider | `renderWithAuth(<Component />)` |
| **Mock de dependencias externas** | Mockear APIs/utils, no el Context | `jest.mock('../../utils/auth')` |
| **waitFor para async** | Esperar cambios de estado asíncronos | `await waitFor(() => expect(...))` |
| **queryBy para ausencia** | Verificar que elementos NO existen | `expect(screen.queryByText(...)).not.toBeInTheDocument()` |
| **userEvent para interacciones** | Simular typing y clicks realistas | `await user.type(input, 'text')` |
| **beforeEach para limpieza** | Resetear mocks entre tests | `jest.clearAllMocks()` |

### Tests del proyecto cubiertos

| Context | Tests realizados | Conceptos validados |
|---------|-----------------|---------------------|
| **ProjectContext** | Agregar/remover proyecto | Estado inicial, mutaciones, sincronización |
| **AuthContext** | Login, logout, estados de carga | Async, mocks, loading states, múltiples consumidores |
| **LoginForm** | Formulario completo con Context | userEvent, validaciones, estados de UI |

### Checklist de testing con Context

Al testear componentes con Context, asegúrate de:

- ✅ Usar el Provider real (no mockear el Context)
- ✅ Mockear **solo** dependencias externas (APIs, localStorage, etc.)
- ✅ Testear estado inicial del Provider
- ✅ Verificar sincronización entre múltiples consumidores
- ✅ Probar manejo de errores (API failures, validaciones)
- ✅ Validar estados de carga (isLoading, spinners, botones deshabilitados)
- ✅ Usar `waitFor` para operaciones asíncronas
- ✅ Limpiar mocks con `beforeEach`

:::tip Próximos pasos
En la siguiente sección (`msw.md`) veremos cómo usar **Mock Service Worker** para simular APIs completas sin mockear funciones individuales. Esto nos permitirá testear flujos end-to-end con datos realistas.
:::

