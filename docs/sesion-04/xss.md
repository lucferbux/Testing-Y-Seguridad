---
sidebar_position: 5
title: "Cross-Site Scripting (XSS)"
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

## 🛡️ Prevención de XSS

La prevención de XSS requiere **múltiples capas de defensa**. Ninguna técnica sola es suficiente.

### **1. Sanitización en el Backend** 🧹

**Regla de oro**: **Nunca confíes en datos del usuario**. Sanitiza SIEMPRE antes de guardar o renderizar.

#### Usando DOMPurify (Isomorphic)

```bash
npm install isomorphic-dompurify
```

```javascript
import DOMPurify from 'isomorphic-dompurify';

app.post('/comments', async (req, res) => {
  const comment = req.body.comment;
  
  // Sanitizar ANTES de guardar en DB
  const cleanComment = DOMPurify.sanitize(comment, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
  });
  
  await Comment.create({ text: cleanComment });
  res.json({ success: true });
});

// Ejemplo de sanitización:
// Input:  '<script>alert("XSS")</script><p>Comentario legítimo</p>'
// Output: '<p>Comentario legítimo</p>'
```

**Configuraciones de DOMPurify**:

```javascript
// Configuración estricta (solo texto)
const textOnly = DOMPurify.sanitize(input, {
  ALLOWED_TAGS: [],
  KEEP_CONTENT: true, // Mantiene texto, elimina tags
});

// Configuración para rich text
const richText = DOMPurify.sanitize(input, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^https?:\/\//, // Solo HTTP/HTTPS
});

// Configuración para markdown procesado
const markdown = DOMPurify.sanitize(markdownHTML, {
  ALLOWED_TAGS: ['p', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['class'],
});
```

---

### **2. Escapado en el Frontend** ⚛️

#### React: Auto-Escapado por Defecto

```tsx
// ✅ SEGURO: React escapa automáticamente
function Comment({ text }: { text: string }) {
  return (
    <div>
      <p>{text}</p>
      {/* Input: <script>alert('XSS')</script> */}
      {/* Renderizado: &lt;script&gt;alert('XSS')&lt;/script&gt; */}
    </div>
  );
}

// ❌ PELIGROSO: dangerouslySetInnerHTML bypassa escapado
function Comment({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
  // ¡Solo usar con contenido YA sanitizado en backend!
}

// ✅ SEGURO: Combina backend sanitization + dangerouslySetInnerHTML
function RichComment({ unsafeHTML }: { unsafeHTML: string }) {
  // Sanitizar en cliente también (defense in depth)
  const cleanHTML = DOMPurify.sanitize(unsafeHTML);
  
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
}
```

#### Vanilla JavaScript: Escapado Manual

```javascript
// ❌ VULNERABLE: innerHTML con input no sanitizado
const search = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').innerHTML = `<h1>Results for: ${search}</h1>`;

// ✅ SEGURO: textContent (escapa automáticamente)
const search = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').textContent = `Results for: ${search}`;

// ✅ SEGURO: createElement + textContent
const search = new URLSearchParams(window.location.search).get('q');
const h1 = document.createElement('h1');
h1.textContent = `Results for: ${search}`;
document.getElementById('results').appendChild(h1);

// ✅ SEGURO: Función de escapado manual
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const search = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').innerHTML = `<h1>Results for: ${escapeHTML(search)}</h1>`;
```

---

### **3. Content Security Policy (CSP)** 🔒

**CSP es una capa adicional** que limita qué scripts pueden ejecutarse, incluso si XSS bypassa sanitización.

#### Configuración con Helmet.js

```javascript
import helmet from 'helmet';

// Configuración básica (estricta)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], // Solo scripts del mismo origen
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"], // Deshabilita Flash, etc.
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"], // Previene clickjacking
    upgradeInsecureRequests: [],
  },
}));

// Configuración para SPAs (React/Vue) con inline scripts
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // EVITAR 'unsafe-inline' en producción
      // En su lugar, usar nonces o hashes
    ],
    styleSrc: ["'self'", "'unsafe-inline'"], // Necesario para styled-components
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.myapp.com"],
  },
}));

// Configuración con NONCES (recomendado para inline scripts)
import crypto from 'crypto';

app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    scriptSrc: [
      "'self'",
      (req, res) => `'nonce-${res.locals.nonce}'`,
    ],
  },
}));

// En el HTML
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <script nonce="${res.locals.nonce}">
          console.log('Este script es permitido');
        </script>
      </head>
    </html>
  `);
});
```

**Directivas CSP más importantes**:

| Directiva | Descripción | Ejemplo |
|-----------|-------------|----------|
| `default-src` | Fallback para otras directivas | `'self'` |
| `script-src` | Fuentes permitidas para JS | `'self' https://cdn.example.com` |
| `style-src` | Fuentes permitidas para CSS | `'self' 'unsafe-inline'` |
| `img-src` | Fuentes para imágenes | `'self' data: https:` |
| `connect-src` | Orígenes para fetch/XHR | `'self' https://api.myapp.com` |
| `font-src` | Fuentes para fonts | `'self' https://fonts.gstatic.com` |
| `object-src` | Plugins (Flash, etc.) | `'none'` |
| `frame-src` | Orígenes para iframes | `'none'` o `'self'` |
| `upgrade-insecure-requests` | Fuerza HTTPS | (sin valor) |

**Valores especiales**:

- `'self'`: Mismo origen que la página
- `'none'`: Bloquea todo
- `'unsafe-inline'`: Permite inline scripts/styles (⚠️ evitar)
- `'unsafe-eval'`: Permite eval() (⚠️ evitar)
- `'nonce-<random>'`: Permite script específico con nonce
- `'sha256-<hash>'`: Permite script con hash específico

**Ejemplo de CSP reportando violaciones**:

```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    reportUri: '/api/csp-report', // Endpoint para recibir reportes
  },
  reportOnly: false, // false = bloquea, true = solo reporta
}));

// Endpoint que recibe violaciones CSP
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.log('CSP Violation:', req.body);
  
  // Loguear violación
  securityLogger.warn('CSP Violation', {
    document: req.body['csp-report']['document-uri'],
    violated: req.body['csp-report']['violated-directive'],
    blocked: req.body['csp-report']['blocked-uri'],
  });
  
  res.status(204).end();
});
```

---

### **4. Validación de Inputs** ✅

**Whitelist sobre Blacklist**: Define qué es permitido, no qué está bloqueado.

```typescript
import Joi from 'joi';

// Schema de validación para comentarios
const commentSchema = Joi.object({
  text: Joi.string()
    .max(500)
    .pattern(/^[a-zA-Z0-9\s.,!?'-]+$/) // Solo caracteres alfanuméricos y puntuación
    .required(),
  author: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
});

app.post('/comments', async (req, res) => {
  const { error, value } = commentSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  
  // value está validado, pero aún sanitizar antes de guardar
  const cleanText = DOMPurify.sanitize(value.text);
  
  await Comment.create({ text: cleanText, author: value.author });
  res.json({ success: true });
});
```

---

### **5. HTTPOnly Cookies** 🍪

Previene que JavaScript acceda a cookies (protege contra robo de sesión).

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true, // JavaScript no puede leer document.cookie
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS
    sameSite: 'strict', // Previene CSRF también
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
}));

// Tokens JWT en cookies HttpOnly
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000, // 1 hora
});
```

**Comparación**:

```javascript
// ❌ VULNERABLE: Token en localStorage (accesible por XSS)
localStorage.setItem('token', jwtToken);
// Atacante puede: localStorage.getItem('token')

// ✅ SEGURO: Token en HttpOnly cookie (no accesible por JS)
res.cookie('token', jwtToken, { httpOnly: true });
// Atacante NO puede acceder desde JavaScript
```

---

## 🧪 Testing de XSS

### Tests Automatizados

```typescript
// tests/xss.test.ts
import request from 'supertest';
import app from '../app';

describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(\'XSS\')">',
    '<svg onload="alert(\'XSS\')">',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  ];
  
  it('debe sanitizar comentarios con scripts', async () => {
    for (const payload of xssPayloads) {
      const res = await request(app)
        .post('/api/comments')
        .send({ text: payload });
      
      expect(res.status).toBe(200);
      
      // Verificar que el payload fue sanitizado
      const comments = await request(app).get('/api/comments');
      const savedComment = comments.body.find(c => c.text.includes('script') || c.text.includes('onerror'));
      expect(savedComment).toBeUndefined();
    }
  });
  
  it('debe incluir CSP header', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
  
  it('debe configurar cookies con httpOnly', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('HttpOnly');
  });
});
```

---

## 📚 Resumen: Checklist Anti-XSS

- [ ] **Sanitizar SIEMPRE inputs** con DOMPurify antes de guardar
- [ ] **Escapar outputs** al renderizar (React hace esto por defecto)
- [ ] **Configurar CSP estricto** con Helmet.js (evitar `'unsafe-inline'`)
- [ ] **Validar inputs** con Joi/Zod (whitelist de caracteres)
- [ ] **HttpOnly cookies** para tokens/sesiones (no localStorage)
- [ ] **Evitar `dangerouslySetInnerHTML`** o sanitizar antes
- [ ] **No usar `eval()`, `innerHTML` con datos del usuario**
- [ ] **Testear con payloads XSS comunes** en tests automatizados
- [ ] **Monitorear violaciones CSP** con reportUri

:::tip Defense in Depth
**Múltiples capas**: Si una falla (ej: sanitización), CSP aún protege. Si CSP falla, HttpOnly cookies previenen robo de sesión.
:::

:::warning Frameworks Modernos
React, Vue, Angular **escapan por defecto**, pero `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]` bypasan protecciones. **Úsalos solo con datos sanitizados**.
:::
