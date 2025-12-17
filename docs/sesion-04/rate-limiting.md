---
sidebar_position: 7
title: "Rate Limiting"
---

# Rate Limiting

## ¿Qué es Rate Limiting?

Rate Limiting es una técnica que controla el número de peticiones que un cliente puede hacer a tu API en un período de tiempo determinado. Es una defensa fundamental contra varios tipos de ataques y abusos.

### ¿Por qué es necesario?

Sin rate limiting, un atacante puede hacer miles de peticiones por segundo a tu API. Esto permite:

1. **Ataques de fuerza bruta**: Probar millones de contraseñas contra el endpoint de login
2. **DDoS básico**: Saturar tu servidor con peticiones legítimas hasta que deje de responder
3. **Scraping agresivo**: Extraer todos los datos de tu API en minutos
4. **Enumeración de usuarios**: Descubrir qué emails/usernames existen en tu sistema
5. **Agotamiento de recursos**: Consumir CPU, memoria, y ancho de banda
6. **Costos elevados**: Si usas servicios cloud que cobran por petición

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    ATAQUE SIN RATE LIMITING                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Atacante ejecuta script de fuerza bruta:                           │
│                                                                     │
│  for password in wordlist:                                          │
│      response = requests.post('/login', {                           │
│          'email': 'admin@example.com',                              │
│          'password': password                                       │
│      })                                                             │
│                                                                     │
│  Velocidad: 1000+ intentos por segundo                              │
│  Diccionario: 10 millones de passwords comunes                      │
│  Tiempo para probar todo: ~3 horas                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│                    CON RATE LIMITING                                │
│                                                                     │
│  Rate limit: 5 intentos de login por 15 minutos                     │
│                                                                     │
│  Intento 1: 200 OK (password incorrecto)                            │
│  Intento 2: 200 OK (password incorrecto)                            │
│  Intento 3: 200 OK (password incorrecto)                            │
│  Intento 4: 200 OK (password incorrecto)                            │
│  Intento 5: 200 OK (password incorrecto)                            │
│  Intento 6: 429 Too Many Requests                                   │
│  ...bloqueado por 15 minutos...                                     │
│                                                                     │
│  Velocidad efectiva: 5 intentos / 15 min = 20 intentos / hora       │
│  Tiempo para probar 10M passwords: ~57 años                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## express-rate-limit

La librería `express-rate-limit` proporciona rate limiting simple y efectivo para Express:

```bash
cd api
npm install express-rate-limit
```

### Implementación básica

```typescript
// api/src/config/middleware/middleware.ts

import rateLimit from 'express-rate-limit';

// Rate limit general: 100 requests / 15 minutos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos en milisegundos
  max: 100,                   // Máximo 100 requests por ventana
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.',
  },
});

export function configure(app: express.Application): void {
  // Aplicar rate limit a toda la API
  app.use('/v1/', generalLimiter);
  
  // ... resto de configuración
}
```

---

## Estrategia por capas

Una buena estrategia de rate limiting usa múltiples capas con diferentes niveles de restricción según la sensibilidad del endpoint:

```typescript
// api/src/config/middleware/rateLimiter.ts

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Rate limit general para toda la API
 * Protege contra scraping y DDoS básico
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  // Ventana de tiempo: 15 minutos
  windowMs: 15 * 60 * 1000,
  
  // Máximo 100 requests por IP en la ventana
  max: 100,
  
  // Mensaje de error estructurado
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Has excedido el límite de peticiones. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutes',
  },
  
  // Incluir headers estándar RFC 6585
  standardHeaders: true,
  
  // Deshabilitar headers legacy X-RateLimit-*
  legacyHeaders: false,
  
  // Handler personalizado cuando se excede el límite
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Rate limit estricto para autenticación
 * Protege contra ataques de fuerza bruta
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  
  // Solo 5 intentos de login cada 15 minutos
  max: 5,
  
  // No contar requests exitosos (status < 400)
  skipSuccessfulRequests: true,
  
  message: {
    status: 429,
    error: 'Too Many Login Attempts',
    message: 'Demasiados intentos de login. Tu cuenta ha sido temporalmente bloqueada.',
    retryAfter: '15 minutes',
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit para registro de usuarios
 * Previene creación masiva de cuentas (spam)
 */
export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  
  // Solo 3 registros por hora por IP
  max: 3,
  
  message: {
    status: 429,
    error: 'Too Many Registrations',
    message: 'Límite de registros alcanzado. Intenta de nuevo en 1 hora.',
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit para creación de recursos
 * Previene spam y abuso
 */
export const createLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  
  // 50 creaciones por hora
  max: 50,
  
  message: {
    status: 429,
    error: 'Creation Limit Exceeded',
    message: 'Has alcanzado el límite de creación de recursos.',
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limit para operaciones costosas
 * Por ejemplo: exportación de datos, generación de reportes
 */
export const heavyOperationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  
  // Solo 10 operaciones costosas por hora
  max: 10,
  
  message: {
    status: 429,
    error: 'Operation Limit Exceeded',
    message: 'Esta operación tiene un límite. Intenta de nuevo más tarde.',
  },
  
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Aplicar limiters en las rutas

```typescript
// api/src/config/middleware/middleware.ts

import { 
  generalLimiter, 
  authLimiter, 
  registerLimiter,
  createLimiter 
} from './rateLimiter';

export function configure(app: express.Application): void {
  // ... otros middlewares
  
  // Rate limiting general para toda la API v1
  app.use('/v1/', generalLimiter);
  
  // Rate limiting estricto para autenticación
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', registerLimiter);
  
  // Rate limiting para creación de recursos
  app.use('/v1/projects', createLimiter);
  
  // ... resto de configuración
}
```

O aplicar directamente en los routers:

```typescript
// api/src/routes/AuthRouter.ts

import { Router } from 'express';
import { authLimiter, registerLimiter } from '../config/middleware/rateLimiter';
import * as AuthComponent from '../components/Auth';

const router = Router();

// Login con rate limiting estricto
router.post('/login', authLimiter, AuthComponent.login);

// Registro con rate limiting
router.post('/register', registerLimiter, AuthComponent.signup);

export default router;
```

---

## Headers de Rate Limit

Cuando configuras `standardHeaders: true`, cada response incluye headers informativos según RFC 6585:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1702656000
```

| Header | Significado |
|--------|-------------|
| `RateLimit-Limit` | Número máximo de requests permitidos en la ventana |
| `RateLimit-Remaining` | Requests restantes en la ventana actual |
| `RateLimit-Reset` | Timestamp UNIX cuando se resetea la ventana |

Cuando se excede el límite:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1702656000
Retry-After: 900
```

El header `Retry-After` indica cuántos segundos debe esperar el cliente.

### Verificar rate limiting

```bash
# Ver headers de rate limit
curl -I http://localhost:4000/v1/aboutme

# Hacer múltiples requests y observar cómo decrece Remaining
for i in {1..10}; do 
  echo "=== Request $i ===" 
  curl -s -I http://localhost:4000/v1/aboutme 2>&1 | grep -E "RateLimit|HTTP"
  sleep 0.5
done
```

---

## Opciones de configuración avanzadas

### keyGenerator: Identificar clientes

Por defecto, express-rate-limit usa la IP del cliente. Puedes personalizarlo:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  
  // Función para obtener el identificador del cliente
  keyGenerator: (req): string => {
    // Opción 1: IP (default)
    // Funciona para la mayoría de casos
    return req.ip || 'unknown';
    
    // Opción 2: X-Forwarded-For para proxies/load balancers
    // Útil si estás detrás de nginx, cloudflare, etc.
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.ip 
      || 'unknown';
    
    // Opción 3: Combinar IP con usuario autenticado
    // Permite más requests a usuarios autenticados
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}:${userId}`;
    
    // Opción 4: Por API key
    // Para APIs que usan API keys
    return req.headers['x-api-key'] as string || req.ip || 'unknown';
  },
});
```

### skip: Excluir ciertas requests

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  
  // Excluir ciertas requests del rate limiting
  skip: (req): boolean => {
    // No limitar health checks
    if (req.path === '/health' || req.path === '/ready') {
      return true;
    }
    
    // No limitar a IPs internas (comunicación entre servicios)
    const internalIPs = ['127.0.0.1', '::1', '10.0.0.0/8'];
    if (isInternalIP(req.ip, internalIPs)) {
      return true;
    }
    
    // No limitar a admins
    if (req.user?.role === 'admin') {
      return true;
    }
    
    return false;
  },
});
```

### skipSuccessfulRequests: No contar éxitos

Útil para login donde solo quieres contar intentos fallidos:

```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  
  // Solo contar requests con status >= 400
  skipSuccessfulRequests: true,
  
  // Así, un usuario puede hacer login exitoso sin límite
  // pero solo 5 intentos fallidos
});
```

### skipFailedRequests: No contar fallos

Útil cuando quieres limitar uso exitoso, no intentos:

```typescript
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  
  // Solo contar requests exitosas
  skipFailedRequests: true,
  
  // Errores del servidor (500) no consumen cuota
});
```

---

## Rate Limiting en producción con Redis

El rate limiter por defecto guarda los contadores en memoria. Esto tiene problemas en producción:

1. **Se pierde al reiniciar**: Los contadores se resetean
2. **No escala**: Si tienes múltiples instancias, cada una tiene su propio contador

```text
┌─────────────────────────────────────────────────────────────────────┐
│               PROBLEMA CON RATE LIMITING EN MEMORIA                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Load Balancer                                                      │
│       │                                                             │
│       ├──────────► Instance 1 (counter: 50/100)                     │
│       │                                                             │
│       ├──────────► Instance 2 (counter: 45/100)                     │
│       │                                                             │
│       └──────────► Instance 3 (counter: 48/100)                     │
│                                                                     │
│  El atacante puede hacer 100 requests a CADA instancia              │
│  Total efectivo: 300 requests en lugar de 100                       │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│               SOLUCIÓN: REDIS COMO STORE COMPARTIDO                 │
│                                                                     │
│  Load Balancer                                                      │
│       │                                                             │
│       ├──────────► Instance 1 ──┐                                   │
│       │                         │                                   │
│       ├──────────► Instance 2 ──┼──────► Redis (counter: 100/100)   │
│       │                         │                                   │
│       └──────────► Instance 3 ──┘                                   │
│                                                                     │
│  Todas las instancias comparten el mismo contador                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementación con Redis

```bash
npm install rate-limit-redis ioredis
```

```typescript
// api/src/config/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Crear cliente Redis
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  
  // Reconexión automática
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis connection failed');
      return null; // Stop retrying
    }
    return Math.min(times * 100, 3000);
  },
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis for rate limiting');
});

// Rate limiter con Redis
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  
  // Usar Redis como store
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: 'rl:general:',  // Prefijo para las keys en Redis
  }),
  
  standardHeaders: true,
  legacyHeaders: false,
  
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: 'rl:auth:',
  }),
  
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Verificar en Redis

```bash
# Conectar a Redis CLI
redis-cli

# Ver todas las keys de rate limit
KEYS rl:*

# Ver el contador de una IP específica
GET "rl:general:192.168.1.100"

# Ver TTL (tiempo restante en la ventana)
TTL "rl:general:192.168.1.100"
```

---

## Consideraciones especiales

### NAT corporativo y VPNs

Muchos usuarios detrás de una IP (NAT corporativo, universidad, VPN) pueden ser bloqueados injustamente:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  
  // Límite más alto para acomodar múltiples usuarios por IP
  max: 500,
  
  // O usar identificadores adicionales
  keyGenerator: (req) => {
    // Combinar IP con User-Agent para diferenciar usuarios
    const ip = req.ip;
    const ua = req.headers['user-agent']?.slice(0, 50) || 'unknown';
    return `${ip}:${ua}`;
  },
});
```

### Proxies y X-Forwarded-For

Si tu aplicación está detrás de un proxy (nginx, Cloudflare, load balancer), la IP real está en headers, no en `req.ip`:

```typescript
// Importante: Configurar Express para confiar en el proxy
app.set('trust proxy', 1);  // Confiar en 1 nivel de proxy

// O especificar IPs de proxies confiables
app.set('trust proxy', ['loopback', '10.0.0.0/8']);
```

Con `trust proxy` configurado, `req.ip` automáticamente lee de `X-Forwarded-For`.

### Rate limiting por usuario autenticado

Para usuarios autenticados, puedes tener límites diferentes:

```typescript
export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  
  // Función dinámica para el máximo
  max: (req) => {
    // Usuarios premium tienen más cuota
    if (req.user?.plan === 'premium') return 1000;
    if (req.user?.plan === 'pro') return 500;
    return 100;  // Plan gratuito
  },
  
  keyGenerator: (req) => {
    // Usar ID de usuario en lugar de IP
    return req.user?.id || req.ip || 'anonymous';
  },
});
```

---

## Monitoreo y alertas

Es importante monitorear cuando los rate limits se activan:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  
  handler: (req, res, next, options) => {
    // Log para monitoreo
    console.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
    
    // Opcional: Enviar a sistema de métricas
    // metrics.increment('rate_limit.exceeded', { path: req.path });
    
    // Opcional: Alertar si hay muchos bloqueos
    // alerting.checkThreshold('rate_limit', req.ip);
    
    res.status(options.statusCode).json(options.message);
  },
});
```

---

## Checklist de Rate Limiting

```text
□ Rate limit general aplicado a toda la API
□ Rate limit estricto para endpoints de autenticación (5-10 intentos)
□ Rate limit para registro de usuarios
□ Rate limit para operaciones costosas (exports, reports)
□ Headers estándar habilitados (RateLimit-*)
□ Redis configurado para producción (múltiples instancias)
□ trust proxy configurado correctamente
□ Monitoreo de rate limits activo
□ Mensajes de error claros para usuarios
□ Documentación de límites en API docs
□ Skip para health checks y servicios internos
□ Límites diferentes para usuarios premium (si aplica)
```

---

## Próximo Paso

Con rate limiting configurado, el siguiente paso es asegurar cómo almacenamos y transmitimos los tokens de autenticación. Continúa con **[Autenticación Segura con Cookies](./cookies-auth)**.
