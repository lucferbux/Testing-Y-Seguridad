---
sidebar_position: 8
title: "Testing de Navegación"
---

# Testing de Navegación

## Ejemplo: Sidebar Navigation

**Test: cypress/e2e/sidebar.cy.ts**

```typescript
describe('Sidebar Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/docs');
  });

  it('debe expandir/colapsar categorías', () => {
    // Verificar categoría colapsada
    cy.get('[data-testid="category-tutorial"]')
      .should('have.attr', 'aria-expanded', 'false');
    
    // Expandir
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
  });

  it('debe resaltar página actual', () => {
    cy.visit('/docs/intro');
    
    cy.get('[data-testid="sidebar-item-intro"]')
      .should('have.class', 'active')
      .or('have.attr', 'aria-current', 'page');
  });

  it('debe mantener scroll position', () => {
    // Scroll hasta abajo
    cy.get('[data-testid="sidebar"]').scrollTo('bottom');
    
    // Click en link
    cy.get('[data-testid="sidebar"]')
      .find('a')
      .last()
      .click();
    
    // Volver atrás
    cy.go('back');
    
    // Verificar que mantiene posición (aproximada)
    cy.get('[data-testid="sidebar"]')
      .should(($el) => {
        const scrollTop = $el[0].scrollTop;
        expect(scrollTop).to.be.greaterThan(100);
      });
  });

  it('debe ser responsive', () => {
    // Mobile viewport
    cy.viewport('iphone-x');
    
    // Sidebar debe estar oculto
    cy.get('[data-testid="sidebar"]').should('not.be.visible');
    
    // Abrir menu mobile
    cy.get('[data-testid="mobile-menu-button"]').click();
    
    // Sidebar debe aparecer
    cy.get('[data-testid="sidebar"]').should('be.visible');
  });
});
```

## Ejemplo: Paginación

**Test: cypress/e2e/pagination.cy.ts**

```typescript
describe('Pagination', () => {
  
  beforeEach(() => {
    cy.visit('/blog');
  });

  it('debe navegar entre páginas', () => {
    // Verificar página 1
    cy.get('[data-testid="current-page"]').should('contain', '1');
    
    // Click en siguiente
    cy.get('[data-testid="next-page"]').click();
    
    // Verificar página 2
    cy.url().should('include', 'page=2');
    cy.get('[data-testid="current-page"]').should('contain', '2');
    
    // Verificar contenido cambió
    cy.get('[data-testid="blog-posts"]')
      .find('[data-testid="post"]')
      .should('have.length.at.least', 1);
  });

  it('debe deshabilitar botón en primera/última página', () => {
    // Primera página: previous disabled
    cy.get('[data-testid="prev-page"]').should('be.disabled');
    
    // Navegar a última página
    cy.get('[data-testid="last-page"]').click();
    
    // Última página: next disabled
    cy.get('[data-testid="next-page"]').should('be.disabled');
  });

  it('debe permitir salto directo a página', () => {
    cy.get('[data-testid="page-3"]').click();
    
    cy.url().should('include', 'page=3');
    cy.get('[data-testid="current-page"]').should('contain', '3');
  });
});
```
