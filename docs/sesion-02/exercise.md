---
sidebar_position: 9
title: "Ejercicio Práctico"
---

# Ejercicio Práctico: Integration Testing Completo

## Objetivos

Aplicar todos los conceptos aprendidos en un ejercicio integrador.

## Parte 1: Testing de Context (40 minutos)

### NavigationContext

Crea un context para navegación con breadcrumbs:

```typescript
interface NavigationState {
  breadcrumbs: string[];
  addBreadcrumb: (item: string) => void;
  clearBreadcrumbs: () => void;
}
```

**Tareas:**

1. Implementar `NavigationProvider` y hook `useNavigation`
2. Componente `Breadcrumbs` que muestre la ruta
3. Tests de integración:
   - Agregar breadcrumbs
   - Limpiar breadcrumbs
   - Renderizar múltiples componentes que usen el context

## Parte 2: Testing de API (50 minutos)

### Posts API

Implementa una API REST para posts:

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}
```

**Endpoints:**

- `GET /api/posts` - Listar posts
- `GET /api/posts/:id` - Obtener post
- `POST /api/posts` - Crear post (requiere title, content, authorId)
- `PUT /api/posts/:id` - Actualizar post
- `DELETE /api/posts/:id` - Eliminar post

**Tareas:**

1. Implementar router con Express
2. Validación de datos con función helper
3. Tests con Supertest para todos los endpoints
4. Tests de casos límite (IDs inexistentes, datos inválidos)

## Parte 3: Integration con Auth (30 minutos)

**Tareas:**

1. Agregar autenticación a los endpoints de posts
2. Solo el autor puede actualizar/eliminar su post
3. Tests de flujo completo:
   - Login → crear post → actualizar → eliminar
   - Intentar actualizar post de otro usuario (debe fallar)

## Evaluación

**Criterios:**

- ✅ Todos los tests pasan
- ✅ Coverage > 70%
- ✅ Uso correcto de fixtures/factories
- ✅ Tests claros y descriptivos
- ✅ Manejo de errores
