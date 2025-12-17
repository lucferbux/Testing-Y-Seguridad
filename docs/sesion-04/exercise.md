---
sidebar_position: 6
title: "Ejercicio Práctico"
---

# 🎯 Ejercicio: Auditoría de Seguridad (10 min)

:::info Objetivo
Auditar el proyecto **Taller-Testing-Security** usando las técnicas vistas en la sesión.
:::

## Paso 1: Auditar dependencias (3 min)

```bash
# En el directorio api/
cd api && npm audit

# En el directorio ui/
cd ../ui && npm audit
```

**Analiza el resultado:**
- ¿Cuántas vulnerabilidades encontró?
- ¿Cuál es la más grave (Critical/High)?
- ¿Alguna tiene fix automático?

## Paso 2: Verificar headers de seguridad (3 min)

```bash
# Inicia el servidor
cd api && npm run dev

# En otra terminal, verifica headers
curl -I http://localhost:3000/api/auth/login
```

**Checklist de headers:**

| Header | ¿Presente? | Configurado por |
|--------|-----------|-----------------|
| `X-Content-Type-Options: nosniff` | ✅/❌ | Helmet |
| `X-Frame-Options: SAMEORIGIN` | ✅/❌ | Helmet |
| `X-Powered-By` | ⚠️ Debe estar **ausente** | Express disable |

## Paso 3: Revisar middleware (4 min)

Abre `api/src/config/middleware/middleware.ts` y verifica:

```typescript
// ✅ Verificar que helmet() está configurado
app.use(helmet());

// ❓ ¿Qué falta añadir?
// 1. Rate limiting en login
// 2. Cookies HttpOnly para JWT
```

### Mini-reto: Añadir rate limiting

Modifica `api/src/routes/auth.route.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: { error: 'Too many login attempts' }
});

router.post('/login', loginLimiter, AuthController.login);
```

---

## Tabla de Vulnerabilidades Comunes

| Vulnerabilidad | Archivo afectado | Mitigación |
|---------------|------------------|------------|
| NoSQL Injection | `Auth/index.ts` | Mongoose types + Joi |
| XSS | `ui/src/components/Admin/Admin.tsx` | Evitar `dangerouslySetInnerHTML` |
| JWT en header | `jwtAuth.ts` | Migrar a HttpOnly cookies |
| Sin rate limiting | `auth.route.ts` | express-rate-limit |

---

## Solución: Código seguro completo

<details>
<summary><strong>Ver implementación de rate limiting</strong></summary>

```typescript
// api/src/routes/auth.route.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../components/Auth';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  message: { error: 'Too many attempts, try again later' }
});

router.post('/login', loginLimiter, AuthController.login);
router.post('/register', AuthController.register);

export default router;
```

</details>

<details>
<summary><strong>Ver migración a JWT en cookies</strong></summary>

```typescript
// api/src/components/Auth/index.ts
async login(req: Request, res: Response) {
  // ... validación ...
  
  const token = jwt.sign(payload, process.env.JWT_SECRET!);
  
  // ✅ Cookie HttpOnly en lugar de header
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hora
  });
  
  res.json({ message: 'Login successful' });
}
```

</details>

:::tip Para profundizar
Después de la sesión, implementa todas las mejoras en tu fork del proyecto.
:::
