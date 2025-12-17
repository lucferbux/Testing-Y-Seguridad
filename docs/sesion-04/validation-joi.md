---
sidebar_position: 10
title: "Validación con Joi"
---

# Validación con Joi

## ¿Por qué Joi además de Mongoose?

Aunque Mongoose valida los datos, lo hace **después** de que los datos han llegado al modelo. Joi te permite validar en el middleware de Express, rechazando datos inválidos **antes** de que entren en la lógica de negocio.

```text
┌────────────────────────────────────────────────────────────────────────┐
│              Validación en dos capas: Joi + Mongoose                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Cliente                                                              │
│      │                                                                 │
│      ▼                                                                 │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      EXPRESS ROUTER                             │  │
│   ├─────────────────────────────────────────────────────────────────┤  │
│   │  Joi Middleware                                                 │  │
│   │  ┌───────────────────────────────────────────────────────────┐  │  │
│   │  │ ✓ Valida estructura y formato                             │  │  │
│   │  │ ✓ Rechaza requests malformados RÁPIDO                     │  │  │
│   │  │ ✓ Mensajes de error claros para el cliente                │  │  │
│   │  │ ✓ Transforma y sanitiza datos                             │  │  │
│   │  │ ✗ Si falla → 400 Bad Request (nunca llega al controller)  │  │  │
│   │  └───────────────────────────────────────────────────────────┘  │  │
│   └───────────────────────────┬─────────────────────────────────────┘  │
│                               │                                        │
│                               ▼ (solo si Joi pasa)                     │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                        CONTROLLER                               │  │
│   │  Lógica de negocio con datos ya validados                       │  │
│   └───────────────────────────┬─────────────────────────────────────┘  │
│                               │                                        │
│                               ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     MONGOOSE MODEL                              │  │
│   │  ┌───────────────────────────────────────────────────────────┐  │  │
│   │  │ ✓ Validación de tipos y constraints                       │  │  │
│   │  │ ✓ Validadores async (unicidad, referencias)               │  │  │
│   │  │ ✓ Hooks pre/post save                                     │  │  │
│   │  │ ✓ Segunda línea de defensa                                │  │  │
│   │  └───────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Ventajas de validar con Joi

| Aspecto | Solo Mongoose | Joi + Mongoose |
|---------|---------------|----------------|
| Momento de validación | En `.save()` | En el middleware |
| Rendimiento | Crea documento, luego valida | Valida primero, crea si válido |
| Mensajes de error | Genéricos | Personalizados y localizables |
| Validaciones async | Soportadas | No necesarias en Joi |
| Transformación | Pre-save hooks | Durante validación |
| Reglas complejas | Limitadas | Muy flexibles |
| Testing | Necesita MongoDB | Sin dependencias |

---

## Instalación

```bash
# Joi para validación
npm install joi

# Si usas TypeScript
npm install @types/joi
```

---

## Esquemas básicos de Joi

### Definiendo un esquema

```typescript
// api/src/components/User/validation.ts

import Joi from 'joi';

// Esquema para crear usuario
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'El email no tiene un formato válido',
      'any.required': 'El email es obligatorio',
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no puede exceder 100 caracteres',
      'string.pattern.base': 'La contraseña debe incluir mayúsculas, minúsculas y números',
      'any.required': 'La contraseña es obligatoria',
    }),

  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 50 caracteres',
    }),
});

// Esquema para login
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'El email es obligatorio',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es obligatoria',
    }),
});

// Esquema para actualizar perfil
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .trim()
    .optional(),

  // Al menos un campo debe estar presente
}).min(1).messages({
  'object.min': 'Debes proporcionar al menos un campo para actualizar',
});
```

### Esquema para proyectos

```typescript
// api/src/components/Project/validation.ts

import Joi from 'joi';

// Validar ObjectId de MongoDB
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede exceder 100 caracteres',
      'any.required': 'El nombre del proyecto es obligatorio',
    }),

  description: Joi.string()
    .max(5000)
    .required()
    .messages({
      'string.max': 'La descripción no puede exceder 5000 caracteres',
      'any.required': 'La descripción es obligatoria',
    }),

  status: Joi.string()
    .valid('draft', 'active', 'archived')
    .default('draft')
    .messages({
      'any.only': 'El estado debe ser draft, active o archived',
    }),

  isPublic: Joi.boolean()
    .default(false),

  collaborators: Joi.array()
    .items(
      Joi.string()
        .pattern(objectIdPattern)
        .messages({
          'string.pattern.base': 'ID de colaborador inválido',
        })
    )
    .max(50)
    .default([])
    .messages({
      'array.max': 'No puedes añadir más de 50 colaboradores',
    }),

  tags: Joi.array()
    .items(Joi.string().min(1).max(30).trim())
    .max(10)
    .default([])
    .messages({
      'array.max': 'No puedes añadir más de 10 tags',
    }),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim(),

  description: Joi.string()
    .max(5000),

  status: Joi.string()
    .valid('draft', 'active', 'archived'),

  isPublic: Joi.boolean(),

  collaborators: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .max(50),

  tags: Joi.array()
    .items(Joi.string().min(1).max(30).trim())
    .max(10),
}).min(1);

// Esquema para parámetros de URL
export const projectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'ID de proyecto inválido',
      'any.required': 'El ID del proyecto es obligatorio',
    }),
});

// Esquema para query parameters
export const listProjectsSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'active', 'archived'),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),

  sort: Joi.string()
    .valid('createdAt', 'updatedAt', 'name')
    .default('updatedAt'),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
});
```

---

## Middleware de validación

### Middleware genérico

```typescript
// api/src/config/middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Opciones de validación por defecto
const defaultOptions: Joi.ValidationOptions = {
  abortEarly: false,      // Reportar TODOS los errores, no solo el primero
  stripUnknown: true,     // Eliminar campos no definidos en el esquema
  convert: true,          // Permitir conversión de tipos (string a number, etc.)
};

// Tipos de datos a validar
type ValidationTarget = 'body' | 'params' | 'query';

// Factory de middlewares de validación
export function validate(
  schema: Joi.ObjectSchema,
  target: ValidationTarget = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];

    const { error, value } = schema.validate(dataToValidate, defaultOptions);

    if (error) {
      // Formatear errores para respuesta
      const errors: Record<string, string> = {};
      
      for (const detail of error.details) {
        const key = detail.path.join('.');
        errors[key] = detail.message;
      }

      res.status(400).json({
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Reemplazar datos originales con datos validados y transformados
    req[target] = value;
    next();
  };
}

// Helpers para casos comunes
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');
```

### Usando el middleware en rutas

```typescript
// api/src/routes/ProjectRouter.ts

import { Router } from 'express';
import * as ProjectComponent from '../components/Project';
import { validateBody, validateParams, validateQuery } from '../config/middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  listProjectsSchema,
} from '../components/Project/validation';
import { isAuthenticated } from '../config/middleware/jwtAuth';

const router = Router();

// Listar proyectos
// GET /v1/projects?status=active&page=1&limit=10
router.get(
  '/',
  isAuthenticated,
  validateQuery(listProjectsSchema),  // Validar query params
  ProjectComponent.list
);

// Crear proyecto
// POST /v1/projects
router.post(
  '/',
  isAuthenticated,
  validateBody(createProjectSchema),  // Validar body
  ProjectComponent.create
);

// Obtener proyecto por ID
// GET /v1/projects/:id
router.get(
  '/:id',
  isAuthenticated,
  validateParams(projectIdSchema),    // Validar params
  ProjectComponent.findById
);

// Actualizar proyecto
// PUT /v1/projects/:id
router.put(
  '/:id',
  isAuthenticated,
  validateParams(projectIdSchema),    // Validar params
  validateBody(updateProjectSchema),  // Validar body
  ProjectComponent.update
);

// Eliminar proyecto
// DELETE /v1/projects/:id
router.delete(
  '/:id',
  isAuthenticated,
  validateParams(projectIdSchema),
  ProjectComponent.remove
);

export default router;
```

---

## Validaciones avanzadas

### Campos condicionales

```typescript
// Si el proyecto es público, requiere descripción larga
const projectSchemaConditional = Joi.object({
  name: Joi.string().required(),
  
  isPublic: Joi.boolean().default(false),
  
  description: Joi.string()
    .when('isPublic', {
      is: true,
      then: Joi.string().min(100).required().messages({
        'string.min': 'Los proyectos públicos requieren descripción de al menos 100 caracteres',
      }),
      otherwise: Joi.string().optional(),
    }),
});
```

### Validación cruzada de campos

```typescript
// Validar que fechas sean coherentes
const eventSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
})
.custom((value, helpers) => {
  if (value.endDate <= value.startDate) {
    return helpers.error('date.order');
  }
  return value;
})
.messages({
  'date.order': 'La fecha de fin debe ser posterior a la fecha de inicio',
});
```

### Arrays con reglas complejas

```typescript
const teamSchema = Joi.object({
  members: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        role: Joi.string().valid('lead', 'member', 'viewer').required(),
      })
    )
    .min(1)
    .max(20)
    // Validar que haya exactamente un lead
    .custom((members, helpers) => {
      const leads = members.filter((m: any) => m.role === 'lead');
      if (leads.length !== 1) {
        return helpers.error('team.singleLead');
      }
      return members;
    })
    .messages({
      'team.singleLead': 'El equipo debe tener exactamente un líder',
      'array.min': 'El equipo debe tener al menos un miembro',
      'array.max': 'El equipo no puede tener más de 20 miembros',
    }),
});
```

### Extensión de Joi para ObjectId

```typescript
// api/src/config/joi-extensions.ts

import Joi from 'joi';
import mongoose from 'mongoose';

// Crear extensión personalizada
const JoiExtended = Joi.extend((joi) => ({
  type: 'objectId',
  base: joi.string(),
  messages: {
    'objectId.invalid': '{{#label}} debe ser un ObjectId válido',
  },
  validate(value, helpers) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return { value, errors: helpers.error('objectId.invalid') };
    }
    return { value };
  },
}));

export default JoiExtended;
```

Uso:

```typescript
import Joi from '../config/joi-extensions';

const schema = Joi.object({
  projectId: Joi.objectId().required(),
  userId: Joi.objectId().required(),
});
```

---

## Sanitización con Joi

### Transformación de datos

```typescript
const userSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()    // Convertir a minúsculas
    .trim(),        // Eliminar espacios

  username: Joi.string()
    .required()
    .trim()
    .replace(/\s+/g, '_')  // Reemplazar espacios por _
    .lowercase(),

  phone: Joi.string()
    .pattern(/^\+?[\d\s()-]+$/)
    .custom((value) => {
      // Normalizar: solo dígitos y +
      return value.replace(/[\s()-]/g, '');
    }),
});

// Input: { email: "  TEST@Email.COM  ", username: "John Doe", phone: "(123) 456-7890" }
// Output: { email: "test@email.com", username: "john_doe", phone: "+1234567890" }
```

### Integración con DOMPurify

```typescript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Joi from 'joi';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

const commentSchema = Joi.object({
  // Campo de texto plano - eliminar todo HTML
  title: Joi.string()
    .max(100)
    .required()
    .custom((value) => {
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
    }),

  // Campo que permite HTML limitado
  content: Joi.string()
    .max(5000)
    .required()
    .custom((value) => {
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href'],
        ALLOW_DATA_ATTR: false,
      });
    }),
});
```

---

## Testing de esquemas Joi

Una gran ventaja de Joi es que puedes testear los esquemas sin necesidad de MongoDB:

```typescript
// api/src/components/User/validation.test.ts

import { createUserSchema, loginSchema } from './validation';

describe('User Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate a correct user', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'John Doe',
      };

      const { error, value } = createUserSchema.validate(validUser);
      
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'not-an-email',
        password: 'Password123',
      };

      const { error } = createUserSchema.validate(invalidUser);
      
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('email');
    });

    it('should reject weak password', () => {
      const weakPassword = {
        email: 'test@example.com',
        password: 'weak',  // Sin mayúsculas, sin números, muy corto
      };

      const { error } = createUserSchema.validate(weakPassword);
      
      expect(error).toBeDefined();
      expect(error?.details.some(d => d.path.includes('password'))).toBe(true);
    });

    it('should transform email to lowercase', () => {
      const user = {
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123',
      };

      const { value } = createUserSchema.validate(user);
      
      expect(value.email).toBe('test@example.com');
    });

    it('should strip unknown fields', () => {
      const userWithExtra = {
        email: 'test@example.com',
        password: 'Password123',
        role: 'admin',      // Campo no definido
        isAdmin: true,      // Campo no definido
      };

      const { value } = createUserSchema.validate(userWithExtra, { 
        stripUnknown: true 
      });
      
      expect(value.role).toBeUndefined();
      expect(value.isAdmin).toBeUndefined();
    });

    it('should report all errors when abortEarly is false', () => {
      const invalidUser = {
        email: 'bad',
        password: 'x',
      };

      const { error } = createUserSchema.validate(invalidUser, { 
        abortEarly: false 
      });
      
      // Debería reportar error de email Y password
      expect(error?.details.length).toBeGreaterThan(1);
    });
  });

  describe('loginSchema', () => {
    it('should require email and password', () => {
      const empty = {};

      const { error } = loginSchema.validate(empty, { abortEarly: false });
      
      expect(error?.details).toHaveLength(2);
    });
  });
});
```

---

## Patrones de reutilización

### Campos comunes

```typescript
// api/src/config/validation/common.ts

import Joi from 'joi';

// Patrón ObjectId reutilizable
export const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'ID inválido',
  });

// Email reutilizable
export const email = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(254)
  .messages({
    'string.email': 'Email inválido',
    'string.max': 'El email es demasiado largo',
  });

// Password con requisitos
export const password = Joi.string()
  .min(8)
  .max(100)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'La contraseña debe incluir mayúsculas, minúsculas y números',
  });

// Paginación reutilizable
export const pagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

// Ordenación reutilizable
export const sorting = (allowedFields: string[]) => Joi.object({
  sort: Joi.string().valid(...allowedFields),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});
```

### Uso de campos comunes

```typescript
import Joi from 'joi';
import { objectId, email, password, pagination, sorting } from '../config/validation/common';

export const createUserSchema = Joi.object({
  email: email.required(),
  password: password.required(),
  name: Joi.string().min(2).max(50).trim(),
});

export const listUsersSchema = pagination.concat(
  sorting(['createdAt', 'email', 'name'])
);

export const userIdSchema = Joi.object({
  id: objectId.required(),
});
```

---

## Checklist de Validación con Joi

```text
□ Esquemas definidos para body, params y query
□ Middleware de validación aplicado en las rutas
□ abortEarly: false para reportar todos los errores
□ stripUnknown: true para eliminar campos no definidos
□ Mensajes de error personalizados y claros
□ Transformaciones aplicadas (lowercase, trim, etc.)
□ Sanitización integrada con DOMPurify donde necesario
□ Campos comunes extraídos para reutilización
□ Tests unitarios para los esquemas
□ Validación de ObjectId con patrón correcto
□ Límites de array y string para prevenir DoS
□ Campos condicionales donde aplique
```

---

## Próximo Paso

Con la validación de entrada cubierta, el siguiente paso es asegurar que las dependencias que usas son seguras. Continúa con **[Seguridad de Dependencias con npm](./npm-security)**.
