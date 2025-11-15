---
sidebar_position: 6
title: "Selectores y Comandos"
---

# Selectores y Comandos

## ¿Por Qué Son Importantes los Selectores?

Los **selectores** son la forma en que Cypress encuentra elementos en el DOM. Elegir buenos selectores es **crítico** para tener tests:

- ✅ **Estables**: No se rompen con cambios de CSS o refactors
- ✅ **Mantenibles**: Fáciles de entender y actualizar
- ✅ **Rápidos**: Cypress encuentra elementos rápidamente
- ✅ **Confiables**: Seleccionan exactamente lo que necesitas

**Analogía**: Los selectores son como direcciones postales. Puedes usar "la casa azul cerca del parque" (frágil) o "Calle 123, #456" (estable). Ambos pueden funcionar hoy, pero solo el segundo seguirá funcionando si pintan la casa.

---

## Pirámide de Selectores (De Mejor a Peor)

```
        ⭐ MEJOR
    ┌─────────────────┐
    │  data-testid    │  1. Selectores de Testing
    ├─────────────────┤
    │  ARIA roles     │  2. Semántica de Accesibilidad
    ├─────────────────┤
    │  IDs únicos     │  3. Identificadores únicos
    ├─────────────────┤
    │  Atributos      │  4. name, type, etc.
    ├─────────────────┤
    │  Texto visible  │  5. Contenido del usuario
    └─────────────────┘
        ❌ PEOR
    ┌─────────────────┐
    │  Clases CSS     │  6. Frágiles ante refactors
    ├─────────────────┤
    │  Tags HTML      │  7. Muy genéricos
    ├─────────────────┤
    │  nth-child      │  8. Dependen de estructura
    └─────────────────┘
```

---

## Estrategias de Selectores en Detalle

### 1. ⭐ `data-testid` - LA MEJOR PRÁCTICA

**¿Qué es?** Atributo HTML específico para testing.

```html
<!-- En tu componente -->
<button data-testid="submit-button">Enviar</button>
<input data-testid="email-input" type="email" />
<div data-testid="user-profile">Juan Pérez</div>
```

**En Cypress:**

```typescript
cy.get('[data-testid="submit-button"]').click();
cy.get('[data-testid="email-input"]').type('user@example.com');
cy.get('[data-testid="user-profile"]').should('contain', 'Juan');
```

**Ventajas:**

✅ **Resistente a cambios**: Puedes cambiar clases, estilos, estructura sin romper tests
✅ **Propósito claro**: Es obvio que existe para testing
✅ **Fácil de buscar**: Grep por `data-testid` muestra todos los elementos testeables

**Ejemplo de resistencia:**

```html
<!-- Antes -->
<button data-testid="submit-button" class="btn btn-primary">Submit</button>

<!-- Después (refactor de CSS) -->
<button data-testid="submit-button" class="button button--large button--primary">Submit</button>
```

**Resultado**: El test con `cy.get('[data-testid="submit-button"]')` sigue funcionando. ✅

Un test con `cy.get('.btn-primary')` se rompería. ❌

**Convención de nombres:**

```typescript
// ✅ Descriptivos y kebab-case
data-testid="login-form"
data-testid="user-email-input"
data-testid="submit-button"
data-testid="error-message"

// ❌ Evitar
data-testid="btn1"  // No descriptivo
data-testid="userEmailInput"  // CamelCase inconsistente
```

### 2. 🎯 `data-cy` - Alternativa de Cypress

**Similar a `data-testid` pero específica de Cypress:**

```html
<button data-cy="user-name">Juan</button>
```

```typescript
cy.get('[data-cy="user-name"]');
```

**¿Cuándo usar?** Si ya usas `data-testid` para otra herramienta (ej: Testing Library), puedes usar `data-cy` exclusivamente para Cypress.

### 3. ♿ Roles ARIA - Accesibilidad + Testing

**¿Qué es?** Atributos de accesibilidad que también sirven para testing.

```html
<button role="button" aria-label="Close modal">X</button>
<nav role="navigation" aria-label="Main navigation">
  <a href="/docs">Docs</a>
</nav>
```

**Con Cypress (usando plugin Testing Library):**

```bash
npm install --save-dev @testing-library/cypress
```

```typescript
// cypress/support/e2e.ts
import '@testing-library/cypress/add-commands';
```

```typescript
// En tests
cy.findByRole('button', { name: 'Close modal' }).click();
cy.findByRole('navigation', { name: 'Main navigation' }).should('exist');
```

**Ventajas:**

✅ **Doble beneficio**: Tests + accesibilidad
✅ **Semántico**: Refleja cómo usuarios (especialmente con screen readers) usan la app

**Roles comunes:**

```typescript
cy.findByRole('button')       // <button>, <input type="button">
cy.findByRole('link')         // <a href="...">
cy.findByRole('textbox')      // <input type="text">
cy.findByRole('checkbox')     // <input type="checkbox">
cy.findByRole('navigation')   // <nav>
cy.findByRole('heading')      // <h1>, <h2>, etc.
```

### 4. 🆔 IDs Únicos

**Usar solo si el ID es estable y único:**

```html
<input id="username-input" />
```

```typescript
cy.get('#username-input').type('juan');
```

**⚠️ Cuidado:**

- IDs deben ser **únicos** en la página (regla HTML)
- Si el ID es generado dinámicamente (`user-12345`), NO usar
- Preferir `data-testid` sobre IDs arbitrarios

### 5. 📝 Texto Visible - Contenido del Usuario

**Buscar por el texto que el usuario ve:**

```typescript
cy.contains('Welcome to Docusaurus');
cy.contains('button', 'Submit');  // Botón con texto "Submit"
cy.contains('a', 'Read more');    // Link con texto "Read more"
```

**Ventajas:**

✅ **Tests legibles**: Es obvio qué estás buscando
✅ **Orientado al usuario**: Testeas lo que el usuario ve

**Desventajas:**

❌ **Frágil ante traducciones**: Si cambias "Submit" → "Enviar", el test se rompe
❌ **Ambiguo**: Si hay múltiples elementos con el mismo texto

**Solución para traducciones:**

```typescript
// ❌ Frágil
cy.contains('Submit');

// ✅ Usar data-testid para elementos críticos
cy.get('[data-testid="submit-button"]');

// ✅ O combinar
cy.get('[data-testid="submit-button"]').should('contain', 'Submit');
```

### 6. ❌ Clases CSS - EVITAR

**Problema:** Las clases cambian frecuentemente con refactors de CSS.

```typescript
// ❌ Mal - Frágil
cy.get('.btn-primary').click();
cy.get('.user-card .user-name').should('contain', 'Juan');
```

**¿Por qué falla?**

```html
<!-- Antes -->
<button class="btn btn-primary">Submit</button>

<!-- Después (Tailwind refactor) -->
<button class="px-4 py-2 bg-blue-500 text-white rounded">Submit</button>
```

El selector `.btn-primary` ya no existe. ❌

**Excepción:** Si la clase es parte de la API pública (ej: framework UI).

```typescript
// ✅ OK - Clase de framework (Bootstrap, Material-UI)
cy.get('.MuiButton-root');
```

### 7. ❌ Tags HTML - DEMASIADO GENÉRICOS

```typescript
// ❌ Mal - Puede haber muchos <button>
cy.get('button').click(); // ¿Cuál botón?

// ✅ Mejor - Ser específico
cy.get('button[type="submit"]').click();
cy.get('[data-testid="submit-button"]').click();
```

### 8. ❌ nth-child - DEPENDE DE ESTRUCTURA

```typescript
// ❌ Mal - Frágil ante cambios de estructura
cy.get('ul li:nth-child(3)').click();

// ✅ Mejor - Usar contenido o data-testid
cy.contains('li', 'Third item').click();
cy.get('[data-testid="item-3"]').click();
```

---

## Comandos Esenciales de Cypress

Cypress provee una API rica de comandos para interactuar con tu aplicación. Dominar estos comandos es esencial para escribir tests efectivos.

### Comandos de Navegación

```typescript
// Navegar a URL (usa baseUrl del config)
cy.visit('/about');           
cy.visit('https://example.com'); // URL completa

// Navegación del navegador
cy.go('back');                // Ir atrás (botón back)
cy.go('forward');             // Ir adelante
cy.go(-1);                    // Ir 1 página atrás
cy.go(2);                     // Ir 2 páginas adelante

// Recargar página
cy.reload();                  // Recarga normal
cy.reload(true);              // Recarga forzada (ignora caché)
```

**Ejemplo de navegación completa:**

```typescript
it('debe navegar correctamente', () => {
  cy.visit('/');              // Homepage
  cy.contains('Docs').click(); // Click en link
  cy.url().should('include', '/docs'); // Verificar URL
  
  cy.go('back');              // Volver a homepage
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});
```

### Comandos de Selección

```typescript
// GET - Obtener elemento(s)
cy.get('.selector');          // Por selector CSS
cy.get('[data-testid="id"]'); // Por atributo
cy.get('button');             // Por tag
cy.get('#id');                // Por ID

// CONTAINS - Buscar por texto
cy.contains('Welcome');       // Cualquier elemento con texto
cy.contains('button', 'Submit'); // Botón específico con texto
cy.contains(/regex pattern/); // Por regex

// FIND - Buscar dentro de elemento
cy.get('[data-testid="form"]')
  .find('input')              // Inputs dentro del form
  .first();                   // Primer input

// FILTER - Filtrar elementos
cy.get('li')
  .filter('.active')          // Solo elementos con clase 'active'
  .should('have.length', 1);

// FIRST / LAST - Primer/último elemento
cy.get('li').first();         // Primer <li>
cy.get('li').last();          // Último <li>

// EQ - Elemento por índice (0-based)
cy.get('li').eq(2);           // Tercer <li> (índice 2)

// PARENT / PARENTS - Navegar hacia arriba
cy.get('[data-testid="child"]')
  .parent();                  // Elemento padre directo
cy.get('[data-testid="child"]')
  .parents('div');            // Todos los ancestros <div>

// SIBLINGS - Elementos hermanos
cy.get('[data-testid="item"]')
  .siblings();                // Todos los hermanos

// CHILDREN - Elementos hijos
cy.get('ul')
  .children('li');            // Todos los <li> hijos directos

// CLOSEST - Ancestro más cercano que coincide
cy.get('[data-testid="nested"]')
  .closest('form');           // Form ancestro más cercano
```

**Ejemplo de traversal complejo:**

```typescript
it('debe navegar el DOM correctamente', () => {
  cy.get('[data-testid="user-list"]')
    .find('li')                    // Todos los <li> dentro
    .filter(':contains("Active")') // Solo los que dicen "Active"
    .first()                       // Primer match
    .find('button')                // Botón dentro de ese <li>
    .click();                      // Click
});
```

### Comandos de Acción

```typescript
// CLICK - Click en elemento
cy.get('button').click();
cy.get('a').click();

// Click con opciones
cy.get('button').click({
  force: true,        // Forzar click aunque esté cubierto
  multiple: true,     // Click en todos los matches
  position: 'topLeft' // Posición específica
});

// Tipos de click
cy.get('button').dblclick();    // Doble click
cy.get('button').rightclick();  // Click derecho

// TYPE - Escribir texto
cy.get('input').type('Hello World');
cy.get('input').type('user@example.com');

// Type con caracteres especiales
cy.get('input').type('{enter}');      // Presionar Enter
cy.get('input').type('{backspace}');  // Borrar
cy.get('input').type('{selectall}');  // Seleccionar todo
cy.get('input').type('{ctrl}A');      // Ctrl+A
cy.get('input').type('{esc}');        // Escape

// Type con delay
cy.get('input').type('Slow typing', { delay: 100 }); // 100ms entre teclas

// CLEAR - Limpiar input
cy.get('input').clear();

// CHECK / UNCHECK - Checkboxes y radios
cy.get('[type="checkbox"]').check();    // Check
cy.get('[type="checkbox"]').uncheck();  // Uncheck
cy.get('[type="radio"]').check('value'); // Check radio específico

// SELECT - Dropdowns
cy.get('select').select('Option 1');     // Por texto visible
cy.get('select').select('value1');       // Por value
cy.get('select').select(0);              // Por índice
cy.get('select').select(['opt1', 'opt2']); // Múltiple

// FOCUS / BLUR - Foco
cy.get('input').focus();                 // Dar foco
cy.get('input').blur();                  // Quitar foco

// SUBMIT - Submit de form
cy.get('form').submit();

// SCROLL - Scroll
cy.scrollTo('bottom');                   // Scroll al fondo
cy.scrollTo('top');                      // Scroll arriba
cy.scrollTo(0, 500);                     // Posición específica (x, y)
cy.get('#element').scrollIntoView();     // Scroll hasta elemento

// TRIGGER - Disparar eventos
cy.get('div').trigger('mouseenter');     // Hover
cy.get('div').trigger('mouseleave');
cy.get('input').trigger('change');
```

**Ejemplo de formulario completo:**

```typescript
it('debe llenar y enviar formulario', () => {
  // Text input
  cy.get('[data-testid="name"]').type('Juan Pérez');
  
  // Email input
  cy.get('[data-testid="email"]').type('juan@example.com');
  
  // Select dropdown
  cy.get('[data-testid="country"]').select('Argentina');
  
  // Checkbox
  cy.get('[data-testid="terms"]').check();
  
  // Radio button
  cy.get('[data-testid="plan-premium"]').check();
  
  // Textarea
  cy.get('[data-testid="message"]').type('Este es un mensaje de prueba');
  
  // Submit
  cy.get('[data-testid="submit"]').click();
  
  // Verificar éxito
  cy.contains('Formulario enviado exitosamente').should('be.visible');
});
```

### Comandos de Assertion

```typescript
// SHOULD - Assertion principal
cy.get('button').should('be.visible');
cy.get('button').should('not.exist');
cy.get('button').should('have.class', 'active');

// Encadenar assertions
cy.get('input')
  .should('be.visible')
  .and('have.value', 'Hello')
  .and('not.be.disabled');

// Assertions comunes
.should('exist')              // Elemento existe
.should('not.exist')          // No existe
.should('be.visible')         // Es visible
.should('not.be.visible')     // No es visible (pero existe)
.should('be.hidden')          // Está oculto
.should('be.enabled')         // Está habilitado
.should('be.disabled')        // Está deshabilitado
.should('be.checked')         // Checkbox/radio checked
.should('not.be.checked')     // No checked
.should('be.selected')        // Option seleccionada
.should('be.focused')         // Tiene foco

// Assertions de contenido
.should('have.text', 'Welcome')        // Texto exacto
.should('contain', 'Welcome')          // Contiene texto
.should('not.contain', 'Error')        // No contiene
.should('have.html', '<strong>Hi</strong>') // HTML exacto
.should('include.text', 'partial')     // Texto parcial

// Assertions de valores
.should('have.value', 'value')         // Input value
.should('not.have.value', '')          // No vacío
.should('have.attr', 'href')           // Tiene atributo
.should('have.attr', 'href', '/docs')  // Atributo con valor
.should('have.css', 'color', 'rgb(255, 0, 0)') // CSS property

// Assertions de clase
.should('have.class', 'active')        // Tiene clase
.should('not.have.class', 'disabled')  // No tiene clase

// Assertions de cantidad
.should('have.length', 5)              // Cantidad exacta
.should('have.length.greaterThan', 3)  // Más de 3
.should('have.length.lessThan', 10)    // Menos de 10
.should('have.length.at.least', 1)     // Al menos 1

// Assertions de URL
cy.url().should('include', '/docs');
cy.url().should('eq', 'http://localhost:3000/about');
cy.url().should('match', /\/user\/\d+/); // Regex

// Assertions de título
cy.title().should('include', 'Docusaurus');
cy.title().should('eq', 'Docusaurus');

// Assertions personalizadas
cy.get('[data-testid="price"]').should(($el) => {
  const price = parseFloat($el.text().replace('$', ''));
  expect(price).to.be.greaterThan(0);
  expect(price).to.be.lessThan(1000);
});
```

**Ejemplo de assertions complejas:**

```typescript
it('debe validar estado del usuario', () => {
  cy.get('[data-testid="user-card"]').should(($card) => {
    // Múltiples assertions en callback
    expect($card).to.be.visible;
    expect($card.find('.user-name')).to.contain('Juan');
    expect($card.find('.user-status')).to.have.class('online');
    
    const email = $card.find('.user-email').text();
    expect(email).to.match(/^[\w.-]+@[\w.-]+\.\w+$/);
  });
});
```

### Comandos de Espera

```typescript
// WAIT - Esperar tiempo fijo (evitar si es posible)
cy.wait(1000); // Espera 1 segundo (1000ms)

// WAIT - Esperar request (mejor opción)
cy.intercept('GET', '/api/users').as('getUsers');
cy.visit('/users');
cy.wait('@getUsers'); // Espera a que request complete

// WAIT - Múltiples requests
cy.wait(['@getUsers', '@getPosts']); // Espera a ambos

// WAIT con assertions
cy.wait('@getUsers').its('response.statusCode').should('eq', 200);

// Timeout en comandos
cy.get('[data-testid="slow-element"]', { timeout: 10000 })
  .should('be.visible'); // Espera hasta 10 segundos

// Configurar timeout global
Cypress.config('defaultCommandTimeout', 10000);
```

**Ejemplo de espera inteligente:**

```typescript
it('debe cargar datos de API', () => {
  // Setup intercept
  cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
  
  // Navegar
  cy.visit('/users');
  
  // Verificar loading
  cy.get('[data-testid="loading"]').should('be.visible');
  
  // Esperar a que request complete
  cy.wait('@getUsers');
  
  // Verificar que loading desapareció
  cy.get('[data-testid="loading"]').should('not.exist');
  
  // Verificar datos cargados
  cy.get('[data-testid="user-list"]')
    .find('li')
    .should('have.length', 5);
});
```

---

## Ejemplo Completo: Navegación de Sidebar

Combinemos todo lo aprendido en un test real de navegación:

```typescript
describe('Sidebar Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/docs');
  });

  it('debe expandir/colapsar categorías', () => {
    // Verificar categoría colapsada inicialmente
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'false');
    
    // Click para expandir
    cy.get('[data-testid="category-tutorial"]').click();
    
    // Verificar expandida
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'true');
    
    // Verificar items visibles
    cy.get('[data-testid="category-tutorial"]')
      .parent()
      .find('ul li')
      .should('have.length.at.least', 1)
      .and('be.visible');
    
    // Click nuevamente para colapsar
    cy.get('[data-testid="category-tutorial"]').click();
    
    // Verificar colapsada
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'false');
  });

  it('debe resaltar página actual', () => {
    // Navegar a página específica
    cy.visit('/docs/intro');
    
    // Verificar que item está activo
    cy.get('[data-testid="sidebar-item-intro"]')
      .should('have.class', 'active')
      .or('have.attr', 'aria-current', 'page');
    
    // Verificar color de highlight (CSS)
    cy.get('[data-testid="sidebar-item-intro"]')
      .should('have.css', 'background-color')
      .and('not.eq', 'rgba(0, 0, 0, 0)'); // No transparente
  });

  it('debe mantener scroll position al navegar', () => {
    // Scroll hasta abajo del sidebar
    cy.get('[data-testid="sidebar"]').scrollTo('bottom');
    
    // Guardar posición de scroll
    cy.get('[data-testid="sidebar"]').then(($sidebar) => {
      const scrollTop = $sidebar[0].scrollTop;
      expect(scrollTop).to.be.greaterThan(100);
    });
    
    // Click en último link
    cy.get('[data-testid="sidebar"]')
      .find('a')
      .last()
      .click();
    
    // Volver atrás
    cy.go('back');
    
    // Verificar que scroll se mantuvo (aproximadamente)
    cy.get('[data-testid="sidebar"]').then(($sidebar) => {
      const scrollTop = $sidebar[0].scrollTop;
      expect(scrollTop).to.be.greaterThan(50); // Aproximado
    });
  });

  it('debe ser responsive en mobile', () => {
    // Cambiar a viewport mobile
    cy.viewport('iphone-x');
    
    // Sidebar debe estar oculto inicialmente
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
    
    // Botón de menú debe ser visible
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    
    // Abrir menu mobile
    cy.get('[data-testid="mobile-menu-button"]').click();
    
    // Sidebar debe aparecer
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Click en overlay para cerrar
    cy.get('[data-testid="sidebar-overlay"]').click({ force: true });
    
    // Sidebar debe ocultarse
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
  });

  it('debe buscar en sidebar', () => {
    // Abrir búsqueda de sidebar
    cy.get('[data-testid="sidebar-search"]').click();
    
    // Escribir término
    cy.get('[data-testid="sidebar-search-input"]')
      .should('be.focused')
      .type('testing');
    
    // Verificar resultados filtrados
    cy.get('[data-testid="sidebar"]')
      .find('a:visible')
      .each(($link) => {
        // Cada link visible debe contener "testing" (case-insensitive)
        expect($link.text().toLowerCase()).to.include('testing');
      });
    
    // Limpiar búsqueda
    cy.get('[data-testid="sidebar-search-clear"]').click();
    
    // Verificar que todos los items vuelven
    cy.get('[data-testid="sidebar"]')
      .find('a')
      .should('have.length.greaterThan', 10);
  });
});
```

---

## Mejores Prácticas con Selectores y Comandos

### 1. ✅ Preferir data-testid

```typescript
// ❌ Frágil
cy.get('.btn.btn-primary.submit-btn').click();

// ✅ Estable
cy.get('[data-testid="submit-button"]').click();
```

### 2. ✅ Encadenar comandos

```typescript
// ❌ Repetitivo
cy.get('[data-testid="form"]');
cy.get('[data-testid="form"]').find('input').type('text');
cy.get('[data-testid="form"]').find('button').click();

// ✅ Encadenado
cy.get('[data-testid="form"]')
  .find('input').type('text')
  .parents('form')
  .find('button').click();
```

### 3. ✅ Usar alias para elementos reutilizados

```typescript
// ✅ Con alias
cy.get('[data-testid="user-list"]').as('userList');
cy.get('[data-testid="search"]').as('search');

cy.get('@search').type('Alice');
cy.get('@userList').should('contain', 'Alice');

cy.get('@search').clear().type('Bob');
cy.get('@userList').should('contain', 'Bob');
```

### 4. ✅ Evitar waits fijos

```typescript
// ❌ Wait arbitrario
cy.get('button').click();
cy.wait(3000);
cy.get('[data-testid="result"]');

// ✅ Wait inteligente
cy.get('button').click();
cy.get('[data-testid="result"]', { timeout: 10000 })
  .should('be.visible');
```

### 5. ✅ Ser específico con contains

```typescript
// ❌ Ambiguo
cy.contains('Submit'); // Puede matchear múltiples elementos

// ✅ Específico
cy.contains('button', 'Submit'); // Solo botones
cy.get('form').contains('Submit'); // Dentro de form específico
```

---

## Recursos Adicionales

- **[Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)** - Guía oficial
- **[Selector Playground](https://docs.cypress.io/guides/core-concepts/cypress-studio#Selector-Playground)** - Herramienta visual
- **[Custom Commands](./custom-commands)** - Crea tus propios comandos

:::tip Práctica
Experimenta con los comandos en el Selector Playground de Cypress (`cypress open`). Puedes testear selectores en tiempo real antes de escribirlos en tus tests.
:::
```
