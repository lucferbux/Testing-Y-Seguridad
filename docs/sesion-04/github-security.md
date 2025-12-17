---
sidebar_position: 12
title: "Seguridad en GitHub"
---

# Seguridad en GitHub

## GitHub como plataforma de seguridad

GitHub no es solo un lugar para almacenar código. Incluye un conjunto completo de herramientas de seguridad que pueden detectar vulnerabilidades, secretos expuestos y código inseguro automáticamente.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    GitHub Security Features                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │   Dependabot    │  │ Secret Scanning │  │     CodeQL      │        │
│   │                 │  │                 │  │                 │        │
│   │ Vulnerabilidades│  │ Credenciales    │  │ Análisis        │        │
│   │ en dependencias │  │ en el código    │  │ estático        │        │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│            │                    │                    │                  │
│            └────────────────────┼────────────────────┘                  │
│                                 │                                       │
│                                 ▼                                       │
│                    ┌─────────────────────────┐                          │
│                    │   Security Overview     │                          │
│                    │   Panel centralizado    │                          │
│                    │   de alertas            │                          │
│                    └─────────────────────────┘                          │
│                                                                         │
│   Características adicionales:                                          │
│   • Push Protection (bloquea commits con secretos)                      │
│   • Security Policies (SECURITY.md)                                     │
│   • Private vulnerability reporting                                     │
│   • Security advisories                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dependabot

Dependabot escanea automáticamente tus dependencias y crea Pull Requests cuando encuentra vulnerabilidades o actualizaciones disponibles.

### Activar Dependabot

1. Ve a tu repositorio en GitHub
2. Settings → Code security and analysis
3. Activa:
   - **Dependency graph** (muestra árbol de dependencias)
   - **Dependabot alerts** (notifica vulnerabilidades)
   - **Dependabot security updates** (PRs automáticos de seguridad)
   - **Dependabot version updates** (PRs para mantener actualizado)

### Configuración avanzada

Crea `.github/dependabot.yml`:

```yaml
# .github/dependabot.yml

version: 2

updates:
  # Dependencias de npm (API Node.js)
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Europe/Madrid"
    # Límite de PRs abiertos simultáneamente
    open-pull-requests-limit: 10
    # Agrupar actualizaciones menores
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
    # Etiquetas para los PRs
    labels:
      - "dependencies"
      - "automated"
    # Revisores automáticos
    reviewers:
      - "security-team"
    # Asignar a miembros del equipo
    assignees:
      - "lead-developer"
    # Ignorar paquetes específicos
    ignore:
      - dependency-name: "eslint"
        update-types: ["version-update:semver-major"]

  # Dependencias de npm (UI React)
  - package-ecosystem: "npm"
    directory: "/ui"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      react-ecosystem:
        patterns:
          - "react*"
          - "@types/react*"
      testing:
        patterns:
          - "jest*"
          - "@testing-library/*"
          - "cypress*"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "ci"
      - "dependencies"

  # Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Alertas de Dependabot

Cuando Dependabot detecta una vulnerabilidad:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Dependabot Alert                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️  Critical severity                                                  │
│                                                                         │
│  Package: next                                                          │
│  Vulnerable versions: >= 13.0.0 < 13.5.7                                │
│  Patched version: 13.5.7                                                │
│                                                                         │
│  CVE-2025-29927                                                         │
│  Authorization Bypass Through User-Controlled Key in Next.js            │
│                                                                         │
│  Severity: 9.1 (Critical)                                               │
│  CVSS: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N                     │
│                                                                         │
│  Affected manifests:                                                    │
│  • /ui/package.json                                                     │
│                                                                         │
│  Recommended action:                                                    │
│  Upgrade next to version 13.5.7 or later                                │
│                                                                         │
│  [ Create Dependabot security update ]  [ Dismiss alert ]               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Gestionar alertas

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                  Flujo de gestión de alertas                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Alerta de Dependabot                                                  │
│          │                                                              │
│          ▼                                                              │
│   ┌─────────────────────────────┐                                       │
│   │ ¿Es aplicable a mi código?  │                                       │
│   └──────────┬──────────────────┘                                       │
│              │                                                          │
│        ┌─────┴─────┐                                                    │
│        │           │                                                    │
│       SÍ          NO                                                    │
│        │           │                                                    │
│        │           ▼                                                    │
│        │    ┌─────────────────────────────┐                             │
│        │    │ Dismiss: "Not applicable"   │                             │
│        │    └─────────────────────────────┘                             │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────────────────────────┐                                       │
│   │ ¿Hay PR automático?         │                                       │
│   └──────────┬──────────────────┘                                       │
│              │                                                          │
│        ┌─────┴─────┐                                                    │
│        │           │                                                    │
│       SÍ          NO                                                    │
│        │           │                                                    │
│        │           ▼                                                    │
│        │    ┌─────────────────────────────┐                             │
│        │    │ Actualizar manualmente      │                             │
│        │    │ npm update <paquete>        │                             │
│        │    └─────────────────────────────┘                             │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────────────────────────┐                                       │
│   │ Revisar PR                  │                                       │
│   │ • Ver changelog             │                                       │
│   │ • Ejecutar tests            │                                       │
│   │ • Verificar breaking changes│                                       │
│   └──────────┬──────────────────┘                                       │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────────────────┐                                       │
│   │ Merge PR                    │                                       │
│   └─────────────────────────────┘                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Secret Scanning

GitHub escanea automáticamente tu código buscando secretos como API keys, tokens, contraseñas y certificados.

### Tipos de secretos detectados

GitHub detecta más de 200 tipos de secretos de proveedores como:

| Proveedor | Tipos de secretos |
|-----------|-------------------|
| AWS | Access keys, Secret keys |
| Google Cloud | API keys, Service account keys |
| Azure | Storage keys, Connection strings |
| GitHub | Personal access tokens, OAuth tokens |
| Stripe | API keys, Webhook secrets |
| Twilio | Account SIDs, Auth tokens |
| npm | Access tokens |
| Slack | Webhooks, Bot tokens |
| SendGrid | API keys |
| Database | Connection strings (MongoDB, PostgreSQL, etc.) |

### Activar Secret Scanning

1. Settings → Code security and analysis
2. Activa **Secret scanning**
3. Activa **Push protection** (recomendado)

### Push Protection

Con Push Protection activado, GitHub **bloquea el commit** si detecta un secreto:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       Push Protection                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   $ git push origin main                                                │
│                                                                         │
│   remote: error: GH013: Push cannot be completed.                       │
│   remote:                                                               │
│   remote: Secret scanning detected a secret with type                   │
│   remote: 'AWS Access Key ID' in the following path:                    │
│   remote:                                                               │
│   remote:   src/config/aws.ts:15                                        │
│   remote:                                                               │
│   remote: To push this commit, you need to remove the secret.           │
│   remote:                                                               │
│   remote: For more information, see:                                    │
│   remote: https://gh.io/secret-scanning-push-protection                 │
│                                                                         │
│   To github.com:usuario/repo.git                                        │
│    ! [remote rejected] main -> main (push declined due to              │
│                         secret scanning)                                │
│   error: failed to push some refs to 'github.com:usuario/repo.git'     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Qué hacer si se detecta un secreto

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              Protocolo de respuesta a secreto expuesto                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ⚠️  IMPORTANTE: El secreto ya está comprometido.                      │
│      Borrarlo del código NO es suficiente.                              │
│      Sigue en el historial de Git.                                      │
│                                                                         │
│   PASO 1: REVOCAR INMEDIATAMENTE                                        │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │ • Ir al dashboard del servicio (AWS, Stripe, etc.)            │     │
│   │ • Revocar/eliminar la credencial expuesta                     │     │
│   │ • Generar una nueva credencial                                │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   PASO 2: ACTUALIZAR CONFIGURACIÓN                                      │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │ • Actualizar la nueva credencial en:                          │     │
│   │   - Variables de entorno de producción                        │     │
│   │   - GitHub Secrets                                            │     │
│   │   - Vault / Secret Manager                                    │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   PASO 3: ELIMINAR DEL CÓDIGO                                           │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │ • Reemplazar el secreto hardcodeado por variable de entorno   │     │
│   │ • Usar .env.example con valores placeholder                   │     │
│   │ • Añadir .env a .gitignore                                    │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   PASO 4: REVISAR LOGS                                                  │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │ • Revisar logs de acceso del servicio                         │     │
│   │ • Buscar uso no autorizado durante el período de exposición   │     │
│   │ • Si hay actividad sospechosa, escalar incidente              │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Buenas prácticas para secretos

```typescript
// ❌ NUNCA: Hardcodear secretos
const apiKey = 'sk_live_abc123xyz789';

// ❌ NUNCA: Usar .env commiteado
// .env (en git)
// API_KEY=sk_live_abc123xyz789

// ✅ CORRECTO: Variables de entorno
const apiKey = process.env.STRIPE_API_KEY;

// ✅ CORRECTO: Validar que existen
if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY environment variable is required');
}
```

**.gitignore** debe incluir:

```gitignore
# Archivos de entorno
.env
.env.local
.env.*.local

# Excepto el ejemplo
!.env.example
```

**.env.example** con placeholders:

```bash
# .env.example (SÍ se commitea)

# Base de datos
MONGODB_URI=mongodb://localhost:27017/myapp

# JWT
JWT_SECRET=your-secret-key-here

# Servicios externos
STRIPE_API_KEY=sk_test_...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-here
```

---

## CodeQL

CodeQL es el motor de análisis estático de GitHub. Analiza tu código buscando vulnerabilidades de seguridad como inyección SQL, XSS, path traversal, y más.

### Activar CodeQL

1. Settings → Code security and analysis
2. Activa **Code scanning**
3. Selecciona **Set up → Advanced** para personalizar

O crea el workflow manualmente:

```yaml
# .github/workflows/codeql.yml

name: "CodeQL"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Ejecutar semanalmente
    - cron: '0 4 * * 1'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'typescript']
        # Otros lenguajes soportados:
        # 'csharp', 'cpp', 'go', 'java', 'kotlin', 'python', 'ruby', 'swift'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          # Usar queries de seguridad extendidas
          queries: security-extended

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

### Tipos de vulnerabilidades detectadas

CodeQL puede detectar:

| Categoría | Ejemplos |
|-----------|----------|
| **Injection** | SQL injection, NoSQL injection, Command injection, XSS |
| **Broken Authentication** | Weak crypto, Hardcoded credentials |
| **Sensitive Data Exposure** | Clear-text logging, Insecure transmission |
| **XXE** | XML External Entity attacks |
| **Broken Access Control** | Path traversal, Open redirect |
| **Security Misconfiguration** | Debug mode, Default credentials |
| **Insecure Deserialization** | eval(), unsafe JSON parsing |
| **Using Components with Known Vulnerabilities** | Outdated libraries |

### Ejemplo de alerta CodeQL

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         CodeQL Alert                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️  High severity: Reflected cross-site scripting                      │
│                                                                         │
│  File: src/components/Admin.tsx                                         │
│  Line: 47                                                               │
│                                                                         │
│  Description:                                                           │
│  Cross-site scripting (XSS) vulnerability due to the use of             │
│  dangerouslySetInnerHTML with unsanitized user input.                   │
│                                                                         │
│  Code:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  45 │ return (                                                   │   │
│  │  46 │   <div                                                     │   │
│  │  47 │     dangerouslySetInnerHTML={{ __html: userData.bio }}     │   │
│  │  48 │   />                                                       │   │
│  │  49 │ );                                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Recommendation:                                                        │
│  Sanitize the input using a library like DOMPurify before               │
│  using dangerouslySetInnerHTML.                                         │
│                                                                         │
│  [ Show paths ]  [ Dismiss ]  [ Create issue ]                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## GitHub Secrets

Para almacenar credenciales de forma segura en GitHub Actions:

### Crear secretos

1. Settings → Secrets and variables → Actions
2. New repository secret
3. Nombre: `AWS_ACCESS_KEY_ID`
4. Valor: `AKIA...`

### Usar secretos en workflows

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          # Secretos inyectados como variables de entorno
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1

      - name: Deploy to production
        run: npm run deploy
        env:
          # Más secretos
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Secretos de entorno

Para diferentes entornos (staging, production):

1. Settings → Environments
2. New environment: `production`
3. Add secret específico del entorno
4. Configurar reglas de protección (requiere aprobación, rama específica)

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # ← Usa secretos de este entorno
    
    steps:
      - name: Deploy
        run: npm run deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}  # Del entorno 'production'
```

---

## Security Overview

Para organizaciones, GitHub ofrece un panel centralizado de seguridad.

### Acceder al Security Overview

1. Ir a tu organización
2. Security → Overview

### Métricas disponibles

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      Security Overview                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Repositories: 24                                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Dependabot alerts                                               │   │
│  │  ├── Critical: 3                                                 │   │
│  │  ├── High: 12                                                    │   │
│  │  ├── Medium: 28                                                  │   │
│  │  └── Low: 45                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Secret scanning alerts                                          │   │
│  │  ├── Active: 2                                                   │   │
│  │  └── Resolved: 15                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Code scanning alerts                                            │   │
│  │  ├── Critical: 0                                                 │   │
│  │  ├── High: 5                                                     │   │
│  │  ├── Medium: 18                                                  │   │
│  │  └── Low: 32                                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Coverage:                                                              │
│  ├── Dependabot enabled: 22/24 repos (92%)                              │
│  ├── Secret scanning: 24/24 repos (100%)                                │
│  ├── Code scanning: 18/24 repos (75%)                                   │
│  └── Push protection: 20/24 repos (83%)                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## SECURITY.md

Crea un archivo `SECURITY.md` para indicar cómo reportar vulnerabilidades:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public issue
2. Email security@example.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

We will respond within 48 hours and work with you to:
- Confirm the vulnerability
- Determine affected versions
- Develop and test a fix
- Release a security advisory

## Security Measures

This project implements:
- Dependency scanning with Dependabot
- Secret scanning with push protection
- Static analysis with CodeQL
- Regular security audits

## Bug Bounty

We currently do not have a bug bounty program.
```

---

## Checklist de Seguridad en GitHub

```text
□ Dependabot activado para alertas y actualizaciones
□ Secret Scanning activado
□ Push Protection activado
□ CodeQL configurado con queries security-extended
□ Secretos almacenados en GitHub Secrets (no en código)
□ .env en .gitignore
□ .env.example con placeholders
□ SECURITY.md creado
□ Branch protection rules configuradas
□ Require PR reviews antes de merge
□ Require status checks (tests, audit, CodeQL)
□ Security Overview revisado regularmente
□ Alertas de seguridad gestionadas semanalmente
```

---

## Próximo Paso

Has completado la sección de seguridad. Para explorar recursos adicionales, referencias y herramientas, continúa con **[Recursos Adicionales](./recursos)**.
