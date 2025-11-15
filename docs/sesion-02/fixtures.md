---
sidebar_position: 6
title: "Fixtures y Datos de Prueba"
---

# Fixtures y Datos de Prueba

## Introducción

Cuando escribimos tests, necesitamos **datos de prueba**: usuarios, productos, pedidos, etc. Sin un sistema organizado, terminamos **duplicando** estos datos en cada test file, lo que genera:

- **Código repetitivo**: El mismo objeto de usuario en 20 tests diferentes
- **Mantenimiento difícil**: Si cambia la estructura, hay que actualizar 20 lugares
- **Inconsistencias**: Cada test usa datos ligeramente diferentes
- **Tests frágiles**: Cambios pequeños rompen muchos tests

**Fixtures** resuelven estos problemas proporcionando **datos predefinidos, reutilizables y consistentes** para tus tests.

## ¿Qué son Fixtures?

**Fixtures** son datos predefinidos que usamos en múltiples tests. Piensa en ellos como una "biblioteca" de datos de prueba que todos tus tests pueden usar.

### Analogía del mundo real

Imagina que estás haciendo una película. En lugar de que cada escena construya su propio set desde cero, el estudio tiene **sets reutilizables**: una oficina genérica, un apartamento, una calle. Los fixtures son exactamente eso: "sets de datos" reutilizables para tus tests.

### Beneficios de usar Fixtures

| Beneficio | Explicación | Ejemplo |
|-----------|-------------|---------|
| **Reducen duplicación** | Un fixture se define una vez, se usa en 100 tests | `validUser` en lugar de `{ email: '...', name: '...' }` 100 veces |
| **Consistencia** | Todos los tests usan exactamente los mismos datos | Todos los tests de "usuario válido" usan el mismo objeto |
| **Fácil mantenimiento** | Cambiar un campo se hace en un solo lugar | Si agregas `lastName`, solo actualizas el fixture |
| **Setup rápido** | Crear escenarios complejos es trivial | `seedUsers(adminUsers)` en lugar de 10 líneas de código |
| **Tests más legibles** | El intent queda claro | `send(validUser)` vs `send({ email: 'john@...', name: 'John', age: 30... })` |
| **Type safety** | TypeScript valida que los datos son correctos | Detecta errores en compile time, no en runtime |



## Ejemplo Práctico: Fixtures de Usuarios

Vamos a crear un sistema completo de fixtures para una aplicación que maneja usuarios. Este ejemplo te mostrará **patrones reales** que usarás en producción.

### Estructura de Fixtures: src/tests/fixtures/users.ts

```typescript
// ==================== DATOS BÁSICOS ====================

// Usuario válido estándar - el caso más común
export const validUser = {
  email: 'john.doe@example.com',
  name: 'John Doe',
  age: 30,
  role: 'user' as const,
};

// Casos de usuarios inválidos - para testear validaciones
export const invalidUsers = {
  noEmail: { 
    name: 'No Email',
    age: 25,
    role: 'user' as const,
  },
  noName: { 
    email: 'no-name@example.com',
    age: 25,
    role: 'user' as const,
  },
  invalidEmail: { 
    email: 'not-an-email', // Sin @ ni dominio
    name: 'Invalid Email',
    age: 25,
    role: 'user' as const,
  },
  underage: {
    email: 'young@example.com',
    name: 'Too Young',
    age: 15, // Menor de 18
    role: 'user' as const,
  },
};

// ==================== COLECCIONES ====================

// Conjunto de usuarios de muestra para tests que necesitan múltiples usuarios
export const sampleUsers = [
  { email: 'alice@example.com', name: 'Alice', age: 28, role: 'user' as const },
  { email: 'bob@example.com', name: 'Bob', age: 35, role: 'admin' as const },
  { email: 'charlie@example.com', name: 'Charlie', age: 42, role: 'user' as const },
];

// Usuarios con roles específicos
export const adminUser = {
  email: 'admin@example.com',
  name: 'Admin User',
  age: 40,
  role: 'admin' as const,
};

export const moderatorUser = {
  email: 'mod@example.com',
  name: 'Moderator User',
  age: 32,
  role: 'moderator' as const,
};

// ==================== FACTORY FUNCTION ====================

// Función para crear usuarios mock con valores personalizables
// Esta es la forma más flexible de crear fixtures
export function createMockUser(overrides: Partial<typeof validUser> = {}) {
  return {
    id: Date.now().toString(), // ID único
    email: 'mock@example.com',
    name: 'Mock User',
    age: 25,
    role: 'user' as const,
    createdAt: new Date().toISOString(),
    ...overrides, // Permite sobrescribir cualquier campo
  };
}

// Helper para crear usuarios completos (con ID y timestamps)
export function createCompleteUser(overrides: Partial<typeof validUser> = {}) {
  const baseUser = {
    ...validUser,
    ...overrides,
  };
  
  return {
    ...baseUser,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

### ¿Por qué esta estructura?

Esta organización **demuestra buenas prácticas**:

#### 1. Datos agrupados por categoría

```typescript
// ✅ Fácil encontrar el fixture que necesitas
export const validUser = {...}
export const invalidUsers = {...}
export const sampleUsers = [...]
```

#### 2. Type safety con `as const`

```typescript
// ✅ TypeScript infiere tipos literales
role: 'admin' as const // Tipo: 'admin', no 'string'

// ❌ Sin as const
role: 'admin' // Tipo: string (demasiado amplio)
```

#### 3. Flexibilidad con overrides

```typescript
// Puedes personalizar cualquier campo
const admin = createMockUser({ role: 'admin' });
const youngUser = createMockUser({ age: 20 });
```

## Uso de Fixtures en Tests

Ahora veamos cómo usar estos fixtures en tests reales:

### Ejemplo 1: Tests básicos con fixtures

```typescript
import { validUser, invalidUsers, sampleUsers } from './fixtures/users';
import request from 'supertest';
import { createApp } from '../app';

describe('Users API with Fixtures', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  // ==================== HAPPY PATH ====================
  
  it('debe crear usuario con datos válidos', async () => {
    // En lugar de definir el usuario aquí, usamos el fixture
    const response = await request(app)
      .post('/api/users')
      .send(validUser) // ← Fixture reutilizable
      .expect(201);

    // Verificamos que contiene los datos del fixture
    expect(response.body).toMatchObject(validUser);
    expect(response.body).toHaveProperty('id'); // ID se genera en el servidor
  });

  // ==================== ERROR CASES ====================
  
  it('debe rechazar usuario sin email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(invalidUsers.noEmail) // ← Fixture de error
      .expect(400);

    expect(response.body.error).toContain('email');
  });

  it('debe rechazar email inválido', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(invalidUsers.invalidEmail)
      .expect(400);

    expect(response.body.error).toContain('Invalid email');
  });

  it('debe rechazar usuarios menores de edad', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(invalidUsers.underage)
      .expect(400);

    expect(response.body.error).toContain('age');
  });

  // ==================== BULK OPERATIONS ====================
  
  it('debe crear múltiples usuarios', async () => {
    // Usamos el array de fixtures para crear múltiples usuarios
    for (const user of sampleUsers) {
      await request(app)
        .post('/api/users')
        .send(user)
        .expect(201);
    }

    // Verificamos que todos se crearon
    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.body).toHaveLength(sampleUsers.length);
  });

  // ==================== CUSTOMIZATION ====================
  
  it('debe personalizar fixture con overrides', () => {
    // Podemos crear variaciones del mock fácilmente
    const admin = createMockUser({ role: 'admin' });
    const youngUser = createMockUser({ age: 20 });
    const customUser = createMockUser({ 
      name: 'Custom Name',
      email: 'custom@example.com',
    });

    expect(admin.role).toBe('admin');
    expect(youngUser.age).toBe(20);
    expect(customUser.name).toBe('Custom Name');
  });
});
```

### Ventajas visibles

Comparemos el **antes y después** de usar fixtures:

**❌ Sin fixtures (código repetitivo)**:

```typescript
it('test 1', async () => {
  const user = { email: 'john@example.com', name: 'John', age: 30, role: 'user' };
  // ...
});

it('test 2', async () => {
  const user = { email: 'john@example.com', name: 'John', age: 30, role: 'user' };
  // ...
});

it('test 3', async () => {
  const user = { email: 'john@example.com', name: 'John', age: 30, role: 'user' };
  // ...
});
```

Problemas:
- Repetición innecesaria (DRY violation)
- Inconsistencias (¿todos tienen la misma edad?)
- Difícil de mantener (cambiar estructura requiere tocar 3 lugares)

**✅ Con fixtures (código limpio)**:

```typescript
it('test 1', async () => {
  const response = await request(app).post('/api/users').send(validUser);
  // ...
});

it('test 2', async () => {
  const response = await request(app).post('/api/users').send(validUser);
  // ...
});

it('test 3', async () => {
  const response = await request(app).post('/api/users').send(validUser);
  // ...
});
```

Ventajas:
- Sin repetición
- Perfectamente consistente
- Un solo lugar para cambiar
- Intent más claro




## Patrón Avanzado: Factory Functions

Las **factory functions** son el siguiente nivel de fixtures. En lugar de objetos estáticos, creamos **funciones que generan datos**, lo que nos da:

- **IDs únicos** automáticos
- **Datos dinámicos** (fechas actuales, valores aleatorios)
- **Secuencias** (user1, user2, user3...)
- **Relaciones** entre entidades (users → posts → comments)

### Implementación: src/tests/factories/userFactory.ts

```typescript
// ==================== CONTADOR GLOBAL ====================

// Mantiene track de IDs para generar valores únicos
let userId = 1;
let emailCounter = 1;

// Reset para beforeEach en tests
export function resetUserFactory() {
  userId = 1;
  emailCounter = 1;
}

// ==================== FACTORY BÁSICO ====================

/**
 * Construye un usuario con valores por defecto razonables.
 * Cada llamada genera un usuario único (diferente ID y email).
 */
export function buildUser(attrs: Partial<User> = {}): User {
  const id = (userId++).toString();
  const email = attrs.email || `user${emailCounter++}@example.com`;
  
  return {
    id,
    email,
    name: attrs.name || `User ${id}`,
    age: attrs.age || 25,
    role: attrs.role || 'user',
    createdAt: attrs.createdAt || new Date().toISOString(),
    updatedAt: attrs.updatedAt || new Date().toISOString(),
    ...attrs, // Overrides tienen prioridad
  };
}

// ==================== HELPERS DE BULK ====================

/**
 * Crea N usuarios de forma eficiente.
 * Útil para tests que necesitan poblar la base de datos.
 */
export function buildUsers(count: number, attrs: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => buildUser(attrs));
}

/**
 * Crea usuarios con roles específicos.
 */
export function buildAdmins(count: number): User[] {
  return buildUsers(count, { role: 'admin' });
}

export function buildModerators(count: number): User[] {
  return buildUsers(count, { role: 'moderator' });
}

// ==================== FACTORIES CON RELACIONES ====================

/**
 * Crea un usuario con posts asociados.
 * Demuestra cómo manejar relaciones entre entidades.
 */
export function buildUserWithPosts(postCount: number = 3) {
  const user = buildUser();
  const posts = Array.from({ length: postCount }, (_, i) => ({
    id: (i + 1).toString(),
    title: `Post ${i + 1}`,
    content: `Content for post ${i + 1}`,
    authorId: user.id,
    createdAt: new Date().toISOString(),
  }));
  
  return { user, posts };
}

// ==================== FACTORIES CON ESTADOS ESPECÍFICOS ====================

/**
 * Crea un usuario "completo" con todos los campos opcionales llenos.
 */
export function buildCompleteUser(): User {
  return buildUser({
    bio: 'This is my bio',
    avatar: 'https://example.com/avatar.jpg',
    verified: true,
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  });
}

/**
 * Crea un usuario en estado "pendiente de verificación".
 */
export function buildPendingUser(): User {
  return buildUser({
    verified: false,
    verificationToken: 'abc123',
    verificationSentAt: new Date().toISOString(),
  });
}
```

### Uso de Factories en Tests

```typescript
import { 
  buildUser, 
  buildUsers, 
  buildAdmins,
  buildUserWithPosts,
  resetUserFactory 
} from './factories/userFactory';

describe('User Factory Examples', () => {
  
  beforeEach(() => {
    resetUserFactory(); // IDs comienzan desde 1 en cada test
  });

  // ==================== FACTORY BÁSICO ====================
  
  it('debe crear usuario con valores por defecto', () => {
    const user = buildUser();
    
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user.name).toMatch(/User \d+/);
  });

  it('debe generar IDs y emails únicos', () => {
    const user1 = buildUser();
    const user2 = buildUser();
    const user3 = buildUser();
    
    // Cada usuario tiene ID único
    expect(user1.id).toBe('1');
    expect(user2.id).toBe('2');
    expect(user3.id).toBe('3');
    
    // Cada usuario tiene email único
    expect(user1.email).toBe('user1@example.com');
    expect(user2.email).toBe('user2@example.com');
    expect(user3.email).toBe('user3@example.com');
  });

  it('debe permitir customización con overrides', () => {
    const admin = buildUser({ 
      role: 'admin',
      name: 'Admin User' 
    });
    
    expect(admin.role).toBe('admin');
    expect(admin.name).toBe('Admin User');
    expect(admin).toHaveProperty('id'); // Otros campos siguen auto-generados
  });

  // ==================== BULK CREATION ====================
  
  it('debe crear múltiples usuarios rápidamente', () => {
    const users = buildUsers(10);
    
    expect(users).toHaveLength(10);
    expect(users[0].id).toBe('1');
    expect(users[9].id).toBe('10');
  });

  it('debe crear usuarios con atributos compartidos', () => {
    const youngUsers = buildUsers(5, { age: 20 });
    
    youngUsers.forEach(user => {
      expect(user.age).toBe(20); // Todos tienen 20 años
      expect(user.id).toBeTruthy(); // Pero IDs únicos
    });
  });

  it('debe crear admins fácilmente', () => {
    const admins = buildAdmins(3);
    
    admins.forEach(admin => {
      expect(admin.role).toBe('admin');
    });
  });

  // ==================== RELACIONES ====================
  
  it('debe crear usuario con posts relacionados', () => {
    const { user, posts } = buildUserWithPosts(5);
    
    expect(posts).toHaveLength(5);
    
    // Verificar relación: todos los posts tienen el authorId correcto
    posts.forEach(post => {
      expect(post.authorId).toBe(user.id);
    });
  });

  // ==================== TESTS DE INTEGRACIÓN ====================
  
  it('debe popular base de datos para test de integración', async () => {
    // Creamos escenario completo: 2 admins, 5 users, 10 moderators
    const admins = buildAdmins(2);
    const users = buildUsers(5);
    const moderators = buildModerators(10);
    
    // En un test real, insertaríamos esto en la DB
    const allUsers = [...admins, ...users, ...moderators];
    
    expect(allUsers).toHaveLength(17);
    expect(allUsers.filter(u => u.role === 'admin')).toHaveLength(2);
    expect(allUsers.filter(u => u.role === 'moderator')).toHaveLength(10);
  });
});
```

### Comparación: Fixtures estáticos vs Factories

| Aspecto | Fixtures Estáticos | Factory Functions |
|---------|-------------------|-------------------|
| **Simplicidad** | ✅ Muy simple | ⚠️ Más complejo |
| **Flexibilidad** | ⚠️ Datos fijos | ✅ Datos dinámicos |
| **IDs únicos** | ❌ Requiere trabajo manual | ✅ Automático |
| **Bulk creation** | ⚠️ Hay que duplicar | ✅ `buildUsers(100)` |
| **Relaciones** | ❌ Difícil | ✅ Fácil con helpers |
| **Cuándo usar** | Tests simples, datos conocidos | Tests complejos, datos variables |

### Best Practices con Factories

```typescript
// ✅ HACER: Reset en beforeEach
beforeEach(() => {
  resetUserFactory(); // IDs predecibles en cada test
});

// ✅ HACER: Nombres descriptivos
const verifiedUser = buildUser({ verified: true });
const pendingUser = buildPendingUser();

// ✅ HACER: Factories especializados
export function buildAdminUser() {
  return buildUser({ role: 'admin', verified: true });
}

// ❌ EVITAR: Factories con lógica compleja
// Si tu factory tiene más de 20 líneas, probablemente está haciendo demasiado

// ❌ EVITAR: State global sin reset
// Siempre proporciona una función reset
```

:::tip Cuándo usar cada patrón

**Usa fixtures estáticos cuando**:
- Los datos son simples y conocidos
- No necesitas IDs únicos
- Tus tests son independientes del estado

**Usa factory functions cuando**:
- Necesitas generar muchos objetos
- Los IDs deben ser únicos
- Manejas relaciones entre entidades
- Tus tests requieren datos dinámicos (fechas, randoms, etc.)

**Combina ambos**:
```typescript
// Fixture estático para casos comunes
export const adminRole = 'admin' as const;

// Factory para generar instancias
export function buildAdmin() {
  return buildUser({ role: adminRole });
}
```
:::

## Resumen

En esta sección aprendimos:

1. **Qué son fixtures**: Datos predefinidos reutilizables para tests
2. **Beneficios**: Reducen duplicación, mejoran consistencia, facilitan mantenimiento
3. **Fixtures estáticos**: Ideales para casos simples y datos conocidos
4. **Factory functions**: Perfectos para datos dinámicos, IDs únicos, y relaciones
5. **Best practices**: Organización clara, type safety, reset entre tests

:::info Próximo paso
En la siguiente sección veremos **Mock Service Worker (MSW)**, una herramienta para mockear APIs a nivel de red, proporcionando tests aún más realistas.
:::

