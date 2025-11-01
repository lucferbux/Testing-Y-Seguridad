---
sidebar_position: 11
title: "npm audit"
---

## 9. npm audit: Auditoría de dependencias

### 9.1 ¿Por qué auditar dependencias?

Las librerías que usamos pueden tener vulnerabilidades conocidas. `npm audit` las detecta automáticamente.

### 9.2 Ejecutar auditoría

```bash
# Verificar vulnerabilidades
npm audit

# Salida ejemplo:
# found 3 vulnerabilities (1 low, 2 high) in 1520 scanned packages
#   run `npm audit fix` to fix them, or `npm audit` for details

# Ver detalles
npm audit --json

# Intentar arreglar automáticamente
npm audit fix

# Forzar actualización a versiones breaking changes
npm audit fix --force
```

### 9.3 Interpretar resultados

```bash
# Ejemplo de vulnerabilidad
┌───────────────┬──────────────────────────────────────────────────────────┐
│ High          │ Prototype Pollution                                      │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Package       │ lodash                                                   │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Patched in    │ >=4.17.19                                                │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Dependency of │ express                                                  │
├───────────────┼──────────────────────────────────────────────────────────┤
│ Path          │ express > body-parser > lodash                           │
├───────────────┼──────────────────────────────────────────────────────────┤
│ More info     │ https://npmjs.com/advisories/1523                        │
└───────────────┴──────────────────────────────────────────────────────────┘
```

**Niveles de severidad**:
- **Critical**: Ejecutar `npm audit fix` inmediatamente
- **High**: Priorizar corrección
- **Moderate**: Corregir en próximo ciclo de desarrollo
- **Low**: Monitorear, corregir cuando sea conveniente

### 9.4 Integrar en CI/CD

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Cada lunes

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        # Falla si hay vulnerabilidades moderate o superiores
      
      - name: Check for outdated packages
        run: npm outdated || true
```

### 9.5 Alternativas y complementos

**Snyk**:
```bash
# Instalar Snyk CLI
npm install -g snyk

# Autenticar
snyk auth

# Auditar proyecto
snyk test

# Monitorear continuamente
snyk monitor
```

**npm-check-updates**:
```bash
# Instalar
npm install -g npm-check-updates

# Ver actualizaciones disponibles
ncu

# Actualizar package.json
ncu -u

# Instalar nuevas versiones
npm install
```

### 9.6 Renovate/Dependabot

Automatiza PRs para actualizar dependencias:

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["before 3am on Monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking-change"]
    }
  ]
}
```
