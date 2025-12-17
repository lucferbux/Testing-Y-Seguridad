---
sidebar_position: 4
title: "Validación de Datos"
---

# Validación de Datos

## Introducción

La validación de datos es una de las defensas más fundamentales y efectivas contra vulnerabilidades de seguridad. Cada pieza de información que llega a tu aplicación desde el exterior debe tratarse como potencialmente maliciosa hasta que se demuestre lo contrario.

En esta sección exploraremos cómo implementar validación robusta en múltiples capas utilizando las herramientas disponibles en el proyecto **Taller-Testing-Security**: Mongoose para la capa de base de datos, Joi para la capa de API, y TypeScript para la capa de compilación.

---

## ¿Por Qué Validar en el Servidor?

### La regla de oro: Nunca confíes en el cliente

Es tentador pensar que si validamos en el frontend, los datos que llegan al backend son seguros. Este es uno de los errores de seguridad más comunes y peligrosos.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Por qué la validación frontend NO es suficiente │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuario Normal                          Atacante                   │
│  ┌────────────┐                         ┌────────────┐              │
│  │  Navegador │                         │  Terminal  │              │
│  │            │                         │            │              │
│  │ Formulario │                         │    cURL    │              │
│  │ con validación                       │    Burp    │              │
│  │    ↓       │                         │   Postman  │              │
│  │  React App │                         │            │              │
│  └─────┬──────┘                         └─────┬──────┘              │
│        │                                      │                     │
│        │ POST /api/users                      │ POST /api/users     │
│        │ { "email": "valid@email.com" }       │ { "email": "<script>"}│
│        │                                      │                     │
│        └──────────────┬───────────────────────┘                     │
│                       │                                             │
│                       ▼                                             │
│              ┌────────────────┐                                     │
│              │    Backend     │                                     │
│              │                │                                     │
│              │  Sin validación│ → Ambas requests son procesadas     │
│              │  = VULNERABLE  │   igual, el atacante gana           │
│              │                │                                     │
│              │  Con validación│ → Request maliciosa rechazada       │
│              │  = SEGURO      │   con error 400                     │
│              └────────────────┘                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Beneficios de la validación en servidor

1. **Seguridad real**: La única barrera que un atacante no puede bypasear
2. **Prevención de inyecciones**: Rechaza datos que podrían ser código malicioso
3. **Integridad de datos**: Evita que datos corruptos lleguen a la base de datos
4. **Documentación viva**: Los schemas de validación documentan qué espera tu API
5. **Mensajes de error claros**: Ayuda a los desarrolladores que consumen tu API

---

## Defensa en Profundidad: Validación por Capas

El proyecto implementa validación en múltiples capas. Si una capa falla, la siguiente la atrapa:

```text
Request del Cliente
        │
        ▼
┌─────────────────────┐
│  Capa 1: Express    │  → Validar headers, content-type
│  Rate Limiting      │  → Limitar requests por IP
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Capa 2: Joi        │  → Validar estructura y formato
│  Middleware         │  → Sanitizar inputs
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Capa 3: TypeScript │  → Validar tipos en compilación
│  Interfaces         │  → Detectar errores de desarrollo
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Capa 4: Mongoose   │  → Coerción de tipos
│  Schema             │  → Validaciones de DB
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  MongoDB            │  → Datos seguros almacenados
└─────────────────────┘
```

---

## Mongoose: La Primera Línea de Defensa

### El problema: NoSQL Injection

MongoDB, al ser una base de datos NoSQL, es vulnerable a inyecciones si los queries se construyen directamente con datos del usuario:

```typescript
// ❌ VULNERABLE: Usando driver MongoDB directamente
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Si un atacante envía:
  // { "email": { "$ne": null }, "password": { "$ne": null } }
  
  // El query resultante es:
  // db.users.findOne({ 
  //   email: { $ne: null }, 
  //   password: { $ne: null } 
  // })
  
  // Esto retorna el PRIMER usuario de la base de datos
  // sin verificar ninguna credencial real!
  
  const user = await db.collection('users').findOne({ email, password });
  
  if (user) {
    const token = generateToken(user);
    res.json({ token }); // ¡Token entregado al atacante!
  }
});
```

### La solución: Mongoose Schemas

Mongoose actúa como una capa de abstracción sobre MongoDB que incluye definición de tipos y validación automática:

```typescript
// api/src/components/User/model.ts

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * Interface que define la estructura de un usuario
 * TypeScript la usa para verificación estática de tipos
 */
export interface IUserModel extends Document {
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Schema de Mongoose que define la estructura en MongoDB
 * Incluye validaciones y transformaciones automáticas
 */
const UserSchema = new Schema<IUserModel>(
  {
    email: {
      // TIPO: Cualquier valor se convierte a string
      // Si envían { $ne: null }, se convierte a "[object Object]"
      type: String,
      
      // REQUERIDO: No puede ser null o undefined
      required: [true, 'Email is required'],
      
      // ÚNICO: MongoDB crea un índice único
      unique: true,
      
      // TRANSFORMACIÓN: Convierte a minúsculas
      lowercase: true,
      
      // TRANSFORMACIÓN: Elimina espacios al inicio/final
      trim: true,
      
      // VALIDACIÓN: Regex para formato email
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ],
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      
      // VALIDACIÓN: Mínimo 6 caracteres
      minlength: [6, 'Password must be at least 6 characters'],
      
      // PROYECCIÓN: No incluir en queries por defecto
      select: false,
    },
  },
  {
    // Añadir createdAt y updatedAt automáticamente
    timestamps: true,
    
    // Opciones de transformación para JSON
    toJSON: {
      transform: (doc, ret) => {
        // Nunca exponer password en JSON
        delete ret.password;
        // Renombrar _id a id
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Middleware: Hash password antes de guardar
 * Se ejecuta automáticamente en .save()
 */
UserSchema.pre('save', async function(next) {
  // Solo hashear si password fue modificado
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generar salt y hashear
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Método: Comparar password con hash almacenado
 * Usa bcrypt.compare que es timing-safe
 */
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  // bcrypt.compare previene timing attacks
  return bcrypt.compare(candidatePassword, this.password);
};

// Crear índice de texto para búsquedas
UserSchema.index({ email: 'text' });

export default mongoose.model<IUserModel>('User', UserSchema);
```

### ¿Por qué Mongoose protege contra NoSQL Injection?

```typescript
// Con Mongoose, veamos qué pasa paso a paso:

const attackPayload = { 
  email: { $ne: null }, 
  password: { $ne: null } 
};

// Cuando hacemos:
const user = await User.findOne({ 
  email: attackPayload.email,
  password: attackPayload.password 
});

// Mongoose internamente hace:
// 1. Mira el schema: email tiene type: String
// 2. Intenta convertir { $ne: null } a String
// 3. JavaScript: String({ $ne: null }) → "[object Object]"
// 4. Query final: { email: "[object Object]", password: "[object Object]" }
// 5. No encuentra ningún usuario con ese email
// 6. Retorna null → Login fallido

// ¡La inyección falló porque Mongoose forzó el tipo!
```

### Demostración práctica

```bash
# Intento de NoSQL Injection contra Taller-Testing-Security

# 1. Intento con operador $ne
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": {"$ne": null}}'

# Respuesta esperada: 
# { "error": "Invalid credentials" } 
# (porque "[object Object]" no es un email válido en la DB)

# 2. Intento con operador $gt
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$gt": ""}, "password": {"$gt": ""}}'

# Mismo resultado: falla porque se convierte a string
```

---

## Joi: Validación Explícita de Datos

Aunque Mongoose protege contra inyecciones, necesitamos validación más expresiva para:

1. **Formatos específicos**: Emails válidos, URLs, UUIDs, etc.
2. **Reglas de negocio**: Contraseñas con requisitos, fechas en rangos, etc.
3. **Mensajes de error amigables**: Feedback útil para el desarrollador/usuario
4. **Sanitización**: Eliminar campos no esperados

### Instalación

```bash
cd api
npm install joi
npm install --save-dev @types/joi
```

### Schemas de Validación para Autenticación

```typescript
// api/src/validation/auth.validation.ts

import Joi from 'joi';

/**
 * Schema para login
 * Valida estructura básica - la verificación real de credenciales
 * ocurre en el servicio
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    // Debe ser un email válido según RFC 5322
    .email({ 
      minDomainSegments: 2,
      tlds: { allow: true } 
    })
    // Campo obligatorio
    .required()
    // Mensajes personalizados en español
    .messages({
      'string.email': 'El email debe tener un formato válido',
      'string.empty': 'El email no puede estar vacío',
      'any.required': 'El email es obligatorio',
    }),

  password: Joi.string()
    // Mínimo 6 caracteres
    .min(6)
    // Máximo 128 (prevenir DoS con passwords gigantes)
    .max(128)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
      'string.max': 'La contraseña no puede exceder {#limit} caracteres',
      'string.empty': 'La contraseña no puede estar vacía',
      'any.required': 'La contraseña es obligatoria',
    }),
})
// Opciones del schema
.options({
  // Eliminar campos no definidos en el schema
  stripUnknown: true,
});

/**
 * Schema para registro
 * Incluye validaciones más estrictas para passwords
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    // Convertir a minúsculas para consistencia
    .lowercase()
    // Eliminar espacios
    .trim()
    .required()
    .messages({
      'string.email': 'El email debe tener un formato válido',
      'any.required': 'El email es obligatorio',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    // Regex para requerir complejidad
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos {#limit} caracteres',
      'string.pattern.base': 
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)',
      'any.required': 'La contraseña es obligatoria',
    }),

  confirmPassword: Joi.string()
    // Debe coincidir con password
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Las contraseñas no coinciden',
      'any.required': 'Debes confirmar la contraseña',
    }),

  // Campo opcional: nombre
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos {#limit} caracteres',
      'string.max': 'El nombre no puede exceder {#limit} caracteres',
    }),
})
.options({
  stripUnknown: true,
});
```

### Middleware de Validación Genérico

```typescript
// api/src/middleware/validate.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

/**
 * Tipos de ubicación donde buscar datos a validar
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Interfaz para errores de validación estructurados
 */
interface ValidationError {
  field: string;
  message: string;
  type: string;
}

/**
 * Crea un middleware de validación para el schema dado
 * 
 * @param schema - Schema de Joi a validar
 * @param source - Dónde buscar los datos ('body', 'query', 'params')
 * @returns Middleware de Express
 * 
 * @example
 * router.post('/users', validate(createUserSchema, 'body'), createUser);
 * router.get('/users/:id', validate(userIdSchema, 'params'), getUser);
 */
export function validate(
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body'
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Obtener datos según la fuente
    const dataToValidate = req[source];

    // Validar con Joi
    const { error, value } = schema.validate(dataToValidate, {
      // Recoger TODOS los errores, no solo el primero
      abortEarly: false,
      
      // Eliminar campos no definidos en el schema
      stripUnknown: true,
      
      // Permitir conversión de tipos (string "123" → number 123)
      convert: true,
    });

    // Si hay errores, devolver 400 con detalles
    if (error) {
      const errors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(400).json({
        status: 400,
        message: 'Validation error',
        errors,
      });
    }

    // Reemplazar datos originales con datos validados y sanitizados
    req[source] = value;
    
    next();
  };
}

/**
 * Valida múltiples fuentes a la vez
 * Útil para endpoints que reciben datos en body Y params
 * 
 * @example
 * router.put('/users/:id', 
 *   validateMultiple({
 *     params: userIdSchema,
 *     body: updateUserSchema,
 *   }), 
 *   updateUser
 * );
 */
export function validateMultiple(schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const allErrors: ValidationError[] = [];

    // Validar cada fuente que tenga schema
    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const dataToValidate = req[source as ValidationSource];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: `${source}.${detail.path.join('.')}`,
          message: detail.message,
          type: detail.type,
        }));
        allErrors.push(...errors);
      } else {
        req[source as ValidationSource] = value;
      }
    }

    if (allErrors.length > 0) {
      return res.status(400).json({
        status: 400,
        message: 'Validation error',
        errors: allErrors,
      });
    }

    next();
  };
}
```

### Aplicación en Rutas

```typescript
// api/src/routes/AuthRouter.ts

import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validation/auth.validation';
import * as AuthComponent from '../components/Auth';

const router: Router = Router();

/**
 * POST /auth/login
 * Autentica un usuario y devuelve un token
 */
router.post(
  '/login',
  // Middleware de validación - rechaza si falla
  validate(loginSchema, 'body'),
  // Controller - solo se ejecuta si validación pasa
  AuthComponent.login
);

/**
 * POST /auth/signup
 * Registra un nuevo usuario
 */
router.post(
  '/signup',
  validate(registerSchema, 'body'),
  AuthComponent.signup
);

export default router;
```

### Ejemplo de Respuesta de Error

Cuando la validación falla, el cliente recibe una respuesta estructurada:

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "confirmPassword": "456"
  }'
```

```json
{
  "status": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "El email debe tener un formato válido",
      "type": "string.email"
    },
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 8 caracteres",
      "type": "string.min"
    },
    {
      "field": "password",
      "message": "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)",
      "type": "string.pattern.base"
    },
    {
      "field": "confirmPassword",
      "message": "Las contraseñas no coinciden",
      "type": "any.only"
    }
  ]
}
```

---

## Validación de Proyectos

El proyecto Taller-Testing-Security incluye un CRUD de proyectos que requiere validación:

```typescript
// api/src/validation/project.validation.ts

import Joi from 'joi';

/**
 * Validador personalizado para ObjectId de MongoDB
 * Los IDs tienen exactamente 24 caracteres hexadecimales
 */
const objectIdValidator = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'El ID debe ser un ObjectId válido (24 caracteres hex)',
  });

/**
 * Schema para crear un proyecto
 */
export const createProjectSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.min': 'El título debe tener al menos {#limit} caracteres',
      'string.max': 'El título no puede exceder {#limit} caracteres',
      'string.empty': 'El título no puede estar vacío',
      'any.required': 'El título es obligatorio',
    }),

  description: Joi.string()
    .min(10)
    .max(2000)
    .trim()
    .required()
    .messages({
      'string.min': 'La descripción debe tener al menos {#limit} caracteres',
      'string.max': 'La descripción no puede exceder {#limit} caracteres',
      'any.required': 'La descripción es obligatoria',
    }),

  version: Joi.string()
    // Formato semver: 1.0.0, 2.1.3-beta, etc.
    .pattern(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/)
    .default('1.0.0')
    .messages({
      'string.pattern.base': 
        'La versión debe seguir el formato semver (ej: 1.0.0, 2.1.3-beta)',
    }),

  link: Joi.string()
    // Validar URL
    .uri({
      scheme: ['http', 'https'],
    })
    .optional()
    .allow('')
    .messages({
      'string.uri': 'El link debe ser una URL válida (http o https)',
    }),

  tag: Joi.string()
    // Solo valores permitidos
    .valid('frontend', 'backend', 'fullstack', 'mobile', 'devops', 'other')
    .default('other')
    .messages({
      'any.only': 
        'El tag debe ser uno de: frontend, backend, fullstack, mobile, devops, other',
    }),

  technologies: Joi.array()
    .items(
      Joi.string()
        .min(1)
        .max(50)
        .trim()
    )
    .max(20)
    .default([])
    .messages({
      'array.max': 'No puedes especificar más de {#limit} tecnologías',
    }),

  isPublic: Joi.boolean()
    .default(true),
})
.options({
  stripUnknown: true,
});

/**
 * Schema para actualizar un proyecto
 * Todos los campos son opcionales (update parcial)
 */
export const updateProjectSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .optional(),

  description: Joi.string()
    .min(10)
    .max(2000)
    .trim()
    .optional(),

  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/)
    .optional(),

  link: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),

  tag: Joi.string()
    .valid('frontend', 'backend', 'fullstack', 'mobile', 'devops', 'other')
    .optional(),

  technologies: Joi.array()
    .items(Joi.string().min(1).max(50).trim())
    .max(20)
    .optional(),

  isPublic: Joi.boolean()
    .optional(),
})
// Requerir al menos un campo para actualizar
.min(1)
.options({
  stripUnknown: true,
})
.messages({
  'object.min': 'Debes proporcionar al menos un campo para actualizar',
});

/**
 * Schema para validar params con ID de proyecto
 */
export const projectIdParams = Joi.object({
  id: objectIdValidator.required(),
});

/**
 * Schema para query params de listado
 */
export const listProjectsQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  tag: Joi.string()
    .valid('frontend', 'backend', 'fullstack', 'mobile', 'devops', 'other')
    .optional(),

  search: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional(),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'title')
    .default('createdAt'),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
});
```

### Rutas de Proyectos con Validación

```typescript
// api/src/routes/ProjectRouter.ts

import { Router } from 'express';
import { validate, validateMultiple } from '../middleware/validate';
import { 
  createProjectSchema, 
  updateProjectSchema,
  projectIdParams,
  listProjectsQuery 
} from '../validation/project.validation';
import * as ProjectComponent from '../components/Project';
import * as jwtConfig from '../config/middleware/jwtAuth';

const router: Router = Router();

/**
 * GET /v1/projects
 * Lista proyectos con paginación y filtros
 */
router.get(
  '/',
  jwtConfig.isAuthenticated,
  validate(listProjectsQuery, 'query'),
  ProjectComponent.findAll
);

/**
 * GET /v1/projects/:id
 * Obtiene un proyecto específico
 */
router.get(
  '/:id',
  jwtConfig.isAuthenticated,
  validate(projectIdParams, 'params'),
  ProjectComponent.findOne
);

/**
 * POST /v1/projects
 * Crea un nuevo proyecto
 */
router.post(
  '/',
  jwtConfig.isAuthenticated,
  validate(createProjectSchema, 'body'),
  ProjectComponent.create
);

/**
 * PUT /v1/projects/:id
 * Actualiza un proyecto existente
 */
router.put(
  '/:id',
  jwtConfig.isAuthenticated,
  validateMultiple({
    params: projectIdParams,
    body: updateProjectSchema,
  }),
  ProjectComponent.update
);

/**
 * DELETE /v1/projects/:id
 * Elimina un proyecto
 */
router.delete(
  '/:id',
  jwtConfig.isAuthenticated,
  validate(projectIdParams, 'params'),
  ProjectComponent.remove
);

export default router;
```

---

## Sanitización de HTML con DOMPurify

Si tu aplicación necesita aceptar contenido HTML del usuario (por ejemplo, un editor de texto enriquecido), debes sanitizarlo para prevenir XSS:

### Instalación

```bash
# Para Node.js
npm install isomorphic-dompurify

# Para solo backend
npm install dompurify jsdom
```

### Implementación con Joi

```typescript
// api/src/validation/content.validation.ts

import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Extensión de Joi para sanitizar HTML
 */
const sanitizeHtml = Joi.extend((joi) => ({
  type: 'htmlString',
  base: joi.string(),
  messages: {
    'htmlString.dangerous': 'El contenido HTML contiene elementos peligrosos',
  },
  rules: {
    sanitize: {
      method() {
        return this.$_addRule('sanitize');
      },
      validate(value, helpers) {
        // Configuración de DOMPurify
        const cleanHtml = DOMPurify.sanitize(value, {
          // Tags permitidos
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 's', 
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'blockquote', 'code', 'pre',
            'img'
          ],
          // Atributos permitidos
          ALLOWED_ATTR: [
            'href', 'target', 'rel',
            'src', 'alt', 'title',
            'class'
          ],
          // Forzar target="_blank" a tener rel="noopener"
          ADD_ATTR: ['rel'],
          // Hooks para modificar elementos
          FORCE_BODY: true,
        });

        // Verificar si se eliminó contenido peligroso
        if (cleanHtml !== value) {
          // Opcional: puedes rechazar o simplemente sanitizar
          // return helpers.error('htmlString.dangerous');
        }

        return cleanHtml;
      },
    },
  },
}));

/**
 * Schema para comentarios con HTML
 */
export const commentSchema = Joi.object({
  projectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  // Usando la extensión de sanitización
  content: sanitizeHtml.htmlString()
    .sanitize()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'El comentario no puede estar vacío',
      'string.max': 'El comentario no puede exceder {#limit} caracteres',
    }),
});

/**
 * Alternativa: Sanitizar manualmente en custom validator
 */
export const articleSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required(),

  body: Joi.string()
    .min(50)
    .max(50000)
    .required()
    .custom((value, helpers) => {
      // Sanitizar HTML
      const clean = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'img', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class'],
      });
      
      return clean;
    }, 'HTML Sanitization'),
});
```

### Ejemplo de uso

```typescript
// Controller de comentarios
import { Request, Response } from 'express';
import { commentSchema } from '../validation/content.validation';

export async function createComment(req: Request, res: Response) {
  // El body ya viene sanitizado gracias al middleware de validación
  const { projectId, content } = req.body;
  
  // El HTML malicioso ya fue eliminado por DOMPurify
  // <script>alert('xss')</script> → (eliminado)
  // <img src="x" onerror="alert(1)"> → <img src="x">
  
  const comment = await Comment.create({
    projectId,
    content, // HTML seguro
    userId: req.user.id,
  });
  
  res.status(201).json(comment);
}
```

---

## TypeScript: Validación en Tiempo de Compilación

TypeScript añade una capa adicional de validación que ocurre antes de que el código se ejecute:

### Interfaces para Request/Response

```typescript
// api/src/types/auth.types.ts

/**
 * DTO para login - lo que esperamos recibir
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Response de login - lo que devolvemos
 */
export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * DTO para registro
 */
export interface RegisterDTO {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

/**
 * Usuario en el request después de autenticación
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
}
```

### Tipado de Controllers

```typescript
// api/src/components/Auth/index.ts

import { Request, Response, NextFunction } from 'express';
import { LoginDTO, LoginResponse } from '../../types/auth.types';

/**
 * Controller de login con tipado completo
 */
export async function login(
  req: Request<{}, LoginResponse, LoginDTO>,
  res: Response<LoginResponse>,
  next: NextFunction
): Promise<void> {
  try {
    // TypeScript sabe que req.body tiene { email: string, password: string }
    const { email, password } = req.body;
    
    // Error de compilación si intentas acceder a propiedades que no existen
    // const name = req.body.name; // ❌ Error: Property 'name' does not exist
    
    const user = await AuthService.authenticate(email, password);
    
    // TypeScript valida que la respuesta cumple con LoginResponse
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    });
    
  } catch (error) {
    next(error);
  }
}
```

---

## Resumen: Defensa en Profundidad

| Capa | Herramienta | Momento | Protección |
|------|-------------|---------|------------|
| **1. Compilación** | TypeScript | Build time | Tipos incorrectos, errores de desarrollo |
| **2. Runtime - Request** | Joi | Request llega | Formato, estructura, valores permitidos |
| **3. Runtime - Sanitización** | DOMPurify | Antes de procesar | XSS en contenido HTML |
| **4. Runtime - Persistencia** | Mongoose | Antes de DB | NoSQL Injection, coerción de tipos |
| **5. Base de datos** | MongoDB Schema Validation | Insert/Update | Última barrera, validación nativa |

### Flujo de validación completo

```text
Request HTTP
     │
     ▼
┌─────────────────┐
│   Express       │ → Content-Type validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      Joi        │ → Estructura, formato, sanitización
│   Middleware    │ → Mensajes de error amigables
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   TypeScript    │ → (Ya verificado en compilación)
│   Interfaces    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Mongoose     │ → Coerción de tipos, validaciones de schema
│     Schema      │ → Pre/post hooks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │ → Datos seguros almacenados
└─────────────────┘
```

---

## Próximo Paso

Ahora que entiendes cómo validar y sanitizar datos, el siguiente paso es asegurar que tus dependencias no introduzcan vulnerabilidades. Continúa con **[Gestión de Dependencias](./dependencies)** para aprender sobre npm audit, Dependabot, y gestión de vulnerabilidades.
