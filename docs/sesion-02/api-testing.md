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



## Setup: Express + Jest + Supertest

Para testear APIs construidas con Express, usamos **Supertest**, una librería que hace requests HTTP a nuestra aplicación sin necesidad de levantar un servidor real en un puerto. Esto hace los tests mucho más rápidos y confiables.

### ¿Qué es Supertest?

**Supertest** permite:
- Hacer requests HTTP (GET, POST, PUT, DELETE) a tu app Express
- Verificar status codes (200, 404, 500, etc.)
- Inspeccionar headers y body de las respuestas
- Ejecutar tests en milisegundos sin levantar servidor
- Simular diferentes escenarios (errores de red, timeouts, etc.)

### Instalación

```bash
# Supertest + tipos para TypeScript
npm install --save-dev supertest @types/supertest

# Express (si aún no lo tienes)
npm install express
npm install --save-dev @types/express
```

### Comparación: Test tradicional vs Supertest

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
- Tienes que manejar el lifecycle del servidor

**✅ Enfoque moderno (simple y confiable)**:

```typescript
import request from 'supertest';

const response = await request(app)
  .get('/api/users')
  .expect(200);
```

Ventajas:
- Sin puerto real, sin networking
- Super rápido (microsegundos)
- Determinista (mismo resultado siempre)
- API limpia y expresiva



## Ejemplo Completo: API de Usuarios

Vamos a construir un API REST completa para gestionar usuarios. Este ejemplo incluye:
- **CRUD completo** (Create, Read, Update, Delete)
- **Validaciones** (campos requeridos, formatos)
- **Manejo de errores** (404, 400, 500)
- **Base de datos en memoria** (para simplicidad en tests)

Este tipo de API es extremadamente común en aplicaciones reales. Aprenderás patrones que aplicarás en todos tus proyectos.

### Código: src/api/users.ts

```typescript
import express, { Router, Request, Response } from 'express';

// Modelo de datos
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Simulación de base de datos en memoria
// En producción, esto sería MongoDB, PostgreSQL, etc.
let users: User[] = [];

export const usersRouter = Router();

// ==================== ENDPOINTS ====================

// GET /users - Listar todos los usuarios
usersRouter.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// GET /users/:id - Obtener un usuario específico
usersRouter.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// POST /users - Crear nuevo usuario
usersRouter.post('/', (req: Request, res: Response) => {
  const { email, name } = req.body;
  
  // Validación: campos requeridos
  if (!email || !name) {
    return res.status(400).json({ 
      error: 'Email and name are required' 
    });
  }
  
  // Validación: formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format' 
    });
  }
  
  // Validación: email único
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ 
      error: 'Email already exists' 
    });
  }
  
  // Crear usuario
  const newUser: User = {
    id: Date.now().toString(), // En producción, usa UUID
    email,
    name,
    createdAt: new Date(),
  };
  
  users.push(newUser);
  
  // 201 Created es el status correcto para recursos nuevos
  res.status(201).json(newUser);
});

// PUT /users/:id - Actualizar usuario
usersRouter.put('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const { email, name } = req.body;
  
  // Actualizar solo campos proporcionados
  if (email) users[userIndex].email = email;
  if (name) users[userIndex].name = name;
  
  res.json(users[userIndex]);
});

// DELETE /users/:id - Eliminar usuario
usersRouter.delete('/:id', (req: Request, res: Response) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  
  // 204 No Content es el status correcto para deletes exitosos
  res.status(204).send();
});

// ==================== HELPERS ====================

// Helper para tests: limpiar la "base de datos"
export function clearUsers() {
  users = [];
}

// Helper para tests: agregar usuarios de prueba
export function seedUsers(testUsers: Omit<User, 'id' | 'createdAt'>[]) {
  users = testUsers.map((u, i) => ({
    ...u,
    id: (i + 1).toString(),
    createdAt: new Date(),
  }));
}
```

### Análisis de buenas prácticas

Este código demuestra **patrones profesionales de API design**:

#### 1. Status codes semánticos

```typescript
// ✅ Usa el status code correcto para cada caso
res.status(200).json(data);  // OK - Éxito general
res.status(201).json(data);  // Created - Recurso creado
res.status(204).send();      // No Content - Delete exitoso
res.status(400).json(error); // Bad Request - Error del cliente
res.status(404).json(error); // Not Found - Recurso no existe
res.status(500).json(error); // Internal Server Error - Error del servidor
```

#### 2. Validaciones en capas

```typescript
// Capa 1: Campos requeridos
if (!email || !name) return res.status(400).json({...});

// Capa 2: Formato de datos
if (!emailRegex.test(email)) return res.status(400).json({...});

// Capa 3: Reglas de negocio
if (users.some(u => u.email === email)) return res.status(400).json({...});
```

#### 3. Mensajes de error descriptivos

```typescript
// ❌ Mal: mensaje genérico
{ error: 'Invalid input' }

// ✅ Bien: mensaje específico
{ error: 'Email already exists' }
```

### App: src/api/app.ts

Ahora creamos la aplicación Express que usa nuestro router:

```typescript
import express from 'express';
import { usersRouter } from './users';

export function createApp() {
  const app = express();
  
  // Middleware para parsear JSON
  app.use(express.json());
  
  // Montar router en /api/users
  app.use('/api/users', usersRouter);
  
  // Health check endpoint (útil para monitoring)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  return app;
}
```

**¿Por qué `createApp` es una función?**

Esto nos permite crear **instancias frescas de la app para cada test**:

```typescript
// Cada test tiene su propia app limpia
beforeEach(() => {
  app = createApp();
  clearUsers();
});
```

Sin esto, los tests se contaminarían entre sí (state compartido).




## Tests de Integración de API

Ahora vamos a testear toda la API de forma exhaustiva. Estos tests verifican:
- **Respuestas correctas** para requests válidos
- **Manejo de errores** para requests inválidos
- **Side effects** (creación, actualización, eliminación de datos)
- **Edge cases** (emails duplicados, IDs inexistentes, etc.)

### Test Completo: src/api/tests/users.integration.test.ts

```typescript
import request from 'supertest';
import { createApp } from '../app';
import { clearUsers, seedUsers } from '../users';

describe('Users API Integration', () => {
  let app: Express.Application;

  // Antes de cada test: app fresca + base de datos limpia
  beforeEach(() => {
    app = createApp();
    clearUsers();
  });

  // ==================== GET /api/users ====================
  
  describe('GET /api/users', () => {
    it('debe retornar array vacío inicialmente', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200); // Verifica status code

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debe retornar todos los usuarios', async () => {
      // Arrange: creamos usuarios de prueba
      await request(app)
        .post('/api/users')
        .send({ email: 'user1@test.com', name: 'User 1' });
      
      await request(app)
        .post('/api/users')
        .send({ email: 'user2@test.com', name: 'User 2' });

      // Act: obtenemos todos los usuarios
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: verificamos cantidad y estructura
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('debe retornar usuarios con estructura correcta', async () => {
      // Seed con datos conocidos
      seedUsers([
        { email: 'test@example.com', name: 'Test User' }
      ]);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Verificamos la estructura completa
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expect.any(String),
      });
    });
  });

  // ==================== GET /api/users/:id ====================
  
  describe('GET /api/users/:id', () => {
    it('debe retornar usuario específico', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      const userId = createResponse.body.id;

      // Obtener por ID
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('test@example.com');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  // ==================== POST /api/users ====================
  
  describe('POST /api/users', () => {
    it('debe crear usuario exitosamente', async () => {
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201); // 201 Created

      // Verificar que retorna el usuario creado
      expect(response.body).toMatchObject(newUser);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('debe retornar 400 sin email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' }) // Falta email
        .expect(400);

      expect(response.body.error).toBe('Email and name are required');
    });

    it('debe retornar 400 sin name', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' }) // Falta name
        .expect(400);

      expect(response.body.error).toBe('Email and name are required');
    });

    it('debe retornar 400 con email inválido', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ 
          email: 'invalid-email', // Sin @ ni dominio
          name: 'Test User' 
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    it('debe retornar 400 si email ya existe', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      // Primer usuario - OK
      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Segundo usuario con mismo email - ERROR
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Email already exists');
    });

    it('debe persistir el usuario creado', async () => {
      // Crear usuario
      await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      // Verificar que aparece en el listado
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  // ==================== PUT /api/users/:id ====================
  
  describe('PUT /api/users/:id', () => {
    it('debe actualizar usuario exitosamente', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'old@example.com', name: 'Old Name' });

      const userId = createResponse.body.id;

      // Actualizar
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ email: 'new@example.com', name: 'New Name' })
        .expect(200);

      expect(response.body.email).toBe('new@example.com');
      expect(response.body.name).toBe('New Name');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      const response = await request(app)
        .put('/api/users/999')
        .send({ email: 'test@example.com', name: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('debe actualizar solo campos proporcionados', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      const userId = createResponse.body.id;

      // Actualizar solo el name
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated Name' }) // Sin email
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('test@example.com'); // Sin cambios
    });
  });

  // ==================== DELETE /api/users/:id ====================
  
  describe('DELETE /api/users/:id', () => {
    it('debe eliminar usuario exitosamente', async () => {
      // Crear usuario
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Test User' });

      const userId = createResponse.body.id;

      // Eliminar
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204); // 204 No Content

      // Verificar que ya no existe
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('debe retornar 404 si usuario no existe', async () => {
      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('debe eliminar solo el usuario especificado', async () => {
      // Crear dos usuarios
      const user1 = await request(app)
        .post('/api/users')
        .send({ email: 'user1@test.com', name: 'User 1' });

      await request(app)
        .post('/api/users')
        .send({ email: 'user2@test.com', name: 'User 2' });

      // Eliminar solo el primero
      await request(app)
        .delete(`/api/users/${user1.body.id}`)
        .expect(204);

      // Verificar que queda solo uno
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].email).toBe('user2@test.com');
    });
  });

  // ==================== TESTS DE INTEGRACIÓN COMPLETA ====================
  
  describe('Flujo completo CRUD', () => {
    it('debe permitir crear, leer, actualizar y eliminar', async () => {
      // CREATE
      const createRes = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', name: 'Original' })
        .expect(201);

      const userId = createRes.body.id;

      // READ
      let readRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);
      expect(readRes.body.name).toBe('Original');

      // UPDATE
      await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated' })
        .expect(200);

      readRes = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);
      expect(readRes.body.name).toBe('Updated');

      // DELETE
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });
  });
});
```

### Análisis de técnicas de testing

#### 1. Patrón AAA (Arrange-Act-Assert)

```typescript
it('debe retornar todos los usuarios', async () => {
  // ARRANGE: Preparar el estado
  await request(app).post('/api/users').send({...});
  
  // ACT: Ejecutar la acción
  const response = await request(app).get('/api/users');
  
  // ASSERT: Verificar el resultado
  expect(response.body).toHaveLength(2);
});
```

#### 2. Tests de side effects

```typescript
it('debe persistir el usuario creado', async () => {
  // Crear usuario
  await request(app).post('/api/users').send({...});

  // Verificar que persiste con otro request
  const response = await request(app).get('/api/users');
  expect(response.body).toHaveLength(1);
});
```

Esto verifica que **los cambios realmente se guardan**, no solo que retornan status 201.

#### 3. Tests de edge cases

```typescript
it('debe retornar 400 si email ya existe', async () => {
  // Detecta el caso límite de emails duplicados
});

it('debe actualizar solo campos proporcionados', async () => {
  // Verifica partial updates
});
```

#### 4. Helpers para setup

```typescript
beforeEach(() => {
  app = createApp();  // App limpia
  clearUsers();       // DB limpia
});
```

Garantiza **aislamiento total** entre tests.

:::tip Best Practices de API Testing
1. **Test cada endpoint** con casos exitosos y fallidos
2. **Verifica status codes** precisos (200, 201, 400, 404, 500)
3. **Valida estructura de respuestas** con `toMatchObject`, `toHaveProperty`
4. **Test side effects** (verificar que cambios persisten)
5. **Test edge cases** (validaciones, límites, duplicados)
6. **Usa beforeEach** para limpiar estado entre tests
7. **Agrupa tests** por endpoint con `describe`
:::

## Resumen

En esta sección aprendimos:

1. **Por qué testear APIs**: Validar contratos, detectar regresiones, documentar comportamiento
2. **Supertest**: Herramienta para hacer requests HTTP sin levantar servidor
3. **Estructura de tests**: Arrange-Act-Assert, describe blocks, beforeEach
4. **Cobertura completa**: CRUD, validaciones, errores, edge cases
5. **Best practices**: Status codes semánticos, mensajes descriptivos, aislamiento de tests

:::info Próximo paso
En la siguiente sección veremos **fixtures** y **Mock Service Worker (MSW)** para crear datos de prueba realistas y mockear APIs externas.
:::

