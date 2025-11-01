---
sidebar_position: 5
title: "Primer Test con Cypress"
---

# Primer Test con Cypress

## Estructura Básica

```typescript
describe('Mi primer test', () => {
  it('debe visitar la página', () => {
    cy.visit('/');
    cy.contains('Welcome');
  });
});
```

## Ejemplo: Test de Homepage

**Test: cypress/e2e/homepage.cy.ts**

```typescript
describe('Homepage', () => {
  
  beforeEach(() => {
    // Visitar homepage antes de cada test
    cy.visit('/');
  });

  it('debe cargar correctamente', () => {
    // Verificar título
    cy.title().should('include', 'Docusaurus');
    
    // Verificar elemento principal
    cy.get('[data-testid="hero"]').should('be.visible');
  });

  it('debe mostrar navegación', () => {
    // Verificar links de navegación
    cy.get('nav').should('be.visible');
    cy.get('nav').find('a').should('have.length.at.least', 3);
  });

  it('debe tener meta descripción', () => {
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
  });

  it('debe responder en menos de 3 segundos', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
        const measure = win.performance.getEntriesByName('pageLoad')[0];
        expect(measure.duration).to.be.lessThan(3000);
      },
    });
  });
});
```

## Ejecutar Tests

```bash
# Modo interactivo (recomendado para desarrollo)
npm run cy:open

# Modo headless (CI/CD)
npm run cy:run

# Con navegador específico
npm run cy:run:chrome
```
