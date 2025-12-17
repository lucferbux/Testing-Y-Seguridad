---
sidebar_position: 6
title: "Headers de Seguridad con Helmet"
---

# Headers de Seguridad con Helmet

## ¿Por qué son importantes los headers HTTP?

Los headers HTTP son metadatos que acompañan cada request y response entre el navegador y el servidor. Más allá de transportar información técnica como el tipo de contenido o las cookies, ciertos headers instruyen al navegador sobre cómo comportarse respecto a seguridad.

El problema es que Express (y la mayoría de frameworks) no configura estos headers de seguridad por defecto. Esto significa que tu aplicación está expuesta a vulnerabilidades que podrían prevenirse simplemente enviando los headers correctos.

### Headers de seguridad que tu aplicación debería enviar

| Header | Propósito | Sin él, eres vulnerable a... |
|--------|-----------|------------------------------|
| `Content-Security-Policy` | Define qué recursos puede cargar el navegador | XSS, inyección de scripts externos |
| `X-Content-Type-Options` | Previene MIME sniffing | Ejecución de archivos maliciosos |
| `X-Frame-Options` | Controla si la página puede ser embebida en iframes | Clickjacking |
| `Strict-Transport-Security` | Fuerza HTTPS | Man-in-the-middle, SSL stripping |
| `X-XSS-Protection` | Activa filtro XSS del navegador | XSS básico |
| `Referrer-Policy` | Controla qué información se envía en el Referer | Filtración de URLs con tokens |

---

## Helmet: Seguridad con una línea de código

Helmet es una colección de 11+ middlewares que configuran headers de seguridad HTTP. En lugar de configurar cada header manualmente (y potencialmente olvidar alguno), Helmet aplica configuraciones seguras por defecto.

### Instalación

```bash
cd api
npm install helmet
```

### Implementación básica

```typescript
// api/src/config/middleware/middleware.ts

import express from 'express';
import helmet from 'helmet';

export function configure(app: express.Application): void {
  // ✅ Una sola línea activa 11+ protecciones de seguridad
  app.use(helmet());
  
  // ... resto de middlewares
}
```

Con esta única línea, tu aplicación ahora envía headers como:

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: no-referrer
X-XSS-Protection: 0
```

Nota también que `X-Powered-By: Express` **no aparece**. Helmet lo elimina automáticamente para no revelar qué tecnología usas, dificultando ataques dirigidos.

---

## Explicación detallada de cada header

### Content-Security-Policy (CSP)

CSP es el header de seguridad más poderoso. Define una política de seguridad que indica al navegador qué recursos puede cargar y de dónde.

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

**Directivas principales:**

| Directiva | Controla | Ejemplo |
|-----------|----------|---------|
| `default-src` | Fallback para todas las directivas | `'self'` (solo nuestro origen) |
| `script-src` | Scripts JavaScript | `'self' 'nonce-abc123'` |
| `style-src` | Hojas de estilo CSS | `'self' 'unsafe-inline'` |
| `img-src` | Imágenes | `'self' data: https:` |
| `font-src` | Fuentes | `'self' https://fonts.gstatic.com` |
| `connect-src` | Fetch, XHR, WebSocket | `'self' https://api.example.com` |
| `frame-src` | Iframes | `'none'` (bloquear todos) |
| `frame-ancestors` | Quién puede embebernos | `'none'` (nadie) |

**Valores especiales:**

| Valor | Significado |
|-------|-------------|
| `'self'` | Mismo origen (protocolo + dominio + puerto) |
| `'none'` | Bloquear completamente |
| `'unsafe-inline'` | Permitir inline (⚠️ debilita CSP) |
| `'unsafe-eval'` | Permitir eval() (⚠️ muy peligroso) |
| `'nonce-xxx'` | Permitir elementos con ese nonce |
| `'strict-dynamic'` | Scripts cargados por scripts permitidos |
| `https:` | Cualquier origen HTTPS |
| `data:` | Data URIs (útil para imágenes inline) |

**Cómo CSP bloquea XSS:**

Si un atacante inyecta `<script>alert('XSS')</script>`, el navegador verifica la política CSP:

```text
Política: script-src 'self'
Script inyectado: inline (no tiene origen)
Decisión: BLOQUEADO

Mensaje en consola:
"Refused to execute inline script because it violates the 
Content-Security-Policy directive: 'script-src 'self''"
```

### X-Content-Type-Options

```text
X-Content-Type-Options: nosniff
```

Previene "MIME sniffing", donde el navegador intenta adivinar el tipo de contenido ignorando el header `Content-Type`.

**Escenario de ataque sin `nosniff`:**

1. Atacante sube un archivo `malware.txt` con contenido JavaScript
2. El servidor lo sirve como `Content-Type: text/plain`
3. Sin `nosniff`, el navegador "huele" que parece JavaScript
4. El navegador ejecuta el archivo como JavaScript
5. Código malicioso ejecutado

Con `nosniff`, el navegador respeta estrictamente el `Content-Type` y no ejecuta texto como JavaScript.

### X-Frame-Options

```text
X-Frame-Options: SAMEORIGIN
```

Controla si tu página puede ser embebida en un `<iframe>`, `<frame>`, `<embed>`, u `<object>`.

| Valor | Comportamiento |
|-------|----------------|
| `DENY` | Nunca permitir ser embebido |
| `SAMEORIGIN` | Solo permitir ser embebido por páginas del mismo origen |
| `ALLOW-FROM uri` | Solo permitir desde una URI específica (deprecated) |

**Ataque de Clickjacking que previene:**

```html
<!-- Sitio del atacante -->
<style>
  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    opacity: 0;  /* Invisible */
    z-index: 1;
  }
  .fake-button {
    position: absolute;
    top: 200px; left: 300px;
  }
</style>

<div class="fake-button">¡Haz clic para ganar $1000!</div>
<iframe src="https://tu-banco.com/transferir?a=atacante&monto=10000"></iframe>
```

El usuario ve un botón para "ganar dinero" pero realmente hace clic en el botón de transferir del banco (invisible encima).

Con `X-Frame-Options: DENY`, el banco no se carga en el iframe y el ataque falla.

### Strict-Transport-Security (HSTS)

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Una vez que el navegador recibe este header (por HTTPS), recuerda que este dominio **solo debe accederse por HTTPS** durante el tiempo especificado.

| Directiva | Significado |
|-----------|-------------|
| `max-age=31536000` | Recordar durante 1 año (en segundos) |
| `includeSubDomains` | Aplicar también a subdominios |
| `preload` | Incluir en lista hardcoded de navegadores |

**Ataque SSL Stripping que previene:**

```text
Sin HSTS:
1. Usuario escribe "banco.com" en el navegador
2. Navegador hace petición HTTP a http://banco.com
3. Atacante en la red (WiFi público) intercepta
4. Atacante responde en lugar del banco real
5. Usuario cree que está en el banco pero es phishing

Con HSTS:
1. Usuario escribe "banco.com"
2. Navegador recuerda: "banco.com tiene HSTS"
3. Navegador AUTOMÁTICAMENTE usa HTTPS
4. No hay petición HTTP que interceptar
```

### Referrer-Policy

```text
Referrer-Policy: strict-origin-when-cross-origin
```

Controla qué información se incluye en el header `Referer` cuando navegas de una página a otra.

| Valor | Comportamiento |
|-------|----------------|
| `no-referrer` | Nunca enviar Referer |
| `same-origin` | Solo enviar a mismo origen |
| `strict-origin` | Enviar solo el origen (sin path) a otros sitios |
| `strict-origin-when-cross-origin` | Path completo a mismo origen, solo origen a otros |

**Por qué importa:**

Si tu URL es `https://app.com/reset-password?token=abc123`, sin política de Referer:
- El usuario hace clic en un link externo
- El sitio externo recibe `Referer: https://app.com/reset-password?token=abc123`
- El token de reset está expuesto

Con `strict-origin`:
- El sitio externo solo recibe `Referer: https://app.com`
- El token está protegido

---

## Configuración personalizada de Helmet

Los valores por defecto de Helmet son buenos para empezar, pero en producción querrás ajustarlos según tus necesidades:

```typescript
// api/src/config/middleware/middleware.ts

import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy personalizado
  contentSecurityPolicy: {
    directives: {
      // Fallback: solo recursos de nuestro origen
      defaultSrc: ["'self'"],
      
      // Scripts: solo de nuestro origen, sin eval
      scriptSrc: ["'self'"],
      
      // Estilos: permitir inline para CSS-in-JS (styled-components, etc.)
      styleSrc: ["'self'", "'unsafe-inline'"],
      
      // Imágenes: nuestro origen + data URIs + HTTPS externo
      imgSrc: ["'self'", "data:", "https:"],
      
      // Fuentes: nuestro origen + Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      
      // Conexiones API: nuestro origen + API externa si aplica
      connectSrc: [
        "'self'",
        process.env.NODE_ENV === 'development' 
          ? 'http://localhost:4000' 
          : 'https://api.example.com',
      ],
      
      // Frames: bloquear completamente
      frameSrc: ["'none'"],
      
      // Quién puede embebernos: nadie
      frameAncestors: ["'none'"],
      
      // Formularios: solo a nuestro origen
      formAction: ["'self'"],
      
      // Base URL: solo nuestro origen
      baseUri: ["'self'"],
      
      // Plugins (Flash, Java): bloquear
      objectSrc: ["'none'"],
      
      // Upgrade HTTP a HTTPS automáticamente
      upgradeInsecureRequests: [],
    },
  },
  
  // HSTS con configuración más estricta
  hsts: {
    maxAge: 31536000,        // 1 año en segundos
    includeSubDomains: true, // Aplicar a subdominios
    preload: true,           // Para lista de preload de navegadores
  },
  
  // Bloquear iframes completamente
  frameguard: { action: 'deny' },
  
  // No cachear en navegadores por seguridad
  noCache: true,
  
  // Política de Referrer estricta
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Desactivar detección de tipo de contenido
  noSniff: true,
  
  // Desactivar DNS prefetching
  dnsPrefetchControl: { allow: false },
  
  // Prevenir descargas en contexto del sitio (IE)
  ieNoOpen: true,
  
  // No permitir políticas de Adobe
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));
```

### CSP para aplicaciones React/SPA

Las SPAs modernas a menudo necesitan configuraciones CSP específicas:

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    
    // React en desarrollo usa eval para hot reload
    scriptSrc: process.env.NODE_ENV === 'development'
      ? ["'self'", "'unsafe-eval'"]
      : ["'self'"],
    
    // Styled-components necesita inline styles
    styleSrc: ["'self'", "'unsafe-inline'"],
    
    // Imágenes de CDN
    imgSrc: ["'self'", "data:", "https://cdn.example.com"],
    
    // API backend
    connectSrc: [
      "'self'",
      process.env.VITE_API_URL,
      // WebSocket para hot reload en desarrollo
      ...(process.env.NODE_ENV === 'development' ? ['ws://localhost:*'] : []),
    ],
    
    // Fuentes
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.example.com",
    ],
    
    // Workers (para service workers, web workers)
    workerSrc: ["'self'", "blob:"],
    
    // Manifest
    manifestSrc: ["'self'"],
  },
},
```

---

## Verificar headers de seguridad

### Con cURL

```bash
# Ver headers de respuesta
curl -I http://localhost:4000/v1/aboutme

# Ejemplo de respuesta:
HTTP/1.1 401 Unauthorized
X-DNS-Prefetch-Control: off
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-Permitted-Cross-Domain-Policies: none
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

### Con el navegador

1. Abre DevTools (F12)
2. Ve a la pestaña Network
3. Haz una petición
4. Selecciona la petición y mira los Response Headers

### Con herramientas online (para producción)

**SecurityHeaders.com**
- 🔗 [securityheaders.com](https://securityheaders.com/)
- Analiza los headers y da una calificación A-F
- Sugiere mejoras específicas

**Mozilla Observatory**
- 🔗 [observatory.mozilla.org](https://observatory.mozilla.org/)
- Auditoría completa de seguridad web
- Incluye CSP, cookies, HSTS, y más

**Lighthouse (Chrome DevTools)**
- Abre DevTools → Lighthouse → Security
- Genera reporte con recomendaciones

---

## Solución de problemas comunes

### "Refused to load script..."

```text
Refused to load the script 'https://cdn.example.com/script.js' because it 
violates the Content-Security-Policy directive: "script-src 'self'"
```

**Solución**: Añadir el origen a `script-src`:

```typescript
scriptSrc: ["'self'", "https://cdn.example.com"],
```

### "Refused to apply inline style..."

```text
Refused to apply inline style because it violates the Content-Security-Policy 
directive: "style-src 'self'"
```

**Solución**: Para CSS-in-JS, necesitas `'unsafe-inline'`:

```typescript
styleSrc: ["'self'", "'unsafe-inline'"],
```

**Mejor solución**: Usar nonces para estilos específicos.

### "Refused to connect to..."

```text
Refused to connect to 'http://localhost:4000/api' because it violates the 
Content-Security-Policy directive: "connect-src 'self'"
```

**Solución**: Añadir la API a `connect-src`:

```typescript
connectSrc: ["'self'", "http://localhost:4000"],
```

### Google Fonts no cargan

```typescript
fontSrc: ["'self'", "https://fonts.gstatic.com"],
styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
```

---

## Checklist de Headers de Seguridad

```text
□ Helmet instalado y configurado
□ CSP configurado sin 'unsafe-eval' en producción
□ X-Frame-Options: DENY o SAMEORIGIN
□ HSTS con max-age de al menos 1 año
□ X-Content-Type-Options: nosniff
□ Referrer-Policy configurado
□ X-Powered-By eliminado
□ Headers verificados con securityheaders.com
□ CSP probado en desarrollo antes de producción
□ Excepciones de CSP documentadas y justificadas
```

---

## Próximo Paso

Con los headers de seguridad configurados, el siguiente paso es proteger tu API contra ataques de fuerza bruta. Continúa con **[Rate Limiting](./rate-limiting)**.
