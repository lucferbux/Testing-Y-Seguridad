---
sidebar_position: 1
title: "Introducción"
---

# Sesión 4: Seguridad en Desarrollo Web

**Duración:** 1.5 horas  
**Nivel:** Intermedio  
**Objetivo:** Comprender las vulnerabilidades web más comunes y dominar las técnicas de desarrollo seguro en aplicaciones Node.js/Express/React

---

## 📋 Contenido de la Sesión

En las sesiones anteriores hemos construido una base sólida de testing: tests unitarios para verificar componentes aislados, tests de integración para validar la comunicación entre módulos, y tests E2E para garantizar que los flujos de usuario funcionan correctamente. Ahora damos un paso crucial: **asegurar que nuestra aplicación no solo funciona, sino que es resistente a ataques**.

La seguridad en desarrollo web no es un añadido opcional ni una tarea que se aborda "cuando hay tiempo". Es una disciplina que debe integrarse desde el diseño inicial y mantenerse a lo largo de todo el ciclo de vida del software. Los ataques a aplicaciones web han evolucionado significativamente en las últimas décadas, pasando de simples defacements a sofisticados ataques a la cadena de suministro que afectan a miles de organizaciones simultáneamente.

### ¿Por qué los desarrolladores necesitan entender seguridad?

Tradicionalmente, la seguridad se consideraba responsabilidad exclusiva de equipos especializados que realizaban auditorías puntuales antes de los lanzamientos. Sin embargo, este modelo reactivo ha demostrado ser insuficiente:

1. **Las vulnerabilidades son más caras de corregir cuanto más tarde se detectan**: Un bug de seguridad encontrado en desarrollo cuesta 10x menos que uno encontrado en producción
2. **Los atacantes son más rápidos que nunca**: El tiempo medio entre la publicación de un CVE y el primer exploit activo se ha reducido a días u horas
3. **El código es el perímetro**: En la era del cloud, la seguridad de red ya no es suficiente; las vulnerabilidades de aplicación son el vector de ataque principal

Como desarrollador full-stack, tienes la responsabilidad y la oportunidad de construir software seguro desde el código fuente.

### Módulos de Aprendizaje

Esta sesión está estructurada en módulos progresivos que cubren desde conceptos fundamentales hasta implementación práctica:

**Vulnerabilidades Web (OWASP Top 10)**
- **[Cross-Site Scripting (XSS)](./xss)** - Inyección de scripts maliciosos en páginas web
- **[Cross-Site Request Forgery (CSRF)](./csrf)** - Ataques de suplantación de peticiones
- **[NoSQL Injection](./injection)** - Inyección de operadores en MongoDB
- **[Broken Access Control](./access-control)** - Escalado de privilegios e IDOR

**Seguridad en el Backend**
- **[Headers HTTP con Helmet](./helmet)** - Configuración de headers de seguridad
- **[Rate Limiting](./rate-limiting)** - Protección contra ataques de fuerza bruta
- **[Autenticación con Cookies](./cookies-auth)** - JWT con cookies HttpOnly

**Validación de Datos**
- **[Validación con Mongoose](./validation-mongoose)** - Protección a nivel de modelo
- **[Validación con Joi](./validation-joi)** - Validación de schemas en middleware

**Gestión de Dependencias**
- **[Seguridad npm](./npm-security)** - Auditoría y gestión de vulnerabilidades
- **[Seguridad GitHub](./github-security)** - Dependabot, Secret Scanning y CodeQL

**Referencias**
- **[Recursos Adicionales](./recursos)** - Documentación, herramientas y referencias

---

## 🎯 Objetivos de Aprendizaje

Al finalizar esta sesión, habrás adquirido las siguientes competencias:

### Conocimientos Fundamentales
- ✅ **Comprender el OWASP Top 10** y por qué estas vulnerabilidades son las más críticas
- ✅ **Identificar vectores de ataque** en código real (XSS, CSRF, Injection, BAC)
- ✅ **Entender el modelo de amenazas** de aplicaciones web modernas con arquitectura cliente-servidor

### Habilidades Técnicas
- ✅ **Configurar Helmet.js** para añadir headers de seguridad HTTP en Express
- ✅ **Implementar rate limiting** con express-rate-limit para prevenir ataques de fuerza bruta
- ✅ **Migrar autenticación JWT** de headers a cookies HttpOnly para mayor seguridad
- ✅ **Validar inputs** con Joi middleware y aprovechar la protección de tipos de Mongoose
- ✅ **Auditar dependencias** con npm audit y entender cómo interpretar resultados
- ✅ **Configurar Dependabot** y otras herramientas de seguridad de GitHub

### Competencias Profesionales
- ✅ **Aplicar el principio de Defense in Depth** con múltiples capas de seguridad
- ✅ **Evaluar el impacto de vulnerabilidades** como CVE-2025-29927 en tu stack
- ✅ **Priorizar remediaciones** según severidad y contexto de negocio
- ✅ **Establecer workflows de seguridad** en CI/CD para detección continua

---

## 🔍 El Panorama de Seguridad Web en 2025

### El Costo Real de las Brechas de Seguridad

La seguridad no es solo una cuestión técnica; tiene implicaciones financieras, legales y reputacionales devastadoras:

| Métrica | Valor (2024) |
|---------|--------------|
| **Costo promedio de una brecha** | $4.88 millones USD |
| **Tiempo promedio de detección** | 194 días |
| **Tiempo promedio de contención** | 64 días |
| **Costo por registro comprometido** | $169 USD |

*Fuente: IBM Cost of a Data Breach Report 2024*

### Casos de Estudio Relevantes

| Incidente | Año | Vector | Impacto |
|-----------|-----|--------|---------|
| **Equifax** | 2017 | Dependencia vulnerable (Apache Struts) | 147 millones de usuarios, $1.4 mil millones |
| **SolarWinds** | 2020 | Supply chain attack | 18,000+ organizaciones comprometidas |
| **Log4Shell** | 2021 | RCE en librería de logging | CVSS 10.0, millones de sistemas afectados |
| **ua-parser-js** | 2021 | Paquete npm comprometido | Cryptocurrency miner en dependencia popular |
| **CVE-2025-29927** | 2025 | Next.js middleware bypass | CVSS 9.1, bypass de autenticación |

Estos incidentes demuestran que las vulnerabilidades pueden provenir tanto de nuestro código como de las dependencias en las que confiamos.

---

## 📚 Prerequisitos

Antes de comenzar esta sesión, deberías tener:

### Conocimientos Requeridos
- **JavaScript/TypeScript**: Nivel intermedio (async/await, Promises, clases)
- **Node.js/Express**: Comprensión de middleware, routing, y manejo de requests
- **React**: Componentes, estado, efectos (para entender vulnerabilidades en frontend)
- **HTTP**: Métodos, headers, cookies, CORS
- **Testing**: Haber completado sesiones anteriores (unitario, integración, E2E)

### Herramientas Necesarias
- **Node.js 18+** instalado
- **npm o yarn** como package manager
- **Git** para control de versiones
- **VS Code** con extensión ESLint
- **Postman o cURL** para probar APIs

### Proyecto de Ejemplo

Usaremos el proyecto **Taller-Testing-Security** como referencia para todos los ejemplos:

```bash
git clone https://github.com/lucferbux/Taller-Testing-Security
cd Taller-Testing-Security
```

---

## 🏗️ Arquitectura del Proyecto Base

El proyecto Taller-Testing-Security es una aplicación full-stack que representa un caso de uso común: un portfolio con autenticación para gestionar perfil y proyectos.

### Stack Tecnológico

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    React + TypeScript + Vite                     │
│        ┌─────────────┬─────────────┬─────────────┐              │
│        │  Componentes│   Routing   │   Estado    │              │
│        │    React    │ React Router│   Context   │              │
│        └─────────────┴─────────────┴─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                          API HTTP                                │
│                    Fetch / Axios → JSON                          │
├─────────────────────────────────────────────────────────────────┤
│                         BACKEND                                  │
│                   Express + TypeScript                           │
│        ┌─────────────┬─────────────┬─────────────┐              │
│        │  Middleware │   Routes    │ Controllers │              │
│        │Helmet/CORS  │  /api/v1/*  │  Components │              │
│        └─────────────┴─────────────┴─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                        DATABASE                                  │
│                   MongoDB + Mongoose                             │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de Directorios

```text
Taller-Testing-Security/
├── api/                              # Backend Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── connection/           # Conexión MongoDB
│   │   │   ├── error/                # Manejo de errores
│   │   │   └── middleware/
│   │   │       ├── middleware.ts     # Helmet, CORS, cookie-parser
│   │   │       └── jwtAuth.ts        # Middleware de autenticación JWT
│   │   ├── components/
│   │   │   ├── Auth/                 # Login, registro, logout
│   │   │   │   ├── index.ts          # Controller
│   │   │   │   ├── service.ts        # Lógica de negocio
│   │   │   │   └── validation.ts     # Schemas Joi
│   │   │   ├── User/                 # Modelo de usuario
│   │   │   │   ├── model.ts          # Schema Mongoose con bcrypt
│   │   │   │   └── interface.ts
│   │   │   ├── AboutMe/              # Perfil del usuario
│   │   │   └── Projects/             # CRUD de proyectos
│   │   └── routes/
│   │       ├── auth.route.ts
│   │       ├── user.route.ts
│   │       ├── aboutme.route.ts
│   │       └── projects.route.ts
│   └── package.json
│
└── ui/                               # Frontend React
    ├── src/
    │   ├── api/                      # Cliente HTTP
    │   │   └── api.ts
    │   ├── components/
    │   │   ├── routes/
    │   │   │   ├── Admin.tsx         # ⚠️ Ejemplo vulnerable a XSS
    │   │   │   ├── Login.tsx
    │   │   │   └── Dashboard.tsx
    │   │   └── common/
    │   └── utils/
    │       └── auth.ts               # Gestión de tokens JWT
    ├── cypress/                      # Tests E2E
    └── package.json
```

### Archivos Clave de Seguridad

Durante la sesión, analizaremos y modificaremos estos archivos:

| Archivo | Propósito | Qué aprenderemos |
|---------|-----------|------------------|
| `api/src/config/middleware/middleware.ts` | Configuración global | Helmet, CORS, cookies |
| `api/src/config/middleware/jwtAuth.ts` | Autenticación | JWT, Bearer tokens |
| `api/src/components/Auth/index.ts` | Login/Register | bcrypt, validación |
| `api/src/components/User/model.ts` | Modelo Usuario | Mongoose schemas |
| `ui/src/components/routes/Admin.tsx` | Panel admin | Vulnerabilidad XSS |

---

## 🛡️ Principios Fundamentales de Seguridad

Antes de sumergirnos en técnicas específicas, es crucial entender los principios que guían el desarrollo seguro.

### 1. Defense in Depth (Defensa en Profundidad)

No confíes nunca en una única capa de seguridad. Cada capa debe asumir que las capas anteriores pueden fallar:

```text
┌─────────────────────────────────────────────────────────────┐
│ Capa 1: RED                                                  │
│ • Firewall                                                   │
│ • WAF (Web Application Firewall)                             │
│ • DDoS protection                                            │
├─────────────────────────────────────────────────────────────┤
│ Capa 2: TRANSPORTE                                           │
│ • HTTPS/TLS obligatorio                                      │
│ • Certificados válidos                                       │
│ • HSTS (HTTP Strict Transport Security)                      │
├─────────────────────────────────────────────────────────────┤
│ Capa 3: APLICACIÓN                                           │
│ • Helmet.js (headers de seguridad)                           │
│ • Content Security Policy                                    │
│ • CORS configurado restrictivamente                          │
├─────────────────────────────────────────────────────────────┤
│ Capa 4: AUTENTICACIÓN                                        │
│ • JWT con cookies HttpOnly                                   │
│ • bcrypt para passwords                                      │
│ • Rate limiting en login                                     │
├─────────────────────────────────────────────────────────────┤
│ Capa 5: AUTORIZACIÓN                                         │
│ • RBAC (Role-Based Access Control)                           │
│ • Verificación de ownership                                  │
│ • Principio de mínimo privilegio                             │
├─────────────────────────────────────────────────────────────┤
│ Capa 6: VALIDACIÓN                                           │
│ • Joi schemas para inputs                                    │
│ • Mongoose types para queries                                │
│ • Sanitización de outputs                                    │
├─────────────────────────────────────────────────────────────┤
│ Capa 7: DATOS                                                │
│ • Encriptación en reposo                                     │
│ • Backups seguros                                            │
│ • Principio de mínima exposición                             │
└─────────────────────────────────────────────────────────────┘
```

**Ejemplo práctico**: Si un atacante logra bypasear la autenticación (como en CVE-2025-29927), las capas de autorización y validación aún pueden prevenir el acceso a datos sensibles.

### 2. Principle of Least Privilege (Mínimo Privilegio)

Cada componente del sistema debe tener solo los permisos estrictamente necesarios para realizar su función:

```typescript
// ❌ Mal: Usuario de base de datos con todos los permisos
const db = mongoose.connect('mongodb://root:password@localhost/myapp');

// ✅ Bien: Usuario específico con permisos limitados
const db = mongoose.connect('mongodb://appuser:limited@localhost/myapp');
// El usuario 'appuser' solo tiene permisos de lectura/escritura en la colección 'users'
```

```typescript
// ❌ Mal: Token JWT con demasiada información
const token = jwt.sign({
  id: user.id,
  email: user.email,
  role: user.role,
  passwordHash: user.passwordHash, // ¡Nunca!
  allPermissions: user.permissions, // ¿Necesario?
  internalId: user._internalId // Exposición innecesaria
}, secret);

// ✅ Bien: Token con claims mínimos necesarios
const token = jwt.sign({
  sub: user.id,
  role: user.role
}, secret, { expiresIn: '1h' });
```

### 3. Fail Securely (Fallar de Forma Segura)

Cuando algo sale mal, el sistema debe **denegar acceso por defecto**, no permitirlo:

```typescript
// ❌ INSEGURO: Permite por defecto
function checkAccess(user: User, resource: Resource): boolean {
  if (user.role === 'admin') {
    return true;
  }
  if (user.id === resource.ownerId) {
    return true;
  }
  // Sin return final: undefined se convierte en falsy, 
  // pero otros paths podrían permitir acceso
}

// ✅ SEGURO: Deniega explícitamente por defecto
function checkAccess(user: User, resource: Resource): boolean {
  // Caso explícito: admins tienen acceso total
  if (user.role === 'admin') {
    return true;
  }
  
  // Caso explícito: propietarios tienen acceso a sus recursos
  if (user.id === resource.ownerId) {
    return true;
  }
  
  // SIEMPRE denegar por defecto
  return false;
}
```

### 4. Never Trust User Input (Nunca Confíes en el Input del Usuario)

Todo dato que venga del cliente es potencialmente malicioso, incluso si parece venir de tu propio frontend:

```typescript
// ❌ INSEGURO: Confiar en el input del cliente
app.post('/api/users', (req, res) => {
  const user = new User(req.body); // Acepta cualquier campo
  user.save();
});

// Atacante puede enviar:
// { "role": "admin", "verified": true, "subscriptionLevel": "premium" }

// ✅ SEGURO: Whitelist de campos permitidos
app.post('/api/users', (req, res) => {
  const { email, password, name } = req.body;
  const user = new User({
    email,
    password,
    name,
    role: 'user', // Siempre 'user', nunca del request
    verified: false,
    createdAt: new Date()
  });
  user.save();
});
```

---

## 📊 OWASP Top 10: Resumen Rápido

El Open Web Application Security Project (OWASP) mantiene una lista de las 10 vulnerabilidades web más críticas, actualizada cada 3-4 años. La versión 2021 (vigente) incluye:

| Posición | Vulnerabilidad | Relevancia para este proyecto |
|----------|---------------|------------------------------|
| **A01** | Broken Access Control | ⭐⭐⭐ Crítico - Lo veremos en detalle |
| **A02** | Cryptographic Failures | ⭐⭐ bcrypt, JWT, HTTPS |
| **A03** | Injection | ⭐⭐⭐ NoSQL Injection, XSS |
| **A04** | Insecure Design | ⭐⭐ Arquitectura de auth |
| **A05** | Security Misconfiguration | ⭐⭐⭐ Helmet, CORS, headers |
| **A06** | Vulnerable Components | ⭐⭐⭐ npm audit, CVE-2025-29927 |
| **A07** | Auth Failures | ⭐⭐⭐ Rate limiting, JWT |
| **A08** | Software Integrity Failures | ⭐⭐ Dependencias, CI/CD |
| **A09** | Logging & Monitoring | ⭐ Fuera del alcance |
| **A10** | SSRF | ⭐ Menos relevante para este stack |

En esta sesión nos enfocaremos en las vulnerabilidades más relevantes para nuestro stack (React, Express, MongoDB).

---

## 🚀 Próximo Paso

Ahora que entiendes la importancia de la seguridad y los principios fundamentales, vamos a sumergirnos en las vulnerabilidades específicas.

Continúa con **[Cross-Site Scripting (XSS)](./xss)** para aprender cómo los atacantes inyectan código malicioso en páginas web y cómo prevenirlo.
