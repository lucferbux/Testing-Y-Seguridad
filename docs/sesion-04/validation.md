---
sidebar_position: 9
title: "Validación y Sanitización"
---

## 7. Validación y Sanitización con Joi/Zod

### 7.1 ¿Por qué validar?

- **No confíes en el cliente**: Validación frontend es UX, no seguridad
- **Previene inyecciones**: Rechaza datos inesperados
- **Evita errores**: Tipos incorrectos pueden romper la aplicación
- **Documenta expectativas**: El schema es la documentación

### 7.2 Validación con Joi

```bash
npm install joi
```

```javascript
import Joi from 'joi';

// Schema de validación para registro
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  
  email: Joi.string()
    .email()
    .required(),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special char'
    }),
  
  age: Joi.number()
    .integer()
    .min(18)
    .max(120)
    .optional(),
  
  terms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept terms and conditions'
    }),
});

// Middleware de validación
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Devuelve todos los errores
      stripUnknown: true, // Elimina campos no definidos
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return res.status(400).json({ errors });
    }
    
    req.body = value; // Usa valores validados/sanitizados
    next();
  };
}

// Usar en rutas
app.post('/api/auth/register', validate(registerSchema), async (req, res) => {
  const { username, email, password } = req.body;
  // Datos ya validados y sanitizados
});
```

### 7.3 Validación con Zod (más moderno)

```bash
npm install zod
```

```typescript
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Schema con Zod
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric'),
  
  email: z.string()
    .email('Invalid email format'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special char'
    ),
  
  age: z.number()
    .int()
    .min(18, 'Must be at least 18 years old')
    .max(120)
    .optional(),
  
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept terms and conditions' })
  }),
});

// Type inference automático
type RegisterInput = z.infer<typeof registerSchema>;

// Middleware de validación con Zod
function validateZod<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ errors });
      }
      next(error);
    }
  };
}

// Usar en rutas
app.post(
  '/api/auth/register',
  validateZod(registerSchema),
  async (req: Request, res: Response) => {
    const { username, email, password } = req.body as RegisterInput;
    // TypeScript conoce los tipos automáticamente
  }
);
```

### 7.4 Validaciones comunes

```typescript
import { z } from 'zod';

// ObjectId de MongoDB
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// URL
const urlSchema = z.string().url();

// Fecha
const dateSchema = z.string().datetime(); // ISO 8601

// Enum
const roleSchema = z.enum(['user', 'admin', 'moderator']);

// Arrays
const tagsSchema = z.array(z.string()).min(1).max(10);

// Nested objects
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().length(2), // Código ISO
});

const userSchema = z.object({
  name: z.string(),
  address: addressSchema,
  tags: tagsSchema,
});

// Conditional validation
const productSchema = z.object({
  type: z.enum(['physical', 'digital']),
  weight: z.number().positive().optional(),
}).refine(
  data => data.type !== 'physical' || data.weight !== undefined,
  {
    message: 'Physical products must have a weight',
    path: ['weight'],
  }
);
```
