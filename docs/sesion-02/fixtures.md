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



## Ejemplo Práctico: Fixtures del Proyecto

Vamos a crear fixtures basados en los modelos reales del **Taller-Testing-Security**: **User**, **Project** y **AboutMe**. Este ejemplo muestra patrones reales que usarás en producción.

### Modelos del Proyecto

Primero, veamos las interfaces reales:

```typescript
// api/src/components/User/model.ts
export interface IUserModel {
  _id?: string;
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  tokens?: AuthToken[];
}

// ui/src/model/project.ts
export interface Project {
  _id?: string;
  title: string;
  description: string;
  version: string;
  link: string;
  tag: string;
  timestamp: number;
}

// ui/src/model/aboutme.ts
export interface AboutMe {
  _id: string;
  name: string;
  birthday?: number;
  nationality?: string;
  job?: string;
  github?: string;
}
```

### Estructura de Fixtures: src/tests/fixtures/

#### 1. Fixtures de Usuarios (users.ts)

```typescript
import { IUserModel } from '@/components/User/model';

// ==================== DATOS BÁSICOS ====================

// Usuario válido estándar - el caso más común
export const validUser: Partial<IUserModel> = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
};

// Casos de usuarios inválidos - para testear validaciones
export const invalidUsers = {
  noEmail: { 
    password: 'SecurePassword123!',
  } as Partial<IUserModel>,
  
  noPassword: { 
    email: 'no-password@example.com',
  } as Partial<IUserModel>,
  
  invalidEmail: { 
    email: 'not-an-email', // Sin @ ni dominio
    password: 'SecurePassword123!',
  } as Partial<IUserModel>,
  
  weakPassword: {
    email: 'weak@example.com',
    password: '123', // Demasiado corta
  } as Partial<IUserModel>,
};

// ==================== COLECCIONES ====================

// Conjunto de usuarios de muestra para tests que necesitan múltiples usuarios
export const sampleUsers: Partial<IUserModel>[] = [
  { email: 'alice@example.com', password: 'AlicePass123!' },
  { email: 'bob@example.com', password: 'BobSecure456!' },
  { email: 'charlie@example.com', password: 'Charlie789!' },
];

// Usuario con token de reset
export const userWithResetToken: Partial<IUserModel> = {
  email: 'reset@example.com',
  password: 'OldPassword123!',
  passwordResetToken: 'reset-token-abc123',
  passwordResetExpires: new Date(Date.now() + 3600000), // 1 hora desde ahora
};
```

#### 2. Fixtures de Proyectos (projects.ts)

```typescript
import { Project } from '@/model/project';

// ==================== DATOS BÁSICOS ====================

// Proyecto válido estándar
export const validProject: Omit<Project, '_id'> = {
  title: 'Taller Testing & Security',
  description: 'Proyecto educativo sobre testing y seguridad en aplicaciones web',
  version: '1.0.0',
  link: 'https://github.com/lucferbux/Taller-Testing-Security',
  tag: 'education',
  timestamp: Date.now(),
};

// Casos de proyectos inválidos - para testear validaciones
export const invalidProjects = {
  noTitle: {
    description: 'Missing title',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now(),
  } as Partial<Project>,
  
  noDescription: {
    title: 'No Description Project',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now(),
  } as Partial<Project>,
  
  invalidLink: {
    title: 'Invalid Link',
    description: 'Project with invalid link',
    version: '1.0.0',
    link: 'not-a-url',
    tag: 'test',
    timestamp: Date.now(),
  } as Partial<Project>,
};

// ==================== COLECCIONES ====================

// Conjunto de proyectos de muestra
export const sampleProjects: Omit<Project, '_id'>[] = [
  {
    title: 'React Dashboard',
    description: 'Dashboard administrativo con React y TypeScript',
    version: '2.1.0',
    link: 'https://github.com/lucferbux/react-dashboard',
    tag: 'react',
    timestamp: Date.now(),
  },
  {
    title: 'Vue Portfolio',
    description: 'Portfolio personal construido con Vue.js',
    version: '1.5.2',
    link: 'https://github.com/lucferbux/vue-portfolio',
    tag: 'vue',
    timestamp: Date.now() - 86400000, // 1 día atrás
  },
  {
    title: 'Node API',
    description: 'RESTful API con Node.js y Express',
    version: '3.0.0',
    link: 'https://github.com/lucferbux/node-api',
    tag: 'backend',
    timestamp: Date.now() - 172800000, // 2 días atrás
  },
];

// Proyectos por categoría
export const educationProjects = sampleProjects.filter(p => p.tag === 'education');
export const reactProjects = sampleProjects.filter(p => p.tag === 'react');
```

#### 3. Fixtures de AboutMe (aboutme.ts)

```typescript
import { AboutMe } from '@/model/aboutme';

// ==================== DATOS BÁSICOS ====================

// AboutMe válido estándar
export const validAboutMe: AboutMe = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Lucas Fernandez',
  birthday: 631152000000, // 1990-01-01 en timestamp
  nationality: 'Spanish',
  job: 'Software Developer',
  github: 'https://github.com/lucferbux',
};

// Casos de aboutme inválidos
export const invalidAboutMe = {
  noName: {
    _id: '507f1f77bcf86cd799439012',
    birthday: 631152000000,
    nationality: 'Spanish',
  } as Partial<AboutMe>,
  
  invalidGithub: {
    _id: '507f1f77bcf86cd799439013',
    name: 'Invalid Github',
    github: 'not-a-url',
  } as Partial<AboutMe>,
};

// AboutMe mínimo (solo campos requeridos)
export const minimalAboutMe: AboutMe = {
  _id: '507f1f77bcf86cd799439014',
  name: 'Minimal User',
};

// AboutMe completo (todos los campos)
export const completeAboutMe: AboutMe = {
  _id: '507f1f77bcf86cd799439015',
  name: 'Complete User',
  birthday: 694224000000, // 1992-01-01
  nationality: 'American',
  job: 'Full Stack Developer',
  github: 'https://github.com/completeuser',
};

// ==================== FACTORY FUNCTIONS ====================

// Función para crear proyectos mock con valores personalizables
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return {
    _id: Math.random().toString(36).substring(2, 11),
    title: 'Mock Project',
    description: 'This is a mock project for testing',
    version: '1.0.0',
    link: 'https://github.com/mock/project',
    tag: 'test',
    timestamp: Date.now(),
    ...overrides, // Permite sobrescribir cualquier campo
  };
}

// Helper para crear usuarios completos
export function createMockUser(overrides: Partial<IUserModel> = {}): IUserModel {
  return {
    _id: Math.random().toString(36).substring(2, 11),
    email: 'mock@example.com',
    password: 'MockPassword123!',
    ...overrides,
  } as IUserModel;
}

// Helper para crear AboutMe completo
export function createMockAboutMe(overrides: Partial<AboutMe> = {}): AboutMe {
  return {
    _id: Math.random().toString(36).substring(2, 11),
    name: 'Mock User',
    birthday: Date.now(),
    nationality: 'Unknown',
    job: 'Developer',
    github: 'https://github.com/mockuser',
    ...overrides,
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

Ahora veamos cómo usar estos fixtures en tests reales del proyecto:

### Ejemplo 1: Tests de API con Fixtures

```typescript
import { validUser, invalidUsers, sampleUsers } from './fixtures/users';
import { validProject, sampleProjects } from './fixtures/projects';
import request from 'supertest';
import app from '../server';

describe('API con Fixtures del Proyecto', () => {

  // ==================== USERS API ====================
  
  it('debe crear usuario con datos válidos', async () => {
    const response = await request(app)
      .post('/v1/users')
      .send(validUser) // ← Fixture reutilizable del proyecto
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.email).toBe(validUser.email);
  });

  it('debe rechazar usuario sin email', async () => {
    const response = await request(app)
      .post('/v1/users')
      .send(invalidUsers.noEmail) // ← Fixture de error
      .expect(400);

    expect(response.body.error).toContain('email');
  });

  it('debe rechazar email inválido', async () => {
    const response = await request(app)
      .post('/v1/users')
      .send(invalidUsers.invalidEmail)
      .expect(400);

    expect(response.body.error).toMatch(/email.*invalid/i);
  });

  // ==================== PROJECTS API ====================

  it('debe crear proyecto con datos válidos', async () => {
    // Primero autenticamos para obtener token
    const authResponse = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    const token = authResponse.body.token;

    // Creamos proyecto usando fixture
    const response = await request(app)
      .post('/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(validProject)
      .expect(201);

    expect(response.body.title).toBe(validProject.title);
    expect(response.body.description).toBe(validProject.description);
    expect(response.body).toHaveProperty('_id');
  });

  it('debe listar todos los proyectos', async () => {
    // Insertamos proyectos de muestra
    for (const project of sampleProjects) {
      await request(app)
        .post('/v1/projects')
        .send(project);
    }

    const response = await request(app)
      .get('/v1/projects/')
      .expect(200);

    expect(response.body).toHaveLength(sampleProjects.length);
    expect(response.body[0]).toHaveProperty('title');
  });

  // ==================== CUSTOMIZATION ====================
  
  it('debe personalizar fixture con overrides', () => {
    const customProject = createMockProject({ 
      title: 'Custom Title',
      tag: 'custom-tag',
    });

    expect(customProject.title).toBe('Custom Title');
    expect(customProject.tag).toBe('custom-tag');
    expect(customProject).toHaveProperty('_id'); // Auto-generado
  });
});
```

### Ejemplo 2: Tests de Componentes React con Fixtures

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ProjectList } from '../components/ProjectList';
import { sampleProjects } from './fixtures/projects';
import { server, http, HttpResponse } from '../mocks/server';

describe('ProjectList con Fixtures', () => {
  
  it('debe mostrar proyectos usando fixtures', async () => {
    // MSW interceptará la request y retornará nuestros fixtures
    server.use(
      http.get('/v1/projects/', () => {
        return HttpResponse.json(sampleProjects);
      })
    );

    render(<ProjectList />);

    // Esperamos a que los proyectos se carguen
    await waitFor(() => {
      expect(screen.getByText('React Dashboard')).toBeInTheDocument();
    });

    // Verificamos que todos los proyectos del fixture aparecen
    expect(screen.getByText('Vue Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Node API')).toBeInTheDocument();
  });

  it('debe manejar proyecto vacío', async () => {
    server.use(
      http.get('/v1/projects/', () => {
        return HttpResponse.json([]); // Array vacío
      })
    );

    render(<ProjectList />);

    await waitFor(() => {
      expect(screen.getByText(/no hay proyectos/i)).toBeInTheDocument();
    });
  });
});
```

### Ventajas visibles

Comparemos el **antes y después** de usar fixtures:

**❌ Sin fixtures (código repetitivo)**:

```typescript
it('test 1', async () => {
  const project = { 
    title: 'Test Project',
    description: 'Description',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now()
  };
  // ...
});

it('test 2', async () => {
  const project = { 
    title: 'Test Project',
    description: 'Description',
    version: '1.0.0',
    link: 'https://github.com/test',
    tag: 'test',
    timestamp: Date.now()
  };
  // ...
});
```

Problemas:

- Repetición innecesaria (DRY violation)
- Inconsistencias (¿todos tienen el mismo timestamp?)
- Difícil de mantener (cambiar estructura requiere tocar múltiples lugares)

**✅ Con fixtures (código limpio)**:

```typescript
it('test 1', async () => {
  const response = await request(app).post('/v1/projects').send(validProject);
  // ...
});

it('test 2', async () => {
  const response = await request(app).post('/v1/projects').send(validProject);
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

- **IDs únicos** automáticos (_id de MongoDB)
- **Datos dinámicos** (timestamps actuales, valores aleatorios)
- **Secuencias** (project1, project2, project3...)
- **Relaciones** entre entidades (user → projects)

### Implementación: src/tests/factories/

#### projectFactory.ts

```typescript
import { Project } from '@/model/project';

// ==================== CONTADOR GLOBAL ====================

let projectId = 1;

export function resetProjectFactory() {
  projectId = 1;
}

// ==================== FACTORY BÁSICO ====================

/**
 * Construye un proyecto con valores por defecto razonables.
 * Cada llamada genera un proyecto único.
 */
export function buildProject(attrs: Partial<Project> = {}): Project {
  const id = `project-${projectId++}`;
  
  return {
    _id: id,
    title: attrs.title || `Project ${projectId}`,
    description: attrs.description || `Description for project ${projectId}`,
    version: attrs.version || '1.0.0',
    link: attrs.link || `https://github.com/user/${id}`,
    tag: attrs.tag || 'general',
    timestamp: attrs.timestamp || Date.now(),
    ...attrs,
  };
}

// ==================== HELPERS DE BULK ====================

/**
 * Crea N proyectos de forma eficiente.
 */
export function buildProjects(count: number, attrs: Partial<Project> = {}): Project[] {
  return Array.from({ length: count }, () => buildProject(attrs));
}

/**
 * Crea proyectos con tags específicos.
 */
export function buildEducationProjects(count: number): Project[] {
  return buildProjects(count, { tag: 'education' });
}

export function buildReactProjects(count: number): Project[] {
  return buildProjects(count, { tag: 'react' });
}

// ==================== FACTORIES CON ESTADOS ESPECÍFICOS ====================

/**
 * Crea un proyecto "completo" con todos los campos llenos.
 */
export function buildCompleteProject(): Project {
  return buildProject({
    title: 'Complete Project',
    description: 'A fully detailed project with all fields',
    version: '2.5.3',
    link: 'https://github.com/complete/project',
    tag: 'featured',
  });
}

/**
 * Crea un proyecto reciente (timestamp muy actual).
 */
export function buildRecentProject(): Project {
  return buildProject({
    timestamp: Date.now(),
  });
}

/**
 * Crea un proyecto antiguo (timestamp de hace meses).
 */
export function buildOldProject(): Project {
  return buildProject({
    timestamp: Date.now() - 7776000000, // 90 días atrás
  });
}
```

#### userFactory.ts

```typescript
import { IUserModel } from '@/components/User/model';

let userId = 1;

export function resetUserFactory() {
  userId = 1;
}

/**
 * Construye un usuario con valores por defecto.
 */
export function buildUser(attrs: Partial<IUserModel> = {}): Partial<IUserModel> {
  const id = `user-${userId++}`;
  const email = attrs.email || `user${userId}@example.com`;
  
  return {
    _id: id,
    email,
    password: attrs.password || 'SecurePassword123!',
    ...attrs,
  };
}

/**
 * Crea N usuarios.
 */
export function buildUsers(count: number, attrs: Partial<IUserModel> = {}): Partial<IUserModel>[] {
  return Array.from({ length: count }, () => buildUser(attrs));
}

/**
 * Usuario con token de reset activo.
 */
export function buildUserWithResetToken(): Partial<IUserModel> {
  return buildUser({
    passwordResetToken: `reset-${Date.now()}`,
    passwordResetExpires: new Date(Date.now() + 3600000), // 1 hora
  });
}
```
```

### Uso de Factories en Tests

```typescript
import { 
  buildProject, 
  buildProjects, 
  buildEducationProjects,
  buildRecentProject,
  buildOldProject,
  resetProjectFactory 
} from './factories/projectFactory';
import { buildUser, buildUsers, resetUserFactory } from './factories/userFactory';

describe('Factory Examples del Proyecto', () => {
  
  beforeEach(() => {
    resetProjectFactory();
    resetUserFactory();
  });

  // ==================== FACTORY BÁSICO ====================
  
  it('debe crear proyecto con valores por defecto', () => {
    const project = buildProject();
    
    expect(project).toHaveProperty('_id');
    expect(project).toHaveProperty('title');
    expect(project.version).toBe('1.0.0');
  });

  it('debe generar IDs únicos', () => {
    const project1 = buildProject();
    const project2 = buildProject();
    const project3 = buildProject();
    
    expect(project1._id).toBe('project-1');
    expect(project2._id).toBe('project-2');
    expect(project3._id).toBe('project-3');
  });

  it('debe permitir customización con overrides', () => {
    const customProject = buildProject({ 
      title: 'Custom Title',
      tag: 'react',
      version: '2.0.0'
    });
    
    expect(customProject.title).toBe('Custom Title');
    expect(customProject.tag).toBe('react');
    expect(customProject.version).toBe('2.0.0');
    expect(customProject).toHaveProperty('_id'); // Auto-generado
  });

  // ==================== BULK CREATION ====================
  
  it('debe crear múltiples proyectos rápidamente', () => {
    const projects = buildProjects(10);
    
    expect(projects).toHaveLength(10);
    expect(projects[0]._id).toBe('project-1');
    expect(projects[9]._id).toBe('project-10');
  });

  it('debe crear proyectos con atributos compartidos', () => {
    const reactProjects = buildProjects(5, { tag: 'react' });
    
    reactProjects.forEach(project => {
      expect(project.tag).toBe('react');
      expect(project._id).toBeTruthy(); // IDs únicos
    });
  });

  it('debe crear proyectos educativos fácilmente', () => {
    const eduProjects = buildEducationProjects(3);
    
    eduProjects.forEach(project => {
      expect(project.tag).toBe('education');
    });
  });

  // ==================== ESTADOS ESPECÍFICOS ====================
  
  it('debe crear proyectos con diferentes timestamps', () => {
    const recentProject = buildRecentProject();
    const oldProject = buildOldProject();
    
    const daysDiff = (recentProject.timestamp - oldProject.timestamp) / (1000 * 60 * 60 * 24);
    
    expect(daysDiff).toBeGreaterThan(80); // ~90 días de diferencia
  });

  // ==================== TESTS DE INTEGRACIÓN ====================
  
  it('debe popular base de datos para test de integración', async () => {
    // Creamos escenario completo: usuarios y proyectos
    const users = buildUsers(3);
    const eduProjects = buildEducationProjects(5);
    const reactProjects = buildReactProjects(7);
    
    const allProjects = [...eduProjects, ...reactProjects];
    
    expect(allProjects).toHaveLength(12);
    expect(allProjects.filter(p => p.tag === 'education')).toHaveLength(5);
    expect(allProjects.filter(p => p.tag === 'react')).toHaveLength(7);
  });

  // ==================== API TESTS CON FACTORIES ====================
  
  it('debe usar factories en tests de API', async () => {
    const user = buildUser();
    const project = buildProject({ title: 'API Test Project' });
    
    // Simular autenticación
    const authResponse = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: user.password });
    
    const token = authResponse.body.token;
    
    // Crear proyecto
    const response = await request(app)
      .post('/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(project)
      .expect(201);
    
    expect(response.body.title).toBe('API Test Project');
  });
});
```

### Comparación: Fixtures estáticos vs Factories

| Aspecto | Fixtures Estáticos | Factory Functions |
|---------|-------------------|-------------------|
| **Simplicidad** | ✅ Muy simple | ⚠️ Más complejo |
| **Flexibilidad** | ⚠️ Datos fijos | ✅ Datos dinámicos |
| **IDs únicos** | ❌ Requiere trabajo manual | ✅ Automático |
| **Bulk creation** | ⚠️ Hay que duplicar | ✅ `buildProjects(100)` |
| **Relaciones** | ❌ Difícil | ✅ Fácil con helpers |
| **Cuándo usar** | Tests simples, datos conocidos | Tests complejos, datos variables |

### Best Practices con Factories

```typescript
// ✅ HACER: Reset en beforeEach
beforeEach(() => {
  resetProjectFactory();
  resetUserFactory();
});

// ✅ HACER: Nombres descriptivos
const recentProject = buildRecentProject();
const oldProject = buildOldProject();

// ✅ HACER: Factories especializados
export function buildFeaturedProject() {
  return buildProject({ tag: 'featured', version: '2.0.0' });
}

// ❌ EVITAR: Factories con lógica compleja
// Si tu factory tiene más de 20 líneas, probablemente está haciendo demasiado

// ❌ EVITAR: State global sin reset
// Siempre proporciona una función reset
```

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

En esta sección aprendimos sobre fixtures y datos de prueba aplicados al **Taller Testing & Security**:

1. **Qué son fixtures**: Datos predefinidos reutilizables basados en los modelos reales del proyecto
   - **User**: Email, password, tokens de reset
   - **Project**: Title, description, version, link, tag, timestamp
   - **AboutMe**: Name, birthday, nationality, job, github

2. **Beneficios**: 
   - Reducen duplicación de código en tests
   - Mejoran consistencia usando los modelos exactos
   - Facilitan mantenimiento con un solo punto de cambio

3. **Fixtures estáticos**: Ideales para casos simples y datos conocidos
   - `validUser`, `validProject`, `validAboutMe`
   - `invalidUsers`, `invalidProjects` para tests de validación
   - `sampleProjects` para poblar datos de prueba

4. **Factory functions**: Perfectos para datos dinámicos e IDs únicos
   - `buildProject()`, `buildUser()`, `buildAboutMe()`
   - Generan `_id` únicos automáticamente
   - Permiten overrides para personalización
   - Helpers de bulk: `buildProjects(10)`, `buildEducationProjects(5)`

5. **Best practices**: 
   - Organización clara por modelo
   - Type safety con TypeScript
   - Reset de factories entre tests
   - Fixtures especializados por escenario (`buildRecentProject`, `buildOldProject`)

### Aplicación en el Proyecto

Los fixtures del proyecto cubren:

- **Tests de API**: Validación de endpoints `/v1/users`, `/v1/projects/`, `/v1/aboutme/`
- **Tests de componentes**: Mock data para MSW y React Testing Library
- **Tests de integración**: Población de datos para escenarios completos
- **Tests de autenticación**: Usuarios con tokens JWT

:::info Próximo paso
En la siguiente sección **Mock Service Worker (MSW)**, usaremos estos fixtures para crear handlers realistas que interceptan requests HTTP y retornan datos consistentes.
:::

---

**Referencias del Proyecto**:
- Modelos: `ui/src/model/` (Project, AboutMe)
- Backend: `api/src/components/User/model.ts` (IUserModel)
- Endpoints: `/v1/projects/`, `/v1/aboutme/`, `/auth/login`

