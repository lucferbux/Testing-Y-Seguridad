---
sidebar_position: 13
title: "Checklist de Seguridad"
---

## 11. Checklist de seguridad

### Pre-deployment Security Checklist:

#### Autenticación y Autorización
- [ ] Passwords hasheados con bcrypt (cost factor >= 10)
- [ ] JWT con secrets fuertes (>32 caracteres)
- [ ] Refresh tokens implementados
- [ ] Logout invalida tokens correctamente
- [ ] Rate limiting en endpoints de autenticación
- [ ] Control de acceso basado en roles (RBAC)

#### Configuración
- [ ] Helmet.js configurado correctamente
- [ ] CORS configurado (no permitir `*` en producción)
- [ ] HTTPS habilitado en producción
- [ ] Cookies con flags: HttpOnly, Secure, SameSite
- [ ] Variables de entorno validadas
- [ ] Secretos no están en el código

#### Validación y Sanitización
- [ ] Validación de todos los inputs con Joi/Zod
- [ ] Sanitización contra NoSQL injection
- [ ] Sanitización contra XSS (DOMPurify)
- [ ] Validación de file uploads (tipo, tamaño)
- [ ] Límites en tamaño de requests

#### Headers de Seguridad
- [ ] Content-Security-Policy configurado
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security
- [ ] X-XSS-Protection

#### Base de Datos
- [ ] Queries parametrizadas (no string concatenation)
- [ ] Principio de mínimos privilegios en DB user
- [ ] Backups automáticos configurados
- [ ] Conexión encriptada (MongoDB: ssl=true)

#### Dependencias
- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] Dependencias actualizadas
- [ ] Renovate/Dependabot configurado
- [ ] Lockfile (package-lock.json) committed

#### Logging y Monitoreo
- [ ] No loguear información sensible (passwords, tokens)
- [ ] Logs de errores y intentos de acceso
- [ ] Monitoreo de errores (Sentry, etc.)
- [ ] Alertas para patrones sospechosos

#### Testing
- [ ] Tests de seguridad en CI/CD
- [ ] Tests de rate limiting
- [ ] Tests de autorización
- [ ] Tests de validación de inputs
