---
sidebar_position: 10
title: "Recursos Adicionales"
---

# Recursos Adicionales

Esta sección recopila recursos valiosos para profundizar en testing unitario con Jest y React Testing Library. Utiliza estos materiales para expandir tu conocimiento y resolver dudas específicas.

## Documentación Oficial

### Jest

- **[Jest Documentation](https://jestjs.io/docs/getting-started)** - La documentación oficial de Jest es exhaustiva y bien organizada. Incluye:
  - Guías de configuración para diferentes entornos
  - API completa de matchers y utilidades
  - Ejemplos prácticos de casos de uso comunes
  - Sección de troubleshooting para problemas frecuentes

- **[Jest API Reference](https://jestjs.io/docs/api)** - Referencia completa de todas las funciones globales:
  - `describe`, `it`, `test`, `beforeEach`, etc.
  - Matchers (`expect`, `toBe`, `toHaveBeenCalled`, etc.)
  - Mock functions y utilidades

- **[Configuring Jest](https://jestjs.io/docs/configuration)** - Todas las opciones de `jest.config.js` explicadas:
  - Patherns de archivos a testear
  - Setup y teardown global
  - Coverage configuration
  - Transform y preprocessors

### React Testing Library

- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - La guía oficial explica la filosofía de RTL:
  - Por qué testear comportamiento sobre implementación
  - Cómo simular interacciones de usuario
  - Mejores prácticas y patrones comunes

- **[Testing Library Queries](https://testing-library.com/docs/queries/about)** - Referencia completa de queries con ejemplos:
  - Diferencias entre `getBy`, `queryBy`, `findBy`
  - Cuándo usar cada variante (`ByRole`, `ByText`, `ByLabelText`, etc.)
  - Tabla de prioridades recomendadas

- **[Testing Library API - React](https://testing-library.com/docs/react-testing-library/api)** - API específica de React:
  - `render`, `screen`, `waitFor`, `within`
  - `fireEvent` vs `userEvent`
  - Utilities para testing asíncrono

### Testing Library Core Concepts

- **[Guiding Principles](https://testing-library.com/docs/guiding-principles)** - Los principios fundamentales de Testing Library:
  > "The more your tests resemble the way your software is used, the more confidence they can give you."
  
  Esta página explica por qué RTL enfoca en accesibilidad y comportamiento de usuario.

## Tutoriales y Guías por Expertos

### Kent C. Dodds (Creador de Testing Library)

Kent C. Dodds es el creador de Testing Library y tiene excelentes artículos sobre filosofía y práctica de testing:

- **[Common mistakes with React Testing Library](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)** - Errores comunes que cometen incluso desarrolladores experimentados:
  - Usar `container.querySelector` en lugar de queries accesibles
  - No usar `*ByRole` cuando debería ser la primera opción
  - Testear implementación en lugar de comportamiento
  - No limpiar mocks entre tests

- **[Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)** - Filosofía de testing del autor:
  - Por qué integration tests dan más confianza que unit tests
  - Cómo evitar "falsa confianza" con demasiados mocks
  - Balancear velocidad de tests vs cobertura realista
  
  **Quote clave:**  
  > "The more your tests resemble the way your software is used, the more confidence they can give you."

- **[Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)** - Qué NO testear:
  - Por qué testear state interno hace tests frágiles
  - Cómo identificar detalles de implementación vs comportamiento
  - Ejemplos de refactoring que rompen tests mal escritos

- **[How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)** - Guía para decidir cobertura:
  - Usar casos de uso como base
  - Priorizar paths críticos de usuario
  - Cuándo escribir tests de edge cases

### Otras Guías Recomendadas

- **[JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)** - Repositorio con 50+ mejores prácticas:
  - Estructura de tests
  - Backend testing
  - CI/CD integration
  - Disponible en español

- **[TestingJavaScript.com](https://testingjavascript.com/)** - Curso completo de Kent C. Dodds (de pago):
  - Desde fundamentos hasta testing avanzado
  - Incluye testing E2E con Cypress
  - Certificado al completar

## Herramientas Interactivas

### Testing Playground

- **[Testing Library Playground](https://testing-playground.com/)** - Herramienta interactiva para practicar queries:
  - Pega HTML de tu componente
  - Experimenta con diferentes queries
  - Ve qué query recomienda RTL para cada elemento
  - Aprende la jerarquía de prioridades

**Ejemplo de uso:**

Abre [testing-playground.com](https://testing-playground.com/) y:

1. Pega este HTML:

   ```html
   <button aria-label="Close modal">×</button>
   ```

2. Haz click en el botón
3. El playground te sugiere: `screen.getByRole('button', { name: /close modal/i })`

### Otras Herramientas Útiles

- **[Jest Cheat Sheet](https://github.com/sapegin/jest-cheat-sheet)** - Referencia rápida de Jest en un PDF:
  - Todos los matchers en una página
  - Setup y teardown hooks
  - Mocking cheat codes
  - Descargable e imprimible

- **[Regexr.com](https://regexr.com/)** - Para construir expresiones regulares en tus tests:
  - Útil para matchers como `toMatch(/patrón/)`
  - Explica regex paso a paso
  - Cheatsheet incorporado

- **[Which Query Should I Use?](https://testing-library.com/docs/queries/about/#priority)** - Diagrama de flujo para elegir query:

```text
¿Es un elemento interactivo? (botón, input, etc.)
    └─ Sí → getByRole
    └─ No → ¿Tiene texto visible?
            └─ Sí → getByText
            └─ No → ¿Tiene label?
                    └─ Sí → getByLabelText
                    └─ No → getByTestId (último recurso)
```

## Extensiones y Plugins

### VS Code Extensions

- **[Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)** - Ejecuta tests individuales con un click:
  - Botones "Run" y "Debug" sobre cada `it()`
  - Atajo de teclado para ejecutar test bajo el cursor
  - Integración con debugger

- **[Jest Snippets](https://marketplace.visualstudio.com/items?itemName=andys8.jest-snippets)** - Snippets para escribir tests más rápido:
  - `desc` → `describe()` block
  - `it` → `it()` test
  - `bfe` → `beforeEach()` hook

- **[ESLint Plugin Jest](https://github.com/jest-community/eslint-plugin-jest)** - Linter específico para Jest:
  - Detecta errores comunes (assertions sin expect, etc.)
  - Enforza buenas prácticas
  - Reglas para describe/it naming

### Linter y Formatters

- **[eslint-plugin-testing-library](https://github.com/testing-library/eslint-plugin-testing-library)** - ESLint rules para Testing Library:
  - Enforza uso de queries correctas
  - Detecta uso de `container.querySelector`
  - Recomienda mejores alternativas

- **[eslint-plugin-jest-dom](https://github.com/testing-library/eslint-plugin-jest-dom)** - Mejora matchers de jest-dom:
  - Sugiere matchers más específicos
  - `toBeInTheDocument()` vs `toBeTruthy()`
  - Mejor legibilidad en assertions

## Comunidad y Ayuda

### Foros y Discusiones

- **[Stack Overflow - Jest Tag](https://stackoverflow.com/questions/tagged/jestjs)** - Miles de preguntas y respuestas:
  - Busca errores específicos
  - Ve soluciones a problemas comunes
  - Haz preguntas si no encuentras respuesta

- **[Testing Library Discord](https://discord.gg/testing-library)** - Chat en tiempo real:
  - Canal #help para preguntas
  - Creadores de la librería activos
  - Comunidad muy colaborativa

- **[Reddit r/reactjs](https://www.reddit.com/r/reactjs/)** - Testing threads frecuentes:
  - Discusiones sobre mejores prácticas
  - Comparaciones de herramientas
  - Show & Tell de proyectos

### Repositorios de Ejemplo

- **[React Testing Examples](https://github.com/kentcdodds/react-testing-library-examples)** - Ejemplos oficiales de Kent C. Dodds:
  - Casos de uso comunes con soluciones
  - Forms, async, context, custom hooks
  - Código comentado y explicado

- **[Real World React](https://github.com/gothinkster/realworld)** - Implementación completa con tests:
  - App full-stack testeada
  - Ejemplos de integration tests
  - CI/CD configurado

## Libros Recomendados

- **"Testing JavaScript Applications"** - Lucas da Costa
  - Cubre Jest, Testing Library, E2E, CI/CD
  - Ejemplos prácticos y teoría sólida
  - Disponible en Amazon

- **"The Art of Unit Testing"** - Roy Osherove
  - Aunque no es específico de JavaScript, los principios son universales
  - Mocking, stubs, test doubles
  - Arquitectura testeable
