---
sidebar_position: 1
title: "Introducción"
---

# Sesión 4: Seguridad y Desarrollo Seguro

**Duración:** 1.5 horas  
**Nivel:** Intermedio-Avanzado  
**Objetivo:** Dominar las prácticas esenciales de seguridad para construir aplicaciones web robustas y protegidas contra las vulnerabilidades más comunes

---

## 🛡️ ¿Por Qué Seguridad?

La seguridad **no es opcional**. En 2024, el costo promedio de una brecha de seguridad fue de **$4.45 millones USD**. Más allá del costo financiero, los daños a la reputación pueden ser irreparables.

**Casos reales de impacto**:

- **Equifax (2017)**: 147 millones de usuarios afectados, costo de $1.4 mil millones
- **Facebook (2019)**: 540 millones de registros expuestos en AWS pública
- **Capital One (2019)**: 100 millones de clientes afectados, multa de $80 millones
- **SolarWinds (2020)**: Supply chain attack afectó a miles de organizaciones

**Tu responsabilidad como desarrollador**:

- ✅ Proteger datos sensibles de usuarios
- ✅ Prevenir accesos no autorizados
- ✅ Garantizar disponibilidad del servicio
- ✅ Cumplir regulaciones (GDPR, CCPA, etc.)
- ✅ Mantener la confianza del usuario

---

## 📚 Contenido de la Sesión

Esta sesión está diseñada para cubrir las vulnerabilidades más críticas (OWASP Top 10) y las mejores prácticas para Node.js/Express.

### Módulos de Aprendizaje

1. **[Introducción](./introduction)** - Filosofía de seguridad por capas y principios fundamentales
2. **[OWASP Top 10](./owasp-top10)** - Las 10 vulnerabilidades más críticas en aplicaciones web
3. **[Injection Attacks](./injection)** - SQL/NoSQL injection y cómo prevenirlos
4. **[Cross-Site Scripting (XSS)](./xss)** - Tipos de XSS y estrategias de protección
5. **[Cross-Site Request Forgery (CSRF)](./csrf)** - Protección contra peticiones falsificadas
6. **[Helmet.js: Headers de Seguridad](./helmet)** - Configuración de headers HTTP seguros
7. **[Rate Limiting](./rate-limiting)** - Protección contra fuerza bruta y DoS
8. **[Validación y Sanitización](./validation)** - Joi/Zod para validación robusta
9. **[Gestión de Secretos](./secrets)** - Variables de entorno y secretos seguros
10. **[npm audit](./npm-audit)** - Auditoría de dependencias vulnerables
11. **[Testing de Seguridad](./security-testing)** - Tests automatizados de seguridad
12. **[Checklist de Seguridad](./checklist)** - Checklist pre-deployment
13. **[Ejercicio Práctico](./exercise)** - Ejercicio integrador: asegurar una API completa
14. **[Recursos Adicionales](./recursos)** - Herramientas, libros y recursos avanzados
15. **[Conclusión](./conclusion)** - Resumen y próximos pasos

---

## 🎯 Objetivos de Aprendizaje

Al finalizar esta sesión, habrás adquirido las siguientes competencias:

### Conocimientos Fundamentales

- ✅ **Comprender OWASP Top 10**: Identificar las 10 vulnerabilidades más críticas y su impacto
- ✅ **Filosofía de seguridad por capas**: Defense in Depth y principio de menor privilegio
- ✅ **Conocer vectores de ataque**: Cómo los atacantes explotan vulnerabilidades comunes

### Habilidades Técnicas

- ✅ **Prevenir inyecciones**: Protección contra SQL/NoSQL/Command injection
- ✅ **Proteger contra XSS**: Sanitización, CSP y escapado de contenido
- ✅ **Implementar protección CSRF**: Tokens y SameSite cookies
- ✅ **Configurar Helmet.js**: Headers de seguridad correctos
- ✅ **Implementar rate limiting**: Protección contra fuerza bruta
- ✅ **Validar inputs**: Joi/Zod para validación robusta del lado del servidor
- ✅ **Gestionar secretos**: .env, variables de entorno y servicios de secretos
- ✅ **Auditar dependencias**: npm audit, Snyk, Dependabot
- ✅ **Escribir tests de seguridad**: Tests automatizados para validar controles

### Competencias Profesionales

- ✅ **Aplicar checklist pre-deployment**: Verificar seguridad antes de producir
- ✅ **Realizar threat modeling básico**: Identificar amenazas en tu arquitectura
- ✅ **Implementar logging de seguridad**: Detectar y responder a incidentes
- ✅ **Seguir principios OWASP**: Aplicar estándares de la industria

---

## 🛠️ Prerequisitos

Antes de comenzar esta sesión, deberías tener:

### Conocimientos Requeridos

- **Node.js/Express**: Nivel intermedio (rutas, middleware, async/await)
- **JavaScript/TypeScript**: Comprensión de Promises, async patterns
- **APIs REST**: Cómo funcionan GET, POST, autenticación, headers
- **Bases de datos**: Conceptos básicos de SQL/NoSQL
- **Testing**: Haber completado Sesiones 1-3 (Unit, Integration, E2E)

### Herramientas Necesarias

- **Node.js 18+** instalado
- **npm o yarn** como package manager
- **Postman o curl** para testing de APIs
- **Editor de código** (VS Code recomendado)
- **Git** para control de versiones

### Proyecto Base

Usaremos una **API Express vulnerable** como base para aplicar las mejoras de seguridad. Puedes:

1. Clonar el proyecto de ejemplo: `git clone [repo-url]`
2. O seguir los ejemplos con tu propio proyecto

---

## ⏱️ Estructura de Tiempo

Esta sesión está diseñada para completarse en **1.5 horas**:

| Sección | Tiempo | Tipo |
|---------|--------|------|
| Introducción y OWASP Top 10 | 15 min | Teórica |
| Injection, XSS, CSRF | 20 min | Práctica |
| Helmet.js y Rate Limiting | 15 min | Práctica |
| Validación y Secretos | 15 min | Práctica |
| npm audit y Testing | 10 min | Práctica |
| Ejercicio Integrador | 15 min | Práctica |

:::tip Ritmo de Aprendizaje
Si eres nuevo en seguridad, considera tomar **2 horas** para completar la sesión cómodamente. La seguridad requiere atención al detalle.
:::

---

## 📊 Enfoque de la Sesión

### ¿Qué Cubrimos?

✅ **Seguridad aplicada**: Implementaciones prácticas en Node.js/Express  
✅ **Vulnerabilidades comunes**: OWASP Top 10 relevantes para Full Stack  
✅ **Best practices**: Estándares de la industria  
✅ **Herramientas automatizadas**: Helmet, npm audit, Snyk  
✅ **Testing de seguridad**: Tests automatizados  

### ¿Qué NO Cubrimos?

❌ **Pentesting avanzado**: No somos hackers éticos  
❌ **Criptografía profunda**: Solo conceptos básicos  
❌ **Seguridad de infraestructura**: AWS/Docker security (mínimo)  
❌ **Compliance detallado**: GDPR/HIPAA (solo menciones)  
❌ **Exploit development**: No escribimos malware  

**Nuestro objetivo**: Ser **desarrolladores responsables** que construyen aplicaciones seguras, no expertos en seguridad ofensiva.

---

## 🔒 Principios Fundamentales

Antes de sumergirnos en las vulnerabilidades específicas, es crucial entender estos principios:

### 1. **Defense in Depth (Defensa en Profundidad)**

No confíes en una única capa de seguridad. Implementa múltiples controles:

```
┌───────────────────────┐
│ Firewall / WAF          │  Capa 1: Red
├───────────────────────┤
│ HTTPS / TLS             │  Capa 2: Transporte
├───────────────────────┤
│ Helmet.js / Headers     │  Capa 3: Aplicación
├───────────────────────┤
│ Autenticación / JWT     │  Capa 4: Autorización
├───────────────────────┤
│ Validación / Joi        │  Capa 5: Datos
├───────────────────────┤
│ Rate Limiting           │  Capa 6: Disponibilidad
├───────────────────────┤
│ Logging / Monitoring    │  Capa 7: Detección
└───────────────────────┘
```

### 2. **Principle of Least Privilege (Mínimo Privilegio)**

Otorga **solo los permisos necesarios**, nada más:

- Usuario de DB con permisos limitados (no root)
- Tokens JWT con claims específicos
- CORS configurado restrictivamente

### 3. **Fail Securely (Fallar de Forma Segura)**

Cuando algo sale mal, **falla hacia el lado seguro**:

```typescript
// ❌ Inseguro - Por defecto permite
function checkPermission(user, resource) {
  try {
    return hasAccess(user, resource);
  } catch (error) {
    return true; // ¡PELIGRO! Permite acceso en error
  }
}

// ✅ Seguro - Por defecto deniega
function checkPermission(user, resource) {
  try {
    return hasAccess(user, resource);
  } catch (error) {
    console.error('Permission check failed', error);
    return false; // Seguro: deniega acceso en error
  }
}
```

### 4. **Never Trust User Input (Nunca Confíes en el Usuario)**

**Toda entrada es maliciosa hasta que se demuestre lo contrario**:

- Valida en el servidor (nunca solo en cliente)
- Sanitiza datos antes de usar
- Usa prepared statements para DB
- Escapa output al renderizar HTML

---

## 🚀 Comenzar

Comienza explorando la **[Introducción](./introduction)** para entender:

- La filosofía de seguridad por capas (Defense in Depth)
- Los principios fundamentales del desarrollo seguro
- El modelo de amenazas básico
- Cómo pensar como un atacante para defenderte mejor

:::info Siguiente Paso
Después de comprender los fundamentos, aprenderás sobre **[OWASP Top 10](./owasp-top10)**, la lista definitiva de vulnerabilidades críticas que todo desarrollador debe conocer.
:::

:::warning Importante
La seguridad es un **proceso continuo**, no un producto final. Esta sesión te da las bases, pero debes mantenerte actualizado con nuevas amenazas y técnicas.
:::
