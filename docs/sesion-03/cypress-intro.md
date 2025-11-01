---
sidebar_position: 3
title: "¿Qué es Cypress?"
---

# ¿Qué es Cypress?

## Cypress vs Otras Herramientas

| Característica | Cypress | Selenium | Playwright |
|---------------|---------|----------|------------|
| **Velocidad** | Rápido | Lento | Rápido |
| **Debug** | Excelente | Difícil | Bueno |
| **Setup** | Simple | Complejo | Moderado |
| **Multi-browser** | Limitado | Sí | Sí |
| **Time-travel** | Sí | No | No |
| **Auto-wait** | Sí | No | Sí |

## Ventajas de Cypress

**1. Developer Experience**
- Setup simple (npm install)
- Time-travel debugging
- Screenshots y videos automáticos
- Test runner visual

**2. Arquitectura Única**
- Corre en el mismo loop que la app
- Acceso directo al DOM
- Control completo del navegador
- Sin Selenium WebDriver

**3. Features Potentes**
- Auto-retry de comandos
- Auto-wait de elementos
- Network stubbing/spying
- Real-time reloading

## Limitaciones

- ❌ Solo un navegador a la vez
- ❌ No soporta multi-tabs nativamente
- ❌ No puede hacer iframe testing complejo
- ❌ Limitaciones con Safari
