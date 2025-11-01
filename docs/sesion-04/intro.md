---
sidebar_position: 1
title: "Seguridad y Desarrollo Seguro"
---

## Introducción

La seguridad en aplicaciones web es un aspecto fundamental que debe integrarse desde el inicio del desarrollo. En esta sesión nos enfocamos en el **desarrollo seguro** desde la perspectiva de un desarrollador Full Stack, no como especialistas en seguridad ofensiva, sino como profesionales responsables de construir aplicaciones robustas y protegidas.

### Objetivos de la sesión

- Comprender las vulnerabilidades más comunes (OWASP Top 10)
- Implementar medidas de seguridad en aplicaciones Node.js/Express
- Configurar headers de seguridad con Helmet.js
- Validar y sanitizar entradas de usuario
- Gestionar secretos y variables de entorno de forma segura
- Integrar prácticas de seguridad en el flujo de desarrollo

### Filosofía: Seguridad por capas (Defense in Depth)

No existe una única solución que haga tu aplicación 100% segura. La seguridad se construye mediante múltiples capas de protección:

1. **Validación de entrada**: No confíes en datos del usuario
2. **Autenticación y autorización**: Verifica identidad y permisos
3. **Configuración segura**: Headers, HTTPS, secretos
4. **Auditoría y monitoreo**: Detecta amenazas temprano
5. **Actualizaciones**: Mantén dependencias al día

---

## 1. OWASP Top 10: Las vulnerabilidades más críticas

El proyecto [OWASP (Open Web Application Security Project)](https://owasp.org/www-project-top-ten/) publica cada pocos años una lista de las 10 vulnerabilidades más críticas en aplicaciones web.

### Top 10 (2021):

1. **A01: Broken Access Control** - Control de acceso roto
2. **A02: Cryptographic Failures** - Fallos criptográficos
3. **A03: Injection** - Inyección (SQL, NoSQL, Command)
4. **A04: Insecure Design** - Diseño inseguro
5. **A05: Security Misconfiguration** - Configuración incorrecta
6. **A06: Vulnerable Components** - Componentes vulnerables
7. **A07: Authentication Failures** - Fallos de autenticación
8. **A08: Software and Data Integrity Failures** - Fallos de integridad
9. **A09: Security Logging Failures** - Fallos en logging
10. **A10: Server-Side Request Forgery (SSRF)** - Falsificación de peticiones

En esta sesión nos enfocaremos en los más relevantes para desarrolladores Full Stack.

---

## 2. Injection Attacks

### 2.1 ¿Qué es una inyección?

Ocurre cuando un atacante puede insertar código malicioso en una consulta o comando que la aplicación ejecuta.

### 2.2 SQL Injection (aunque usamos MongoDB)

Ejemplo vulnerable en SQL:

```javascript
// ❌ VULNERABLE
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// Ataque: GET /user?id=1 OR 1=1
// Resultado: Devuelve TODOS los usuarios
```

**Solución**: Usar prepared statements o ORMs

```javascript
// ✅ SEGURO
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    res.json(results);
  });
});
```

### 2.3 NoSQL Injection (MongoDB)

MongoDB también es vulnerable a inyecciones:

```javascript
// ❌ VULNERABLE
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({
    username: username,
    password: password
  });
  
  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Ataque con:
// { "username": "admin", "password": { "$ne": null } }
// Esto busca usuarios donde password != null
```

**Solución**: Sanitizar entradas y usar operadores seguros

```javascript
// ✅ SEGURO
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize()); // Middleware que elimina $ y .

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validar que sean strings
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  const user = await User.findOne({
    username: username,
    password: hashPassword(password) // Nunca guardes passwords en texto plano
  });
  
  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});
```

### 2.4 Command Injection

Ejecutar comandos del sistema es extremadamente peligroso:

```javascript
// ❌ VULNERABLE
const { exec } = require('child_process');

app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(stdout);
  });
});

// Ataque: GET /ping?host=google.com;rm -rf /
```

**Solución**: Evitar exec/eval, validar estrictamente

```javascript
// ✅ MEJOR
import validator from 'validator';

app.get('/ping', (req, res) => {
  const host = req.query.host;
  
  // Validar que es un dominio o IP válida
  if (!validator.isFQDN(host) && !validator.isIP(host)) {
    return res.status(400).json({ error: 'Invalid host' });
  }
  
  // Usar librería específica en lugar de exec
  ping.promise.probe(host).then(result => {
    res.json(result);
  });
});
```

---

## 3. Cross-Site Scripting (XSS)

### 3.1 ¿Qué es XSS?

Un atacante inyecta JavaScript malicioso que se ejecuta en el navegador de otros usuarios.

### 3.2 Tipos de XSS

**Reflected XSS** (Reflejado):
```javascript
// ❌ VULNERABLE
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Resultados para: ${query}</h1>`);
});

// Ataque: GET /search?q=<script>alert('XSS')</script>
```

**Stored XSS** (Almacenado):
```javascript
// ❌ VULNERABLE
app.post('/comment', async (req, res) => {
  const { text } = req.body;
  await Comment.create({ text }); // Guarda sin sanitizar
  res.redirect('/comments');
});

app.get('/comments', async (req, res) => {
  const comments = await Comment.find();
  // Si renderizas con innerHTML o dangerouslySetInnerHTML
  // el script se ejecutará
});
```

### 3.3 Prevención de XSS

**En el Backend**:

```javascript
import DOMPurify from 'isomorphic-dompurify';

app.post('/comment', async (req, res) => {
  const { text } = req.body;
  
  // Sanitizar HTML peligroso
  const cleanText = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });
  
  await Comment.create({ text: cleanText });
  res.json({ success: true });
});
```

**En el Frontend (React)**:

```tsx
// ✅ SEGURO - React escapa automáticamente
function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          {comment.text} {/* Escapado automáticamente */}
        </div>
      ))}
    </div>
  );
}

// ❌ PELIGROSO - Solo usar con contenido sanitizado
function RichComment({ html }: { html: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// ✅ MEJOR - Sanitizar antes de renderizar
import DOMPurify from 'dompurify';

function SafeRichComment({ html }: { html: string }) {
  const cleanHtml = DOMPurify.sanitize(html);
  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  );
}
```

**Content Security Policy (CSP)**:

```javascript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Evita 'unsafe-inline' en producción
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
```

---

## 4. Cross-Site Request Forgery (CSRF)

### 4.1 ¿Qué es CSRF?

Un atacante engaña a un usuario autenticado para que ejecute acciones no deseadas en una aplicación web.

**Escenario de ataque**:
1. Usuario inicia sesión en `banco.com`
2. Usuario visita `sitiomalicioso.com`
3. `sitiomalicioso.com` contiene: `<img src="https://banco.com/transfer?to=atacante&amount=1000">`
4. El navegador envía la petición CON las cookies de `banco.com`

### 4.2 Prevención con CSRF Tokens

```javascript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// Configurar CSRF protection
const csrfProtection = csrf({ cookie: true });

// Ruta para obtener el token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Proteger rutas que modifican datos
app.post('/api/transfer', csrfProtection, (req, res) => {
  const { to, amount } = req.body;
  // Realizar transferencia
  res.json({ success: true });
});
```

**En el Frontend**:

```typescript
// Obtener token al cargar la app
async function getCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}

// Incluir token en peticiones POST/PUT/DELETE
async function transfer(to: string, amount: number) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken, // Header personalizado
    },
    body: JSON.stringify({ to, amount }),
  });
  
  return response.json();
}
```

### 4.3 SameSite Cookies

Otra capa de protección:

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS
    sameSite: 'strict', // Previene envío cross-site
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
```

Valores de `sameSite`:
- **strict**: Cookie nunca se envía en peticiones cross-site
- **lax**: Cookie se envía en navegación top-level (enlaces, no AJAX)
- **none**: Cookie se envía siempre (requiere `secure: true`)

---

## 5. Helmet.js: Configuración de Headers de Seguridad

Helmet.js configura automáticamente headers HTTP que mejoran la seguridad:

```bash
npm install helmet
```

### 5.1 Configuración básica

```javascript
import helmet from 'helmet';

// Configuración completa recomendada
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    // Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    
    // Prevenir clickjacking
    frameguard: {
      action: 'deny',
    },
    
    // No revelar tecnología del servidor
    hidePoweredBy: true,
    
    // Prevenir MIME sniffing
    noSniff: true,
    
    // Habilitar XSS filter del navegador
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  })
);
```

### 5.2 Headers explicados

**X-Content-Type-Options: nosniff**
```
Previene que el navegador "adivine" el tipo MIME
Evita: cargar script.txt como JavaScript
```

**X-Frame-Options: DENY**
```
Previene que tu sitio se cargue en un iframe
Evita: ataques de clickjacking
```

**Strict-Transport-Security (HSTS)**
```
Fuerza HTTPS en futuras visitas
max-age: duración de la política
includeSubDomains: aplica a todos los subdominios
```

**X-XSS-Protection: 1; mode=block**
```
Activa filtro XSS del navegador
mode=block: bloquea la página en lugar de sanitizar
```

**Content-Security-Policy (CSP)**
```
Define fuentes permitidas para recursos
script-src: de dónde cargar scripts
style-src: de dónde cargar estilos
img-src: de dónde cargar imágenes
```

### 5.3 Verificar headers

```bash
# Verificar headers con curl
curl -I https://tu-sitio.com

# Resultado esperado:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
```

---

## 6. Rate Limiting: Protección contra fuerza bruta

### 6.1 ¿Por qué rate limiting?

Previene:
- Ataques de fuerza bruta en login
- Abuso de APIs
- DDoS básicos
- Web scraping agresivo

### 6.2 Implementación con express-rate-limit

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

// Rate limit general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: 'Demasiadas peticiones desde esta IP, intenta más tarde',
  standardHeaders: true, // Envía info en headers RateLimit-*
  legacyHeaders: false, // Deshabilita headers X-RateLimit-*
});

app.use('/api/', generalLimiter);

// Rate limit estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  skipSuccessfulRequests: true, // No cuenta intentos exitosos
  message: 'Demasiados intentos de login, intenta en 15 minutos',
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Lógica de login
});

// Rate limit para APIs públicas
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 peticiones por minuto
});

app.use('/api/public/', apiLimiter);
```

### 6.3 Rate limiting avanzado

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Usar Redis para aplicaciones distribuidas
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Prefijo para keys de Redis
  }),
});

// Rate limit por usuario autenticado
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    // Usar user ID si está autenticado, sino IP
    return req.user?.id || req.ip;
  },
});
```

### 6.4 Testing de rate limiting

```typescript
// tests/rate-limit.test.ts
import request from 'supertest';
import app from '../app';

describe('Rate Limiting', () => {
  it('debe bloquear después de 5 intentos de login', async () => {
    const credentials = { username: 'test', password: 'wrong' };
    
    // Primeros 5 intentos deben responder 401
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);
      expect(res.status).toBe(401);
    }
    
    // Sexto intento debe ser bloqueado con 429
    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);
      
    expect(res.status).toBe(429);
    expect(res.body.message).toContain('Demasiados intentos');
  });
  
  it('debe respetar límite de API general', async () => {
    // Hacer 100 peticiones
    const promises = Array(100).fill(null).map(() =>
      request(app).get('/api/users')
    );
    
    await Promise.all(promises);
    
    // La petición 101 debe fallar
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(429);
  });
});
```

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

---

## 8. Gestión de Secretos y Variables de Entorno

### 8.1 ¿Qué son los secretos?

Información sensible que no debe estar en el código:
- Contraseñas de bases de datos
- API keys
- JWT secrets
- Credenciales de servicios externos
- Certificados SSL

### 8.2 Variables de entorno con dotenv

```bash
npm install dotenv
```

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRATION=24h
API_KEY=abc123xyz789
REDIS_HOST=localhost
REDIS_PORT=6379
```

```javascript
// src/config/environment.ts
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiration: string;
  apiKey: string;
  redisHost: string;
  redisPort: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiration: getEnvVar('JWT_EXPIRATION', '24h'),
  apiKey: getEnvVar('API_KEY'),
  redisHost: getEnvVar('REDIS_HOST', 'localhost'),
  redisPort: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),
};
```

### 8.3 Múltiples entornos con dotenv-flow

```bash
npm install dotenv-flow
```

Estructura de archivos:
```
.env                 # Valores por defecto
.env.local           # Overrides locales (no commitear)
.env.development     # Valores para desarrollo
.env.test            # Valores para tests
.env.production      # Valores para producción
```

```javascript
// src/index.ts
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  silent: false, // Muestra errores si falta .env
});

// Ahora process.env tiene las variables cargadas
```

### 8.4 Validación de variables de entorno

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRATION: z.string(),
  API_KEY: z.string().min(20),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
});

export type Env = z.infer<typeof envSchema>;

// Validar al inicio de la aplicación
try {
  envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:');
  console.error(error);
  process.exit(1);
}

export const env = process.env as Env;
```

### 8.5 Buenas prácticas

```bash
# .gitignore - NUNCA commitear secretos
.env
.env.local
.env.*.local
*.pem
*.key
```

```bash
# .env.example - Plantilla para otros desarrolladores
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=change-me-in-production
JWT_EXPIRATION=24h
API_KEY=your-api-key-here
```

**Para producción**: Usar servicios de gestión de secretos:
- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **HashiCorp Vault**
- **Variables de entorno de la plataforma** (Heroku, Vercel, Railway)

---

## 9. npm audit: Auditoría de dependencias

### 9.1 ¿Por qué auditar dependencias?

Las librerías que usamos pueden tener vulnerabilidades conocidas. `npm audit` las detecta automáticamente.

### 9.2 Ejecutar auditoría

```bash
# Verificar vulnerabilidades
npm audit

# Salida ejemplo:
# found 3 vulnerabilities (1 low, 2 high) in 1520 scanned packages
#   run `npm audit fix` to fix them, or `npm audit` for details

# Ver detalles
npm audit --json

# Intentar arreglar automáticamente
npm audit fix

# Forzar actualización a versiones breaking changes
npm audit fix --force
```

### 9.3 Interpretar resultados

```bash
# Ejemplo de vulnerabilidad
┌───────────────┬──────────────────────────────────────────────────────────┐
│ High          │ Prototype Pollution                                      │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Package       │ lodash                                                   │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Patched in    │ >=4.17.19                                                │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Dependency of │ express                                                  │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Path          │ express > body-parser > lodash                           │
├───────────────┼──────────────────────────────────────────────────────────┤
│ More info     │ https://npmjs.com/advisories/1523                        │
└───────────────┴──────────────────────────────────────────────────────────┘
```

**Niveles de severidad**:
- **Critical**: Ejecutar `npm audit fix` inmediatamente
- **High**: Priorizar corrección
- **Moderate**: Corregir en próximo ciclo de desarrollo
- **Low**: Monitorear, corregir cuando sea conveniente

### 9.4 Integrar en CI/CD

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Cada lunes

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        # Falla si hay vulnerabilidades moderate o superiores
      
      - name: Check for outdated packages
        run: npm outdated || true
```

### 9.5 Alternativas y complementos

**Snyk**:
```bash
# Instalar Snyk CLI
npm install -g snyk

# Autenticar
snyk auth

# Auditar proyecto
snyk test

# Monitorear continuamente
snyk monitor
```

**npm-check-updates**:
```bash
# Instalar
npm install -g npm-check-updates

# Ver actualizaciones disponibles
ncu

# Actualizar package.json
ncu -u

# Instalar nuevas versiones
npm install
```

### 9.6 Renovate/Dependabot

Automatiza PRs para actualizar dependencias:

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["before 3am on Monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking-change"]
    }
  ]
}
```

---

## 10. Testing de seguridad

### 10.1 Test de headers de seguridad

```typescript
// tests/security-headers.test.ts
import request from 'supertest';
import app from '../app';

describe('Security Headers', () => {
  it('debe incluir headers de seguridad básicos', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
  
  it('debe incluir Content-Security-Policy', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
  
  it('no debe revelar información del servidor', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
```

### 10.2 Test de autenticación

```typescript
// tests/auth-security.test.ts
import request from 'supertest';
import app from '../app';

describe('Authentication Security', () => {
  it('debe rechazar credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });
  
  it('debe establecer cookies HttpOnly', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correctpassword' });
    
    expect(res.status).toBe(200);
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('Secure'); // En producción
  });
  
  it('debe prevenir inyección NoSQL en login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: { $ne: null },
        password: { $ne: null }
      });
    
    expect(res.status).toBe(400); // Bad request por validación
  });
});
```

### 10.3 Test de autorización

```typescript
// tests/authorization.test.ts
import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';

describe('Authorization', () => {
  let userToken: string;
  let adminToken: string;
  
  beforeAll(() => {
    userToken = generateToken({ id: '1', role: 'user' });
    adminToken = generateToken({ id: '2', role: 'admin' });
  });
  
  it('debe rechazar acceso sin token', async () => {
    const res = await request(app)
      .get('/api/admin/users');
    
    expect(res.status).toBe(401);
  });
  
  it('debe rechazar token inválido', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(res.status).toBe(401);
  });
  
  it('debe rechazar usuarios sin permisos', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(403); // Forbidden
  });
  
  it('debe permitir acceso a admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});
```

### 10.4 Test de validación de inputs

```typescript
// tests/input-validation.test.ts
import request from 'supertest';
import app from '../app';

describe('Input Validation', () => {
  describe('POST /api/users', () => {
    it('debe rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'SecurePass123!'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('email')
        })
      );
    });
    
    it('debe rechazar password débil', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password'
        })
      );
    });
    
    it('debe sanitizar campos desconocidos', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          isAdmin: true, // Campo no permitido
          maliciousScript: '<script>alert("xss")</script>'
        });
      
      expect(res.status).toBe(201);
      
      // Verificar que campos no permitidos se ignoraron
      const user = res.body;
      expect(user.isAdmin).toBeUndefined();
      expect(user.maliciousScript).toBeUndefined();
    });
  });
});
```

---

## 11. Checklist de seguridad

### Pre-deployment Security Checklist:

#### Autenticación y Autorización
- [ ] Passwords hasheados con bcrypt (cost factor >= 10)
- [ ] JWT con secrets fuertes (>32 caracteres)
- [ ] Refresh tokens implementados
- [ ] Logout invalida tokens correctamente
- [ ] Rate limiting en endpoints de autenticación
- [ ] Control de acceso basado en roles (RBAC)

#### Configuración
- [ ] Helmet.js configurado correctamente
- [ ] CORS configurado (no permitir `*` en producción)
- [ ] HTTPS habilitado en producción
- [ ] Cookies con flags: HttpOnly, Secure, SameSite
- [ ] Variables de entorno validadas
- [ ] Secretos no están en el código

#### Validación y Sanitización
- [ ] Validación de todos los inputs con Joi/Zod
- [ ] Sanitización contra NoSQL injection
- [ ] Sanitización contra XSS (DOMPurify)
- [ ] Validación de file uploads (tipo, tamaño)
- [ ] Límites en tamaño de requests

#### Headers de Seguridad
- [ ] Content-Security-Policy configurado
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security
- [ ] X-XSS-Protection

#### Base de Datos
- [ ] Queries parametrizadas (no string concatenation)
- [ ] Principio de mínimos privilegios en DB user
- [ ] Backups automáticos configurados
- [ ] Conexión encriptada (MongoDB: ssl=true)

#### Dependencias
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Dependencias actualizadas
- [ ] Renovate/Dependabot configurado
- [ ] Lockfile (package-lock.json) committed

#### Logging y Monitoreo
- [ ] No loguear información sensible (passwords, tokens)
- [ ] Logs de errores y intentos de acceso
- [ ] Monitoreo de errores (Sentry, etc.)
- [ ] Alertas para patrones sospechosos

#### Testing
- [ ] Tests de seguridad en CI/CD
- [ ] Tests de rate limiting
- [ ] Tests de autorización
- [ ] Tests de validación de inputs

---

## 12. Ejercicio Práctico: Auditoría de Seguridad

### Contexto

Se te proporciona una API Express con múltiples vulnerabilidades. Tu tarea es:
1. Identificar las vulnerabilidades
2. Implementar las correcciones
3. Escribir tests que verifiquen las correcciones

### Código vulnerable

```javascript
// ❌ VULNERABLE - NO USAR EN PRODUCCIÓN
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/myapp');

// Modelo de usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // Password en texto plano
  email: String,
  role: String,
});

const User = mongoose.model('User', UserSchema);

// 1. Login sin rate limiting, vulnerable a inyección NoSQL
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({
    username: username,
    password: password
  });
  
  if (user) {
    const token = jwt.sign(
      { id: user._id },
      'secret', // Secret débil
      { expiresIn: '7d' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Registro sin validación
app.post('/api/register', async (req, res) => {
  const user = new User(req.body); // Acepta cualquier campo
  await user.save();
  res.json(user); // Expone toda la información
});

// 3. Endpoint vulnerable a XSS
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Results for: ${query}</h1>`);
});

// 4. Middleware de autenticación débil
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  try {
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// 5. Sin validación de autorización
app.delete('/api/users/:id', authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// 6. Expone información sensible en errores
app.use((err, req, res, next) => {
  console.log(err.stack); // Log completo en consola
  res.status(500).json({
    error: err.message,
    stack: err.stack // Expone stack trace
  });
});

app.listen(3000);
```

### Tarea 1: Identificar vulnerabilidades

Enumera todas las vulnerabilidades que encuentres en el código anterior. Clasifícalas por severidad (Critical, High, Medium, Low).

**Pista**: Busca al menos 10 vulnerabilidades diferentes.

### Tarea 2: Implementar correcciones

Reescribe el código aplicando todas las medidas de seguridad vistas en la sesión:
- Helmet.js
- Rate limiting
- Validación con Joi/Zod
- Hashing de passwords con bcrypt
- Sanitización de inputs
- Variables de entorno
- Gestión correcta de errores
- CSRF protection
- Autorización adecuada

### Tarea 3: Tests de seguridad

Escribe una suite de tests que verifique:
- Headers de seguridad están presentes
- Rate limiting funciona
- NoSQL injection es prevenida
- XSS es prevenida
- Autorización funciona correctamente
- Passwords no se exponen en respuestas

---

## 13. Recursos adicionales

### Documentación oficial
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Herramientas
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/) - Escáner de vulnerabilidades
- [Burp Suite Community](https://portswigger.net/burp/communitydownload) - Testing de seguridad

### Cursos y tutoriales
- [Web Security Academy by PortSwigger](https://portswigger.net/web-security)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - Aplicación vulnerable para practicar
- [NodeGoat](https://github.com/OWASP/NodeGoat) - Aplicación Node.js vulnerable

### Blogs y newsletters
- [OWASP Blog](https://owasp.org/blog/)
- [Snyk Blog](https://snyk.io/blog/)
- [npm Security Blog](https://github.blog/tag/npm/)

---

## Conclusión

La seguridad no es un feature que se añade al final, sino una práctica continua que debe integrarse en todo el ciclo de desarrollo:

**Durante el desarrollo**:
- Validar todos los inputs
- Usar librerías actualizadas
- No hardcodear secretos
- Seguir el principio de mínimos privilegios

**Antes del deployment**:
- Ejecutar npm audit
- Revisar checklist de seguridad
- Configurar Helmet.js y rate limiting
- Validar variables de entorno

**En producción**:
- Monitorear logs y errores
- Actualizar dependencias regularmente
- Responder rápidamente a vulnerabilidades
- Realizar auditorías periódicas

**Recuerda**: Un solo punto vulnerable puede comprometer toda la aplicación. La seguridad es tan fuerte como su eslabón más débil.

### Próximos pasos

1. Completa el ejercicio práctico de auditoría
2. Aplica el checklist de seguridad a tu proyecto actual
3. Configura auditorías automáticas en tu CI/CD
4. Explora OWASP Top 10 en profundidad
5. Practica con aplicaciones vulnerables (WebGoat, NodeGoat)

**¡La seguridad es responsabilidad de todos los desarrolladores!**
