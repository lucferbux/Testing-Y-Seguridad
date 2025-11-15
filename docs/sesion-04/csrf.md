---
sidebar_position: 6
title: "Cross-Site Request Forgery (CSRF)"
---

# Cross-Site Request Forgery (CSRF)

## 🎯 ¿Qué es CSRF?

**Cross-Site Request Forgery (CSRF)** es un ataque que **fuerza a un usuario autenticado** a ejecutar acciones no deseadas en una aplicación web en la que está autenticado. El atacante engaña al navegador del usuario para que envíe requests maliciosos usando las credenciales de sesión del usuario.

**¿Por qué funciona?**

Los navegadores **envían automáticamente cookies** con cada request al dominio correspondiente. Si estás autenticado en `banco.com`, TODAS las peticiones a `banco.com` incluyen tu cookie de sesión, **incluso si vienen de otro sitio**.

---

## 🔍 Anatomía de un Ataque CSRF

### Escenario Real: Transferencia Bancaria

**Flujo del ataque paso a paso**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ATAQUE CSRF                                  │
└──────────────────────────────────────────────────────────────────────┘

1️⃣ CONFIGURACIÓN INICIAL
   Usuario → banco.com/login
   ✅ Login exitoso
   🍪 Cookie de sesión: session_id=abc123

2️⃣ USUARIO VISITA SITIO MALICIOSO
   Usuario navega a → sitiomalicioso.com
   (En otra pestaña, banco.com sigue con sesión activa)

3️⃣ SITIO MALICIOSO CONTIENE CÓDIGO OCULTO
   <!-- sitiomalicioso.com -->
   <img src="https://banco.com/transfer?to=atacante&amount=10000" />
   
   O peor aún:
   <form action="https://banco.com/transfer" method="POST">
     <input name="to" value="atacante" />
     <input name="amount" value="10000" />
   </form>
   <script>document.forms[0].submit();</script>

4️⃣ NAVEGADOR ENVÍA REQUEST AUTOMÁTICAMENTE
   Request a banco.com/transfer
   Headers:
     Cookie: session_id=abc123  ← ¡Cookie válida!
     Referer: sitiomalicioso.com
   
5️⃣ BANCO.COM PROCESA LA TRANSFERENCIA
   ✅ Sesión válida detectada
   ✅ Usuario autenticado
   ❌ NO VERIFICA origen del request
   → Transferencia ejecutada

6️⃣ RESULTADO
   💰 $10,000 transferidos al atacante
   😱 Usuario no se dio cuenta hasta revisar su cuenta
```

**Código vulnerable en el servidor**:

```javascript
// ❌ VULNERABLE: Procesa transferencias sin verificar origen
app.post('/transfer', authenticate, async (req, res) => {
  const { to, amount } = req.body;
  
  // Usuario está autenticado (middleware authenticate pasó)
  const user = req.user;
  
  // NO VERIFICA si el request vino de sitio legítimo
  await transferMoney(user.id, to, amount);
  
  res.json({ success: true, message: 'Transferencia exitosa' });
});

// También vulnerable con GET (peor aún)
app.get('/transfer', authenticate, async (req, res) => {
  const { to, amount } = req.query;
  await transferMoney(req.user.id, to, amount);
  res.json({ success: true });
});
// Ataque simple: <img src="https://banco.com/transfer?to=atacante&amount=1000">
```

---

## 🚨 Casos Reales de Ataques CSRF

**YouTube (2008)**:
- CSRF permitía que atacantes modificaran casi cualquier configuración de cuenta
- Podían suscribir usuarios a canales, marcar videos como favoritos, enviar mensajes

**Netflix (2006)**:
- CSRF permitía cambiar dirección de envío de DVDs
- Atacante podía recibir DVDs rentados por la víctima

**ING Direct (2008)**:
- CSRF permitía agregar direcciones de email a cuentas bancarias
- Atacante podía recibir notificaciones y resetear passwords

---

## 🛡️ Prevención de CSRF

### **1. CSRF Tokens (Synchronizer Token Pattern)** 🎫

**Concepto**: Generar token único por sesión/request que el servidor valida.

#### Implementación con csurf

```bash
npm install csurf cookie-parser
```

```javascript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// Configurar protección CSRF
const csrfProtection = csrf({ 
  cookie: true // Token almacenado en cookie
});

// Aplicar globalmente a todas las rutas que modifican datos
app.use(csrfProtection);

// Ruta para obtener el token CSRF
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rutas protegidas automáticamente
app.post('/api/transfer', async (req, res) => {
  // csurf middleware ya validó el token
  const { to, amount } = req.body;
  await transferMoney(req.user.id, to, amount);
  res.json({ success: true });
});

app.put('/api/settings', async (req, res) => {
  // También protegido automáticamente
  await updateSettings(req.user.id, req.body);
  res.json({ success: true });
});

// Manejo de errores CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ 
      error: 'Invalid CSRF token',
      message: 'Form submission rejected. Please refresh and try again.'
    });
  } else {
    next(err);
  }
});
```

**En el Frontend (React)**:

```typescript
// hooks/useCsrfToken.ts
import { useState, useEffect } from 'react';

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  useEffect(() => {
    async function fetchToken() {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include', // Incluir cookies
      });
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    }
    
    fetchToken();
  }, []);
  
  return csrfToken;
}

// components/TransferForm.tsx
import { useCsrfToken } from '../hooks/useCsrfToken';

function TransferForm() {
  const csrfToken = useCsrfToken();
  const [formData, setFormData] = useState({ to: '', amount: 0 });
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const response = await fetch('/api/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken, // Header con token
      },
      credentials: 'include',
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      alert('Transferencia exitosa');
    } else if (response.status === 403) {
      alert('Token CSRF inválido. Por favor recarga la página.');
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.to}
        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
        placeholder="Destinatario"
      />
      <input 
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: +e.target.value })}
        placeholder="Cantidad"
      />
      <button type="submit">Transferir</button>
    </form>
  );
}
```

**Alternativa: Token en hidden input (SSR)**:

```html
<!-- Generado en servidor -->
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>" />
  <input name="to" placeholder="Destinatario" />
  <input name="amount" placeholder="Cantidad" />
  <button type="submit">Transferir</button>
</form>
```

---

### **2. SameSite Cookies** 🍪

**Concepto**: Cookies con atributo `SameSite` NO se envían en requests cross-site.

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS
    sameSite: 'strict', // Clave para prevenir CSRF
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
  resave: false,
  saveUninitialized: false,
}));

// Para JWTs en cookies
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000, // 1 hora
});
```

**Valores de SameSite**:

| Valor | Comportamiento | Cuándo usar |
|-------|---------------|-------------|
| `strict` | Cookie NUNCA se envía en requests cross-site | Máxima seguridad. Usar para sesiones/auth |
| `lax` | Cookie se envía en navegación top-level (GET links), NO en forms POST cross-site | Balance seguridad/UX. Permite links externos |
| `none` | Cookie siempre se envía (requiere `secure: true`) | APIs de terceros, iframes autorizados |

**Ejemplos**:

```javascript
// SameSite=Strict (más seguro)
// Usuario en sitiomalicioso.com hace click en link a banco.com
// → Cookie NO se envía, usuario debe login de nuevo

// SameSite=Lax (balance)
// Usuario en email.com hace click en link a banco.com
// → Cookie SÍ se envía (navegación top-level GET)
// Formulario en sitiomalicioso.com hace POST a banco.com
// → Cookie NO se envía (cross-site POST bloqueado)

// SameSite=None (menos seguro)
// Cualquier sitio puede enviar requests con cookie
// → Solo usar con secure=true y en casos específicos
```

**Testing SameSite**:

```typescript
// tests/csrf-samesite.test.ts
import request from 'supertest';
import app from '../app';

describe('SameSite Cookies', () => {
  it('debe configurar SameSite=strict en cookies de sesión', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('SameSite=Strict');
    expect(cookies[0]).toContain('HttpOnly');
  });
});
```

---

### **3. Double Submit Cookie Pattern** 🍪🍪

**Concepto**: Token en cookie Y en request body/header deben coincidir.

```javascript
import crypto from 'crypto';

// Middleware que genera y valida double-submit token
function doubleSubmitCsrf(req, res, next) {
  // Generar token si no existe
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', token, {
      httpOnly: false, // Debe ser accesible por JS
      secure: true,
      sameSite: 'strict',
    });
  }
  
  // Validar en métodos que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const tokenFromCookie = req.cookies.csrfToken;
    const tokenFromHeader = req.headers['x-csrf-token'];
    
    if (!tokenFromCookie || tokenFromCookie !== tokenFromHeader) {
      return res.status(403).json({ error: 'CSRF token mismatch' });
    }
  }
  
  next();
}

app.use(doubleSubmitCsrf);

// Frontend lee cookie y la envía en header
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function makeSecureRequest(url: string, options: RequestInit) {
  const csrfToken = getCookie('csrfToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken || '',
    },
    credentials: 'include',
  });
}
```

---

### **4. Verificación de Origin/Referer Headers** 🔍

**Concepto**: Validar que el request viene del mismo origen.

```javascript
function verifyOrigin(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [
      'https://myapp.com',
      'https://www.myapp.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);
    
    if (!origin) {
      return res.status(403).json({ error: 'Missing origin header' });
    }
    
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    });
    
    if (!isAllowed) {
      securityLogger.warn('CSRF attempt detected', {
        origin,
        ip: req.ip,
        path: req.path,
      });
      return res.status(403).json({ error: 'Invalid origin' });
    }
  }
  
  next();
}

app.use(verifyOrigin);
```

**Limitaciones**:
- Headers pueden ser omitidos en algunos casos (proxies, navegadores viejos)
- No debe ser la ÚNICA defensa, combinar con tokens

---

### **5. Re-autenticación para Acciones Críticas** 🔐

**Concepto**: Solicitar password de nuevo para operaciones sensibles.

```typescript
// Middleware de re-autenticación
async function requireReauth(req, res, next) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      error: 'Password required for this action' 
    });
  }
  
  const user = await User.findById(req.user.id);
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  
  if (!validPassword) {
    securityLogger.warn('Failed re-authentication', {
      userId: req.user.id,
      ip: req.ip,
    });
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  next();
}

// Aplicar a acciones críticas
app.post('/api/transfer-large', csrfProtection, requireReauth, async (req, res) => {
  const { to, amount, password } = req.body;
  
  if (amount > 10000) {
    // Ya validado por requireReauth
    await transferMoney(req.user.id, to, amount);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Amount exceeds limit' });
  }
});

app.delete('/api/account', csrfProtection, requireReauth, async (req, res) => {
  await deleteAccount(req.user.id);
  res.json({ success: true });
});
```

---

## 🧪 Testing CSRF Protection

```typescript
// tests/csrf.test.ts
import request from 'supertest';
import app from '../app';

describe('CSRF Protection', () => {
  let csrfToken: string;
  let cookies: string[];
  
  beforeAll(async () => {
    // Login para obtener sesión
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    cookies = loginRes.headers['set-cookie'];
    
    // Obtener CSRF token
    const tokenRes = await request(app)
      .get('/api/csrf-token')
      .set('Cookie', cookies);
    
    csrfToken = tokenRes.body.csrfToken;
  });
  
  it('debe rechazar POST sin CSRF token', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .set('Cookie', cookies)
      .send({ to: 'attacker', amount: 1000 });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('CSRF');
  });
  
  it('debe aceptar POST con CSRF token válido', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .set('Cookie', cookies)
      .set('CSRF-Token', csrfToken)
      .send({ to: 'recipient', amount: 100 });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
  
  it('debe rechazar CSRF token inválido', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .set('Cookie', cookies)
      .set('CSRF-Token', 'invalid-token-123')
      .send({ to: 'attacker', amount: 1000 });
    
    expect(res.status).toBe(403);
  });
  
  it('debe configurar SameSite cookies', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'test@example.com',
      password: 'password123',
    });
    
    const setCookies = res.headers['set-cookie'];
    expect(setCookies[0]).toContain('SameSite=Strict');
  });
});
```

---

## 📋 Resumen: Checklist Anti-CSRF

- [ ] **Implementar CSRF tokens** con csurf en rutas POST/PUT/DELETE
- [ ] **Configurar SameSite=Strict** en cookies de sesión
- [ ] **Validar Origin/Referer** headers en requests state-changing
- [ ] **NO usar GET para acciones** que modifiquen datos
- [ ] **Re-autenticación** para operaciones críticas (transfers, delete account)
- [ ] **Testear protección CSRF** en suite de tests
- [ ] **Educar usuarios** sobre phishing (no hacer click en links sospechosos)
- [ ] **Logging** de intentos CSRF fallidos para detectar ataques

:::tip Defense in Depth
**Combina múltiples técnicas**:
1. CSRF tokens (previene requests no autorizados)
2. SameSite cookies (previene envío automático)
3. Origin verification (doble verificación)
4. Re-auth (última línea de defensa para acciones críticas)
:::

:::warning GET Requests
**NUNCA uses GET para modificar datos**. GET debe ser idempotente y seguro. Usa POST/PUT/DELETE según corresponda.
:::

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
