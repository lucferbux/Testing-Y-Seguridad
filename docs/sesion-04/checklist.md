---
sidebar_position: 13
title: "Checklist de Seguridad"
---

## 11. Checklist de seguridad

Un checklist de seguridad es una herramienta fundamental para garantizar que ningún aspecto crítico quede sin revisar antes de desplegar una aplicación a producción. A diferencia de los tests automatizados que verifican funcionalidad, este checklist abarca configuraciones, políticas de seguridad, y prácticas que deben ser revisadas manualmente o mediante herramientas especializadas. Basado en el OWASP Application Security Verification Standard (ASVS) y las mejores prácticas de la industria, este checklist está organizado por capas de seguridad, desde la autenticación hasta el monitoreo continuo. Se recomienda asignar un responsable para cada sección y documentar evidencias de cumplimiento (screenshots, configuraciones, resultados de tests) en un documento de auditoría pre-deployment.

---

### 🔐 Autenticación y Autorización

Esta sección cubre la primera línea de defensa: verificar identidad y controlar acceso. Los errores aquí tienen impacto crítico ya que permiten acceso no autorizado.

#### Gestión de Passwords

- [ ] **Passwords hasheados con bcrypt** (cost factor >= 12)
  ```javascript
  // Verificar en código
  const hash = await bcrypt.hash(password, 12); // ✅ Mínimo 12
  ```
  - **Razón**: bcrypt con cost 12 toma ~300ms, previene brute force
  - **Test**: Crear usuario y verificar que el hash en DB es bcrypt (`$2b$12$...`)

- [ ] **No almacenar passwords en logs/errores**
  ```javascript
  // ❌ MAL
  logger.error('Login failed', { username, password });
  
  // ✅ BIEN
  logger.error('Login failed', { username });
  ```

- [ ] **Política de passwords robusta**
  - Mínimo 12 caracteres
  - Requiere mayúsculas, minúsculas, números, símbolos
  - No permite passwords comunes (Top 10,000 most common)
  - **Tool**: [zxcvbn](https://github.com/dropbox/zxcvbn) para estimar fortaleza

- [ ] **Password reset seguro**
  - Token único, de un solo uso, con expiración (15-30 min)
  - Token almacenado hasheado en DB
  - No revelar si email existe o no (respuesta genérica)

#### Tokens y Sesiones

- [ ] **JWT con secrets fuertes** (>32 caracteres aleatorios)
  ```bash
  # Generar secret seguro
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  - **Test**: Verificar que `process.env.JWT_SECRET.length >= 32`

- [ ] **Expiración corta de Access Tokens** (15min - 1h)
  ```javascript
  jwt.sign(payload, secret, { expiresIn: '15m' }); // ✅
  ```

- [ ] **Refresh tokens implementados**
  - Access token: 15 min (en memoria del cliente)
  - Refresh token: 7 días (HttpOnly cookie)
  - Rotación de refresh token al renovar

- [ ] **Logout invalida tokens**
  - Blacklist de tokens (Redis con TTL = tiempo restante del token)
  - O regenerar secret (invalida TODOS los tokens)

- [ ] **Cookies con flags de seguridad**
  ```javascript
  res.cookie('token', token, {
    httpOnly: true,    // ✅ No accesible desde JS
    secure: true,      // ✅ Solo HTTPS
    sameSite: 'strict', // ✅ CSRF protection
    maxAge: 3600000,   // 1 hora
  });
  ```

#### Control de Acceso

- [ ] **Rate limiting en autenticación**
  - Login: 5 intentos / 15 min
  - Register: 3 registros / hora / IP
  - Password reset: 3 solicitudes / hora / IP

- [ ] **RBAC (Role-Based Access Control) implementado**
  - Roles definidos: `user`, `admin`, `moderator`
  - Permisos verificados en CADA request
  - No confiar en permisos del cliente (frontend)

- [ ] **Verificación de ownership**
  ```javascript
  // ✅ Verificar que el usuario es dueño del recurso
  if (req.user.id !== resource.ownerId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  ```

- [ ] **No user enumeration**
  - Login: Mismo mensaje para "usuario no existe" y "password incorrecto"
  - Register: No revelar si email ya existe (enviar email genérico en ambos casos)

---

### ⚙️ Configuración del Servidor

#### Headers de Seguridad

- [ ] **Helmet.js configurado**
  ```javascript
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Solo si es necesario
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
  }));
  ```

- [ ] **Verificar headers con herramientas**
  - [SecurityHeaders.com](https://securityheaders.com/)
  - [Mozilla Observatory](https://observatory.mozilla.org/)
  - **Target**: A+ rating

- [ ] **X-Powered-By eliminado**
  ```javascript
  app.disable('x-powered-by'); // ✅
  ```

#### HTTPS y Transporte

- [ ] **HTTPS obligatorio en producción**
  - Certificado SSL/TLS válido (Let's Encrypt gratis)
  - Redirect automático HTTP → HTTPS
  ```javascript
  // Middleware de redirect
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
  ```

- [ ] **HSTS header configurado**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - **Submit to HSTS Preload List**: [hstspreload.org](https://hstspreload.org/)

#### CORS

- [ ] **CORS configurado restrictivamente**
  ```javascript
  // ❌ MAL: Permite todo
  app.use(cors({ origin: '*' }));
  
  // ✅ BIEN: Whitelist de dominios
  const whitelist = ['https://myapp.com', 'https://admin.myapp.com'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Para cookies
  }));
  ```

- [ ] **Preflight requests manejados**
  - `OPTIONS` requests retornan headers CORS correctos

#### Variables de Entorno

- [ ] **Todos los secretos en .env**
  - JWT_SECRET
  - DATABASE_URL (con password)
  - API keys de terceros
  - Encryption keys

- [ ] **.env NO commiteado**
  - `.gitignore` incluye `.env`
  - `.env.example` SIN valores reales commiteado

- [ ] **Validación de env vars al inicio**
  ```javascript
  // config/env.js
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'];
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      throw new Error(`Missing required env var: ${varName}`);
    }
  });
  ```

---

### 🛡️ Validación y Sanitización

- [ ] **Validación de TODOS los inputs**
  - Body, query params, headers, path params
  - Usar Joi/Zod, NO validación manual

- [ ] **Whitelist approach** (definir qué está permitido, no qué está prohibido)
  ```javascript
  // ✅ BIEN
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    age: Joi.number().integer().min(0).max(120),
  });
  ```

- [ ] **Sanitización contra NoSQL injection**
  ```javascript
  app.use(mongoSanitize()); // Elimina $, .
  ```

- [ ] **Sanitización contra XSS**
  - Backend: DOMPurify para HTML
  - Frontend: React/Vue escapan automáticamente, pero validar inputs de texto enriquecido

- [ ] **File uploads validados**
  - Tipo MIME verificado (no confiar en extensión)
  - Tamaño máximo (ej: 5MB)
  - Almacenar fuera de webroot
  - Renombrar archivos (no usar nombre original)
  ```javascript
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  ```

- [ ] **Límites en payload size**
  ```javascript
  app.use(express.json({ limit: '10kb' })); // ✅
  app.use(express.urlencoded({ limit: '10kb', extended: true }));
  ```

---

### 💾 Base de Datos

- [ ] **Queries parametrizadas** (NO string concatenation)
  ```javascript
  // ❌ MAL
  db.query(`SELECT * FROM users WHERE id = ${userId}`);
  
  // ✅ BIEN (con ORMs como Mongoose, Sequelize)
  User.findById(userId);
  ```

- [ ] **Principio de mínimos privilegios**
  - Usuario de DB con permisos mínimos (NO usar `root`)
  - READ/WRITE solo en las tablas necesarias

- [ ] **Conexión encriptada**
  ```javascript
  // MongoDB
  mongoose.connect(process.env.DATABASE_URL, {
    ssl: true,
    sslValidate: true,
  });
  ```

- [ ] **Backups automáticos**
  - Diarios en producción
  - Almacenados en ubicación separada (AWS S3, Google Cloud Storage)
  - Testear restauración de backups regularmente

- [ ] **Datos sensibles encriptados at-rest**
  - SSN, números de tarjetas, datos médicos
  - Usar encryption-at-rest de DB (MongoDB Enterprise, AWS RDS)

---

### 📦 Dependencias

- [ ] **`npm audit` sin vulnerabilidades críticas/altas**
  ```bash
  npm audit --production
  # Target: 0 vulnerabilities (critical, high)
  ```

- [ ] **Dependencias actualizadas**
  ```bash
  npm outdated
  # Actualizar manualmente las que tengan vulnerabilidades
  ```

- [ ] **Renovate/Dependabot configurado**
  - PRs automáticos para actualizaciones
  - Configurar auto-merge para patches (semver PATCH)

- [ ] **package-lock.json commiteado**
  - Garantiza versiones exactas en todos los ambientes

- [ ] **Evitar dependencias con pocos mantenedores**
  - Verificar en [Snyk Advisor](https://snyk.io/advisor/)
  - Mirar: downloads/week, # de maintainers, última actualización

---

### 📊 Logging y Monitoreo

- [ ] **No loguear info sensible**
  - ❌ Passwords, tokens, SSN, tarjetas de crédito
  - ✅ Username, IP, timestamp, acción

- [ ] **Logs estructurados (JSON)**
  ```javascript
  logger.info('User login', {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
  ```

- [ ] **Logging de eventos de seguridad**
  - Login fallido (especialmente múltiples intentos)
  - Cambios de password
  - Cambios de permisos/roles
  - Accesos denegados (403)

- [ ] **Monitoreo de errores**
  - [Sentry](https://sentry.io/), [Rollbar](https://rollbar.com/), [LogRocket](https://logrocket.com/)
  - Alertas en Slack/email para errores críticos

- [ ] **Alertas para patrones sospechosos**
  - 10+ login fallidos en 5 minutos desde misma IP
  - Usuario intenta acceder a recursos de otro usuario (403s)
  - Spike en requests (posible DDoS)

---

### 🧪 Testing

- [ ] **Tests de seguridad en CI/CD**
  ```yaml
  # .github/workflows/security.yml
  - name: Security audit
    run: npm audit --production --audit-level=high
  
  - name: Run security tests
    run: npm run test:security
  ```

- [ ] **Tests de rate limiting**
  ```javascript
  it('debe bloquear después de 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/login').send({ username: 'test', password: 'wrong' });
    }
    const res = await request(app).post('/login').send({ username: 'test', password: 'wrong' });
    expect(res.status).toBe(429);
  });
  ```

- [ ] **Tests de autorización**
  - Usuario normal NO puede acceder a endpoints de admin
  - Usuario NO puede modificar recursos de otros

- [ ] **Tests de validación de inputs**
  - Payloads maliciosos (XSS, SQL Injection, NoSQL Injection)
  - Fuzzing con inputs aleatorios

---

### 🚀 Pre-Deployment Final

- [ ] **Escaneo con OWASP ZAP/Burp**
  ```bash
  docker run -t owasp/zap2docker-stable zap-baseline.py \
    -t https://staging.myapp.com
  ```

- [ ] **Revisión manual de código (Security-focused)**
  - Buscar: `eval()`, `exec()`, `dangerouslySetInnerHTML`
  - Verificar que NO hay secrets hardcodeados

- [ ] **Penetration testing** (si es aplicación crítica)
  - Contratar pentester externo
  - O ejecutar internamente con checklist OWASP Testing Guide

- [ ] **Documentación de seguridad actualizada**
  - Arquitectura de seguridad
  - Respuesta a incidentes (incident response plan)
  - Contactos de seguridad

---

## 📋 Checklist Resumido (Print & Check)

```
🔐 AUTENTICACIÓN
[ ] bcrypt cost >= 12
[ ] JWT secret >= 32 chars
[ ] Refresh tokens implementados
[ ] Rate limiting en login
[ ] RBAC verificado

⚙️ CONFIGURACIÓN
[ ] Helmet.js configurado
[ ] HTTPS en producción
[ ] CORS restrictivo
[ ] .env validado
[ ] Secrets NO en código

🛡️ VALIDACIÓN
[ ] Joi/Zod en todos los inputs
[ ] express-mongo-sanitize
[ ] DOMPurify para HTML
[ ] File uploads validados

💾 BASE DE DATOS
[ ] Queries parametrizadas
[ ] Mínimos privilegios
[ ] Backups diarios

📦 DEPENDENCIAS
[ ] npm audit clean
[ ] Dependabot activo
[ ] package-lock committed

📊 MONITOREO
[ ] Sentry/Rollbar configurado
[ ] Logs NO contienen secrets
[ ] Alertas configuradas

🧪 TESTING
[ ] Tests de seguridad en CI/CD
[ ] Rate limiting testeado
[ ] Autorización testeada
```

---

:::tip Auditoría Trimestral
Este checklist debe ejecutarse:
- **Pre-deployment**: Antes de cada release a producción
- **Trimestralmente**: Para detectar configuraciones que se degradaron
- **Post-incident**: Después de cualquier brecha de seguridad
:::

:::warning Compliance
Si tu aplicación maneja datos sensibles (GDPR, HIPAA, PCI-DSS), este checklist es el MÍNIMO. Consulta los requisitos específicos de compliance de tu industria.
:::
