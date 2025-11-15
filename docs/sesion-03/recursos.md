---
sidebar_position: 13
title: "Recursos Adicionales"
---

# Recursos Adicionales

## 📚 Documentación Oficial

### Cypress Core

- **[Cypress Documentation](https://docs.cypress.io/)** - Documentación oficial completa
- **[API Reference](https://docs.cypress.io/api/table-of-contents)** - Referencia completa de API
- **[Best Practices](https://docs.cypress.io/guides/references/best-practices)** - Prácticas recomendadas oficiales
- **[Configuration](https://docs.cypress.io/guides/references/configuration)** - Todas las opciones de configuración
- **[Migration Guide](https://docs.cypress.io/guides/references/migration-guide)** - Migrar entre versiones

### Guías Específicas

- **[Writing Your First Test](https://docs.cypress.io/guides/getting-started/writing-your-first-test)** - Tutorial oficial paso a paso
- **[Testing Your App](https://docs.cypress.io/guides/core-concepts/testing-your-app)** - Conceptos fundamentales
- **[Interacting with Elements](https://docs.cypress.io/guides/core-concepts/interacting-with-elements)** - Comandos de interacción
- **[Assertions](https://docs.cypress.io/guides/references/assertions)** - Lista completa de assertions
- **[Network Requests](https://docs.cypress.io/guides/guides/network-requests)** - cy.intercept() y cy.request()

---

## 🎓 Tutoriales y Cursos

### Cursos Gratuitos

- **[Test Automation University - Cypress](https://testautomationu.applitools.com/cypress-tutorial/)** - Curso completo gratuito
- **[Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)** - Aplicación completa con tests
- **[Cypress Example Recipes](https://docs.cypress.io/examples/examples/recipes)** - Ejemplos de casos de uso reales
- **[Egghead.io Cypress Courses](https://egghead.io/q/cypress)** - Varios cursos (algunos gratuitos)

### Tutoriales Escritos

- **[Cypress Blog](https://www.cypress.io/blog/)** - Artículos oficiales del equipo
- **[Learn Cypress](https://learn.cypress.io/)** - Tutoriales interactivos
- **[Cypress Tips & Tricks](https://cypress.tips/)** - Blog por Gleb Bahmutov (VP of Cypress)

---

## 🔌 Plugins Esenciales

### Testing Library Integration

```bash
npm install --save-dev @testing-library/cypress
```

**Uso**: Queries semánticas basadas en accesibilidad

```typescript
cy.findByRole('button', { name: /submit/i });
cy.findByLabelText('Email');
cy.findByText('Welcome');
```

- **[Docs](https://testing-library.com/docs/cypress-testing-library/intro/)**

### Accessibility Testing

```bash
npm install --save-dev cypress-axe axe-core
```

**Uso**: Auditorías automáticas de accesibilidad

```typescript
cy.injectAxe();
cy.checkA11y();
```

- **[cypress-axe](https://github.com/component-driven/cypress-axe)**
- **[Guía de A11y con Cypress](https://www.cypress.io/blog/2020/04/28/test-your-app-accessibility-with-cypress/)**

### File Upload

```bash
npm install --save-dev cypress-file-upload
```

**Uso**: Upload de archivos en tests

```typescript
cy.get('input[type="file"]').attachFile('example.json');
```

- **[cypress-file-upload](https://github.com/abramenal/cypress-file-upload)**

### Visual Regression

```bash
npm install --save-dev cypress-image-snapshot
```

**Uso**: Comparación visual de screenshots

```typescript
cy.matchImageSnapshot('homepage');
```

- **[cypress-image-snapshot](https://github.com/jaredpalmer/cypress-image-snapshot)**

### Code Coverage

```bash
npm install --save-dev @cypress/code-coverage
```

**Uso**: Medir cobertura de tests E2E

- **[@cypress/code-coverage](https://github.com/cypress-io/code-coverage)**
- **[Guía oficial](https://docs.cypress.io/guides/tooling/code-coverage)**

### IFrame Testing

```bash
npm install --save-dev cypress-iframe
```

**Uso**: Trabajar con iframes fácilmente

```typescript
cy.frameLoaded();
cy.iframe().find('button').click();
```

- **[cypress-iframe](https://github.com/kuceb/cypress-iframe)**

---

## 🛠️ Herramientas y Servicios

### Cypress Dashboard

**[Cypress Dashboard](https://www.cypress.io/dashboard)**

- Grabación de tests en cloud
- Analytics y reportes
- Paralelización de tests
- Integración con GitHub/GitLab
- Screenshots y videos automáticos

**Planes**: Gratis hasta 500 tests/mes, luego pago

### Percy (Visual Testing)

**[Percy.io](https://percy.io/)**

- Visual regression testing
- Comparación de screenshots
- Integración con Cypress
- Detección automática de cambios visuales

```bash
npm install --save-dev @percy/cypress
```

```typescript
cy.percySnapshot('Homepage');
```

### Sorry Cypress (Open Source Dashboard)

**[Sorry Cypress](https://sorry-cypress.dev/)**

- Dashboard open source
- Auto-hospedado (Docker)
- Alternativa gratis a Cypress Dashboard
- Paralelización
- Reportes y analytics

### Cypress Studio

**Built-in en Cypress 6+**

- Grabación visual de tests
- Genera código automáticamente
- Ideal para prototipar tests rápido

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    experimentalStudio: true,
  },
});
```

---

## 📖 Libros y Recursos Avanzados

### Libros

- **"End-to-End Web Testing with Cypress"** por Wawrzyniec Jasinski
- **"Cypress End-to-End Testing"** por Marcos Mendes
- **"Testing JavaScript Applications"** por Lucas da Costa (incluye Cypress)

### Blogs y Newsletters

- **[Cypress Blog](https://www.cypress.io/blog/)** - Oficial
- **[Gleb Bahmutov's Blog](https://glebbahmutov.com/blog/)** - VP of Cypress, muy técnico
- **[Cypress.tips](https://cypress.tips/)** - Tips semanales
- **[Filip Hric's Blog](https://filiphric.com/blog)** - Testing engineer, excelente contenido

### Comunidad

- **[Cypress Discord](https://discord.com/invite/cypress)** - Chat oficial muy activo
- **[Cypress Gitter](https://gitter.im/cypress-io/cypress)** - Chat alternativo
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/cypress)** - Tag `[cypress]`
- **[GitHub Discussions](https://github.com/cypress-io/cypress/discussions)** - Discusiones oficiales

---

## 🎥 Videos y Conferencias

### Canales de YouTube

- **[Cypress.io Official](https://www.youtube.com/c/Cypressio)** - Canal oficial
- **[Test Automation University](https://www.youtube.com/channel/UCYSVaYgUgZ-N3wfPLDm9nJA)** - Cursos completos
- **[Gleb Bahmutov](https://www.youtube.com/c/GlebBahmutov)** - Demos técnicas avanzadas

### Conferencias Destacadas

- **AssertJS** - Conferencia anual de Cypress
- **TestJS Summit** - Testing en JavaScript
- **Cypress Component Testing** - Webinars oficiales

---

## 🔍 Recursos por Tema

### CI/CD Integration

- **[GitHub Actions con Cypress](https://github.com/cypress-io/github-action)**
- **[GitLab CI con Cypress](https://docs.cypress.io/guides/continuous-integration/gitlab-ci)**
- **[CircleCI con Cypress](https://circleci.com/docs/2.0/browser-testing/#cypress)**
- **[Jenkins con Cypress](https://www.jenkins.io/doc/book/using/using-agents/#running-cypress-tests)**

### Component Testing

- **[Cypress Component Testing](https://docs.cypress.io/guides/component-testing/overview)** - Testing de componentes React/Vue/Angular
- **[Migrar de Jest a Cypress](https://docs.cypress.io/guides/component-testing/migration-guide)**

### API Testing

- **[cy.request() Guide](https://docs.cypress.io/api/commands/request)** - Testing de APIs REST
- **[API Testing Best Practices](https://www.cypress.io/blog/2021/11/12/api-testing-with-cypress/)**

### Performance Testing

- **[Lighthouse CI con Cypress](https://github.com/GoogleChrome/lighthouse-ci)**
- **[Performance Metrics](https://www.cypress.io/blog/2020/04/06/cypress-performance-metrics/)**

### Security Testing

- **[OWASP ZAP con Cypress](https://github.com/zaproxy/zaproxy/wiki/ZAP-API)**
- **[Security Headers Testing](https://www.cypress.io/blog/2021/03/10/testing-security-headers/)**

---

## 🚀 Ejemplos de Proyectos Reales

### Open Source Apps con Cypress

1. **[Cypress RealWorld App](https://github.com/cypress-io/cypress-realworld-app)**
   - App bancaria completa (React + Express)
   - Tests E2E exhaustivos
   - Mejor recurso para aprender

2. **[Conduit (RealWorld)](https://github.com/gothinkster/realworld)**
   - Clone de Medium
   - Múltiples implementaciones con Cypress

3. **[TodoMVC](https://github.com/cypress-io/cypress-example-todomvc)**
   - Clásico TodoMVC con tests Cypress

4. **[Kitchen Sink](https://github.com/cypress-io/cypress-example-kitchensink)**
   - Showcase de todos los comandos de Cypress

### Templates de Proyectos

- **[Cypress + Next.js](https://github.com/vercel/next.js/tree/canary/examples/with-cypress)**
- **[Cypress + React](https://github.com/cypress-io/cypress-example-recipes)**
- **[Cypress + Vue](https://github.com/cypress-io/cypress-example-recipes)**

---

## 📊 Comparativas y Alternativas

### Cypress vs Otras Herramientas

- **[Cypress vs Selenium](https://www.cypress.io/how-it-works)** - Comparativa oficial
- **[Cypress vs Playwright](https://www.browserstack.com/guide/cypress-vs-playwright)** - Análisis detallado
- **[Cypress vs TestCafe](https://medium.com/@mwaysolutions/cypress-vs-testcafe-e2e-testing-tools-comparison-d3b9e4e7b8a9)**
- **[E2E Testing Tools Comparison 2024](https://2024.stateofjs.com/en-US/libraries/testing/)**

---

## 🆘 Debugging y Troubleshooting

### Recursos de Debugging

- **[Debugging Guide](https://docs.cypress.io/guides/guides/debugging)** - Guía oficial
- **[Troubleshooting](https://docs.cypress.io/guides/references/troubleshooting)** - Problemas comunes
- **[Error Messages](https://docs.cypress.io/guides/references/error-messages)** - Explicación de errores
- **[Known Issues](https://github.com/cypress-io/cypress/issues)** - Issues en GitHub

### Tools de Debugging

```typescript
// Pause test
cy.pause();

// Debug command
cy.get('[data-testid="user"]').debug();

// Log custom message
cy.log('✅ User logged in');

// Inspect variable
cy.get('[data-testid="price"]').then(($el) => {
  debugger; // Chrome DevTools breakpoint
  console.log($el.text());
});
```

---

## 🎯 Próxima Sesión

### Sesión 4: Seguridad y Desarrollo Seguro

En la próxima sesión aprenderás:

- 🔐 **OWASP Top 10** - Vulnerabilidades más críticas
- 🛡️ **XSS, CSRF, SQL Injection** - Ataques comunes y prevención
- 🔒 **Helmet.js** - Headers de seguridad en Express
- 🔑 **JWT Security** - Mejores prácticas de autenticación
- 🔍 **npm audit** - Auditoría de dependencias
- 🧪 **Security Testing** - Testing de seguridad automatizado

**Recursos preparatorios:**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## ✅ Checklist de Dominio

Antes de avanzar, asegúrate de poder:

- [ ] Instalar y configurar Cypress desde cero
- [ ] Escribir tests E2E básicos con assertions
- [ ] Usar selectores estables (`data-testid`)
- [ ] Navegar el DOM con comandos de traversal
- [ ] Interceptar y mockear requests HTTP
- [ ] Crear custom commands reutilizables
- [ ] Aplicar best practices de testing E2E
- [ ] Debuggear tests con time-travel y screenshots
- [ ] Configurar Cypress para CI/CD
- [ ] Organizar suites de tests escalables

---

**¡Felicidades!** 🎉 Has completado el módulo de **Testing E2E con Cypress**. Ahora tienes las habilidades para crear tests robustos que validan el comportamiento completo de tus aplicaciones desde la perspectiva del usuario.

**Continúa practicando** con el [ejercicio integrador](./exercise) y explora los recursos adicionales para profundizar tus conocimientos.

:::tip Siguiente Paso
Avanza a la **[Sesión 4: Seguridad](../../sesion-04/intro)** para aprender sobre desarrollo seguro y protección contra vulnerabilidades comunes.
:::
