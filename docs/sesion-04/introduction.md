---
sidebar_position: 2
title: "Seguridad en Aplicaciones Web"
---

# Introducción a la Seguridad Web

## 🎯 ¿Por Qué Seguridad en el Desarrollo?

La seguridad en aplicaciones web no es un "feature opcional" ni algo que se añade al final. **Es un requisito fundamental** que debe integrarse desde el primer commit. En 2024, las aplicaciones web enfrentan amenazas sofisticadas y automatizadas que pueden explotar vulnerabilidades en segundos.

**Datos alarmantes del estado actual**:

- **60%** de las organizaciones sufrieron al menos una brecha de seguridad en 2023
- **$4.45 millones** es el costo promedio de una brecha de datos (IBM Security Report)
- **43%** de los ataques se dirigen a pequeñas empresas (que asumen estar "seguras por ser pequeñas")
- **95%** de las vulnerabilidades son por errores humanos, no defectos del software
- **18 segundos** es el tiempo promedio que tarda un bot en detectar un servidor vulnerable

**¿Tu aplicación podría ser la siguiente?** La respuesta es **sí**, a menos que implementes prácticas de seguridad desde el desarrollo.

---

## 🧑‍💻 Enfoque: Desarrolladores Responsables, No Hackers

En esta sesión nos enfocamos en el **desarrollo seguro** desde la perspectiva de un desarrollador Full Stack. No te convertirás en un hacker ético ni en un pentester profesional, pero sí en un **desarrollador responsable** que:

✅ **Construye aplicaciones robustas** que resisten ataques comunes  
✅ **Previene vulnerabilidades** antes de que lleguen a producción  
✅ **Aplica best practices** reconocidas por la industria (OWASP, NIST)  
✅ **Automatiza controles de seguridad** con testing y CI/CD  
✅ **Piensa en términos de amenazas** (threat modeling básico)  

❌ **No aprenderás** a hackear sistemas (ética y legalmente incorrecto)  
❌ **No profundizaremos** en criptografía avanzada (solo conceptos)  
❌ **No cubrimos** seguridad de infraestructura al detalle (AWS, Docker)  

**Nuestro objetivo**: Que puedas responder con confianza a estas preguntas:

- ¿Mi aplicación está protegida contra OWASP Top 10?
- ¿Cómo prevenir inyecciones SQL/NoSQL y XSS?
- ¿Qué headers de seguridad debo configurar?
- ¿Cómo gestiono secretos de forma segura?
- ¿Puedo detectar dependencias vulnerables automáticamente?

---

## 🎯 Objetivos de la Sesión

Al finalizar esta sesión, habrás adquirido competencias técnicas y conceptuales clave:

### Conocimientos Fundamentales

1. **Comprender OWASP Top 10 (2021)**
   - Identificar las 10 vulnerabilidades más críticas en aplicaciones web
   - Entender su impacto en confidencialidad, integridad y disponibilidad
   - Conocer vectores de ataque y técnicas de explotación

2. **Filosofía de seguridad por capas (Defense in Depth)**
   - No depender de una única capa de protección
   - Implementar controles redundantes y complementarios
   - Aplicar principio de menor privilegio (Least Privilege)

3. **Threat Modeling básico**
   - Pensar como atacante para identificar vulnerabilidades
   - Clasificar amenazas por probabilidad e impacto
   - Priorizar mitigaciones según riesgo

### Habilidades Técnicas

1. **Prevenir Injection Attacks**
   - SQL Injection con prepared statements
   - NoSQL Injection con sanitización
   - Command Injection evitando exec/eval

2. **Proteger contra XSS (Cross-Site Scripting)**
   - Sanitización de inputs con DOMPurify
   - Content Security Policy (CSP) con Helmet.js
   - Escapado correcto en React/templates

3. **Implementar protección CSRF (Cross-Site Request Forgery)**
   - CSRF tokens en formularios
   - SameSite cookies configuration
   - Double-submit cookie pattern

4. **Configurar Helmet.js correctamente**
   - Headers de seguridad esenciales
   - CSP personalizado para SPAs
   - HSTS, X-Frame-Options, etc.

5. **Implementar Rate Limiting**
   - Protección contra fuerza bruta
   - Configuración por endpoint
   - Redis para rate limiting distribuido

6. **Validación robusta con Joi/Zod**
   - Schemas de validación del lado del servidor
   - Sanitización de inputs
   - Manejo de errores de validación

7. **Gestionar secretos de forma segura**
   - Variables de entorno con dotenv
   - Servicios de secretos (AWS Secrets Manager, HashiCorp Vault)
   - Rotación de secretos y tokens

8. **Auditar dependencias con npm audit**
   - Detectar vulnerabilidades conocidas (CVEs)
   - Interpretar severidades (crítico, alto, medio, bajo)
   - Remediar con updates o alternativas

9. **Escribir tests de seguridad**
   - Tests automatizados para validar controles
   - Integration tests de autenticación/autorización
   - Smoke tests de headers de seguridad

### Competencias Profesionales

1. **Aplicar checklist de seguridad pre-deployment**
   - Verificación sistemática antes de producir
   - HTTPS, headers, secrets, logging
   - Cumplimiento de políticas organizacionales

2. **Integrar seguridad en CI/CD**
   - npm audit en pipeline
   - SAST tools (Static Analysis)
   - Dependabot/Snyk para dependency scanning

3. **Logging y monitoreo de seguridad**
   - Registrar eventos relevantes (logins fallidos, accesos denegados)
   - Alertas ante comportamientos sospechosos
   - Cumplir GDPR/regulaciones sobre logs

---

## 🛡️ Filosofía: Seguridad por Capas (Defense in Depth)

**La seguridad NO es binaria**. No existe una configuración mágica que haga tu aplicación "100% segura". La seguridad se construye mediante **múltiples capas de protección redundantes**.

### Analogía: Seguridad como una Fortaleza Medieval

Imagina que tu aplicación es un castillo medieval:

```
╔═══════════════════════════════════════════════════════════════════╗
║                        🏰 CASTILLO (Aplicación)                   ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  👑 Sala del Tesoro (Base de Datos)                     │     ║ Capa 7
║  │     - Encriptación at-rest                              │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         ▲                                                         ║
║         │ Capa 6: Autorización (Guards con llaves específicas)   ║
║         ▼                                                         ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  🚪 Puertas Internas (Endpoints protegidos)             │     ║ Capa 5
║  │     - JWT verification, RBAC                            │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         ▲                                                         ║
║         │ Capa 4: Validación (Inspección de visitantes)          ║
║         ▼                                                         ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  🔍 Punto de Control (Input Validation)                 │     ║ Capa 3
║  │     - Joi/Zod schemas, sanitización                     │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         ▲                                                         ║
║         │ Capa 2: Headers de Seguridad (Murallas defensivas)     ║
║         ▼                                                         ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  🧱 Muralla (Helmet.js, HTTPS, CORS)                    │     ║ Capa 2
║  └─────────────────────────────────────────────────────────┘     ║
║         ▲                                                         ║
║         │ Capa 1: Perímetro (Firewall, Rate Limiting)            ║
║         ▼                                                         ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  🚧 Foso (WAF, DDoS protection, Rate Limiter)           │     ║ Capa 1
║  └─────────────────────────────────────────────────────────┘     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
       Atacante debe superar TODAS las capas para tener éxito
```

**¿Por qué múltiples capas?**

1. **Redundancia**: Si una capa falla (bug, misconfiguration), las demás siguen protegiendo
2. **Complementariedad**: Cada capa protege contra amenazas diferentes
3. **Profundidad**: Dificulta significativamente la explotación (costo/tiempo para atacante)
4. **Detection**: Más capas = más oportunidades de detectar y alertar

### Las 7 Capas de Seguridad en una Aplicación Full Stack

#### **Capa 1: Perímetro (Network Security)**

**Qué protege**: Ataques de red, DDoS, scanning automatizado

**Implementaciones**:
- Firewall configurado correctamente (solo puertos necesarios)
- Rate Limiting global (ej: 1000 req/min por IP)
- WAF (Web Application Firewall) para filtrar tráfico malicioso
- DDoS mitigation (Cloudflare, AWS Shield)

**Ejemplo con rate-limiter**:

```typescript
import rateLimit from 'express-rate-limit';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Too many requests, please try again later',
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false, // X-RateLimit-* headers
});

app.use(globalLimiter);
```

#### **Capa 2: Transporte (HTTPS/TLS)**

**Qué protege**: Man-in-the-middle, eavesdropping, packet sniffing

**Implementaciones**:
- HTTPS con certificados válidos (Let's Encrypt)
- TLS 1.3 preferred, mínimo TLS 1.2
- HSTS header para forzar HTTPS
- Secure cookies (httpOnly, secure, sameSite)

**Configuración segura**:

```typescript
app.use(helmet.hsts({
  maxAge: 31536000, // 1 año
  includeSubDomains: true,
  preload: true
}));

// Cookies seguras
app.use(session({
  secret: process.env.SESSION_SECRET!,
  cookie: {
    secure: true, // Solo HTTPS
    httpOnly: true, // No accesible desde JS
    sameSite: 'strict', // Protección CSRF
    maxAge: 3600000 // 1 hora
  }
}));
```

#### **Capa 3: Aplicación (Headers & Config)**

**Qué protege**: Clickjacking, XSS, MIME sniffing, información sensible

**Implementaciones**:
- Helmet.js para headers de seguridad
- CSP (Content Security Policy)
- CORS configuration restrictiva
- Deshabilitar stack traces en producción

**Configuración Helmet.js**:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

#### **Capa 4: Autenticación & Autorización**

**Qué protege**: Accesos no autorizados, privilege escalation

**Implementaciones**:
- JWT con expiración corta (15min access, 7d refresh)
- RBAC (Role-Based Access Control)
- MFA (Multi-Factor Authentication) para acciones críticas
- Session management seguro

**Middleware de autorización**:

```typescript
function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Uso
app.delete('/users/:id', requireRole('admin'), deleteUser);
```

#### **Capa 5: Validación & Sanitización**

**Qué protege**: Injection attacks, data corruption, business logic bypass

**Implementaciones**:
- Validación server-side con Joi/Zod
- Sanitización de inputs (express-mongo-sanitize, DOMPurify)
- Type checking estricto (TypeScript)
- Whitelisting sobre blacklisting

**Validación robusta**:

```typescript
import Joi from 'joi';

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(12).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  age: Joi.number().integer().min(18).max(120).required(),
});

app.post('/register', async (req, res) => {
  const { error, value } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  
  // value está validado y sanitizado
  const user = await createUser(value);
  res.json(user);
});
```

#### **Capa 6: Datos (Database Security)**

**Qué protege**: Data breaches, SQL injection, unauthorized queries

**Implementaciones**:
- Prepared statements / Parameterized queries
- Least privilege DB users (no usar root)
- Encriptación at-rest y in-transit
- Backups encriptados

**Configuración segura de Mongoose**:

```typescript
// Usuario DB con permisos limitados
const dbUser = process.env.DB_USER; // NO es admin
const dbPass = process.env.DB_PASS;

mongoose.connect(`mongodb://${dbUser}:${dbPass}@localhost/myapp`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin', // DB de autenticación
});

// Queries seguras con Mongoose (previene NoSQL injection)
const user = await User.findOne({ 
  email: sanitizedEmail 
}).select('-password'); // No retornar password
```

#### **Capa 7: Monitoreo & Auditoría**

**Qué protege**: Detecta y responde a incidentes, cumplimiento regulatorio

**Implementaciones**:
- Logging estructurado (Winston, Pino)
- Alertas ante eventos sospechosos
- SIEM integration (Security Information and Event Management)
- Audit trails de acciones críticas

**Logging de seguridad**:

```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
  ],
});

// Loguear eventos de seguridad
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authenticateUser(email, password);
  
  if (!user) {
    securityLogger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  securityLogger.info('Successful login', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  res.json({ token: generateToken(user) });
});
```

---

## 🔑 Principios Fundamentales de Seguridad

Más allá de las implementaciones técnicas, existen principios universales que guían el desarrollo seguro:

### 1. **Principle of Least Privilege (Mínimo Privilegio)**

**Definición**: Otorgar **solo los permisos necesarios** para realizar una tarea, nada más.

**Aplicaciones**:

```typescript
// ❌ Usuario DB con privilegios de ADMIN
const dbConnection = mongoose.connect('mongodb://admin:pass@localhost/myapp');

// ✅ Usuario DB con permisos específicos (solo read/write en myapp)
const dbConnection = mongoose.connect('mongodb://myapp_user:pass@localhost/myapp');

// ❌ Token JWT con todos los datos del usuario
const token = jwt.sign({ ...user }, secret);

// ✅ Token JWT con claims mínimos necesarios
const token = jwt.sign({ 
  userId: user.id, 
  email: user.email, 
  role: user.role 
}, secret, { expiresIn: '15m' });

// ❌ CORS abierto a cualquier origen
app.use(cors({ origin: '*' }));

// ✅ CORS restringido a dominios conocidos
app.use(cors({ 
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true 
}));
```

### 2. **Fail Securely (Fallar de Forma Segura)**

**Definición**: Cuando algo sale mal, **fallar hacia el lado seguro** (denegar acceso por defecto).

```typescript
// ❌ INSEGURO: Por defecto permite
function checkPermission(user: User, resource: string): boolean {
  try {
    return hasAccess(user, resource);
  } catch (error) {
    console.log('Error checking permission:', error);
    return true; // ¡PELIGRO! Permite acceso en caso de error
  }
}

// ✅ SEGURO: Por defecto deniega
function checkPermission(user: User, resource: string): boolean {
  try {
    return hasAccess(user, resource);
  } catch (error) {
    securityLogger.error('Permission check failed', { user: user.id, resource, error });
    return false; // Seguro: deniega acceso en caso de error
  }
}

// ❌ INSEGURO: Error expone información
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message }); // Expone stack trace
  }
});

// ✅ SEGURO: Error genérico al usuario
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user', { userId: req.params.id, error });
    res.status(500).json({ error: 'Internal server error' }); // Genérico
  }
});
```

### 3. **Never Trust User Input (Nunca Confíes en el Usuario)**

**Definición**: **Toda entrada es potencialmente maliciosa** hasta que se valide y sanitice.

```typescript
// ❌ INSEGURO: Confía ciegamente en el input
app.post('/search', async (req, res) => {
  const query = req.body.query; // Sin validación
  const results = await db.collection('products').find({ name: query }).toArray();
  res.json(results);
});

// Ataque: { "query": { "$ne": null } } retorna TODOS los productos

// ✅ SEGURO: Valida tipo y sanitiza
import mongoSanitize from 'express-mongo-sanitize';
import Joi from 'joi';

app.use(mongoSanitize()); // Elimina $, . de inputs

const searchSchema = Joi.object({
  query: Joi.string().max(100).required(),
  category: Joi.string().valid('electronics', 'books', 'clothing').optional(),
});

app.post('/search', async (req, res) => {
  const { error, value } = searchSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  
  // value está validado: query es string, category es enum válido
  const results = await db.collection('products')
    .find({ 
      name: new RegExp(value.query, 'i'),
      ...(value.category && { category: value.category })
    })
    .toArray();
  
  res.json(results);
});
```

**Regla de oro**: Valida **siempre en el servidor**, incluso si validas en el cliente. El cliente es **totalmente controlable** por el atacante.

### 4. **Defense in Depth (Ya cubierto arriba)**

Múltiples capas redundantes de seguridad.

### 5. **Security by Design, Not by Obscurity**

**Definición**: La seguridad debe venir del **diseño robusto**, no de ocultar información.

```typescript
// ❌ INSEGURO: Confía en que la URL es "secreta"
app.get('/admin/secret-panel-xyz123', requireAuth, adminPanel);

// Si alguien descubre la URL, tiene acceso

// ✅ SEGURO: Verifica permisos robustos
app.get('/admin', requireAuth, requireRole('admin'), adminPanel);

// La URL puede ser conocida, pero solo admins tienen acceso

// ❌ INSEGURO: "Nadie sabrá que uso MD5 para passwords"
const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

// MD5 es roto desde 2004, se puede crackear fácilmente

// ✅ SEGURO: Usa algoritmos probados (bcrypt, argon2)
const hashedPassword = await bcrypt.hash(password, 12);
```

### 6. **Keep it Simple, Security (KISS)**

**Definición**: La complejidad es enemiga de la seguridad. **Código simple = menos bugs**.

```typescript
// ❌ COMPLEJO: Lógica de autorización rebuscada
function canEditPost(user, post) {
  if (user.role === 'admin') return true;
  if (user.role === 'moderator' && post.flagCount > 5) return true;
  if (user.id === post.authorId && !post.isLocked) return true;
  if (user.subscriptionTier === 'premium' && new Date(user.createdAt) < new Date('2023-01-01')) return true;
  return false;
}

// ✅ SIMPLE: Reglas claras y verificables
function canEditPost(user: User, post: Post): boolean {
  // Solo el autor o admin pueden editar
  return user.id === post.authorId || user.role === 'admin';
}

// Si necesitas lógica compleja, separa en funciones pequeñas y testeables
function canEditPost(user: User, post: Post): boolean {
  return isOwner(user, post) || isAdmin(user) || isModerator(user, post);
}

function isOwner(user: User, post: Post): boolean {
  return user.id === post.authorId && !post.isLocked;
}

function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

function isModerator(user: User, post: Post): boolean {
  return user.role === 'moderator' && post.flagCount > 5;
}
```

---

## 🧠 Threat Modeling: Pensar como Atacante

**Threat Modeling** (modelado de amenazas) es el proceso de identificar, priorizar y mitigar amenazas potenciales a tu aplicación.

### Framework STRIDE (Microsoft)

Clasifica amenazas en 6 categorías:

| Categoría | Amenaza | Ejemplo | Mitigación |
|-----------|---------|---------|------------|
| **S**poofing | Suplantación de identidad | Atacante usa credenciales robadas | MFA, tokens JWT con expiración corta |
| **T**ampering | Modificación de datos | Atacante altera request para cambiar precio | Validación server-side, firmas digitales |
| **R**epudiation | Negación de acciones | Usuario niega haber hecho compra | Audit logs, firmas digitales |
| **I**nformation Disclosure | Fuga de información | Stack traces expuestos | Error handling genérico, logging seguro |
| **D**enial of Service | Denegación de servicio | Atacante satura servidor con requests | Rate limiting, load balancing |
| **E**levation of Privilege | Escalada de privilegios | Usuario normal accede a panel admin | RBAC, Least Privilege |

### Proceso de Threat Modeling (simplificado)

1. **Diagramar la arquitectura**: Identificar componentes y flujos de datos

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Cliente │ ◄──────► │ API     │ ◄──────► │ MongoDB │
│ (React) │   HTTPS  │ (Express│   TLS    │         │
└─────────┘          └─────────┘          └─────────┘
                          │
                          ▼
                     ┌─────────┐
                     │ Redis   │
                     │ (cache) │
                     └─────────┘
```

2. **Identificar amenazas**: Para cada componente, aplicar STRIDE

   **Ejemplo: Endpoint de Login**
   
   - **Spoofing**: ¿Puedo autenticar sin credenciales válidas?
   - **Tampering**: ¿Puedo modificar el request para cambiar mi rol?
   - **Repudiation**: ¿Se loguean intentos de login fallidos?
   - **Information Disclosure**: ¿Revelo si el email existe al fallar login?
   - **DoS**: ¿Puedo saturar con intentos de login?
   - **Elevation of Privilege**: ¿Puedo obtener token de admin?

3. **Priorizar amenazas**: Por probabilidad × impacto

   | Amenaza | Probabilidad | Impacto | Prioridad |
   |---------|--------------|---------|-----------|
   | Brute force login | Alta | Alto | **Crítica** |
   | User enumeration | Media | Medio | Media |
   | Session fixation | Baja | Alto | Media |

4. **Mitigar amenazas**:

   ```typescript
   // Mitigación: Brute force con rate limiting
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // 5 intentos por 15min
     skipSuccessfulRequests: true,
   });

   app.post('/login', loginLimiter, async (req, res) => {
     // ...
   });

   // Mitigación: User enumeration (mismo mensaje para ambos casos)
   if (!user || !validPassword) {
     return res.status(401).json({ 
       error: 'Invalid email or password' // No revela cuál falló
     });
   }
   ```

---

## 📊 El Costo de la Inseguridad

**¿Qué pasa si no implementas seguridad?**

### Costos Financieros

- **Multas regulatorias**: GDPR hasta €20M o 4% facturación anual
- **Remediación técnica**: Parchear vulnerabilidades, migrar datos
- **Legal**: Demandas de usuarios afectados
- **Pérdida de negocio**: Clientes que abandonan por falta de confianza

### Costos de Reputación

- **Marca dañada**: Noticias de "Empresa X fue hackeada"
- **Pérdida de confianza**: Usuarios migran a competidores
- **Impacto en valoración**: Startups pierden inversión

### Casos Reales

**Equifax (2017)**:
- **Vulnerabilidad**: Apache Struts sin parchear (CVE-2017-5638)
- **Impacto**: 147 millones de usuarios, SSN y datos financieros expuestos
- **Costo**: $1.4 mil millones en remediación y multas
- **Lección**: Mantener dependencias actualizadas (npm audit!)

**British Airways (2018)**:
- **Vulnerabilidad**: Magecart (skimming de tarjetas vía JavaScript malicioso)
- **Impacto**: 380,000 tarjetas comprometidas
- **Multa GDPR**: £20 millones
- **Lección**: CSP estricto, subresource integrity

---

## 🎯 Nuestro Plan de Acción

En las siguientes secciones implementarás **protecciones concretas** contra las amenazas más comunes:

1. **[OWASP Top 10](./owasp-top10)**: Panorama de las 10 vulnerabilidades críticas
2. **[Injection](./injection)**: Prevención de SQL/NoSQL/Command injection
3. **[XSS](./xss)**: Protección contra Cross-Site Scripting
4. **[CSRF](./csrf)**: Defensa contra Cross-Site Request Forgery
5. **[Helmet.js](./helmet)**: Configuración de headers de seguridad
6. **[Rate Limiting](./rate-limiting)**: Protección contra brute force y DoS
7. **[Validación](./validation)**: Joi/Zod para validación robusta
8. **[Secretos](./secrets)**: Gestión segura de variables de entorno
9. **[npm audit](./npm-audit)**: Auditoría automatizada de dependencias
10. **[Testing](./security-testing)**: Tests automatizados de seguridad
11. **[Checklist](./checklist)**: Verificación pre-deployment
12. **[Ejercicio](./exercise)**: Práctica integradora

:::tip Enfoque Práctico
Cada sección incluye código vulnerable y su versión segura, para que veas el "antes y después" de aplicar buenas prácticas.
:::

---

## 💡 Mindset de Seguridad

Desarrollar de forma segura requiere un **cambio de mentalidad**:

### ❌ Mentalidad Insegura

- "Mi app es pequeña, nadie me atacará"
- "Validaré en el frontend, es más rápido"
- "Guardaré el JWT en localStorage por comodidad"
- "Este endpoint es secreto, no necesita auth"
- "npm audit da warnings, pero funcionan... ignoro"

### ✅ Mentalidad Segura

- "Bots escanean todo, debo estar preparado"
- "El frontend es controlable por el atacante, valido en servidor"
- "Usaré httpOnly cookies para prevenir XSS"
- "Implemento autenticación y autorización en todos los endpoints sensibles"
- "npm audit es parte de mi CI/CD, no puedo deployar con vulnerabilidades críticas"

---

## 🚀 ¡Comencemos!

Ahora que comprendes **por qué** la seguridad es crítica y **cómo** abordarla con múltiples capas, es hora de pasar a la acción.

:::info Siguiente Paso
Explora **[OWASP Top 10](./owasp-top10)** para conocer las 10 vulnerabilidades más críticas que debes prevenir.
:::

:::warning Recuerda
La seguridad es un **viaje continuo**, no un destino. Mantente actualizado, audita regularmente, y aplica el principio de mejora continua.
:::
