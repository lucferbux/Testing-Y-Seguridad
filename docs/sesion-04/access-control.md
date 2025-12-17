---
sidebar_position: 5
title: "Broken Access Control"
---

# Broken Access Control

## ¿Qué es Broken Access Control?

Broken Access Control es la vulnerabilidad #1 del OWASP Top 10 (2021), habiendo subido desde la quinta posición en 2017. Ocurre cuando las restricciones sobre lo que los usuarios autenticados pueden hacer no se implementan correctamente, permitiendo a atacantes acceder a funciones o datos fuera de sus permisos.

A diferencia de vulnerabilidades como XSS o inyecciones que explotan fallos técnicos en el código, Broken Access Control es frecuentemente un error de lógica: el desarrollador simplemente "olvidó" verificar si el usuario tiene permiso para realizar una acción.

### ¿Por qué es la vulnerabilidad #1?

- **Prevalencia extrema**: El 94% de las aplicaciones testeadas tienen alguna forma de broken access control
- **Fácil de explotar**: A menudo solo requiere cambiar un número en una URL
- **Impacto alto**: Acceso a datos de otros usuarios, funciones de admin, modificación de datos
- **Difícil de detectar automáticamente**: Los scanners no entienden la lógica de negocio

---

## Tipos de Broken Access Control

### 1. Escalada Vertical de Privilegios

Un usuario con permisos bajos accede a funciones que requieren permisos más altos.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                  ESCALADA VERTICAL                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Estructura de privilegios:                                         │
│                                                                     │
│  ┌─────────────┐                                                    │
│  │    Admin    │  Puede: Gestionar usuarios, ver logs, config      │
│  └──────┬──────┘                                                    │
│         │                                                           │
│  ┌──────┴──────┐                                                    │
│  │   Manager   │  Puede: Ver todos los proyectos, gestionar equipo │
│  └──────┬──────┘                                                    │
│         │                                                           │
│  ┌──────┴──────┐                                                    │
│  │    User     │  Puede: Ver sus proyectos, editar su perfil       │
│  └─────────────┘                                                    │
│                                                                     │
│  ATAQUE:                                                            │
│  ┌─────────┐                                                        │
│  │  User   │ ────GET /admin/users───────────────────────►           │
│  │ (rol:   │                                                        │
│  │  user)  │     Sin verificación de rol, el servidor responde     │
│  └─────────┘     con la lista de todos los usuarios                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Ejemplo de código vulnerable:**

```typescript
// ❌ VULNERABLE: No verifica que el usuario sea admin
app.get('/admin/users', authenticate, async (req, res) => {
  // Solo verifica que esté autenticado, no verifica el rol
  const users = await User.find();
  res.json(users);
});
```

**Código corregido:**

```typescript
// ✅ SEGURO: Verifica rol de administrador
app.get('/admin/users', authenticate, requireRole('admin'), async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Middleware de verificación de rol
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden: insufficient privileges' 
      });
    }
    next();
  };
}
```

### 2. Escalada Horizontal (IDOR)

Un usuario accede a recursos que pertenecen a otro usuario del mismo nivel de privilegios. Esto se conoce también como **IDOR** (Insecure Direct Object Reference).

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    ESCALADA HORIZONTAL (IDOR)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Base de datos de proyectos:                                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ ID: 1001    │ userId: "userA" │ title: "Proyecto de User A" │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ ID: 1002    │ userId: "userA" │ title: "Otro proyecto A"    │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ ID: 1003    │ userId: "userB" │ title: "Proyecto SECRETO B" │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ATAQUE:                                                            │
│  ┌─────────┐                                                        │
│  │  User A │   GET /api/projects/1001 ✓ (su proyecto)               │
│  │         │   GET /api/projects/1002 ✓ (su proyecto)               │
│  │         │   GET /api/projects/1003 ✓ ← IDOR! Ve proyecto de B    │
│  └─────────┘                                                        │
│                                                                     │
│  El servidor solo verifica que el usuario está autenticado,         │
│  pero no verifica que el proyecto pertenezca al usuario.            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Ejemplo de código vulnerable:**

```typescript
// ❌ VULNERABLE: No verifica ownership
app.get('/api/projects/:id', authenticate, async (req, res) => {
  // Cualquier usuario autenticado puede ver cualquier proyecto
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(project);
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  // ¡Cualquier usuario puede eliminar cualquier proyecto!
  await Project.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
```

**Ataque en acción:**

```bash
# User A está autenticado con su token
TOKEN_A="eyJhbG..."

# User A tiene un proyecto con ID 1001
curl -X GET 'http://localhost:4000/v1/projects/1001' \
  -H "Authorization: Bearer $TOKEN_A"
# ✓ OK - Es su proyecto

# User A "adivina" o enumera otros IDs
curl -X GET 'http://localhost:4000/v1/projects/1003' \
  -H "Authorization: Bearer $TOKEN_A"
# ✗ IDOR - Puede ver proyecto de User B

# User A elimina el proyecto de User B
curl -X DELETE 'http://localhost:4000/v1/projects/1003' \
  -H "Authorization: Bearer $TOKEN_A"
# ✗ CRÍTICO - Eliminó datos de otro usuario
```

### 3. Manipulación de Parámetros

El atacante modifica parámetros de la request para cambiar el contexto de la acción.

```typescript
// ❌ VULNERABLE: Confía en el userId del body
app.post('/api/profile/update', authenticate, async (req, res) => {
  const { userId, name, email } = req.body;
  
  // Usa el userId del body en lugar del token
  await User.findByIdAndUpdate(userId, { name, email });
  res.json({ success: true });
});
```

**Ataque:**

```bash
# El atacante envía el userId de otra persona
curl -X POST 'http://localhost:4000/api/profile/update' \
  -H "Authorization: Bearer $TOKEN_ATACANTE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "ID_DE_OTRA_PERSONA",
    "name": "Cuenta Hackeada",
    "email": "atacante@evil.com"
  }'
```

---

## Implementación Segura

### 1. Verificar Ownership en cada operación

```typescript
// ✅ SEGURO: Verifica que el recurso pertenece al usuario
app.get('/api/projects/:id', authenticate, async (req, res) => {
  const project = await Project.findById(req.params.id);
  
  // Verificar que el proyecto existe
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  // Verificar ownership
  if (project.userId.toString() !== req.user.id) {
    // IMPORTANTE: Devolver 404, no 403
    // 403 revela que el recurso existe
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(project);
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  // Solo el dueño o un admin puede eliminar
  if (project.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  await project.deleteOne();
  res.json({ success: true });
});
```

### 2. Query Scoping: Patrón más seguro

Una forma más elegante y segura es **scopear** todas las queries al usuario actual. Esto hace imposible accidentalmente acceder a recursos de otros usuarios:

```typescript
// api/src/services/project.service.ts

class ProjectService {
  /**
   * Todas las operaciones incluyen userId en la query
   * Es imposible acceder a proyectos de otros usuarios
   */
  
  async findAll(userId: string): Promise<Project[]> {
    // Solo retorna proyectos del usuario
    return Project.find({ userId });
  }
  
  async findOne(projectId: string, userId: string): Promise<Project | null> {
    // Busca por ID Y userId - si no coinciden, retorna null
    return Project.findOne({ _id: projectId, userId });
  }
  
  async create(data: CreateProjectDTO, userId: string): Promise<Project> {
    // Siempre asigna el userId del token, no del body
    return Project.create({ ...data, userId });
  }
  
  async update(
    projectId: string, 
    data: UpdateProjectDTO, 
    userId: string
  ): Promise<Project | null> {
    // Solo actualiza si pertenece al usuario
    return Project.findOneAndUpdate(
      { _id: projectId, userId },
      data,
      { new: true }
    );
  }
  
  async delete(projectId: string, userId: string): Promise<boolean> {
    // Solo elimina si pertenece al usuario
    const result = await Project.deleteOne({ _id: projectId, userId });
    return result.deletedCount > 0;
  }
}

export const projectService = new ProjectService();
```

**Uso en controladores:**

```typescript
// api/src/controllers/project.controller.ts

app.get('/api/projects', authenticate, async (req, res) => {
  // userId SIEMPRE viene del token, nunca de la request
  const projects = await projectService.findAll(req.user.id);
  res.json(projects);
});

app.get('/api/projects/:id', authenticate, async (req, res) => {
  const project = await projectService.findOne(req.params.id, req.user.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(project);
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  const deleted = await projectService.delete(req.params.id, req.user.id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json({ success: true });
});
```

**¿Por qué es más seguro?**

```text
┌─────────────────────────────────────────────────────────────────────┐
│             QUERY SCOPING vs VERIFICACIÓN MANUAL                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Verificación Manual (puede olvidarse):                             │
│                                                                     │
│  const project = await Project.findById(projectId);                 │
│  if (project.userId !== userId) { ... }  // ← Puede olvidarse       │
│                                                                     │
│  Query Scoping (siempre seguro):                                    │
│                                                                     │
│  const project = await Project.findOne({ _id: projectId, userId }); │
│  // La verificación está DENTRO de la query                         │
│  // Es imposible retornar un proyecto de otro usuario               │
│                                                                     │
│  Beneficios:                                                        │
│  ✓ No hay forma de "olvidar" la verificación                        │
│  ✓ Menos código, menos bugs                                         │
│  ✓ La query es más eficiente (usa índices)                          │
│  ✓ Patrón consistente en todo el codebase                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Usar siempre el userId del Token

Nunca confíes en un userId que venga del body de la request:

```typescript
// ❌ VULNERABLE: userId viene del body
app.post('/api/projects', authenticate, async (req, res) => {
  const { title, description, userId } = req.body;
  const project = await Project.create({ title, description, userId });
  res.json(project);
});

// ✅ SEGURO: userId viene del token JWT
app.post('/api/projects', authenticate, async (req, res) => {
  const { title, description } = req.body;
  const project = await Project.create({ 
    title, 
    description, 
    userId: req.user.id  // ← Del token, no del body
  });
  res.json(project);
});
```

### 4. Implementar RBAC (Role-Based Access Control)

Para aplicaciones con múltiples roles, implementa un sistema de control de acceso basado en roles:

```typescript
// api/src/middleware/rbac.ts

type Permission = 
  | 'projects:read' 
  | 'projects:write' 
  | 'projects:delete'
  | 'users:read'
  | 'users:write'
  | 'admin:access';

// Definir permisos por rol
const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'projects:read', 'projects:write', 'projects:delete',
    'users:read', 'users:write',
    'admin:access'
  ],
  manager: [
    'projects:read', 'projects:write', 'projects:delete',
    'users:read'
  ],
  user: [
    'projects:read', 'projects:write'
  ],
  viewer: [
    'projects:read'
  ]
};

// Middleware para verificar permisos
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'viewer';
    const userPermissions = rolePermissions[userRole] || [];
    
    const hasAllPermissions = permissions.every(
      permission => userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}

// Uso en rutas
app.get('/api/projects', 
  authenticate, 
  requirePermission('projects:read'), 
  getProjects
);

app.delete('/api/projects/:id', 
  authenticate, 
  requirePermission('projects:delete'), 
  deleteProject
);

app.get('/admin/dashboard', 
  authenticate, 
  requirePermission('admin:access'), 
  getAdminDashboard
);
```

### 5. Respuestas consistentes para evitar enumeración

Siempre devuelve las mismas respuestas para recursos no encontrados y recursos no autorizados:

```typescript
// ❌ REVELA INFORMACIÓN
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
    // ↑ El atacante sabe que el usuario EXISTE pero no tiene permiso
  }
  
  res.json(user);
});

// ✅ NO REVELA INFORMACIÓN
app.get('/api/users/:id', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);
  
  // Misma respuesta para "no existe" y "no autorizado"
  if (!user || (user.id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});
```

---

## Re-autenticación para acciones sensibles

Para acciones críticas (cambiar password, eliminar cuenta, transferir dinero), requiere que el usuario vuelva a autenticarse:

```typescript
// Middleware de re-autenticación
async function requireReauth(req: Request, res: Response, next: NextFunction) {
  const { currentPassword } = req.body;
  
  if (!currentPassword) {
    return res.status(400).json({ 
      error: 'Current password required for this action' 
    });
  }
  
  const user = await User.findById(req.user.id).select('+password');
  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  next();
}

// Rutas que requieren re-autenticación
app.put('/api/users/change-password', 
  authenticate, 
  requireReauth,  // ← Requiere password actual
  changePassword
);

app.delete('/api/users/me', 
  authenticate, 
  requireReauth,  // ← Requiere password actual
  deleteAccount
);
```

---

## Checklist de Prevención

```text
□ Verificar ownership en TODAS las operaciones sobre recursos
□ Usar query scoping: incluir userId en las queries de MongoDB
□ NUNCA confiar en userId/roleId que vengan del body de la request
□ Implementar RBAC para controlar acceso por roles
□ Devolver 404 (no 403) cuando el recurso no pertenece al usuario
□ Usar IDs no predecibles (UUIDs en lugar de números secuenciales)
□ Requerir re-autenticación para acciones sensibles
□ Implementar rate limiting en endpoints sensibles
□ Auditar logs de acceso para detectar patrones de ataque
□ Escribir tests específicos para verificar control de acceso
□ Negar por defecto: todo está prohibido excepto lo explícitamente permitido
```

---

## Próximo Paso

Ahora que entiendes las vulnerabilidades de seguridad más comunes, es momento de implementar las contramedidas. Continúa con **[Headers de Seguridad con Helmet](./helmet)** para proteger tu aplicación con headers HTTP.
