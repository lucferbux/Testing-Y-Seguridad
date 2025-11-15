---
sidebar_position: 3
title: "OWASP Top 10"
---

# OWASP Top 10: Las Vulnerabilidades Más Críticas

## 🛡️ ¿Qué es OWASP Top 10?

El proyecto [OWASP (Open Web Application Security Project)](https://owasp.org/www-project-top-ten/) es una **organización sin fines de lucro** dedicada a mejorar la seguridad del software. Desde 2003, publican cada 3-4 años una lista de las **10 vulnerabilidades más críticas** en aplicaciones web, basada en datos reales de:

- Análisis de miles de aplicaciones web
- Reportes de incidentes de seguridad
- Encuestas a profesionales de seguridad
- CVEs (Common Vulnerabilities and Exposures)

**¿Por qué es importante?**

✅ **Estándar de la industria**: Referencia mundial en seguridad web  
✅ **Basado en datos reales**: No es teórico, refleja amenazas actuales  
✅ **Prioriza riesgos**: Te permite enfocarte en lo más crítico  
✅ **Lenguaje común**: Facilita comunicación entre equipos  
✅ **Compliance**: Muchas regulaciones lo requieren (PCI DSS, HIPAA)  

:::info Versión Actual
Estamos usando **OWASP Top 10 - 2021**, la versión más reciente. La próxima actualización está prevista para 2024-2025.
:::

---

## 📊 OWASP Top 10 (2021)

A continuación, la lista completa con explicaciones detalladas, impacto y prevenciones para cada vulnerabilidad:

---

### **A01: Broken Access Control** 🔓

**Descripción**: Los controles de acceso fallan en prevenir que usuarios realicen acciones fuera de sus permisos.

**Ejemplos de explotación**:

```typescript
// ❌ VULNERABLE: Usuario puede eliminar cualquier post modificando el ID
app.delete('/api/posts/:id', authenticate, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id); // No verifica ownership
  res.json({ success: true });
});

// Ataque: Usuario con ID 123 elimina post del usuario ID 456
// DELETE /api/posts/999 (post que no le pertenece)

// ✅ SEGURO: Verifica que el usuario sea dueño o admin
app.delete('/api/posts/:id', authenticate, async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  
  // Verificar ownership o rol admin
  if (post.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You can only delete your own posts' });
  }
  
  await post.remove();
  res.json({ success: true });
});
```

**Impacto**:

- Acceso a datos sensibles de otros usuarios
- Modificación/eliminación de recursos ajenos
- Escalada de privilegios (convertirse en admin)

**Prevención**:

1. **Implementar RBAC** (Role-Based Access Control)
2. **Validar ownership** en cada operación
3. **Deny by default**: Denegar por defecto, permitir explícitamente
4. **Testear autorizaciones**: Tests automatizados
5. **Rate limiting** en endpoints sensibles

**Estadísticas**: 

- **94%** de aplicaciones testeadas tenían alguna forma de broken access control
- Subió del puesto #5 (2017) al **#1 (2021)**

---

### **A02: Cryptographic Failures** 🔐

**Descripción**: Fallos en la protección de datos sensibles mediante criptografía (antes llamado "Sensitive Data Exposure").

**Ejemplos comunes**:

```typescript
// ❌ VULNERABLE: Password en texto plano
const UserSchema = new mongoose.Schema({
  email: String,
  password: String, // ¡PELIGRO! Texto plano
});

// ❌ VULNERABLE: Algoritmo débil (MD5/SHA1)
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');

// ❌ VULNERABLE: Transmisión sin HTTPS
// http://myapp.com/login (datos viajan en texto plano)

// ✅ SEGURO: bcrypt con salt adecuado
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

// Al registrar
const saltRounds = 12; // Costoso computacionalmente
const passwordHash = await bcrypt.hash(password, saltRounds);

const user = new User({ email, passwordHash });
await user.save();

// Al autenticar
const user = await User.findOne({ email });
const isValid = await bcrypt.compare(password, user.passwordHash);

// ✅ SEGURO: Forzar HTTPS en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
  });
}
```

**Datos sensibles que requieren protección**:

- Passwords (bcrypt, argon2)
- Tokens de sesión (JWT secrets)
- Datos personales (PII: nombres, direcciones, SSN)
- Tarjetas de crédito (PCI DSS compliance)
- Datos médicos (HIPAA compliance)

**Prevención**:

1. **Clasificar datos**: Identificar qué es sensible
2. **Encriptar at-rest**: Datos en DB encriptados
3. **Encriptar in-transit**: HTTPS/TLS siempre
4. **Usar algoritmos modernos**: bcrypt/argon2 para passwords, AES-256 para datos
5. **Rotar secrets**: Cambiar JWT secrets periódicamente
6. **No logear secretos**: Nunca en logs

**Impacto**:

- Exposición masiva de datos (ej: Equifax 147M usuarios)
- Multas GDPR (hasta €20M o 4% facturación)
- Pérdida de confianza de usuarios
- Robo de identidad

---

### **A03: Injection** 💉

**Descripción**: Código malicioso es inyectado en queries/comandos del sistema debido a falta de validación.

**Tipos principales**: SQL Injection, NoSQL Injection, Command Injection, LDAP Injection

**Ejemplo: NoSQL Injection en MongoDB**

```typescript
// ❌ VULNERABLE: Acepta objetos directamente
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Si req.body = { username: { $ne: null }, password: { $ne: null } }
  // Query se convierte en: find({ username: { $ne: null }, password: { $ne: null } })
  // ¡Retorna el primer usuario sin verificar password!
  
  const user = await User.findOne({ username, password });
  
  if (user) {
    return res.json({ token: generateToken(user) });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// ✅ SEGURO: Validar tipos + sanitizar
import mongoSanitize from 'express-mongo-sanitize';
import Joi from 'joi';

// Middleware global que elimina $, . de inputs
app.use(mongoSanitize());

const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
});

app.post('/api/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  
  const { username, password } = value;
  
  // Ahora username y password son STRINGS validados
  const user = await User.findOne({ username });
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ token: generateToken(user) });
});
```

**Ejemplo: Command Injection**

```typescript
// ❌ VULNERABLE: Ejecuta comandos del sistema con input del usuario
const { exec } = require('child_process');

app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(stdout);
  });
});

// Ataque: /api/ping?host=google.com;rm -rf /
// Ejecuta: ping -c 4 google.com;rm -rf /
// ¡Borra todo el sistema!

// ✅ SEGURO: Validar estrictamente + usar librería específica
import validator from 'validator';
import ping from 'ping';

app.get('/api/ping', async (req, res) => {
  const host = req.query.host;
  
  // Validar que es dominio o IP válida
  if (!validator.isFQDN(host) && !validator.isIP(host)) {
    return res.status(400).json({ error: 'Invalid host' });
  }
  
  // Usar librería específica en lugar de exec
  try {
    const result = await ping.promise.probe(host, { timeout: 10 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ping failed' });
  }
});
```

**Prevención**:

1. **Usar ORMs/Query Builders**: Mongoose, Sequelize, Prisma
2. **Prepared statements**: Siempre parametrizar queries
3. **Validar inputs**: Joi/Zod para tipos esperados
4. **Sanitizar**: express-mongo-sanitize, DOMPurify
5. **Evitar exec/eval**: Buscar alternativas seguras
6. **Whitelist sobre blacklist**: Permitir caracteres específicos, no bloquear algunos

**Impacto**:

- Acceso completo a base de datos
- Ejecución de comandos arbitrarios en servidor
- Exfiltración de datos masiva
- Toma completa del sistema

---

### **A04: Insecure Design** 🎨

**Descripción**: Fallas en el diseño arquitectónico de la aplicación, no bugs de implementación.

**Diferencia clave**: 

- **Insecure Design**: "¿Qué construimos?" (arquitectura mala desde el inicio)
- **Implementación insegura**: "¿Cómo lo construimos?" (código con bugs)

**Ejemplos**:

```typescript
// ❌ DISEÑO INSEGURO: Sistema de recuperación de contraseña con pregunta secreta
// Problema: Preguntas predecibles ("¿Ciudad de nacimiento?")
app.post('/api/password-reset', async (req, res) => {
  const { username, securityAnswer } = req.body;
  
  const user = await User.findOne({ username });
  
  if (user.securityAnswer === securityAnswer) {
    // Resetear password
    return res.json({ success: true, newPassword: 'temp123' });
  }
  
  res.status(400).json({ error: 'Incorrect answer' });
});

// Atacante puede: 
// 1. Buscar información en redes sociales
// 2. Hacer fuerza bruta (sin rate limiting)
// 3. Adivinar (ciudades comunes)

// ✅ DISEÑO SEGURO: Token temporal enviado por email
import crypto from 'crypto';
import { sendEmail } from './email-service';

app.post('/api/password-reset-request', async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  
  if (!user) {
    // No revelar si el email existe (timing-safe)
    return res.json({ message: 'If email exists, reset link was sent' });
  }
  
  // Generar token criptográficamente seguro
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
  await user.save();
  
  // Enviar email con link
  const resetURL = `https://myapp.com/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `Click here to reset: <a href="${resetURL}">${resetURL}</a>`,
  });
  
  res.json({ message: 'If email exists, reset link was sent' });
});

// Verificar token
app.post('/api/password-reset-confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
  
  // Resetear password
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  res.json({ success: true });
});
```

**Prevención**:

1. **Threat Modeling**: Modelar amenazas desde diseño
2. **Security Requirements**: Definir requerimientos de seguridad
3. **Secure Design Patterns**: Usar patrones probados
4. **Peer Review**: Revisar arquitectura con equipo
5. **Principio de menor privilegio**: Diseñar con mínimos permisos

---

### **A05: Security Misconfiguration** ⚙️

**Descripción**: Configuraciones inseguras por defecto, configuraciones incompletas, headers inseguros.

**Ejemplos comunes**:

```typescript
// ❌ MISCONFIGURATION: Muchas configuraciones inseguras

// 1. CORS abierto a todos
app.use(cors({ origin: '*' })); // ¡PELIGRO!

// 2. Stack traces en producción
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // Expone código interno
  });
});

// 3. Sin headers de seguridad
// No usar Helmet.js

// 4. Secrets en código
const JWT_SECRET = 'my-secret-key'; // ¡PELIGRO!

// 5. MongoDB sin autenticación
mongoose.connect('mongodb://localhost:27017/myapp'); // Sin credenciales

// 6. Información de versiones expuesta
app.use(express()); // Envía "X-Powered-By: Express"

// ✅ CONFIGURACIÓN SEGURA
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// 1. CORS restrictivo
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','), // ['https://myapp.com']
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 2. Headers de seguridad
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
    preload: true,
  },
}));

// 3. Ocultar información del servidor
app.disable('x-powered-by');

// 4. Errores genéricos en producción
app.use((err, req, res, next) => {
  logger.error('Server error', { error: err, userId: req.user?.id });
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 5. MongoDB con autenticación
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
});

// 6. Secrets desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

**Prevención**:

1. **Hardening guides**: Seguir guías de seguridad de frameworks
2. **Default deny**: Configuración segura por defecto
3. **Automatizar configuración**: Infrastructure as Code
4. **Revisar periodicamente**: Auditorías de configuración
5. **Segmentar entornos**: Dev ≠ Prod

---

### **A06: Vulnerable and Outdated Components** 📦

**Descripción**: Usar componentes (librerías, frameworks) con vulnerabilidades conocidas.

**Problema real**:

```bash
# Ejecutar npm audit en proyecto viejo
$ npm audit

found 15 vulnerabilities (3 low, 7 moderate, 5 high) in 1520 scanned packages
  run `npm audit fix` to fix them

# Ejemplo de vulnerabilidad
┌───────────────┬──────────────────────────────────────────┐
│ High          │ Prototype Pollution                      │
├───────────────┼──────────────────────────────────────────┤
│ Package       │ lodash                                   │
├───────────────┼──────────────────────────────────────────┤
│ Patched in    │ >=4.17.19                                │
├───────────────┼──────────────────────────────────────────┤
│ Dependency of │ express                                  │
├───────────────┼──────────────────────────────────────────┤
│ Path          │ express > body-parser > lodash           │
└───────────────┴──────────────────────────────────────────┘
```

**Casos reales**:

- **Equifax (2017)**: Apache Struts sin parchear → 147M usuarios afectados
- **SolarWinds (2020)**: Supply chain attack en dependencia
- **Log4Shell (2021)**: Vulnerabilidad en Log4j afectó a millones de apps Java

**Prevención**:

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
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
        run: npm audit --audit-level=high
        # Falla CI si hay vulnerabilidades high/critical
```

**Tools recomendados**:

1. **npm audit**: Built-in en npm
2. **Snyk**: Free para open source, integración CI/CD
3. **Dependabot**: Auto-PRs para actualizar dependencias (GitHub)
4. **Renovate**: Alternativa a Dependabot más configurable
5. **OWASP Dependency-Check**: Para Java/. NET también

---

### **A07: Identification and Authentication Failures** 🔑

**Descripción**: Fallas en autenticación permiten a atacantes comprometer passwords, keys o sesiones.

**Ejemplos de vulnerabilidades**:

```typescript
// ❌ VULNERABLE: Múltiples fallas de autenticación

// 1. Sin rate limiting → Fuerza bruta
app.post('/api/login', async (req, res) => {
  // Atacante puede intentar 10,000 passwords/min
});

// 2. Session IDs predecibles
const sessionId = userId + Date.now(); // ¡Predecible!

// 3. Passwords débiles permitidos
const password = 'password123'; // Aceptado sin validación

// 4. User enumeration (revela si usuario existe)
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
if (!validPassword) {
  return res.status(401).json({ error: 'Invalid password' });
}

// ✅ SEGURO: Autenticación robusta
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// 1. Rate limiting estricto en login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again in 15 minutes',
});

// 2. Validación de password fuerte
const passwordSchema = Joi.string()
  .min(12)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number and special char',
    'string.min': 'Password must be at least 12 characters',
  });

app.post('/api/register', async (req, res) => {
  const { error, value } = passwordSchema.validate(req.body.password);
  
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  
  // Password cumple requisitos
  const passwordHash = await bcrypt.hash(value, 12);
  // ...
});

// 3. Session IDs criptográficamente seguros
const session Id = crypto.randomBytes(32).toString('hex');
// o usar uuid v4
const sessionId = uuidv4();

// 4. Prevenir user enumeration (mismo mensaje siempre)
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  
  // Siempre hacer bcrypt.compare aunque user no exista (timing-safe)
  const dummyHash = '$2b$12$dummy...'; // Hash válido de "dummy"
  const validPassword = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash);
  
  if (!user || !validPassword) {
    // MISMO mensaje para ambos casos
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Login exitoso
  const token = generateToken(user);
  res.json({ token });
});
```

**Prevención**:

1. **MFA (Multi-Factor Authentication)**: Para operaciones críticas
2. **Passwords fuertes**: Mínimo 12 caracteres, complejidad
3. **Rate limiting**: Prevenir brute force
4. **Session management seguro**: Tokens JWT con expiración corta
5. **No permitir credenciales por defecto**: admin/admin
6. **Prevenir user enumeration**: Mismos mensajes de error

---

### **A08: Software and Data Integrity Failures** ⚖️

**Descripción**: Código o infraestructura que no protege contra modificaciones no autorizadas.

**Ejemplos**:

```typescript
// ❌ VULNERABLE: Cargar scripts de CDNs sin verificar integridad
// index.html
<script src="https://cdn.example.com/library.js"></script>
// Si CDN es comprometido, código malicioso se inyecta

// ✅ SEGURO: Subresource Integrity (SRI)
<script 
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

// ❌ VULNERABLE: npm install sin lockfile
// Cada deploy instala versiones diferentes → potencial supply chain attack

// ✅ SEGURO: Usar package-lock.json
# Commitear package-lock.json en git
# npm ci en CI/CD (usa lockfile, no package.json)
```

**Casos reales**:

- **SolarWinds (2020)**: Build system comprometido, malware en updates oficiales
- **EventStream (2018)**: Dependencia npm con código malicioso para robar Bitcoin

**Prevención**:

1. **Usar lockfiles**: package-lock.json committed
2. **npm ci**: En CI/CD usar `npm ci` en lugar de `npm install`
3. **Verificar signatures**: Para binarios descargados
4. **Subresource Integrity**: Para CDNs
5. **Code signing**: Firmar builds de producción
6. **Review dependencies**: Auditar nuevas dependencias

---

### **A09: Security Logging and Monitoring Failures** 📊

**Descripción**: Falta de logging/monitoreo impide detectar y responder a ataques.

**Problema**:

```typescript
// ❌ SIN LOGGING: Ataques pasan desapercibidos
app.post('/api/login', async (req, res) => {
  // Login sin loguear intentos fallidos
  // Atacante puede hacer fuerza bruta sin ser detectado
});

// ✅ CON LOGGING COMPLETO
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    // Loguear intento fallido
    securityLogger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Loguear login exitoso
  securityLogger.info('Successful login', {
    userId: user.id,
    email: user.email,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  const token = generateToken(user);
  res.json({ token });
});

// Alertar ante patrones sospechosos
app.post('/api/admin/delete-all-users', requireAdmin, async (req, res) => {
  securityLogger.alert('CRITICAL: Mass deletion attempted', {
    userId: req.user.id,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });
  
  // Enviar alerta a Slack/PagerDuty
  await sendSlackAlert(`🚨 User ${req.user.id} attempted mass deletion from IP ${req.ip}`);
  
  // Proceder con acción
});
```

**Qué loguear**:

✅ **Eventos de autenticación**: Login exitoso/fallido, logout  
✅ **Cambios de permisos**: Promoción a admin, cambios de rol  
✅ **Acciones críticas**: Eliminación masiva, cambios de configuración  
✅ **Errores de autorización**: Intentos de acceso denegado  
✅ **Anomalías**: Múltiples requests simultáneos, IPs sospechosas  

❌ **NO loguear**:

- Passwords (ni siquiera hasheados en logs de texto)
- Tokens completos (solo primeros/últimos 4 caracteres)
- PII sin necesidad (GDPR compliance)

**Prevención**:

1. **Logging estructurado**: Winston, Pino con formato JSON
2. **Centralizar logs**: ELK Stack, Splunk, Datadog
3. **Alertas automatizadas**: Slack/PagerDuty ante eventos críticos
4. **Retention policies**: Retener logs 30-90 días (compliance)
5. **Proteger logs**: Acceso restringido, encriptados

---

### **A10: Server-Side Request Forgery (SSRF)** 🌐

**Descripción**: Aplicación hace requests a recursos internos controlados por atacante.

**Ejemplo de ataque**:

```typescript
// ❌ VULNERABLE: Endpoint que hace requests arbitrarios
app.get('/api/fetch-url', async (req, res) => {
  const url = req.query.url;
  
  // Atacante puede hacer que el servidor haga requests a:
  // - http://localhost:27017 (MongoDB interno)
  // - http://169.254.169.254/latest/meta-data/iam/security-credentials/ (AWS metadata)
  // - http://internal-admin-panel.local (servicios internos)
  
  const response = await fetch(url);
  const data = await response.text();
  
  res.send(data); // Expone recursos internos
});

// Ataque: /api/fetch-url?url=http://169.254.169.254/latest/meta-data/
// Resultado: Expone credenciales AWS del servidor

// ✅ SEGURO: Validar y restringir URLs permitidas
import validator from 'validator';

const ALLOWED_DOMAINS = ['api.github.com', 'api.example.com'];

app.get('/api/fetch-url', async (req, res) => {
  const url = req.query.url;
  
  // 1. Validar que es URL válida
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  // 2. Parsear y verificar dominio
  const parsedUrl = new URL(url);
  
  // 3. Bloquear IPs privadas
  if (
    parsedUrl.hostname === 'localhost' ||
    parsedUrl.hostname === '127.0.0.1' ||
    parsedUrl.hostname.startsWith('192.168.') ||
    parsedUrl.hostname.startsWith('10.') ||
    parsedUrl.hostname === '169.254.169.254' // AWS metadata
  ) {
    return res.status(403).json({ error: 'Forbidden: Private IP address' });
  }
  
  // 4. Whitelist de dominios permitidos
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    return res.status(403).json({ error: 'Forbidden: Domain not allowed' });
  }
  
  // 5. Timeout y límite de tamaño de respuesta
  try {
    const response = await fetch(url, {
      timeout: 5000, // 5 segundos
      signal: AbortSignal.timeout(5000),
    });
    
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1000000) { // 1MB
      return res.status(413).json({ error: 'Response too large' });
    }
    
    const data = await response.text();
    res.json({ data });
  } catch (error) {
    logger.error('Fetch URL failed', { url, error });
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});
```

**Prevención**:

1. **Whitelist de dominios**: Solo permitir URLs conocidas
2. **Bloquear IPs privadas**: 127.0.0.1, 192.168.x.x, 10.x.x.x, 169.254.169.254
3. **Disable redirects**: Evitar seguir redirects automáticamente
4. **Network segmentation**: Servidor de app en subnet separada
5. **Timeout y límites**: Prevenir DoS

**Impacto**:

- Acceso a servicios internos (DBs, admin panels)
- Exfiltración de credenciales (AWS metadata)
- Port scanning de red interna
- Bypass de firewalls

---

## 📋 Resumen y Prioridades

### Prioridades según impacto:

| Puesto | Vulnerabilidad | Impacto | Facilidad Explotación | Prioridad |
|--------|----------------|---------|----------------------|-----------|
| A01 | Broken Access Control | Alto | Fácil | ⚠️ Crítica |
| A02 | Cryptographic Failures | Alto | Media | ⚠️ Crítica |
| A03 | Injection | Alto | Media | ⚠️ Crítica |
| A04 | Insecure Design | Alto | Difícil | 🔴 Alta |
| A05 | Security Misconfiguration | Medio | Fácil | 🔴 Alta |
| A06 | Vulnerable Components | Medio | Fácil | 🟡 Media |
| A07 | Authentication Failures | Alto | Media | ⚠️ Crítica |
| A08 | Data Integrity Failures | Medio | Difícil | 🟡 Media |
| A09 | Logging Failures | Bajo | N/A | 🟢 Baja |
| A10 | SSRF | Medio | Media | 🟡 Media |

### Checklist rápido para cada proyecto:

- [ ] **A01**: Implementar RBAC, verificar ownership en cada endpoint
- [ ] **A02**: bcrypt para passwords, HTTPS obligatorio, secrets en .env
- [ ] **A03**: Joi/Zod validation, express-mongo-sanitize, no exec/eval
- [ ] **A04**: Threat modeling en diseño, security requirements
- [ ] **A05**: Helmet.js, CORS restrictivo, secrets en .env validated
- [ ] **A06**: npm audit en CI/CD, Dependabot/Renovate configurado
- [ ] **A07**: Rate limiting en login, MFA para admin, passwords fuertes
- [ ] **A08**: package-lock.json committed, npm ci en CI/CD, SRI para CDNs
- [ ] **A09**: Winston logging, loguear autenticación y eventos críticos
- [ ] **A10**: Whitelist dominios, bloquear IPs privadas en URL fetching

---

## 🎯 Próximos Pasos

Ahora que conoces las 10 vulnerabilidades más críticas, profundizaremos en cada una con implementaciones prácticas:

- **[Injection](./injection)**: SQL/NoSQL/Command injection con ejemplos detallados
- **[XSS](./xss)**: Cross-Site Scripting y protecciones (CSP, sanitización)
- **[CSRF](./csrf)**: Cross-Site Request Forgery con tokens y SameSite cookies
- **[Helmet.js](./helmet)**: Configuración completa de headers de seguridad
- **[Rate Limiting](./rate-limiting)**: Protección contra brute force y DoS
- **[Validación](./validation)**: Joi/Zod para validación robusta

:::tip Recomendación
No intentes implementar todas las protecciones a la vez. **Prioriza según tu contexto**:
- Aplicación financiera → A02 (Crypto) y A01 (Access Control)
- API pública → A03 (Injection) y A06 (Vulnerable Components)
- SaaS con usuarios → A07 (Auth) y A01 (Access Control)
:::

:::info Mantente Actualizado
OWASP actualiza el Top 10 cada 3-4 años. Sigue las nuevas tendencias en [owasp.org](https://owasp.org/www-project-top-ten/).
:::
