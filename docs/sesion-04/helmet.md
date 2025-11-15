---
sidebar_position: 7
title: "Helmet.js: Headers de Seguridad"
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
