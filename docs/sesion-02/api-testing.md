---
sidebar_position: 5
title: "Testing de APIs Backend"
---

# Testing de APIs en Backend

## Introducción

Hasta ahora hemos testeado el frontend: componentes, hooks, Context. Pero las aplicaciones completas también tienen un **backend con APIs** que necesitan testing riguroso. Los tests de backend son fundamentalmente diferentes porque:

1. **No hay UI**: Testeamos endpoints HTTP directamente
2. **Estado persistente**: Interactuamos con bases de datos
3. **Autenticación y autorización**: Verificamos permisos y seguridad
4. **Contratos de API**: Validamos que las respuestas cumplan con el schema esperado

En esta sección aprenderemos a testear APIs con **Express** usando **Supertest**, una librería que nos permite hacer requests HTTP a nuestra API sin necesidad de levantar un servidor real.

## ¿Por qué testear APIs?

Las APIs son el **contrato** entre frontend y backend. Si un endpoint cambia inesperadamente (response format, status codes, validaciones), el frontend puede romper aunque sus tests pasen. Por eso necesitamos:

### Tests que validen el contrato

```typescript
// ❌ Frontend asume que siempre hay 'id'
const user = await fetch('/api/users/123').then(r => r.json());
console.log(user.id.toUpperCase()); // ¡Crash si 'id' no existe!

// ✅ Test de API valida que 'id' siempre está presente
expect(response.body).toHaveProperty('id');
```

### Tests que detecten regresiones

Sin tests, cambios "inocentes" pueden romper funcionalidad:

```typescript
// Antes: retornaba 200 con { error: 'Not found' }
// Después: retorna 404 con { error: 'Not found' }
// Frontend que checkeaba response.ok ahora falla
```

### Tests que documenten comportamiento

Los tests son **documentación viva** de cómo funciona la API:

```typescript
it('debe retornar 400 si email ya existe', async () => {
  // Este test documenta que emails duplicados son un error
});
```



## Análisis del Proyecto: Taller-Testing-Security

Antes de empezar a testear, vamos a analizar el API REST real del proyecto **Taller-Testing-Security** que ya existe en `api/src/`. 

### Características del Backend

Este backend incluye:
- **CRUD completo** de Users y Projects (Create, Read, Update, Delete)
- **Validaciones con Joi** (campos requeridos, formatos)
- **Arquitectura en capas** (Router → Controller → Service → Model)
- **MongoDB con Mongoose** (base de datos real)
- **Autenticación JWT** con bcrypt para passwords

### Estructura del Backend

```
api/src/
├── routes/          # Definición de endpoints
│   ├── UserRouter.ts
│   └── ProjectsRouter.ts
├── components/
│   ├── User/
│   │   ├── model.ts      # Mongoose schema
│   │   ├── service.ts    # Lógica de negocio
│   │   ├── validation.ts # Joi schemas
│   │   └── interface.ts
│   └── Projects/
│       ├── model.ts
│       ├── service.ts
│       └── validation.ts
└── index.ts         # Servidor Express
```

### Código Real: api/src/routes/UserRouter.ts

Este es el router real del proyecto que vamos a testear:

```typescript
import { Router } from 'express';
import { UserComponent } from '@/components';

const router: Router = Router();

// GET /api/v1/users - Obtener todos los usuarios
router.get('/', UserComponent.findAll);

// POST /api/v1/users - Crear nuevo usuario
router.post('/', UserComponent.create);

// GET /api/v1/users/:id - Obtener usuario por ID
router.get('/:id', UserComponent.findOne);

// DELETE /api/v1/users/:id - Eliminar usuario
router.delete('/:id', UserComponent.remove);

export default router;
```

### Controller: api/src/components/User/index.ts

Los controladores manejan las requests y responses:

```typescript
import UserService from './service';
import { HttpError } from '@/config/error';
import { IUserModel } from './model';
import { NextFunction, Request, Response } from 'express';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users: IUserModel[] = await UserService.findAll();
    res.status(200).json(users);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}

export async function findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user: IUserModel = await UserService.findOne(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user: IUserModel = await UserService.insert(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user: IUserModel = await UserService.remove(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(new HttpError(error.message.status, error.message));
  }
}
```

### Service Layer: api/src/components/User/service.ts

La capa de servicio contiene la lógica de negocio:

```typescript
import Joi from 'joi';
import UserModel, { IUserModel } from './model';
import UserValidation from './validation';
import { IUserService } from './interface';
import { Types } from 'mongoose';

const UserService: IUserService = {
  async findAll(): Promise<IUserModel[]> {
    try {
      return await UserModel.find({});
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async findOne(id: string): Promise<IUserModel> {
    try {
      // Validar ID con Joi
      const validate: Joi.ValidationResult = UserValidation.getUser({ id });
      
      if (validate.error) {
        throw new Error(validate.error.message);
      }

      return await UserModel.findOne(
        { _id: Types.ObjectId(id) },
        { password: 0 } // Excluir password de la respuesta
      );
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async insert(body: IUserModel): Promise<IUserModel> {
    try {
      // Validar datos con Joi
      const validate: Joi.ValidationResult<IUserModel> = UserValidation.createUser(body);

      if (validate.error) {
        throw new Error(validate.error.message);
      }

      const user: IUserModel = await UserModel.create(body);
      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async remove(id: string): Promise<IUserModel> {
    try {
      const validate: Joi.ValidationResult = UserValidation.removeUser({ id });

      if (validate.error) {
        throw new Error(validate.error.message);
      }

      const user: IUserModel = await UserModel.findOneAndRemove({
        _id: Types.ObjectId(id)
      });

      return user;
    } catch (error) {
      throw new Error(error.message);
    }
  }
};

export default UserService;
```

### Validation: api/src/components/User/validation.ts

Schemas de validación con Joi:

```typescript
import Joi from 'joi';
import Validation from '@/components/validation';
import { IUserModel } from './model';

class UserValidation extends Validation {
  createUser(params: IUserModel): Joi.ValidationResult<IUserModel> {
    const schema: Joi.ObjectSchema = Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
    });

    return schema.validate(params);
  }

  getUser(body: { id: string }): Joi.ValidationResult<{ id: string }> {
    const schema: Joi.ObjectSchema = Joi.object().keys({
      id: this.customJoi.objectId().required()
    });

    return schema.validate(body);
  }

  removeUser(body: { id: string }): Joi.ValidationResult<{ id: string }> {
    const schema: Joi.ObjectSchema = Joi.object().keys({
      id: this.customJoi.objectId().required()
    });

    return schema.validate(body);
  }
}

export default new UserValidation();
```

### Model: api/src/components/User/model.ts

Mongoose schema (fragmento relevante):

```typescript
import * as bcrypt from 'bcrypt';
import * as connections from '@/config/connection/connection';
import { Document, Schema } from 'mongoose';

export interface IUserModel extends Document {
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  tokens?: AuthToken[];
  comparePassword?: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUserModel>(
  {
    email: {
      type: String,
      unique: true,
      trim: true
    },
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    tokens: Array
  },
  {
    collection: 'users',
    versionKey: false
  }
);

export default connections.db.model<IUserModel>('UserModel', UserSchema);
```
### Arquitectura en Capas

El proyecto usa una **arquitectura MVC mejorada** con separación clara de responsabilidades:

```
Request → Router → Controller → Service → Model → Database
```

**Ventajas**:
- **Router**: Solo define rutas y métodos HTTP
- **Controller**: Maneja Request/Response, validaciones básicas
- **Service**: Lógica de negocio, validación con Joi
- **Model**: Schema de Mongoose, interacción con MongoDB

Esta separación facilita el testing porque podemos:
- Testear servicios sin Express (tests unitarios)
- Testear routers con Supertest (tests de integración)
- Mockear capas individuales



## Configuración Completa del Entorno de Testing

Ahora que conocemos la estructura del proyecto, vamos a configurar el entorno de testing paso a paso.

### 1. Instalación de Dependencias Base

```bash
# Supertest + tipos para TypeScript
npm install --save-dev supertest @types/supertest

# Jest (si aún no lo tienes)
npm install --save-dev jest ts-jest @types/jest

# Express tipos
npm install --save-dev @types/express
```

### 2. ¿Qué es Supertest?

**Supertest** permite hacer requests HTTP a tu app Express sin levantar un servidor real:

**❌ Enfoque antiguo (complejo y frágil)**:

```typescript
// 1. Levantar servidor en puerto aleatorio
const server = app.listen(3000);

// 2. Hacer request con fetch/axios
const response = await fetch('http://localhost:3000/api/users');

// 3. Cerrar servidor
server.close();
```

Problemas:
- Necesitas puerto disponible
- Tests más lentos (networking real)
- Puede fallar por problemas de red
- Lifecycle del servidor complejo

**✅ Enfoque moderno (simple y confiable)**:

```typescript
import request from 'supertest';

const response = await request(app)
  .get('/v1/users')
  .expect(200);
```

Ventajas:
- Sin puerto real, sin networking
- Tests ultra rápidos
- Determinista (mismo resultado siempre)
- API limpia y expresiva

### 3. Instalación de MongoDB Memory Server

```bash
npm install --save-dev @shelf/jest-mongodb mongodb-memory-server
```

Para testear con una base de datos real sin afectar desarrollo:

```bash
npm install --save-dev @shelf/jest-mongodb mongodb-memory-server
```

**MongoDB Memory Server** es una base de datos MongoDB completa que:
- Se ejecuta completamente en memoria (muy rápido)
- Se crea y destruye automáticamente por test
- No requiere instalación de MongoDB
- Aísla completamente los tests

### 4. Configuración de Jest: jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // MongoDB Memory Server
  globalSetup: './src/tests/setup.ts',
  globalTeardown: './src/tests/teardown.ts',
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 5. Setup Global: src/tests/setup.ts

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  // Crear servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Guardar URI para tests individuales
  process.env.MONGO_URI = mongoUri;
  
  // Conectar Mongoose
  await mongoose.connect(mongoUri);
}
```

### 6. Teardown Global: src/tests/teardown.ts

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown() {
  // Desconectar Mongoose
  await mongoose.disconnect();
  
  // Parar servidor MongoDB
  const mongoServer = await MongoMemoryServer.create();
  await mongoServer.stop();
}
```

### 7. Helper de Base de Datos: src/tests/db-helper.ts

```typescript
import mongoose from 'mongoose';
import { UserModel } from '../components/User/model';

/**
 * Limpia todas las colecciones de la base de datos
 */
export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Crea usuarios de prueba
 */
export async function seedUsers(users: Array<{ name: string; email: string; password: string }>) {
  const createdUsers = [];
  
  for (const user of users) {
    const created = await UserModel.create(user);
    createdUsers.push(created);
  }
  
  return createdUsers;
}
```

### 8. Scripts de package.json

Agrega estos scripts para ejecutar los tests fácilmente:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api"
  }
}
```

### 9. Ejecutar los Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests de integración de User
npm test User.integration

# Ejecutar con coverage
npm test:coverage

# Ejecutar en modo watch (re-ejecuta al cambiar código)
npm test:watch

# Solo tests de API
npm test:api
```

:::tip Verificación del Setup

Para verificar que todo está configurado correctamente:

1. **Verifica las dependencias**: `npm list supertest mongodb-memory-server`
2. **Corre un test simple**: Crea un test básico que solo haga `expect(true).toBe(true)`
3. **Verifica MongoDB Memory Server**: El primer test será lento (~10s) porque descarga MongoDB
4. **Tests subsecuentes**: Deben ser muy rápidos (&lt;100ms cada uno)

:::



## Tests de Integración de API

Ahora vamos a testear toda la API de forma exhaustiva usando **MongoDB Memory Server**.

### Test Completo: api/src/tests/User.integration.test.ts

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import { Server } from '../../config/server/server';
import { clearDatabase, seedUsers } from './db-helper';

describe('User API Integration Tests', () => {
  let app: any;

  // Setup antes de todos los tests
  beforeAll(async () => {
    // Conectar a MongoDB Memory Server
    await mongoose.connect(process.env.MONGO_URI!);
    
    // Crear instancia de la app Express
    const serverInstance = new Server();
    app = serverInstance.app;
  });

  // Limpiar base de datos antes de cada test
  beforeEach(async () => {
    await clearDatabase();
  });

  // Cerrar conexión después de todos los tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ==================== GET /v1/users ====================
  
  describe('GET /v1/users', () => {
    it('debe retornar array vacío inicialmente', async () => {
      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar todos los usuarios', async () => {
      // Arrange: crear usuarios de prueba en MongoDB
      await seedUsers([
        { name: 'Alice', email: 'alice@test.com', password: 'password123' },
        { name: 'Bob', email: 'bob@test.com', password: 'password456' }
      ]);

      // Act: obtener todos los usuarios
      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('name');
      // ✅ Password NO debe retornarse (select: false en el schema)
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('debe retornar usuarios con estructura correcta de Mongoose', async () => {
      await seedUsers([
        { name: 'Test User', email: 'test@example.com', password: 'password123' }
      ]);

      const response = await request(app)
        .get('/v1/users')
        .expect(200);

      // Mongoose retorna _id como ObjectId
      expect(response.body[0]).toMatchObject({
        _id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });

  // ==================== GET /v1/users/:id ====================
  
  describe('GET /v1/users/:id', () => {
    it('debe retornar usuario específico por ID', async () => {
      // Crear usuario en MongoDB
      const [user] = await seedUsers([
        { name: 'Test User', email: 'test@example.com', password: 'password123' }
      ]);

      // Obtener por ID
      const response = await request(app)
        .get(`/v1/users/${user._id}`)
        .expect(200);

      expect(response.body._id).toBe(user._id.toString());
      expect(response.body.email).toBe('test@example.com');
    });

    it('debe retornar 400 con ID inválido de MongoDB', async () => {
      const response = await request(app)
        .get('/v1/users/invalid-id')
        .expect(400);

      expect(response.body.error).toContain('Cast to ObjectId failed');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // ID válido pero no existe en DB
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  // ==================== POST /v1/users ====================
  
  describe('POST /v1/users', () => {
    it('debe crear usuario exitosamente', async () => {
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'MySecurePassword123'
      };

      const response = await request(app)
        .post('/v1/users')
        .send(newUser)
        .expect(201);

      // Verificar que retorna el usuario creado
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.name).toBe(newUser.name);
      expect(response.body).toHaveProperty('_id');
      
      // ✅ Password debe estar hasheado (bcrypt)
      expect(response.body.password).not.toBe(newUser.password);
      expect(response.body.password).toMatch(/^\$2[aby]\$/); // bcrypt pattern
    });

    it('debe validar email requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ name: 'Test User', password: 'password123' })
        .expect(400);

      // Joi validation error
      expect(response.body.error).toContain('email');
    });

    it('debe validar formato de email (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ 
          email: 'invalid-email', 
          name: 'Test', 
          password: 'password123' 
        })
        .expect(400);

      expect(response.body.error).toContain('valid email');
    });

    it('debe validar name requerido (Joi)', async () => {
      const response = await request(app)
        .post('/v1/users')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('debe rechazar email duplicado (Mongoose unique)', async () => {
      // Crear primer usuario
      await request(app)
        .post('/v1/users')
        .send({ 
          email: 'test@example.com', 
          name: 'User 1', 
          password: 'password123' 
        });

      // Intentar crear segundo usuario con mismo email
      const response = await request(app)
        .post('/v1/users')
        .send({ 
          email: 'test@example.com', 
          name: 'User 2', 
          password: 'password456' 
        })
        .expect(500); // Mongoose duplicate key error

      expect(response.body.error).toContain('duplicate');
    });
  });

  // ==================== DELETE /v1/users/:id ====================
  
  describe('DELETE /v1/users/:id', () => {
    it('debe eliminar usuario existente', async () => {
      // Crear usuario
      const [user] = await seedUsers([
        { name: 'To Delete', email: 'delete@test.com', password: 'password123' }
      ]);

      // Eliminar usuario
      await request(app)
        .delete(`/v1/users/${user._id}`)
        .expect(204); // 204 No Content

      // Verificar que ya no existe
      const getResponse = await request(app)
        .get(`/v1/users/${user._id}`)
        .expect(404);
    });

    it('debe retornar 404 si usuario no existe', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/v1/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('debe validar ID de MongoDB', async () => {
      const response = await request(app)
        .delete('/v1/users/invalid-id')
        .expect(400);

      expect(response.body.error).toContain('Cast to ObjectId failed');
    });
  });
});
```

### Puntos Clave de los Tests

#### 1. **MongoDB Memory Server**
```typescript
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI!);
});
```
- Base de datos real en memoria
- Aislamiento completo entre tests
- Tests rápidos (sin I/O de disco)

#### 2. **Validación en Capas**
```typescript
// Capa 1: Joi validation (email formato, campos requeridos)
expect(response.body.error).toContain('valid email');

// Capa 2: Mongoose validation (unique constraint)
expect(response.body.error).toContain('duplicate');

// Capa 3: MongoDB constraints (ObjectId format)
expect(response.body.error).toContain('Cast to ObjectId failed');
```

#### 3. **Seguridad Verificada**
```typescript
// ✅ Password hasheado
expect(response.body.password).toMatch(/^\$2[aby]\$/);

// ✅ Password no expuesto en GET
expect(response.body[0]).not.toHaveProperty('password');
```

#### 4. **IDs Reales de MongoDB**
```typescript
// Usar ObjectId real para tests
const fakeId = new mongoose.Types.ObjectId();

// Verificar formato correcto
expect(response.body._id).toBe(user._id.toString());
```
### Análisis de Técnicas de Testing

#### 1. Patrón AAA (Arrange-Act-Assert)

```typescript
it('debe retornar todos los usuarios', async () => {
  // ARRANGE: Preparar el estado con seedUsers
  await seedUsers([
    { name: 'Alice', email: 'alice@test.com', password: 'password123' }
  ]);
  
  // ACT: Ejecutar la acción
  const response = await request(app).get('/v1/users');
  
  // ASSERT: Verificar el resultado
  expect(response.body).toHaveLength(1);
  expect(response.body[0].email).toBe('alice@test.com');
});
```

#### 2. Tests de Side Effects con MongoDB

```typescript
it('debe persistir el usuario en MongoDB', async () => {
  // Crear usuario via API
  await request(app)
    .post('/v1/users')
    .send({ name: 'Test', email: 'test@example.com', password: 'pass123' });

  // Verificar que persiste consultando directamente MongoDB
  const user = await UserModel.findOne({ email: 'test@example.com' });
  expect(user).not.toBeNull();
  expect(user!.name).toBe('Test');
});
```

Esto verifica que **los cambios realmente se guardan en la base de datos**, no solo que retornan status 201.

#### 3. Tests de Validaciones en Capas

```typescript
it('debe validar con Joi antes de llegar a Mongoose', async () => {
  // Joi rechaza email inválido
  const response = await request(app)
    .post('/v1/users')
    .send({ name: 'Test', email: 'invalid', password: 'pass123' })
    .expect(400);
  
  expect(response.body.error).toContain('valid email');
});

it('debe validar constraint unique de Mongoose', async () => {
  // Primer usuario OK
  await request(app).post('/v1/users').send({...});
  
  // Segundo con mismo email - Mongoose lo rechaza
  const response = await request(app).post('/v1/users').send({...});
  expect(response.body.error).toContain('duplicate');
});
```

#### 4. Limpieza de Base de Datos

```typescript
beforeEach(async () => {
  await clearDatabase(); // Limpia MongoDB Memory Server
});
```

Garantiza **aislamiento total** entre tests sin afectar base de datos de desarrollo.

#### 5. Tests con IDs Reales de MongoDB

```typescript
it('debe manejar ObjectIds correctamente', async () => {
  // ID inválido - Error de casting
  await request(app).get('/v1/users/invalid-id').expect(400);
  
  // ID válido pero no existe - 404
  const fakeId = new mongoose.Types.ObjectId();
  await request(app).get(`/v1/users/${fakeId}`).expect(404);
  
  // ID válido y existe - 200
  const [user] = await seedUsers([{...}]);
  await request(app).get(`/v1/users/${user._id}`).expect(200);
});
```

:::tip Best Practices de API Testing con MongoDB

1. **Usa MongoDB Memory Server** para tests rápidos y aislados
2. **Limpia la base de datos** en `beforeEach` para evitar contaminación
3. **Verifica validaciones en todas las capas** (Joi, Mongoose, MongoDB)
4. **Test con ObjectIds reales** de Mongoose, no strings genéricos
5. **Verifica seguridad**: passwords hasheados, campos sensibles no expuestos
6. **Test side effects** consultando directamente la base de datos
7. **Agrupa tests** por endpoint con `describe` anidados

:::

## Resumen

En esta sección aprendimos a testear APIs REST con:

1. **MongoDB Memory Server**: Base de datos real en memoria para tests
2. **Arquitectura en capas**: Router → Controller → Service → Model
3. **Supertest**: Requests HTTP sin levantar servidor
4. **Validación completa**: Joi (service), Mongoose (model), MongoDB (constraints)
5. **Seguridad verificada**: Passwords hasheados, campos sensibles ocultos
6. **Cobertura exhaustiva**: CRUD completo, validaciones, errores, edge cases

:::info Próximo paso

En la siguiente sección veremos **autenticación JWT** y cómo testear endpoints protegidos con tokens de autorización.

:::


