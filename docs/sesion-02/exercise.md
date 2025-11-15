---
sidebar_position: 9
title: "Ejercicio Práctico"
---

# Ejercicio Práctico: Integration Testing Completo

## Introducción

Este ejercicio integrador te permitirá aplicar **todos los conceptos** que has aprendido en esta sesión:
- Testing de Context API
- Testing de Custom Hooks
- Testing de APIs con Supertest
- Fixtures y Factory Functions
- Mock Service Worker (MSW)
- Autenticación con JWT

El ejercicio simula un **blog real** con usuarios, posts y autenticación. Tendrás 2 horas para completarlo.

## Objetivos de Aprendizaje

Al finalizar este ejercicio serás capaz de:

1. **Implementar Context API** con state management complejo
2. **Crear APIs RESTful** con validaciones y manejo de errores
3. **Escribir tests de integración** completos y robustos
4. **Aplicar best practices** de testing en proyectos reales
5. **Integrar autenticación** en flujos de testing

:::tip Preparación
Antes de comenzar, asegúrate de tener:
- Node.js 18+ instalado
- Editor de código (VS Code recomendado)
- Jest y Testing Library configurados
- 2 horas de tiempo disponible
:::

## Parte 1: Testing de Context (40 minutos)

### Objetivo: NavigationContext

Crea un sistema de navegación con **breadcrumbs** (migas de pan) usando Context API. Este patrón es común en aplicaciones reales para mostrar la ruta de navegación del usuario.

### Especificación del Context

```typescript
interface NavigationState {
  breadcrumbs: string[];              // Array de rutas: ['Home', 'Products', 'Laptop']
  addBreadcrumb: (item: string) => void;  // Agregar nueva ruta
  clearBreadcrumbs: () => void;           // Limpiar todas las rutas
  removeLast: () => void;                 // Retroceder (pop)
}
```

### Tareas

#### 1. Implementar el Context (15 min)

**Archivo**: `src/context/NavigationContext.tsx`

```typescript
import { createContext, useContext, useState, ReactNode } from 'react';

// TODO: Implementar NavigationProvider
// TODO: Implementar useNavigation hook
// TODO: Agregar validación (throw error si se usa fuera del Provider)
```

**Requisitos**:
- Estado inicial: breadcrumbs vacío `[]`
- `addBreadcrumb`: debe agregar al final sin duplicados consecutivos
- `clearBreadcrumbs`: debe resetear a `[]`
- `removeLast`: debe hacer pop del último elemento

#### 2. Crear Componente Breadcrumbs (10 min)

**Archivo**: `src/components/Breadcrumbs.tsx`

```typescript
import { useNavigation } from '../context/NavigationContext';

export function Breadcrumbs() {
  // TODO: Obtener breadcrumbs del context
  // TODO: Renderizar como: Home > Products > Laptop
  // TODO: Hacer cada item clickeable (excepto el último)
  // TODO: Al clickear, remover todos los items después de ese
}
```

**UI esperada**:
```
Home > Products > Laptop
^click  ^click    ^disabled
```

#### 3. Tests de Integración (15 min)

**Archivo**: `src/context/__tests__/NavigationContext.integration.test.tsx`

**Tests requeridos**:

```typescript
describe('NavigationContext Integration', () => {
  it('debe iniciar con breadcrumbs vacío', () => {
    // TODO: Renderizar componente con Provider
    // TODO: Verificar que no hay breadcrumbs
  });

  it('debe agregar breadcrumbs', () => {
    // TODO: Llamar addBreadcrumb('Home')
    // TODO: Llamar addBreadcrumb('Products')
    // TODO: Verificar que ambos aparecen
  });

  it('debe evitar duplicados consecutivos', () => {
    // TODO: Agregar 'Home' dos veces
    // TODO: Verificar que solo hay uno
  });

  it('debe limpiar breadcrumbs', () => {
    // TODO: Agregar varios breadcrumbs
    // TODO: Llamar clearBreadcrumbs()
    // TODO: Verificar que está vacío
  });

  it('debe compartir state entre múltiples componentes', () => {
    // TODO: Renderizar dos componentes que usen useNavigation
    // TODO: Agregar breadcrumb desde uno
    // TODO: Verificar que aparece en el otro
  });
});
```

**Criterios de éxito**:
- ✅ Todos los tests pasan
- ✅ No hay warnings en consola
- ✅ Código TypeScript sin errores
- ✅ Componente Breadcrumbs es clickeable

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
