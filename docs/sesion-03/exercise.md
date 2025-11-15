---
sidebar_position: 12
title: "Ejercicio Práctico"
---

# Ejercicio Práctico Integrador

## 🎯 Objetivo del Ejercicio

Crear una **suite completa de tests E2E** para el proyecto Docusaurus que cubra los flujos más importantes de la aplicación. Este ejercicio integrador te permitirá aplicar todos los conceptos aprendidos en la sesión.

**Duración estimada**: 1.5 horas  
**Nivel**: Intermedio  
**Tipo**: Hands-on practice

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cypress instalado en el proyecto
- ✅ Proyecto Docusaurus corriendo en `localhost:3000`
- ✅ Haber completado las secciones anteriores de la sesión
- ✅ Familiaridad con selectores y comandos de Cypress

---

## 🏗️ Estructura del Ejercicio

El ejercicio está dividido en **3 partes** que debes completar en orden:

1. **Parte 1**: Flujo de Navegación (30 min)
2. **Parte 2**: Flujo de Documentación (40 min)
3. **Parte 3**: Flujo de Blog (20 min)

Cada parte incluye:
- ✨ Tareas específicas
- 📝 Funcionalidades a validar
- ✅ Criterios de aceptación
- 💡 Pistas y consejos

---

## Parte 1: Flujo de Navegación Principal (30 min)

### 🎯 Objetivo

Validar que la navegación principal de la aplicación funciona correctamente en diferentes dispositivos y estados.

### Tareas

#### 1.1 Test de Navegación Básica

**Archivo**: `cypress/e2e/navigation/main-navigation.cy.ts`

**Debe validar:**

- [x] Homepage carga correctamente
- [x] Navegación a sección "Docs" funciona
- [x] Navegación a sección "Blog" funciona
- [x] Botón "back" del navegador funciona
- [x] URLs son correctas en cada página

**Ejemplo de estructura:**

```typescript
describe('Main Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe navegar desde home a docs', () => {
    // Tu código aquí
  });

  it('debe navegar desde home a blog', () => {
    // Tu código aquí
  });

  it('debe usar botón back correctamente', () => {
    // Tu código aquí
  });
});
```

**Criterios de aceptación:**

- ✅ Usar `data-testid` para selectores cuando sea posible
- ✅ Verificar URLs con `.should('include', ...)`
- ✅ Validar que elementos clave son visibles después de navegar
- ✅ Tests independientes (pueden correr en cualquier orden)

#### 1.2 Test de Sidebar con Categorías

**Archivo**: `cypress/e2e/navigation/sidebar.cy.ts`

**Debe validar:**

- [x] Sidebar está visible en página de docs
- [x] Categorías se pueden expandir/colapsar
- [x] Al hacer click, `aria-expanded` cambia de `false` a `true`
- [x] Items de categoría se muestran al expandir
- [x] Página actual está resaltada en sidebar

**Ejemplo de test:**

```typescript
it('debe expandir/colapsar categoría', () => {
  cy.visit('/docs');
  
  // Verificar estado inicial (colapsada)
  cy.get('[data-testid="category-tutorial"]')
    .should('have.attr', 'aria-expanded', 'false');
  
  // Expandir
  // ... tu código
  
  // Verificar expandida
  // ... tu código
});
```

**Pistas:**

- 💡 Usa `.parent()` o `.parents()` para navegar del botón a la categoría completa
- 💡 Verifica que los `<li>` hijos son visibles después de expandir
- 💡 Puedes usar `.find('ul li')` para contar items

#### 1.3 Test de Búsqueda

**Archivo**: `cypress/e2e/navigation/search.cy.ts`

**Debe validar:**

- [x] Modal de búsqueda se abre al hacer click en botón
- [x] Input de búsqueda tiene foco automático
- [x] Escribir muestra resultados
- [x] Resultados contienen el término buscado
- [x] Hacer click en resultado navega a la página correcta
- [x] Modal se cierra con tecla `Escape`

**Ejemplo:**

```typescript
it('debe buscar y mostrar resultados', () => {
  cy.visit('/');
  
  // Abrir búsqueda
  cy.get('[data-testid="search-button"]').click();
  
  // Verificar foco automático
  cy.get('[data-testid="search-input"]').should('be.focused');
  
  // Escribir término
  cy.get('[data-testid="search-input"]').type('testing');
  
  // Verificar resultados
  // ... tu código
});
```

**Pistas:**

- 💡 Usa `{esc}` con `.type()` para presionar Escape: `cy.type('{esc}')`
- 💡 Verifica que modal desaparece con `.should('not.exist')`

#### 1.4 Test Responsive

**Archivo**: `cypress/e2e/navigation/responsive.cy.ts`

**Debe validar:**

- [x] Mobile: Sidebar oculto, botón de menú visible
- [x] Mobile: Al abrir menú, sidebar aparece
- [x] Tablet: Navegación completa visible
- [x] Desktop: Todo visible sin menú hamburguesa

**Ejemplo:**

```typescript
it('debe mostrar menú mobile en viewport pequeño', () => {
  cy.viewport('iphone-x');
  cy.visit('/');
  
  // Sidebar oculto
  cy.get('[data-testid="sidebar"]').should('not.be.visible');
  
  // Botón visible
  cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
  
  // Abrir menú
  // ... tu código
});
```

**Viewports disponibles:**

```typescript
cy.viewport('iphone-x');    // 375x812
cy.viewport('ipad-2');       // 768x1024
cy.viewport(1920, 1080);     // Desktop custom
```

---

## Parte 2: Flujo de Documentación (40 min)

### 🎯 Objetivo

Validar que las funcionalidades específicas de la sección de documentación funcionan correctamente.

### Tareas

#### 2.1 Test de Navegación entre Páginas de Docs

**Archivo**: `cypress/e2e/docs/navigation.cy.ts`

**Debe validar:**

- [x] Botón "Next" navega a siguiente página
- [x] Botón "Previous" navega a página anterior
- [x] URL cambia correctamente
- [x] Contenido de página siguiente se carga
- [x] Breadcrumbs actualizan correctamente

**Ejemplo:**

```typescript
it('debe navegar con botón Next', () => {
  cy.visit('/docs/intro');
  
  // Click en Next
  cy.contains('button, a', /next/i).click();
  
  // Verificar URL cambió
  cy.url().should('not.include', '/intro');
  
  // Verificar contenido
  // ... tu código
});
```

#### 2.2 Test de Tabla de Contenidos (TOC)

**Archivo**: `cypress/e2e/docs/table-of-contents.cy.ts`

**Debe validar:**

- [x] TOC visible en página de docs
- [x] TOC contiene headers (h2, h3) de la página
- [x] Click en item de TOC hace scroll a sección
- [x] Item activo se resalta mientras scrolleas

**Ejemplo:**

```typescript
it('debe hacer scroll a sección al hacer click en TOC', () => {
  cy.visit('/docs/intro');
  
  // Click en item de TOC
  cy.get('[data-testid="toc"]')
    .contains('Getting Started')
    .click();
  
  // Verificar scroll
  cy.get('#getting-started').should('be.visible');
  
  // O verificar hash en URL
  cy.url().should('include', '#getting-started');
});
```

**Pistas:**

- 💡 Usa `.scrollIntoView()` si necesitas forzar scroll
- 💡 Headers automáticamente tienen `id` en Docusaurus

#### 2.3 Test de Cambio de Tema (Light/Dark)

**Archivo**: `cypress/e2e/docs/theme-toggle.cy.ts`

**Debe validar:**

- [x] Toggle de tema existe
- [x] Hacer click cambia atributo `data-theme` en `<html>`
- [x] Tema persiste al recargar página
- [x] Tema persiste al navegar a otra página
- [x] CSS cambia (background color diferente)

**Ejemplo:**

```typescript
it('debe cambiar tema y persistir', () => {
  cy.visit('/docs');
  
  // Verificar tema actual
  cy.get('html').should('have.attr', 'data-theme', 'light');
  
  // Cambiar tema
  cy.get('[data-testid="theme-toggle"]').click();
  
  // Verificar cambio
  cy.get('html').should('have.attr', 'data-theme', 'dark');
  
  // Recargar y verificar persistencia
  cy.reload();
  cy.get('html').should('have.attr', 'data-theme', 'dark');
});
```

**Pistas:**

- 💡 Docusaurus guarda tema en `localStorage`
- 💡 Puedes verificar con `cy.window().its('localStorage').invoke('getItem', 'theme')`

#### 2.4 Test de Código Copiable

**Archivo**: `cypress/e2e/docs/code-copy.cy.ts`

**Debe validar:**

- [x] Bloques de código tienen botón "copy"
- [x] Hover sobre código muestra botón
- [x] Click en botón copia código al clipboard
- [x] Botón cambia a "Copied!" después de copiar
- [x] Después de 2 segundos vuelve a "Copy"

**Ejemplo:**

```typescript
it('debe copiar código al clipboard', () => {
  cy.visit('/docs/intro');
  
  // Hover sobre bloque de código
  cy.get('pre').first().trigger('mouseenter');
  
  // Click en botón copy
  cy.get('[data-testid="copy-button"]').first().click();
  
  // Verificar texto cambió
  cy.get('[data-testid="copy-button"]')
    .first()
    .should('contain', 'Copied');
  
  // Verificar clipboard (requiere plugin)
  cy.window().its('navigator.clipboard')
    .invoke('readText')
    .should('not.be.empty');
});
```

**Nota**: Para clipboard testing, necesitas permisos especiales en Cypress.

---

## Parte 3: Flujo de Blog (20 min)

### 🎯 Objetivo

Validar funcionalidades del blog: listado, paginación, posts individuales, tags.

### Tareas

#### 3.1 Test de Listado de Posts

**Archivo**: `cypress/e2e/blog/post-list.cy.ts`

**Debe validar:**

- [x] Blog carga lista de posts
- [x] Cada post tiene título visible
- [x] Cada post tiene fecha
- [x] Cada post tiene autor
- [x] Cada post tiene excerpt/descripción
- [x] Hay al menos 3 posts visibles

**Ejemplo:**

```typescript
it('debe mostrar lista de posts', () => {
  cy.visit('/blog');
  
  // Verificar cantidad mínima
  cy.get('[data-testid="blog-post"]')
    .should('have.length.at.least', 3);
  
  // Verificar estructura de cada post
  cy.get('[data-testid="blog-post"]').each(($post) => {
    cy.wrap($post).find('[data-testid="post-title"]').should('exist');
    cy.wrap($post).find('[data-testid="post-date"]').should('exist');
    cy.wrap($post).find('[data-testid="post-author"]').should('exist');
  });
});
```

#### 3.2 Test de Paginación de Blog

**Archivo**: `cypress/e2e/blog/pagination.cy.ts`

**Debe validar:**

- [x] Indicador de página actual muestra "1"
- [x] Botón "Next" lleva a página 2
- [x] URL incluye `?page=2` o `/page/2`
- [x] Posts cambian al cambiar de página
- [x] Botón "Previous" funciona

**Ejemplo:**

```typescript
it('debe navegar entre páginas', () => {
  cy.visit('/blog');
  
  // Guardar título del primer post
  cy.get('[data-testid="blog-post"]')
    .first()
    .find('[data-testid="post-title"]')
    .invoke('text')
    .as('firstPostTitle');
  
  // Ir a página 2
  cy.get('[data-testid="next-page"]').click();
  
  // Verificar URL
  cy.url().should('match', /page[=/]2/);
  
  // Verificar contenido cambió
  cy.get('[data-testid="blog-post"]')
    .first()
    .find('[data-testid="post-title"]')
    .invoke('text')
    .then((newTitle) => {
      cy.get('@firstPostTitle').should('not.eq', newTitle);
    });
});
```

#### 3.3 Test de Post Individual

**Archivo**: `cypress/e2e/blog/post-detail.cy.ts`

**Debe validar:**

- [x] Click en post navega a página de detalle
- [x] Título completo es visible
- [x] Contenido del post es visible
- [x] Metadata (autor, fecha, tags) visible
- [x] Botón "Back to blog" funciona

**Ejemplo:**

```typescript
it('debe mostrar detalle de post', () => {
  cy.visit('/blog');
  
  // Click en primer post
  cy.get('[data-testid="blog-post"]').first().click();
  
  // Verificar URL cambió
  cy.url().should('include', '/blog/');
  
  // Verificar contenido
  cy.get('[data-testid="post-content"]').should('be.visible');
  cy.get('[data-testid="post-author"]').should('be.visible');
});
```

#### 3.4 Test de Tags/Categorías

**Archivo**: `cypress/e2e/blog/tags.cy.ts`

**Debe validar:**

- [x] Posts tienen tags visibles
- [x] Click en tag filtra posts por ese tag
- [x] URL incluye tag seleccionado
- [x] Solo posts con ese tag se muestran

---

## 🎁 Bonus: Intercepción de APIs (Opcional)

Si tienes tiempo extra, agrega **intercepción de requests** para:

### Mockear Carga de Posts

```typescript
it('debe cargar posts desde API', () => {
  // Interceptar request
  cy.intercept('GET', '/api/blog/posts', {
    statusCode: 200,
    body: {
      posts: [
        { id: 1, title: 'Post 1', author: 'Alice' },
        { id: 2, title: 'Post 2', author: 'Bob' },
      ],
    },
  }).as('getPosts');
  
  cy.visit('/blog');
  
  // Esperar a request
  cy.wait('@getPosts');
  
  // Verificar datos mockeados se muestran
  cy.contains('Post 1').should('be.visible');
  cy.contains('Alice').should('be.visible');
});
```

### Simular Latencia

```typescript
it('debe mostrar loading durante fetch', () => {
  cy.intercept('GET', '/api/blog/posts', (req) => {
    req.reply({
      delay: 2000, // 2 segundos de delay
      statusCode: 200,
      body: { posts: [] },
    });
  }).as('getPosts');
  
  cy.visit('/blog');
  
  // Verificar loading visible
  cy.get('[data-testid="loading"]').should('be.visible');
  
  cy.wait('@getPosts');
  
  // Loading desaparece
  cy.get('[data-testid="loading"]').should('not.exist');
});
```

### Simular Error 404

```typescript
it('debe manejar error 404', () => {
  cy.intercept('GET', '/api/blog/posts', {
    statusCode: 404,
    body: { error: 'Not found' },
  }).as('getPosts');
  
  cy.visit('/blog');
  cy.wait('@getPosts');
  
  // Verificar mensaje de error
  cy.get('[data-testid="error-message"]')
    .should('contain', 'No posts found');
});
```

---

## ✅ Criterios de Evaluación

Tu ejercicio será evaluado según:

### Funcionalidad (60%)

- ✅ **Mínimo 15 tests E2E** que pasen correctamente
- ✅ **Cobertura de 3 flujos principales**: Navegación, Docs, Blog
- ✅ **Tests independientes**: Pueden ejecutarse en cualquier orden
- ✅ **Sin waits fijos**: Usar esperas inteligentes

### Código (25%)

- ✅ **Uso de best practices**: `data-testid`, no clases CSS
- ✅ **Custom commands** para acciones repetitivas
- ✅ **Código limpio**: Nombres descriptivos, organización clara
- ✅ **Uso de `beforeEach`**: Para setup común

### Extras (15%)

- ✅ **Intercepción de requests** con `cy.intercept()`
- ✅ **Fixtures** para datos de prueba
- ✅ **Viewport testing** (responsive)
- ✅ **Screenshots** en puntos clave

---

## 📦 Entregables

### 1. Estructura de Archivos

```
cypress/
├── e2e/
│   ├── navigation/
│   │   ├── main-navigation.cy.ts
│   │   ├── sidebar.cy.ts
│   │   ├── search.cy.ts
│   │   └── responsive.cy.ts
│   ├── docs/
│   │   ├── navigation.cy.ts
│   │   ├── table-of-contents.cy.ts
│   │   ├── theme-toggle.cy.ts
│   │   └── code-copy.cy.ts
│   └── blog/
│       ├── post-list.cy.ts
│       ├── pagination.cy.ts
│       ├── post-detail.cy.ts
│       └── tags.cy.ts
├── fixtures/
│   └── blog-posts.json
└── support/
    └── commands.ts
```

### 2. Custom Commands

Crea al menos **2 custom commands** reutilizables:

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('openSearch', () => {
  cy.get('[data-testid="search-button"]').click();
  cy.get('[data-testid="search-input"]').should('be.focused');
});

Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid="theme-toggle"]').click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      openSearch(): Chainable<void>;
      toggleTheme(): Chainable<void>;
    }
  }
}
```

### 3. Fixtures

Crea archivos de datos para tests:

```json
// cypress/fixtures/blog-posts.json
{
  "posts": [
    {
      "id": 1,
      "title": "Getting Started with Cypress",
      "author": "John Doe",
      "date": "2024-01-15",
      "tags": ["testing", "cypress"]
    },
    {
      "id": 2,
      "title": "Advanced Testing Patterns",
      "author": "Jane Smith",
      "date": "2024-02-20",
      "tags": ["testing", "advanced"]
    }
  ]
}
```

---

## 🚀 Ejecutar Tests

```bash
# Modo interactivo (desarrollo)
npm run cy:open

# Modo headless (CI/CD)
npm run cy:run

# Ejecutar suite específica
npm run cy:run -- --spec "cypress/e2e/navigation/**"

# Con navegador específico
npm run cy:run -- --browser chrome
```

---

## 💡 Consejos Finales

1. **Empieza simple**: Haz que un test básico funcione antes de agregar complejidad
2. **Usa el Selector Playground**: Herramienta visual de Cypress para encontrar selectores
3. **Debug con `cy.pause()`**: Pausa ejecución para inspeccionar estado
4. **Lee los errores**: Cypress da mensajes muy descriptivos
5. **Tests pequeños**: Un concepto por test, múltiples tests pequeños > 1 test gigante
6. **Revisa ejemplos**: Mira los ejemplos de secciones anteriores
7. **No te rindas**: El primer test es el más difícil, después fluye

---

## 🎓 Recursos de Ayuda

- **[Cypress Docs](https://docs.cypress.io/)**
- **[Best Practices](./best-practices)**
- **[Selectores y Comandos](./selectors)**
- **[Custom Commands](./custom-commands)**

---

**¡Éxito con el ejercicio!** 🚀 Recuerda que la práctica es clave para dominar Cypress. Tómate tu tiempo y disfruta el proceso.
