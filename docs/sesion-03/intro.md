---
sidebar_position: 1
title: "Introducción"
---

# Sesión 3: Testing E2E con Cypress

**Duración:** 1.5 horas  
**Nivel:** Intermedio-Avanzado  
**Objetivo:** Dominar el testing End-to-End (E2E) con Cypress para validar flujos completos de usuario en aplicaciones web modernas

---

## 📋 Contenido de la Sesión

Esta sesión está diseñada para llevarte desde los conceptos básicos del testing E2E hasta la implementación de tests robustos y mantenibles en producción.

### Módulos de Aprendizaje

1. **[Introducción al Testing E2E](./introduction)** - Comprende qué es E2E testing, su rol en la pirámide de testing y cuándo aplicarlo
2. **[¿Qué es Cypress?](./cypress-intro)** - Conoce la herramienta, sus ventajas sobre Selenium y Playwright, y su arquitectura única
3. **[Instalación y Configuración](./setup)** - Setup completo de Cypress en tu proyecto con configuraciones esenciales
4. **[Primer Test con Cypress](./first-test)** - Escribe tu primer test E2E, entiende la estructura y el test runner
5. **[Selectores y Comandos](./selectors)** - Domina los selectores estables y los comandos esenciales de Cypress
6. **[Testing de Formularios](./forms)** - Aprende a testear inputs, validaciones, submits y manejo de errores
7. **[Testing de Navegación](./navigation)** - Valida rutas, redirects, guards y navegación compleja
8. **[Intercepción de Requests](./intercept)** - Mockea y espía requests HTTP con `cy.intercept()` para tests deterministas
9. **[Custom Commands](./custom-commands)** - Crea comandos reutilizables para operaciones comunes (login, setup, etc.)
10. **[Best Practices](./best-practices)** - Patrones profesionales para tests mantenibles, rápidos y confiables
11. **[Ejercicio Práctico](./exercise)** - Ejercicio integrador: testea un e-commerce completo
12. **[Recursos Adicionales](./recursos)** - Documentación, plugins y herramientas para profundizar

---

## 🎯 Objetivos de Aprendizaje

Al finalizar esta sesión, habrás adquirido las siguientes competencias:

### Conocimientos Fundamentales
- ✅ **Comprender la diferencia** entre testing E2E, integración y unitario, y cuándo usar cada uno
- ✅ **Entender la arquitectura** única de Cypress y cómo se diferencia de Selenium/Playwright
- ✅ **Conocer el ciclo de vida** de un test E2E desde la preparación hasta la verificación

### Habilidades Técnicas
- ✅ **Instalar y configurar** Cypress en proyectos React, Vue, Angular o vanilla JavaScript
- ✅ **Escribir tests E2E robustos** con selectores estables y assertions claras
- ✅ **Testear formularios complejos** con validaciones, errores y submits asíncronos
- ✅ **Validar navegación** incluyendo rutas dinámicas, redirects y guards de autenticación
- ✅ **Interceptar y mockear** requests HTTP para tests deterministas sin backend real
- ✅ **Crear custom commands** reutilizables que simplifiquen tus tests

### Competencias Profesionales
- ✅ **Aplicar best practices** de testing E2E usadas en empresas de software
- ✅ **Debuggear tests fallidos** usando time-travel, screenshots y videos
- ✅ **Organizar suites de tests** escalables y mantenibles
- ✅ **Optimizar performance** de tests para CI/CD pipelines

---

## 🔍 ¿Por qué Testing E2E?

El testing E2E es la **última línea de defensa** antes de que el código llegue a producción. Mientras que los tests unitarios verifican funciones aisladas y los tests de integración validan módulos combinados, los **tests E2E garantizan que todo el sistema funciona cohesivamente** desde la perspectiva del usuario.

### Casos de Uso Reales

Imagina que has construido un e-commerce con:
- ✅ Tests unitarios: cada función está verificada
- ✅ Tests de integración: componentes funcionan juntos
- ❌ **Pero sin E2E**: No sabes si un usuario puede realmente completar una compra

**El testing E2E responde**:
- ¿Puede un usuario registrarse, buscar productos, agregar al carrito y pagar?
- ¿Funcionan los flujos críticos en diferentes navegadores?
- ¿Se manejan correctamente los errores de red?

---

## 📚 Prerequisitos

Antes de comenzar esta sesión, deberías tener:

### Conocimientos Requeridos
- **JavaScript/TypeScript**: Nivel intermedio (async/await, Promises, DOM)
- **Testing básico**: Haber completado Sesión 1 (Unit Testing) y Sesión 2 (Integration Testing)
- **Desarrollo web**: Conocer HTML, CSS y cómo funcionan las SPAs
- **APIs REST**: Entender requests HTTP (GET, POST, etc.)

### Herramientas Necesarias
- **Node.js 18+** instalado en tu sistema
- **npm o yarn** como package manager
- **Navegador moderno** (Chrome, Edge, Firefox)
- **Editor de código** (VS Code recomendado)
- **Git** para control de versiones

### Proyecto de Ejemplo
Para seguir los ejercicios, puedes:
1. Usar tu propio proyecto React/Vue/Angular
2. Clonar el proyecto de ejemplo: `git clone [repo-url]`
3. Crear una app nueva con `create-react-app` o similar

---

## ⏱️ Estructura de Tiempo

Esta sesión está diseñada para completarse en **1.5 horas** con la siguiente distribución:

| Sección | Tiempo | Tipo |
|---------|--------|------|
| Introducción y Conceptos | 10 min | Teórica |
| Setup de Cypress | 10 min | Práctica |
| Primeros Tests y Selectores | 20 min | Práctica |
| Formularios y Navegación | 20 min | Práctica |
| Intercept y Custom Commands | 15 min | Práctica |
| Best Practices | 10 min | Teórica |
| Ejercicio Integrador | 15 min | Práctica |

:::tip Ritmo de Aprendizaje
Si eres nuevo en E2E testing, considera tomar **2 horas** para completar la sesión confortablemente. Puedes pausar entre secciones para experimentar con los ejemplos.
:::

---

## 🚀 Comenzar

Comienza explorando la **[Introducción al Testing E2E](./introduction)** para entender:
- Qué es el testing E2E y cómo se diferencia de otros tipos de testing
- Su posición en la pirámide de testing (70/20/10)
- Cuándo usar E2E vs Integration vs Unit tests
- Ventajas, desventajas y casos de uso ideales

:::info Siguiente Paso
Después de comprender los conceptos fundamentales, aprenderás sobre **[Cypress](./cypress-intro)** y por qué es la herramienta líder para E2E testing en aplicaciones modernas.
:::

