---
sidebar_position: 6
title: "Cross-Site Request Forgery (CSRF)"
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
