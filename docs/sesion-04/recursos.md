---
sidebar_position: 13
title: "Recursos Adicionales"
---

# Recursos Adicionales

## Introducción

La seguridad web es un campo que evoluciona constantemente. Nuevas vulnerabilidades se descubren cada día, y las técnicas de ataque se vuelven más sofisticadas. Para mantenerte al día y profundizar en los conceptos vistos en esta sesión, hemos recopilado una selección de recursos que te servirán tanto para aprender como para implementar seguridad en tus proyectos.

---

## Documentación Oficial y Estándares

### OWASP: El Estándar de la Industria

OWASP (Open Web Application Security Project) es la referencia mundial en seguridad de aplicaciones web. Sus recursos son gratuitos, mantenidos por la comunidad, y adoptados por empresas de todos los tamaños.

**OWASP Top 10 (2021)**
La lista de las 10 vulnerabilidades más críticas en aplicaciones web. Es el punto de partida para cualquier desarrollador que quiera entender seguridad.
- 🔗 [owasp.org/www-project-top-ten](https://owasp.org/www-project-top-ten/)
- **Uso recomendado**: Léelo completo, cada categoría tiene ejemplos y mitigaciones

**OWASP Cheat Sheet Series**
Más de 100 guías prácticas organizadas por tema: autenticación, manejo de sesiones, validación de entrada, CORS, y más. Son guías concisas y directamente aplicables.
- 🔗 [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/)
- **Favoritas para esta sesión**:
  - Authentication Cheat Sheet
  - Input Validation Cheat Sheet  
  - Cross Site Scripting Prevention Cheat Sheet
  - REST Security Cheat Sheet

**OWASP Application Security Verification Standard (ASVS)**
Un framework de requisitos de seguridad organizados en niveles. Perfecto para auditar aplicaciones y definir qué nivel de seguridad necesitas.
- 🔗 [owasp.org/www-project-application-security-verification-standard](https://owasp.org/www-project-application-security-verification-standard/)
- **Uso recomendado**: Úsalo como checklist al desarrollar aplicaciones empresariales

### Node.js y Express

**Node.js Security Best Practices**
Guía oficial del equipo de Node.js que cubre desde la gestión de dependencias hasta la configuración de headers HTTP.
- 🔗 [nodejs.org/en/docs/guides/security](https://nodejs.org/en/docs/guides/security/)

**Express Security Best Practices**
Recomendaciones oficiales de Express para producción, incluyendo configuración de Helmet, rate limiting, y TLS.
- 🔗 [expressjs.com/en/advanced/best-practice-security.html](https://expressjs.com/en/advanced/best-practice-security.html)

**Helmet.js Documentation**
Documentación completa de todos los headers que configura Helmet y cómo personalizarlos.
- 🔗 [helmetjs.github.io](https://helmetjs.github.io/)

---

## Herramientas de Análisis

### Análisis de Dependencias

El análisis de dependencias es crucial para prevenir ataques de supply chain. Estas herramientas escanean tu `package.json` en busca de paquetes con vulnerabilidades conocidas.

**npm audit (Integrado)**
Viene incluido con npm. Es el punto de partida para cualquier proyecto Node.js.

```bash
# Análisis básico
npm audit

# Formato JSON para integración con CI/CD
npm audit --json

# Arreglar automáticamente lo posible
npm audit fix

# Ver solo vulnerabilidades críticas y altas
npm audit --audit-level=high
```

**Snyk**
Análisis más profundo que npm audit, con mejor base de datos de vulnerabilidades y consejos de remediación más detallados.

```bash
# Instalar globalmente
npm install -g snyk

# Autenticarse (gratis para proyectos open source)
snyk auth

# Escanear proyecto
snyk test

# Monitorear continuamente
snyk monitor
```

**OWASP Dependency-Check**
Scanner que funciona con múltiples lenguajes (Java, .NET, Node, Python, Ruby). Útil si trabajas en proyectos políglotas.
- 🔗 [owasp.org/www-project-dependency-check](https://owasp.org/www-project-dependency-check/)

### Scanners de Vulnerabilidades Web

Estas herramientas analizan tu aplicación en busca de vulnerabilidades activas (XSS, SQLi, etc.).

**OWASP ZAP (Zed Attack Proxy)**
El escáner de vulnerabilidades gratuito más completo. Se puede usar tanto de forma manual (proxy) como automatizada (CI/CD).
- 🔗 [zaproxy.org](https://www.zaproxy.org/)
- **Modos de uso**:
  - GUI para exploración manual
  - Baseline scan para CI (rápido)
  - Full scan para auditorías completas
  - API para integración con pipelines

```bash
# Ejemplo: Baseline scan con Docker
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://tu-aplicacion.com
```

**Burp Suite Community Edition**
Proxy interceptor que te permite ver y modificar todas las requests entre tu navegador y el servidor. Esencial para testing manual de seguridad.
- 🔗 [portswigger.net/burp/communitydownload](https://portswigger.net/burp/communitydownload)
- **Uso típico**: Configurar como proxy del navegador, explorar la aplicación, y analizar las requests

### Linting de Seguridad

Integra análisis de seguridad en tu flujo de desarrollo con ESLint.

```bash
# Instalar plugin de seguridad
npm install --save-dev eslint-plugin-security
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['security'],
  extends: ['plugin:security/recommended'],
  rules: {
    // Previene eval() y similares
    'security/detect-eval-with-expression': 'error',
    // Detecta posibles NoSQL injections
    'security/detect-non-literal-fs-filename': 'warn',
    // Previene RegEx vulnerables a ReDoS
    'security/detect-unsafe-regex': 'error',
  },
};
```

---

## Aprendizaje Práctico

La mejor forma de aprender seguridad es practicando. Estas plataformas ofrecen entornos seguros y legales para experimentar con vulnerabilidades.

### Plataformas Gratuitas

**Web Security Academy (PortSwigger)**
Creada por los desarrolladores de Burp Suite. Más de 200 labs interactivos que cubren desde los fundamentos hasta técnicas avanzadas. Es considerada la mejor plataforma gratuita para aprender seguridad web.
- 🔗 [portswigger.net/web-security](https://portswigger.net/web-security)
- **Nivel**: Principiante → Avanzado
- **Temas**: XSS, SQLi, CSRF, SSRF, Access Control, OAuth, WebSockets, y más
- **Recomendación**: Empieza por los labs de Cross-site scripting (XSS) y Authentication

**OWASP WebGoat**
Aplicación deliberadamente insegura para practicar. Incluye lecciones explicadas paso a paso.
- 🔗 [owasp.org/www-project-webgoat](https://owasp.org/www-project-webgoat/)
- **Nivel**: Principiante
- **Instalación**: `docker run -p 8080:8080 webgoat/webgoat`

**TryHackMe**
Plataforma gamificada con "rooms" temáticas. Tiene paths estructurados para diferentes perfiles (Web Security, Offensive Pentesting, etc.).
- 🔗 [tryhackme.com](https://tryhackme.com/)
- **Nivel**: Principiante → Intermedio
- **Path recomendado**: "Web Fundamentals"

**HackTheBox**
Plataforma más avanzada con máquinas virtuales vulnerables. Requiere conocimientos previos de seguridad.
- 🔗 [hackthebox.com](https://www.hackthebox.com/)
- **Nivel**: Intermedio → Avanzado
- **Consejo**: Empieza con máquinas "Easy" retiradas, que tienen writeups disponibles

### Aplicaciones Vulnerables para Práctica Local

Si prefieres practicar en tu propia máquina:

```bash
# OWASP Juice Shop - Tienda vulnerable moderna
docker run -p 3000:3000 bkimminich/juice-shop

# NodeGoat - Específico para Node.js/Express
docker run -p 4000:4000 owasp/nodegoat

# DVWA - Clásico para principiantes
docker run -p 80:80 vulnerables/web-dvwa
```

### Programas de Bug Bounty

Una vez tengas experiencia, puedes aplicar tus conocimientos (y ganar dinero) en programas de bug bounty:

**HackerOne**
La plataforma más grande. Incluye programas de GitHub, GitLab, Shopify, PayPal, y cientos más.
- 🔗 [hackerone.com](https://www.hackerone.com/)

**Bugcrowd**
Similar a HackerOne. Incluye Tesla, Netflix, Atlassian, Mastercard.
- 🔗 [bugcrowd.com](https://www.bugcrowd.com/)

:::warning Importante
Solo busca vulnerabilidades en aplicaciones que tengan un programa de bug bounty activo o con autorización explícita del propietario. El acceso no autorizado es ilegal.
:::

---

## Referencias Rápidas

Estas herramientas y referencias son útiles para el día a día:

**PayloadsAllTheThings**
Repositorio con payloads de ataque para todo tipo de vulnerabilidades. Útil para testing y para entender vectores de ataque.
- 🔗 [github.com/swisskyrepo/PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)

**CyberChef**
Herramienta web para encodear/decodear datos en cualquier formato (Base64, URL encoding, hex, etc.). Esencial para analizar datos en testing.
- 🔗 [gchq.github.io/CyberChef](https://gchq.github.io/CyberChef/)

**JWT.io**
Debugger de tokens JWT. Pega un token y ve su contenido decodificado. También permite validar firmas.
- 🔗 [jwt.io](https://jwt.io/)

**XSS Cheat Sheet (PortSwigger)**
Lista exhaustiva de payloads XSS, incluyendo bypasses para filtros comunes.
- 🔗 [portswigger.net/web-security/cross-site-scripting/cheat-sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)

**SecurityHeaders.com**
Analiza los headers de seguridad de cualquier sitio web y te da una calificación.
- 🔗 [securityheaders.com](https://securityheaders.com/)

---

## Mantenerse Actualizado

La seguridad cambia constantemente. Estas fuentes te ayudarán a mantenerte al día:

### Newsletters

**tl;dr sec**
Newsletter semanal curada con las noticias más importantes de seguridad. Concisa y de alta calidad.
- 🔗 [tldrsec.com](https://tldrsec.com/)

**Node Weekly**
Newsletter semanal sobre Node.js que incluye sección de seguridad.
- 🔗 [nodeweekly.com](https://nodeweekly.com/)

### Redes Sociales

Cuentas recomendadas en Twitter/X para seguir novedades de seguridad:

- **@OWASP** - Noticias y proyectos de la organización
- **@PortSwigger** - Nuevas investigaciones y técnicas
- **@snaborern** - Investigador de seguridad, excelente contenido
- **@nodejs** - Incluye advisories de seguridad
- **@GHSecurityLab** - GitHub Security Lab

### Canales de YouTube

**LiveOverflow**
Explicaciones detalladas de técnicas de hacking y CTFs. Excelente para entender el "por qué" detrás de las vulnerabilidades.
- 🔗 [youtube.com/@LiveOverflow](https://youtube.com/@LiveOverflow)

**IppSec**
Writeups detallados de máquinas de HackTheBox. Aprende metodología de pentesting viendo a un experto.
- 🔗 [youtube.com/@IppSec](https://youtube.com/@IppSec)

**John Hammond**
CTFs, tutoriales de herramientas, y análisis de malware. Contenido variado y accesible.
- 🔗 [youtube.com/@_JohnHammond](https://youtube.com/@_JohnHammond)

---

## Certificaciones (Opcional)

Si quieres formalizar tus conocimientos en seguridad, estas certificaciones son reconocidas en la industria:

| Certificación | Enfoque | Nivel | Costo |
|---------------|---------|-------|-------|
| **CompTIA Security+** | Fundamentos de seguridad | Principiante | ~$400 |
| **eJPT** | Pentesting práctico | Principiante | ~$250 |
| **OSCP** | Pentesting avanzado | Intermedio | ~$1,600 |
| **BSCP** | Web security (PortSwigger) | Intermedio | ~$100 |

La **BSCP (Burp Suite Certified Practitioner)** es especialmente relevante para desarrolladores web porque se enfoca exclusivamente en seguridad de aplicaciones web.

---

## Práctica Ética

:::danger Advertencia Legal
El acceso no autorizado a sistemas informáticos es un delito en la mayoría de países, incluyendo España (Art. 197 y 264 del Código Penal).

**Nunca** pruebes vulnerabilidades en sistemas sin autorización explícita por escrito.
:::

Para practicar de forma legal y ética, utiliza únicamente:

1. **Entornos propios**: WebGoat, Juice Shop, NodeGoat instalados localmente
2. **Plataformas educativas**: TryHackMe, HackTheBox, Web Security Academy
3. **Programas de Bug Bounty**: Solo en los programas publicados oficialmente
4. **CTFs (Capture The Flag)**: Competiciones de seguridad con autorización

La línea entre "testing de seguridad" y "hacking ilegal" es la **autorización**. Con autorización, eres un pentester. Sin autorización, eres un criminal.
