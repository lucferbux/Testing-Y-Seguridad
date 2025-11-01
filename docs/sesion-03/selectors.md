---
sidebar_position: 6
title: "Selectores y Comandos"
---

# Selectores y Comandos

## Estrategia de Selectores

**Prioridad (de mejor a peor):**

1. **data-testid** (Recomendado)
```typescript
cy.get('[data-testid="submit-button"]');
```

2. **data-cy** (Alternativa)
```typescript
cy.get('[data-cy="user-name"]');
```

3. **Roles ARIA**
```typescript
cy.findByRole('button', { name: 'Submit' });
```

4. **ID únicos**
```typescript
cy.get('#username-input');
```

5. **Clases (evitar)**
```typescript
cy.get('.btn-primary'); // Frágil!
```

## Comandos Esenciales de Cypress

**Navegación:**
```typescript
cy.visit('/about');           // Navegar a URL
cy.go('back');               // Ir atrás
cy.go('forward');            // Ir adelante
cy.reload();                 // Recargar página
```

**Selección:**
```typescript
cy.get('.selector');         // Obtener elemento
cy.contains('text');         // Elemento con texto
cy.find('.child');           // Buscar hijo
cy.first();                  // Primer elemento
cy.last();                   // Último elemento
cy.eq(2);                    // Elemento por índice
cy.parent();                 // Elemento padre
cy.siblings();               // Hermanos
```

**Acciones:**
```typescript
cy.click();                  // Click
cy.dblclick();              // Doble click
cy.rightclick();            // Click derecho
cy.type('texto');           // Escribir
cy.clear();                 // Limpiar input
cy.check();                 // Check checkbox
cy.uncheck();               // Uncheck checkbox
cy.select('option');        // Select dropdown
cy.scrollTo('bottom');      // Scroll
```

**Aserciones:**
```typescript
.should('exist');           // Existe
.should('be.visible');      // Visible
.should('not.exist');       // No existe
.should('have.text', 'x');  // Tiene texto
.should('have.value', 'x'); // Tiene valor
.should('have.class', 'x'); // Tiene clase
.should('have.attr', 'x');  // Tiene atributo
.should('contain', 'x');    // Contiene texto
```

## Ejemplo Completo: Navegación

```typescript
describe('Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe navegar a la página de documentación', () => {
    // Click en link
    cy.get('[data-testid="nav-docs"]').click();
    
    // Verificar URL
    cy.url().should('include', '/docs');
    
    // Verificar contenido
    cy.contains('Documentation').should('be.visible');
  });

  it('debe mantener estado al navegar', () => {
    // Cambiar tema
    cy.get('[data-testid="theme-toggle"]').click();
    
    // Navegar
    cy.visit('/docs');
    
    // Verificar que tema persiste
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });

  it('debe usar breadcrumbs', () => {
    cy.visit('/docs/tutorial/basics');
    
    // Verificar breadcrumb
    cy.get('[aria-label="breadcrumb"]')
      .should('be.visible')
      .and('contain', 'Tutorial')
      .and('contain', 'Basics');
    
    // Click en breadcrumb
    cy.get('[aria-label="breadcrumb"]')
      .contains('Tutorial')
      .click();
    
    cy.url().should('include', '/docs/tutorial');
  });
});
```
