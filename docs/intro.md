---
sidebar_position: 0
slug: /
---

# Testing y Seguridad en Aplicaciones Full Stack

Bienvenido al módulo de **Testing y Seguridad** del Máster de Full Stack Development. Este módulo está diseñado para que aprendas a construir aplicaciones robustas, confiables y seguras mediante testing exhaustivo y prácticas de desarrollo seguro.

## 🎯 Objetivos del Módulo

Al completar este módulo, serás capaz de:

- ✅ Escribir tests unitarios efectivos con **Jest**
- ✅ Implementar tests de integración para componentes y APIs
- ✅ Crear tests End-to-End con **Cypress**
- ✅ Identificar y prevenir vulnerabilidades comunes (**OWASP Top 10**)
- ✅ Implementar medidas de seguridad en aplicaciones Node.js/Express
- ✅ Aplicar prácticas de desarrollo seguro en todo el ciclo de vida

## 📚 Estructura del Módulo

Este módulo se divide en **4 sesiones** de 1.5 horas cada una:

### [Sesión 1: Testing Unitario con Jest](./sesion-01/intro)
- Fundamentos del testing
- Configuración de Jest
- Testing de funciones puras
- Testing de componentes React con React Testing Library
- Mocks y Spies
- Cobertura de código

### [Sesión 2: Testing de Integración](./sesion-02/intro)
- Testing de Context API
- Testing de custom hooks
- Testing de APIs con Supertest
- Mock Service Worker (MSW)
- Testing de flujos de autenticación

### [Sesión 3: Testing E2E con Cypress](./sesion-03/intro)
- Configuración de Cypress
- Selectores y comandos
- Testing de formularios y navegación
- Interceptación de peticiones HTTP
- Custom commands y mejores prácticas

### [Sesión 4: Seguridad y Desarrollo Seguro](./sesion-04/intro)
- OWASP Top 10
- Prevención de vulnerabilidades (XSS, CSRF, Injection)
- Helmet.js y headers de seguridad
- Rate limiting y validación
- Gestión de secretos
- Auditoría de dependencias

## 🏗️ Enfoque del Módulo

Este módulo tiene un enfoque **75% Testing / 25% Seguridad**, reflejando la importancia de construir una base sólida de testing antes de abordar aspectos de seguridad. El enfoque es **práctico y orientado a desarrolladores Full Stack**, no a especialistas en seguridad ofensiva.

### Tecnologías Principales

**Testing:**
- **Jest 29+**: Framework de testing con zero-config
- **React Testing Library**: Testing de componentes centrado en el usuario
- **Cypress 13+**: Testing E2E con time-travel debugging
- **Supertest**: Testing de APIs HTTP
- **MSW (Mock Service Worker)**: Mocking de APIs a nivel de red

**Seguridad:**
- **Helmet.js**: Headers de seguridad HTTP
- **express-rate-limit**: Protección contra fuerza bruta
- **Joi/Zod**: Validación y sanitización de inputs
- **npm audit**: Auditoría de vulnerabilidades en dependencias

## 📖 Metodología

Cada sesión sigue la siguiente estructura:

1. **Teoría (20-30%)**: Conceptos fundamentales y mejores prácticas
2. **Ejemplos prácticos (40-50%)**: Código real y casos de uso
3. **Ejercicios hands-on (30%)**: Práctica guiada para consolidar conocimientos

## 🚀 Requisitos Previos

Para aprovechar al máximo este módulo, deberías tener conocimientos de:

- JavaScript/TypeScript
- Node.js y Express
- React y hooks
- MongoDB/Mongoose
- Git y terminal

## 💡 Filosofía del Módulo

> **"El testing no es opcional, es una inversión en la calidad y mantenibilidad de tu código."**

> **"La seguridad no es un feature que se añade al final, es una práctica continua integrada en todo el desarrollo."**

---

## 📝 Recursos Adicionales

- [Documentación oficial de Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Documentation](https://docs.cypress.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

¡Comencemos con la [Sesión 1: Testing Unitario](./sesion-01/intro)!
