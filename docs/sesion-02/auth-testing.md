---
sidebar_position: 8
title: "Testing de Autenticación"
---

# Testing de Autenticación

## Introducción

La autenticación es uno de los **aspectos más críticos** de cualquier aplicación. Un bug en el sistema de autenticación puede significar:
- **Brechas de seguridad**: Usuarios no autorizados acceden a datos sensibles
- **Pérdida de confianza**: Los usuarios abandonan la aplicación
- **Problemas legales**: Violación de regulaciones (GDPR, etc.)

Por eso, testear autenticación exhaustivamente no es opcional—es **esencial**. En esta sección aprenderemos a testear:

1. **Login/Register**: Verificar que las credenciales se validan correctamente
2. **JWT Tokens**: Asegurar que los tokens se generan y verifican bien
3. **Rutas protegidas**: Validar que solo usuarios autenticados pueden acceder
4. **Middleware de auth**: Testear la lógica de autenticación aisladamente
5. **Flujos completos**: Login → Acceso a recursos → Logout

## Flujo de Autenticación Típico

Antes de comenzar con los tests, entendamos cómo funciona la autenticación con JWT (JSON Web Tokens):

```
┌──────────┐                                           ┌──────────┐
│ Cliente  │                                           │ Backend  │
└────┬─────┘                                           └────┬─────┘
     │                                                      │
     │  1. POST /api/auth/login                             │
     │     { email, password }                              │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                                  2. Verify credentials
     │                                     in database      │
     │                                         │            │
     │                                         ▼            │
     │                                  3. Generate JWT     │
     │                                     token            │
     │                                         │            │
     │  4. Response                            │            │
     │     { token: "eyJhbG...", user: {...} } │            │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
     │  5. Store token (localStorage, cookie, etc.)         │
     │                                                      │
     │  6. Request to protected endpoint                    │
     │     GET /api/profile                                 │
     │     Authorization: Bearer eyJhbG...                  │
     ├─────────────────────────────────────────────────────>│
     │                                                      │
     │                                  7. Verify token     │
     │                                     signature        │
     │                                         │            │
     │                                         ▼            │
     │  8. Response with protected data                     │
     │     { user: { id, email, ... } }                     │
     │<─────────────────────────────────────────────────────┤
     │                                                      │
```

### Componentes clave

1. **Login endpoint**: Acepta credenciales y retorna JWT
2. **JWT Token**: String encriptado que contiene info del usuario
3. **Auth middleware**: Verifica el token en cada request
4. **Protected routes**: Solo accesibles con token válido



## Análisis del Sistema de Autenticación: Taller-Testing-Security

Vamos a analizar el sistema de autenticación real del proyecto **Taller-Testing-Security** que usa JWT (JSON Web Tokens) y bcrypt para manejar passwords de forma segura.

### Instalación de Dependencias

```bash
npm install jsonwebtoken bcrypt http-status-codes
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

### Estructura del Sistema de Auth

```
api/src/
├── routes/
│   └── AuthRouter.ts          # Define endpoint /login
├── components/
│   ├── Auth/
│   │   ├── index.ts            # Controller (login, signup, user)
│   │   ├── service.ts          # Lógica de negocio
│   │   ├── validation.ts       # Joi schemas
│   │   └── interface.ts        # TypeScript interfaces
│   ├── User/
│   │   └── model.ts            # Mongoose model con comparePassword
└── config/
    └── server/server.ts     # Secret key de JWT
```

### Código Real: api/src/routes/AuthRouter.ts

```typescript
import { AuthComponent } from '@/components';
import { Router } from 'express';

const router: Router = Router();

// POST /v1/auth/login
router.post('/login', AuthComponent.login);

export default router;
```

**Arquitectura simple**: El router delega todo al controller `AuthComponent.login`.

### Controller: api/src/components/Auth/index.ts

El controller maneja la lógica HTTP (request/response) y delega la lógica de negocio al service:

```typescript
import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { IUserModel } from '@/components/User/model';
import HttpError from '@/config/error';
import AuthService from './service';
import app from '@/config/server/server';

/**
 * POST /v1/auth/login
 * Autentica usuario y retorna JWT token
 */
export async function login(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validar credenciales con AuthService
    const userModel: IUserModel = await AuthService.getUser(req.body);

    // 2. Generar JWT token
    const token: string = jwt.sign(
      { id: userModel._id, email: userModel.email },
      app.get('secret'),  // Secret key desde config
      { expiresIn: '60m' }
    );

    // 3. Retornar token en header y body
    res
      .status(HttpStatus.OK)
      .header({ Authorization: token })
      .send({ token: token });
      
  } catch (error) {
    if (error.code === 500) {
      return next(new HttpError(error.message.status, error.message));
    }
    res.status(HttpStatus.BAD_REQUEST).send({
      message: 'Invalid Login'
    });
  }
}
```

**Puntos clave**:
- Token se genera con `jwt.sign()` usando secret del servidor
- Expiración de 60 minutos
- Token se retorna en header **y** body
- Manejo de errores con HttpError personalizado

### Service: api/src/components/Auth/service.ts

El service contiene la lógica de negocio: validación, comparación de passwords, creación de usuarios:

```typescript
import Joi from 'joi';
import AuthValidation from './validation';
import UserModel, { IUserModel } from '@/components/User/model';

const AuthService = {
  /**
   * Autentica usuario con email y password
   */
  async getUser(body: IUserModel): Promise<IUserModel> {
    // 1. Validar con Joi
    const validate = AuthValidation.getUser(body);
    if (validate.error) {
      throw new Error(validate.error.message);
    }

    // 2. Buscar usuario por email
    const user: IUserModel = await UserModel.findOne({
      email: body.email
    });

    // 3. Comparar password con bcrypt (método del model)
    const isMatched = user && (await user.comparePassword(body.password));

    if (isMatched) {
      return user;
    }

    throw new Error('Invalid password or email');
  }
};

export default AuthService;
```

**Arquitectura en capas**:
1. **Validación con Joi**: Formato de email, campos requeridos
2. **Lógica de negocio**: Buscar usuario, comparar passwords
3. **Mongoose**: Interacción con MongoDB

### Validation: api/src/components/Auth/validation.ts

```typescript
import Joi from 'joi';

class AuthValidation {
  /**
   * Valida datos para login
   */
  getUser(params: any): Joi.ValidationResult {
    const schema = Joi.object().keys({
      password: Joi.string().required(),
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
    });

    return schema.validate(params);
  }
}

export default new AuthValidation();
```

**Validaciones con Joi**:
- Email con formato válido (mínimo 2 segmentos de dominio)
- Password requerido
- Campos obligatorios

### Cómo funciona comparePassword en el Model

El User model de Mongoose tiene un método `comparePassword` que usa bcrypt:

```typescript
// api/src/components/User/model.ts (simplificado)
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }
});

// Hash password antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
```

**Seguridad automática**:
- Password se hashea automáticamente con `pre('save')`
- `select: false` evita que el password se retorne en queries por defecto
- `comparePassword` encapsula la lógica de bcrypt



## Best Practices de Seguridad Implementadas

### 1. Passwords Hasheados Automáticamente

```typescript
// ✅ El model hashea el password antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});
```

### 2. Mensajes de Error Genéricos

```typescript
// ✅ No revela si el problema es email o password
throw new Error('Invalid password or email');

// ❌ MAL: Revela información
if (!user) throw new Error('Email not found');
if (!isMatched) throw new Error('Wrong password');
```

Esto previene **user enumeration attacks** (adivinar qué emails existen).

### 3. Tokens con Expiración

```typescript
jwt.sign(
  { id: userModel._id, email: userModel.email },
  app.get('secret'),
  { expiresIn: '60m' }  // Token expira en 1 hora
);
```

### 4. Password No se Retorna en Queries

```typescript
// En el schema de Mongoose
password: { type: String, required: true, select: false }
```

Con `select: false`, el password **nunca** se incluye automáticamente en las queries.



## Tests de Autenticación

Ahora vamos a testear el sistema de autenticación completo usando MongoDB Memory Server.

### Setup: api/src/tests/Auth.integration.test.ts

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import { Server } from '../../config/server/server';
import { UserModel } from '../../components/User/model';
import { clearDatabase } from '../db-helper';

describe('Auth API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    const serverInstance = new Server();
    app = serverInstance.app;
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==================== POST /v1/auth/login ====================
  
  describe('POST /v1/auth/login', () => {
    it('debe hacer login con credenciales válidas', async () => {
      // Arrange: Crear usuario en MongoDB
      await UserModel.create({
        email: 'alice@example.com',
        password: 'password123'
      });

      // Act: Intentar login
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'password123'
        })
        .expect(200);

      // Assert: Verificar token y estructura
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
      
      // Verificar que el token está en el header
      expect(response.headers.authorization).toBeDefined();
    });

    it('debe rechazar credenciales inválidas', async () => {
      // Crear usuario
      await UserModel.create({
        email: 'alice@example.com',
        password: 'password123'
      });

      // Intentar login con password incorrecta
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid Login');
    });

    it('debe rechazar email que no existe', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid Login');
    });

    it('debe validar campos requeridos con Joi', async () => {
      // Sin email
      let response = await request(app)
        .post('/v1/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.message).toContain('email');

      // Sin password
      response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('debe validar formato de email con Joi', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  // ==================== TEST DE TOKENS JWT ====================
  
  describe('JWT Token Generation', () => {
    it('debe generar token válido que contiene user data', async () => {
      // Crear usuario
      await UserModel.create({
        email: 'tokentest@example.com',
        password: 'password123'
      });

      // Login
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'tokentest@example.com',
          password: 'password123'
        });

      const { token } = response.body;

      // Decodificar token (sin verificar, solo para inspeccionar)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', 'tokentest@example.com');
      expect(decoded).toHaveProperty('exp'); // Expiration time
    });

    it('debe generar token con expiración de 60 minutos', async () => {
      // Crear usuario y hacer login
      await UserModel.create({
        email: 'expiry@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'expiry@example.com',
          password: 'password123'
        });

      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(response.body.token);

      // Verificar que el token expira en ~60 minutos
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      
      // Debe expirar entre 59 y 61 minutos (con margen)
      expect(expiresIn).toBeGreaterThan(59 * 60);
      expect(expiresIn).toBeLessThan(61 * 60);
    });
  });
});
```

### Análisis de los Tests

#### 1. **Tests de Login**

```typescript
it('debe hacer login con credenciales válidas', async () => {
  // Crear usuario real en MongoDB
  await UserModel.create({ email, password });
  
  // Verificar que retorna token
  expect(response.body).toHaveProperty('token');
  
  // Verificar que está en header también
  expect(response.headers.authorization).toBeDefined();
});
```

**Por qué es importante**: Verifica que el flujo completo funciona (creación de usuario → hashing de password → comparación → generación de token).

#### 2. **Tests de Seguridad**

```typescript
it('debe rechazar credenciales inválidas', async () => {
  // Mensaje genérico: no revela si es email o password
  expect(response.body.message).toBe('Invalid Login');
});

it('debe rechazar email que no existe', async () => {
  // Mismo mensaje: previene user enumeration
  expect(response.body.message).toBe('Invalid Login');
});
```

**Seguridad verificada**: Ambos casos retornan el mismo error genérico.

#### 3. **Tests de Validación**

```typescript
it('debe validar formato de email con Joi', async () => {
  // Joi rechaza antes de llegar a la base de datos
  expect(response.body.message).toContain('email');
});
```

**Validación en capas**: Joi valida primero, luego Mongoose, luego lógica de negocio.

#### 4. **Tests de Tokens JWT**

```typescript
it('debe generar token válido que contiene user data', async () => {
  const decoded = jwt.decode(token);
  expect(decoded).toHaveProperty('id');
  expect(decoded).toHaveProperty('email');
  expect(decoded).toHaveProperty('exp');
});
```

**Verificación completa**: Verifica estructura del token, datos incluidos, y expiración.



## Resumen

En esta sección aprendimos a testear autenticación con:

1. **JWT Tokens**: Generación, validación, expiración
2. **bcrypt**: Hashing automático de passwords en Mongoose
3. **Joi**: Validación de credenciales (email formato, campos requeridos)
4. **MongoDB Memory Server**: Tests con base de datos real en memoria
5. **Best Practices de Seguridad**:
   - Mensajes de error genéricos
   - Passwords nunca en texto plano
   - Tokens con expiración
   - Password no se retorna en queries

:::tip Tests de Seguridad

Los tests de autenticación son **críticos** para la seguridad:
- Verifican que passwords se hashean correctamente
- Validan que tokens expiran
- Confirman que credenciales inválidas son rechazadas
- Detectan vulnerabilidades de seguridad temprano

:::

:::info Próximo paso

En la siguiente sección veremos **testing de hooks personalizados** en React, como `useAuth` que consume estos endpoints de autenticación.

:::
