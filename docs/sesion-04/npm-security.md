---
sidebar_position: 11
title: "Seguridad de Dependencias con npm"
---

# Seguridad de Dependencias con npm

## El riesgo de las dependencias

Las aplicaciones modernas de Node.js dependen de cientos o miles de paquetes. Cada dependencia es código que **no has escrito ni revisado**, pero que se ejecuta con los mismos permisos que tu aplicación.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Árbol de dependencias típico                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   tu-app (tu código)                                                    │
│       │                                                                 │
│       ├── express (1 paquete directo)                                   │
│       │   ├── body-parser                                               │
│       │   │   ├── bytes                                                 │
│       │   │   ├── content-type                                          │
│       │   │   ├── debug                                                 │
│       │   │   │   └── ms                                                │
│       │   │   └── ... (12 más)                                          │
│       │   ├── cookie                                                    │
│       │   ├── cookie-signature                                          │
│       │   └── ... (25 más)                                              │
│       │                                                                 │
│       ├── mongoose (1 paquete directo)                                  │
│       │   ├── bson                                                      │
│       │   ├── kareem                                                    │
│       │   ├── mongodb (driver)                                          │
│       │   │   ├── bson                                                  │
│       │   │   ├── mongodb-connection-string-url                         │
│       │   │   │   └── whatwg-url                                        │
│       │   │   │       └── ... (5 más)                                   │
│       │   │   └── ... (15 más)                                          │
│       │   └── ... (8 más)                                               │
│       │                                                                 │
│       └── ... (resto de dependencias)                                   │
│                                                                         │
│   ────────────────────────────────────────────────────────────────────  │
│   10 dependencias directas → 500+ paquetes transitivos                  │
│   Cada paquete es un punto potencial de vulnerabilidad                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tipos de riesgos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Vulnerabilidad conocida** | CVE publicado en una versión | Prototype pollution en lodash < 4.17.21 |
| **Supply chain attack** | Paquete malicioso publicado | event-stream con crypto-stealer |
| **Typosquatting** | Nombre similar a paquete popular | `lodahs` en lugar de `lodash` |
| **Maintainer hijack** | Cuenta de mantenedor comprometida | ua-parser-js (2021) |
| **Dependency confusion** | Paquete público con nombre interno | Ataque a Microsoft, Apple (2021) |

---

## npm audit

La herramienta oficial de npm para detectar vulnerabilidades conocidas en tus dependencias.

### Ejecutar auditoría

```bash
# Auditoría básica
npm audit

# Solo vulnerabilidades de producción (ignorar devDependencies)
npm audit --omit=dev

# Formato JSON para integración con CI
npm audit --json

# Solo mostrar vulnerabilidades críticas y altas
npm audit --audit-level=high
```

### Interpretar los resultados

```text
# npm audit                                                       
                                                                      
                       === npm audit security report ===             

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          found 3 vulnerabilities                │
│            1 low, 1 moderate, 1 high                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                        high severity                              │
├───────────────────────────────────────────────────────────────────┤
│  Package: minimist                                                │
│  Patched in: >=1.2.6                                              │
│  Dependency of: mkdirp                                            │
│  Path: mkdirp > minimist                                          │
│  More info: https://github.com/advisories/GHSA-xvch-5gv4-984h     │
└───────────────────────────────────────────────────────────────────┘
                                                                      
┌───────────────────────────────────────────────────────────────────┐
│                       moderate severity                           │
├───────────────────────────────────────────────────────────────────┤
│  Package: axios                                                   │
│  Patched in: >=1.6.0                                              │
│  Dependency of: axios                                             │
│  Path: axios                                                      │
│  More info: https://github.com/advisories/GHSA-wf5p-g6vw-rhxx     │
└───────────────────────────────────────────────────────────────────┘
```

### Corregir vulnerabilidades

```bash
# Intentar fix automático (actualiza a versiones parcheadas)
npm audit fix

# Fix forzando actualizaciones mayores (puede romper compatibilidad)
npm audit fix --force

# Ver qué haría sin aplicar cambios
npm audit fix --dry-run
```

---

## Caso de estudio: CVE-2025-29927 (React2Shell)

En marzo de 2025 se descubrió una vulnerabilidad crítica en Next.js que permitía ejecución remota de código.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│               CVE-2025-29927 - "React2Shell"                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SEVERIDAD: 9.1 (Crítica)                                               │
│                                                                         │
│  VERSIONES AFECTADAS:                                                   │
│  • Next.js 13.0.0 - 13.5.6                                              │
│  • Next.js 14.0.0 - 14.2.14                                             │
│  • Next.js 15.0.0 - 15.0.2                                              │
│                                                                         │
│  DESCRIPCIÓN:                                                           │
│  Un bypass en el middleware de autenticación permitía a                 │
│  atacantes ejecutar código arbitrario en el servidor.                   │
│                                                                         │
│  VECTOR DE ATAQUE:                                                      │
│  • Header malformado x-middleware-prefetch: 1                           │
│  • Bypass de autenticación en middleware                                │
│  • Acceso a Server Actions protegidos                                   │
│  • RCE a través de deserialización insegura                             │
│                                                                         │
│  SOLUCIÓN:                                                              │
│  • Actualizar a Next.js 13.5.7, 14.2.15 o 15.0.3                        │
│  • O aplicar mitigación en middleware                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### El problema

```typescript
// middleware.ts vulnerable
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Verificar autenticación
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const isValid = await verifyAuth(token);
  if (!isValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### El ataque

```bash
# El atacante envía un header especial
curl -X POST https://vulnerable-app.com/api/admin/action \
  -H "x-middleware-prefetch: 1" \
  -H "Content-Type: application/json" \
  -d '{"action": "malicious"}'

# El middleware NO se ejecuta
# La petición llega directamente al Server Action
# Bypass total de autenticación
```

### La mitigación

```typescript
// middleware.ts con mitigación
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // ⚠️ MITIGACIÓN: Rechazar requests con el header de prefetch
  const prefetchHeader = request.headers.get('x-middleware-prefetch');
  
  if (prefetchHeader === '1') {
    // Bloquear requests que usan el bypass
    return new NextResponse(null, { status: 400 });
  }
  
  // ... resto del middleware
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

### La solución definitiva

```bash
# Actualizar a versión parcheada
npm update next

# O instalar versión específica
npm install next@14.2.15
```

---

## Herramientas adicionales

### Snyk

Plataforma de seguridad con análisis más profundo que npm audit:

```bash
# Instalar Snyk CLI
npm install -g snyk

# Autenticarse
snyk auth

# Analizar proyecto
snyk test

# Monitorear proyecto (alertas continuas)
snyk monitor
```

Ventajas de Snyk:
- Base de datos de vulnerabilidades más amplia
- Detección de vulnerabilidades en código propio
- Integración con CI/CD
- PRs automáticos de fix
- Análisis de licencias

### npm-check-updates

Para mantener dependencias actualizadas:

```bash
# Instalar
npm install -g npm-check-updates

# Ver actualizaciones disponibles
ncu

# Actualizar package.json a últimas versiones
ncu -u

# Actualizar solo patch y minor (más seguro)
ncu -u --target minor

# Actualizar y reinstalar
ncu -u && npm install
```

### Socket.dev

Detecta ataques de supply chain:

```bash
# Instalar
npm install -g @socketsecurity/cli

# Analizar
socket scan
```

---

## Estrategias de actualización

### Actualizaciones de seguridad

Cuando aparece una vulnerabilidad:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                  Proceso de actualización de seguridad                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. EVALUAR                                                            │
│      │                                                                  │
│      ├── ¿Es una dependencia directa o transitiva?                      │
│      ├── ¿Qué severidad tiene? (critical > high > moderate > low)       │
│      ├── ¿Afecta a producción o solo a dev?                             │
│      └── ¿Tu aplicación usa la funcionalidad vulnerable?                │
│                                                                         │
│   2. DECIDIR                                                            │
│      │                                                                  │
│      ├── Crítica/Alta + prod + usamos funcionalidad → URGENTE           │
│      ├── Crítica/Alta + prod + NO usamos → Prioridad alta               │
│      ├── Moderada/Baja + prod → Prioridad normal                        │
│      └── Solo dev → Prioridad baja                                      │
│                                                                         │
│   3. ACTUALIZAR                                                         │
│      │                                                                  │
│      ├── npm audit fix (automático, seguro)                             │
│      ├── npm update <paquete> (manual, específico)                      │
│      ├── ncu -u --target minor (actualizar minor/patch)                 │
│      └── npm install <paquete>@latest (última versión, revisar!)        │
│                                                                         │
│   4. VERIFICAR                                                          │
│      │                                                                  │
│      ├── Ejecutar tests                                                 │
│      ├── npm audit (confirmar que se resolvió)                          │
│      └── Revisar changelog del paquete                                  │
│                                                                         │
│   5. DESPLEGAR                                                          │
│      │                                                                  │
│      ├── Deploy a staging                                               │
│      ├── Tests de humo                                                  │
│      └── Deploy a producción                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Lockfiles

El `package-lock.json` garantiza builds reproducibles:

```json
{
  "name": "mi-app",
  "lockfileVersion": 3,
  "packages": {
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-5/PsL6iGPdfQ/lKM1UuielYgv3BUoJfz1aUwU9vHZ+J7gyvwdQXFEBIEIax...",
      "dependencies": {
        "accepts": "~1.3.8",
        "body-parser": "1.20.1",
        ...
      }
    }
  }
}
```

**Reglas importantes:**
- ✅ Commitear `package-lock.json` al repositorio
- ✅ Usar `npm ci` en CI/CD (instalación limpia desde lockfile)
- ❌ No editar el lockfile manualmente
- ❌ No ignorar el lockfile en `.gitignore`

```bash
# En desarrollo: instala y puede actualizar lockfile
npm install

# En CI/CD: instala exactamente lo del lockfile
npm ci
```

---

## Integración con CI/CD

### GitHub Actions

```yaml
# .github/workflows/security.yml

name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Ejecutar diariamente a las 6:00 UTC
    - cron: '0 6 * * *'

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high
        # Falla si hay vulnerabilidades high o critical

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  dependency-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          # Bloquea PRs que introducen vulnerabilidades nuevas
```

### Pre-commit hooks

```bash
# Instalar husky
npm install -D husky

# Inicializar
npx husky init
```

```bash
# .husky/pre-commit

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Ejecutar audit antes de cada commit
npm audit --audit-level=high

# Si falla, el commit se cancela
```

---

## Buenas prácticas

### 1. Mínimas dependencias

```typescript
// ❌ Evitar: paquetes para funciones simples
import leftPad from 'left-pad';
const padded = leftPad('hello', 10);

// ✅ Preferir: código nativo
const padded = 'hello'.padStart(10);
```

### 2. Revisar antes de instalar

Antes de `npm install nuevo-paquete`:

```bash
# Verificar en npm
npm info nuevo-paquete

# Ver estadísticas
# - Descargas semanales
# - Última actualización
# - Mantenedores
# - Issues abiertos

# Revisar repositorio de GitHub
# - ¿Tiene tests?
# - ¿Responden a issues?
# - ¿Quién contribuye?
```

### 3. Auditorías regulares

```bash
# Añadir a scripts de package.json
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:updates": "ncu",
    "security:check": "npm run security:audit && snyk test"
  }
}
```

### 4. Monitoreo continuo

- Activar Dependabot en GitHub
- Configurar alertas de Snyk
- Suscribirse a listas de CVEs

---

## Checklist de Seguridad de Dependencias

```text
□ npm audit ejecutado sin vulnerabilidades high/critical
□ package-lock.json commiteado al repositorio
□ npm ci usado en CI/CD (no npm install)
□ Dependabot o Snyk configurado para alertas
□ GitHub Actions con audit en PRs
□ Política de actualización de dependencias definida
□ Dependencias de desarrollo separadas (devDependencies)
□ Mínimo número de dependencias directas
□ Revisión de nuevas dependencias antes de instalar
□ Actualizaciones de seguridad priorizadas
□ Changelog revisado antes de actualizar major versions
□ Tests ejecutados después de cada actualización
```

---

## Próximo Paso

npm audit cubre vulnerabilidades conocidas, pero GitHub ofrece herramientas adicionales para proteger tu código y secretos. Continúa con **[Seguridad en GitHub](./github-security)**.
