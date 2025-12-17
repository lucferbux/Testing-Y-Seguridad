---
sidebar_position: 3
title: "Cross-Site Request Forgery (CSRF)"
---

# Cross-Site Request Forgery (CSRF)

## ¿Qué es CSRF?

Cross-Site Request Forgery (CSRF, también pronunciado "sea-surf") es un ataque que fuerza a usuarios autenticados a ejecutar acciones no deseadas en una aplicación web en la que están actualmente logueados. A diferencia de XSS que explota la confianza del usuario en un sitio, CSRF explota la confianza que un sitio tiene en el navegador del usuario.

El ataque funciona porque los navegadores envían automáticamente las cookies de autenticación con cada petición al dominio correspondiente, sin importar desde qué página se originó la petición. Un atacante puede aprovechar esto para crear peticiones maliciosas que el servidor interpreta como legítimas.

### ¿Por qué es peligroso?

CSRF es particularmente peligroso porque:

1. **Es invisible para la víctima**: El ataque ocurre en segundo plano, sin interacción visible del usuario más allá de visitar una página.

2. **Usa credenciales legítimas**: Desde la perspectiva del servidor, la petición viene de un usuario autenticado con todas sus credenciales.

3. **Es difícil de detectar**: Los logs del servidor muestran una petición normal de un usuario real.

4. **Afecta a cualquier acción**: Cambio de email, cambio de contraseña, transferencias bancarias, eliminación de datos, cualquier acción que el usuario pueda hacer.

---

## Anatomía de un Ataque CSRF

### Escenario: Transferencia bancaria

Imaginemos que un usuario tiene una sesión activa en su banco online:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        ATAQUE CSRF                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PREPARACIÓN:                                                       │
│  El usuario está autenticado en banco.com                           │
│  Tiene una cookie de sesión válida: session=abc123xyz               │
│                                                                     │
│  PASO 1: El atacante crea una página maliciosa                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   evil-site.com/free-iphone.html              │   │
│  │                                                               │   │
│  │  <html>                                                       │   │
│  │    <head><title>¡iPhone 15 Gratis!</title></head>             │   │
│  │    <body>                                                     │   │
│  │      <h1>¡Felicidades! Has ganado un iPhone 15</h1>           │   │
│  │      <p>Haz clic abajo para reclamar tu premio...</p>         │   │
│  │                                                               │   │
│  │      <!-- Formulario oculto que se envía automáticamente -->  │   │
│  │      <form action="https://banco.com/transfer"                │   │
│  │            method="POST" style="display:none">                │   │
│  │        <input name="to" value="cuenta-atacante"/>             │   │
│  │        <input name="amount" value="10000"/>                   │   │
│  │      </form>                                                  │   │
│  │                                                               │   │
│  │      <script>                                                 │   │
│  │        document.forms[0].submit();                            │   │
│  │      </script>                                                │   │
│  │    </body>                                                    │   │
│  │  </html>                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  PASO 2: El atacante envía el link a la víctima                     │
│  (email, mensaje, anuncio, redes sociales, etc.)                    │
│                                                                     │
│  PASO 3: La víctima visita la página                                │
│  ┌─────────┐     GET evil-site.com/free-iphone.html                 │
│  │ Víctima │ ────────────────────────────────────────►              │
│  └─────────┘                                                        │
│       │                                                             │
│       │  El navegador carga la página y ejecuta el JavaScript       │
│       │  que envía el formulario automáticamente                    │
│       ▼                                                             │
│  PASO 4: El formulario hace POST a banco.com                        │
│  ┌─────────┐     POST /transfer                     ┌──────────┐    │
│  │Navegador│ ────────────────────────────────────►  │ banco.com│    │
│  │         │     Cookie: session=abc123xyz          │          │    │
│  │         │     to=cuenta-atacante                 │          │    │
│  │         │     amount=10000                       │          │    │
│  └─────────┘                                        └──────────┘    │
│                                                          │          │
│  PASO 5: El banco ve una petición válida                 │          │
│  - Sesión válida ✓                                       │          │
│  - Usuario autenticado ✓                                 │          │
│  - Datos completos ✓                                     ▼          │
│                                              ┌──────────────────┐   │
│                                              │ Transferencia de │   │
│                                              │ $10,000 realizada│   │
│                                              │ a cuenta-atacante│   │
│                                              └──────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Variantes de CSRF

El ataque puede tomar muchas formas, algunas más sigilosas que otras:

**1. Formulario oculto con auto-submit (como el ejemplo anterior)**
```html
<form action="https://target.com/api/action" method="POST" style="display:none">
  <input name="data" value="malicious"/>
</form>
<script>document.forms[0].submit();</script>
```

**2. Imagen con URL de acción (solo para GET)**
```html
<!-- Se carga automáticamente, sin interacción del usuario -->
<img src="https://target.com/api/delete?id=123" width="0" height="0"/>
```

**3. Iframe oculto**
```html
<iframe src="https://target.com/api/action?param=value" style="display:none"></iframe>
```

**4. JavaScript fetch (si CORS lo permite)**
```javascript
fetch('https://target.com/api/action', {
  method: 'POST',
  credentials: 'include',  // Envía cookies
  body: JSON.stringify({ action: 'malicious' }),
  headers: { 'Content-Type': 'application/json' }
});
```

---

## Escenario en Taller-Testing-Security

Imaginemos que un atacante ha conseguido el token JWT de un usuario del proyecto (mediante XSS u otro vector). Con ese token, puede realizar cualquier acción autenticada:

### Obtener información del perfil

```bash
# El atacante tiene el token robado
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Obtener toda la información del perfil
curl -X GET 'http://localhost:4000/v1/aboutme' \
  --header "Authorization: Bearer $TOKEN"

# Respuesta:
# {
#   "id": "6507d1a2c1a2b3c4d5e6f7a8",
#   "email": "victima@example.com",
#   "name": "Usuario Víctima",
#   ...
# }
```

### Modificar el perfil

```bash
# Cambiar el email del usuario (hijack de cuenta)
curl -X PUT 'http://localhost:4000/v1/aboutme' \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "Cuenta Comprometida",
    "email": "atacante@evil.com"
  }'

# Ahora el atacante puede usar "olvidé mi contraseña"
# con su propio email para tomar control total
```

### Eliminar todos los proyectos

```bash
# Primero, listar los proyectos
curl -X GET 'http://localhost:4000/v1/projects' \
  --header "Authorization: Bearer $TOKEN"

# Luego eliminarlos uno por uno
curl -X DELETE 'http://localhost:4000/v1/projects/6507d1a2c1a2b3c4d5e6f7a8' \
  --header "Authorization: Bearer $TOKEN"

curl -X DELETE 'http://localhost:4000/v1/projects/6507d1a2c1a2b3c4d5e6f7a9' \
  --header "Authorization: Bearer $TOKEN"

# Todos los datos del usuario, eliminados
```

### Crear proyectos spam

```bash
# Crear contenido malicioso en la cuenta de la víctima
curl -X POST 'http://localhost:4000/v1/projects' \
  --header "Authorization: Bearer $TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "title": "Proyecto Malicioso",
    "description": "<script>window.location=\"https://phishing.com\"</script>",
    "link": "https://malware-distribution.com"
  }'
```

---

## Prevención de CSRF

### 1. Cookies SameSite

El atributo `SameSite` de las cookies es la defensa más efectiva contra CSRF. Le indica al navegador cuándo enviar la cookie:

```typescript
// Configuración en Express
res.cookie('token', jwtToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'  // ← Clave para prevenir CSRF
});
```

**Valores de SameSite:**

| Valor | Comportamiento | Protección CSRF |
|-------|----------------|-----------------|
| `strict` | Cookie NUNCA se envía en requests cross-origin, ni siquiera en navegación con link | ✅ Máxima |
| `lax` | Cookie se envía en navegación top-level (links) pero NO en POSTs cross-origin | ✅ Buena |
| `none` | Cookie siempre se envía (requiere `secure: true`) | ❌ Ninguna |

**¿Cuándo usar cada valor?**

- **`strict`**: Para aplicaciones donde la seguridad es crítica y no necesitas que links externos mantengan la sesión. El usuario tendrá que re-autenticarse si llega desde otro sitio.

- **`lax`**: Balance entre seguridad y usabilidad. Links desde otros sitios mantienen la sesión, pero forms POST no. Es el valor por defecto en navegadores modernos.

- **`none`**: Solo para casos específicos como widgets embebidos o APIs que deben aceptar requests cross-origin. Requiere `secure: true`.

### 2. CSRF Tokens

Para aplicaciones que usan cookies de sesión tradicionales, implementa tokens CSRF:

```typescript
// Instalación
// npm install csurf

import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Middleware
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });

// Endpoint para obtener el token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rutas protegidas requieren el token
app.post('/api/transfer', csrfProtection, (req, res) => {
  // El middleware valida automáticamente que el token sea válido
  // Si no lo es, devuelve 403 Forbidden
  processTransfer(req.body);
});
```

**Flujo del token CSRF:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     FLUJO DE TOKEN CSRF                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Usuario carga la página                                         │
│     ┌─────────┐     GET /app             ┌─────────┐                │
│     │ Cliente │ ──────────────────────►  │ Servidor│                │
│     └─────────┘                          └─────────┘                │
│                                               │                     │
│  2. Servidor envía la página + token CSRF    │                      │
│     ┌─────────┐     HTML + csrfToken     ┌───┴─────┐                │
│     │ Cliente │ ◄──────────────────────  │ Servidor│                │
│     └─────────┘                          └─────────┘                │
│          │                                                          │
│  3. Usuario envía formulario con token                              │
│     ┌─────────┐     POST /api/action     ┌─────────┐                │
│     │ Cliente │ ──────────────────────►  │ Servidor│                │
│     └─────────┘     + csrfToken          └─────────┘                │
│                     + Cookie de sesión        │                     │
│                                               │                     │
│  4. Servidor valida: Cookie ✓ Token ✓         │                     │
│     Procesa la petición                       ▼                     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  INTENTO DE ATAQUE CSRF:                                            │
│                                                                     │
│  1. Atacante no puede obtener el token                              │
│     (está en el DOM de otra página, Same-Origin Policy lo protege)  │
│                                                                     │
│  2. Atacante envía formulario SIN token                             │
│     ┌─────────┐     POST /api/action     ┌─────────┐                │
│     │Evil Site│ ──────────────────────►  │ Servidor│                │
│     └─────────┘     Cookie ✓ (enviada)   └─────────┘                │
│                     Token ✗ (faltante)        │                     │
│                                               │                     │
│  3. Servidor rechaza: 403 Forbidden           ▼                     │
│     "Invalid CSRF token"                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Frontend: Incluir token en peticiones**

```typescript
// 1. Obtener el token al cargar la app
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// 2. Incluir en todas las peticiones mutables
async function makeSecureRequest(url: string, data: object) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken  // ← Enviar el token
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  return response.json();
}

// 3. Con Axios, configurar interceptor global
import axios from 'axios';

// Obtener token
const { data } = await axios.get('/api/csrf-token');
axios.defaults.headers.common['CSRF-Token'] = data.csrfToken;
```

### 3. Verificar Origin y Referer

Como capa adicional de defensa, verifica los headers Origin y Referer:

```typescript
function csrfProtectionMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Solo verificar métodos que modifican datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'https://myapp.com',
      'https://www.myapp.com',
      'http://localhost:3000'  // Solo en desarrollo
    ];
    
    // Verificar Origin header
    if (origin) {
      if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({ 
          error: 'CSRF protection: invalid origin' 
        });
      }
    } 
    // Si no hay Origin, verificar Referer
    else if (referer) {
      const refererUrl = new URL(referer);
      if (!allowedOrigins.includes(refererUrl.origin)) {
        return res.status(403).json({ 
          error: 'CSRF protection: invalid referer' 
        });
      }
    }
    // Si no hay ni Origin ni Referer, puede ser sospechoso
    // (algunos browsers/proxies los eliminan, así que no siempre bloquear)
  }
  
  next();
}
```

### 4. Custom Headers (Double Submit)

Los formularios HTML simples no pueden enviar headers personalizados. Por tanto, requerir un header personalizado bloquea CSRF desde formularios:

```typescript
// Backend: Requerir header personalizado
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const customHeader = req.get('X-Requested-With');
    
    if (customHeader !== 'XMLHttpRequest') {
      return res.status(403).json({ 
        error: 'Missing required header' 
      });
    }
  }
  next();
});

// Frontend: Enviar el header en todas las peticiones
fetch('/api/action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'  // ← Header personalizado
  },
  body: JSON.stringify(data)
});
```

**¿Por qué funciona?**

- Formularios HTML (`<form>`) no pueden enviar headers personalizados
- JavaScript cross-origin no puede enviar headers personalizados sin CORS preflight
- Si CORS no está configurado para permitirlo, el navegador bloquea la petición

---

## Checklist de Prevención CSRF

```text
□ Usar cookies SameSite=strict o SameSite=lax
□ Implementar tokens CSRF para formularios tradicionales
□ Verificar headers Origin/Referer en peticiones sensibles
□ Requerir headers personalizados para APIs (X-Requested-With)
□ Configurar CORS restrictivamente (no usar origin: '*' con credentials)
□ No usar GET para acciones que modifican datos
□ Implementar re-autenticación para acciones críticas (cambiar password, transferencias)
□ Usar token JWT en headers en lugar de cookies cuando sea posible
□ Establecer tiempos de expiración cortos para sesiones
```

---

## Próximo Paso

Ahora que entiendes CSRF, veamos otra categoría de vulnerabilidades relacionadas con la manipulación de datos de entrada. Continúa con **[Inyecciones NoSQL](./injection)**.
