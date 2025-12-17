---
sidebar_position: 9
title: "Validación con Mongoose"
---

# Validación con Mongoose

## El rol de Mongoose en la seguridad

Mongoose actúa como la **primera línea de defensa** antes de que los datos lleguen a MongoDB. Cada dato que intentas guardar debe pasar por la validación del esquema.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Flujo de datos hacia MongoDB                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Request                                                               │
│      │                                                                  │
│      ▼                                                                  │
│   ┌─────────────────┐                                                   │
│   │ Express Router  │ ← Recibe datos crudos del cliente                │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ Joi Middleware  │ ← Validación de formato/estructura                │
│   │ (pre-validación)│   (opcional pero recomendado)                     │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │    Controlador  │ ← Lógica de negocio                               │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐                                                   │
│   │ Mongoose Model  │ ← VALIDACIÓN DE ESQUEMA                           │
│   │   .save()       │   - Tipos de datos                                │
│   │   .create()     │   - Validadores built-in                          │
│   │   .findOne...() │   - Validadores custom                            │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼ (solo si válido)                                           │
│   ┌─────────────────┐                                                   │
│   │    MongoDB      │ ← Datos almacenados                               │
│   └─────────────────┘                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tipos de datos en Mongoose

Mongoose convierte automáticamente los datos al tipo definido en el esquema. Esto es una **protección contra NoSQL Injection**:

```typescript
// api/src/components/User/model.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  failedLoginAttempts: number;
  isLocked: boolean;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,        // ← Cualquier cosa se convierte a string
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],  // ← Solo estos valores permitidos
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  failedLoginAttempts: {
    type: Number,        // ← Si envían string, se convierte a número
    default: 0,
    min: 0,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
});
```

### Type coercion como protección

Veamos cómo Mongoose protege contra NoSQL Injection:

```typescript
// Ataque: El atacante envía un objeto en lugar de string
const maliciousInput = {
  email: { $gt: '' },  // Operador MongoDB que matchea todo
  password: 'anything'
};

// SIN Mongoose (driver nativo de MongoDB)
await db.collection('users').findOne({
  email: { $gt: '' },  // ← MongoDB ejecuta el operador
  password: 'anything'
});
// ¡Retorna el primer usuario de la base de datos!

// CON Mongoose
const user = await User.findOne({
  email: { $gt: '' },  // ← Mongoose convierte a string: "{ $gt: '' }"
  password: 'anything'
});
// Busca literalmente un usuario con email "{ $gt: '' }" - no encuentra nada
```

```text
┌─────────────────────────────────────────────────────────────────┐
│              Type Coercion de Mongoose                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT                    TYPE        RESULTADO                 │
│  ─────────────────────────────────────────────────────────────  │
│  { email: "test@t.com" }  String  →  email: "test@t.com"        │
│  { email: 123 }           String  →  email: "123"               │
│  { email: {$gt: ''} }     String  →  email: "[object Object]"   │
│  { role: "admin" }        enum    →  role: "admin"              │
│  { role: "hacker" }       enum    →  ValidationError            │
│  { attempts: "5" }        Number  →  attempts: 5                │
│  { attempts: "abc" }      Number  →  ValidationError            │
│  { isLocked: "true" }     Boolean →  isLocked: true             │
│  { isLocked: 1 }          Boolean →  isLocked: true             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validadores Built-in

Mongoose incluye validadores para casos comunes:

### Validadores de String

```typescript
const ProductSchema = new Schema({
  name: {
    type: String,
    
    // Requerido - no puede ser null/undefined/vacío
    required: [true, 'El nombre del producto es obligatorio'],
    
    // Longitud mínima
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    
    // Longitud máxima - IMPORTANTE para prevenir DoS
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    
    // Eliminar espacios al inicio/final
    trim: true,
    
    // Convertir a minúsculas
    lowercase: true,
    
    // Regex para formato específico
    match: [/^[a-záéíóúñ0-9\s-]+$/i, 'Nombre contiene caracteres no permitidos'],
  },
  
  sku: {
    type: String,
    required: true,
    uppercase: true,  // Convertir a mayúsculas
    match: [/^[A-Z]{3}-\d{4}$/, 'SKU debe tener formato ABC-1234'],
  },
  
  category: {
    type: String,
    // Solo estos valores específicos
    enum: {
      values: ['electronics', 'clothing', 'food', 'books'],
      message: '{VALUE} no es una categoría válida'
    },
    required: true,
  },
});
```

### Validadores de Number

```typescript
const OrderSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
    
    // Valor mínimo
    min: [1, 'La cantidad debe ser al menos 1'],
    
    // Valor máximo
    max: [1000, 'No puedes pedir más de 1000 unidades'],
  },
  
  price: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo'],
  },
  
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: [100, 'El descuento no puede ser mayor al 100%'],
  },
});
```

### Validadores de Array

```typescript
const ProjectSchema = new Schema({
  tags: {
    type: [String],
    
    // Validar cada elemento del array
    validate: {
      validator: function(tags: string[]) {
        // Máximo 10 tags
        return tags.length <= 10;
      },
      message: 'No puedes añadir más de 10 tags'
    }
  },
  
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
});
```

---

## Validadores personalizados

Para reglas de negocio más complejas, creamos validadores custom:

### Validador de email

```typescript
const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string): boolean {
        // Regex para validar formato de email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
      },
      message: (props) => `${props.value} no es un email válido`
    }
  },
});
```

### Validador de URL segura

```typescript
const LinkSchema = new Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(url: string): boolean {
        try {
          const parsed = new URL(url);
          
          // Solo permitir https
          if (parsed.protocol !== 'https:') {
            return false;
          }
          
          // No permitir IPs privadas o localhost
          const host = parsed.hostname;
          const privatePatterns = [
            /^localhost$/i,
            /^127\./,
            /^10\./,
            /^192\.168\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^0\.0\.0\.0$/,
          ];
          
          for (const pattern of privatePatterns) {
            if (pattern.test(host)) {
              return false;
            }
          }
          
          return true;
        } catch {
          return false;
        }
      },
      message: 'URL debe ser HTTPS y no apuntar a direcciones privadas'
    }
  },
});
```

### Validador asíncrono

```typescript
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
    trim: true,
    validate: {
      // Validador asíncrono para verificar unicidad
      validator: async function(username: string): Promise<boolean> {
        // No verificar si es update del mismo documento
        if (!this.isNew && !this.isModified('username')) {
          return true;
        }
        
        // Verificar si ya existe otro usuario con este username
        const existingUser = await mongoose.model('User').findOne({ 
          username,
          _id: { $ne: this._id }  // Excluir el documento actual
        });
        
        return !existingUser;
      },
      message: 'Este nombre de usuario ya está en uso'
    }
  },
});
```

### Validadores dependientes de otros campos

```typescript
const EventSchema = new Schema({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(endDate: Date): boolean {
        // 'this' hace referencia al documento
        return endDate > this.startDate;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  },
  
  minParticipants: {
    type: Number,
    default: 1,
    min: 1,
  },
  maxParticipants: {
    type: Number,
    validate: {
      validator: function(max: number): boolean {
        return max >= this.minParticipants;
      },
      message: 'El máximo de participantes debe ser mayor o igual al mínimo'
    }
  },
});
```

---

## Pre-save hooks para validación

Los hooks de Mongoose permiten ejecutar lógica antes de guardar:

### Ejemplo: Hash de password

```typescript
import bcrypt from 'bcrypt';

UserSchema.pre('save', async function(next) {
  // Solo hashear si el password ha sido modificado
  if (!this.isModified('password')) {
    return next();
  }

  // Validar longitud mínima antes de hashear
  if (this.password.length < 8) {
    return next(new Error('La contraseña debe tener al menos 8 caracteres'));
  }

  try {
    // Generar salt y hash
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});
```

### Ejemplo: Sanitización de campos

```typescript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

ProjectSchema.pre('save', function(next) {
  // Sanitizar descripción que puede contener HTML
  if (this.isModified('description')) {
    this.description = DOMPurify.sanitize(this.description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  }

  // Sanitizar campo de texto plano
  if (this.isModified('name')) {
    // Eliminar cualquier HTML
    this.name = DOMPurify.sanitize(this.name, { ALLOWED_TAGS: [] });
  }

  next();
});
```

### Ejemplo: Normalización de datos

```typescript
UserSchema.pre('save', function(next) {
  // Normalizar email
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }

  // Capitalizar nombre
  if (this.isModified('name')) {
    this.name = this.name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Establecer fecha de actualización
  this.updatedAt = new Date();

  next();
});
```

---

## Manejo de errores de validación

Cuando Mongoose detecta un error de validación, lanza un `ValidationError`. Es importante manejarlo correctamente:

### Middleware de errores

```typescript
// api/src/config/error/index.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface FormattedError {
  message: string;
  status: number;
  errors?: Record<string, string>;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let formattedError: FormattedError = {
    message: 'Internal server error',
    status: 500,
  };

  // Error de validación de Mongoose
  if (error instanceof mongoose.Error.ValidationError) {
    formattedError.status = 400;
    formattedError.message = 'Validation failed';
    formattedError.errors = {};

    // Extraer mensaje de cada campo con error
    for (const [field, err] of Object.entries(error.errors)) {
      formattedError.errors[field] = err.message;
    }
  }

  // Error de Cast (ej: ObjectId inválido)
  if (error instanceof mongoose.Error.CastError) {
    formattedError.status = 400;
    formattedError.message = `Invalid ${error.path}: ${error.value}`;
  }

  // Error de duplicado (unique constraint)
  if ((error as any).code === 11000) {
    formattedError.status = 409;
    const field = Object.keys((error as any).keyValue)[0];
    formattedError.message = `${field} already exists`;
  }

  // Log del error (solo el stack en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  } else {
    console.error(error.message);
  }

  res.status(formattedError.status).json(formattedError);
}
```

### Ejemplo de respuesta de error

```json
{
  "message": "Validation failed",
  "status": 400,
  "errors": {
    "email": "test@invalid no es un email válido",
    "password": "La contraseña debe tener al menos 8 caracteres",
    "role": "hacker no es una categoría válida"
  }
}
```

---

## Esquema seguro completo

Aquí tienes un ejemplo de esquema con todas las protecciones:

```typescript
// api/src/components/Project/model.ts

import mongoose, { Schema, Document } from 'mongoose';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

export interface IProject extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  status: 'draft' | 'active' | 'archived';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: [true, 'El nombre del proyecto es obligatorio'],
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    trim: true,
  },

  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [5000, 'La descripción no puede exceder 5000 caracteres'],
    // No trim para preservar formato
  },

  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El proyecto debe tener un propietario'],
    // ← Mongoose valida que sea un ObjectId válido
  },

  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'archived'],
      message: '{VALUE} no es un estado válido',
    },
    default: 'draft',
  },

  isPublic: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,  // ← No se puede modificar después de crear
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  // Opciones del esquema
  
  // Añadir timestamps automáticos
  timestamps: true,
  
  // Convertir a JSON sin __v y con id en lugar de _id
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// ═══════════════════════════════════════════════════════════════
// ÍNDICES
// ═══════════════════════════════════════════════════════════════

// Índice para búsquedas por owner
ProjectSchema.index({ owner: 1 });

// Índice para búsquedas por colaboradores
ProjectSchema.index({ collaborators: 1 });

// Índice compuesto para listados ordenados
ProjectSchema.index({ owner: 1, status: 1, createdAt: -1 });

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

// Sanitizar antes de guardar
ProjectSchema.pre('save', function(next) {
  // Sanitizar nombre (sin HTML)
  if (this.isModified('name')) {
    this.name = DOMPurify.sanitize(this.name, { ALLOWED_TAGS: [] })
      .trim()
      .slice(0, 100);  // Límite estricto
  }

  // Sanitizar descripción (HTML limitado)
  if (this.isModified('description')) {
    this.description = DOMPurify.sanitize(this.description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
    }).slice(0, 5000);  // Límite estricto
  }

  // Actualizar fecha de modificación
  this.updatedAt = new Date();

  next();
});

// Validar límite de colaboradores
ProjectSchema.pre('save', function(next) {
  if (this.collaborators.length > 50) {
    return next(new Error('Un proyecto no puede tener más de 50 colaboradores'));
  }
  
  // Evitar duplicados en colaboradores
  const uniqueCollaborators = [...new Set(
    this.collaborators.map(id => id.toString())
  )];
  
  if (uniqueCollaborators.length !== this.collaborators.length) {
    return next(new Error('No se permiten colaboradores duplicados'));
  }
  
  next();
});

// ═══════════════════════════════════════════════════════════════
// MÉTODOS DE INSTANCIA
// ═══════════════════════════════════════════════════════════════

ProjectSchema.methods.isOwner = function(userId: string): boolean {
  return this.owner.toString() === userId;
};

ProjectSchema.methods.isCollaborator = function(userId: string): boolean {
  return this.collaborators.some(
    (id: mongoose.Types.ObjectId) => id.toString() === userId
  );
};

ProjectSchema.methods.canAccess = function(userId: string): boolean {
  return this.isPublic || this.isOwner(userId) || this.isCollaborator(userId);
};

// ═══════════════════════════════════════════════════════════════
// MÉTODOS ESTÁTICOS
// ═══════════════════════════════════════════════════════════════

ProjectSchema.statics.findByUser = function(
  userId: string,
  includeCollaborations: boolean = true
) {
  const query = includeCollaborations
    ? { $or: [{ owner: userId }, { collaborators: userId }] }
    : { owner: userId };
  
  return this.find(query).sort({ updatedAt: -1 });
};

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
```

---

## Checklist de Validación Mongoose

```text
□ Todos los campos tienen tipos explícitos
□ Campos obligatorios marcados con required
□ Strings con maxlength para prevenir DoS
□ Numbers con min/max según reglas de negocio
□ Campos enum para valores predefinidos
□ Validadores custom para reglas complejas
□ Pre-save hooks para sanitización
□ Índices únicos donde corresponda
□ ObjectIds validados automáticamente
□ Errores de validación manejados correctamente
□ Timestamps automáticos configurados
□ Campos sensibles excluidos de toJSON
```

---

## Próximo Paso

Mongoose valida los datos en la capa de modelo, pero es mejor rechazar datos inválidos lo antes posible. Con **Joi** podemos validar en el controlador, antes de que lleguen a Mongoose. Continúa con **[Validación con Joi](./validation-joi)**.
