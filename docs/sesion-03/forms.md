---
sidebar_position: 7
title: "Testing de Formularios"
---

# Testing de Formularios

## Ejemplo: Formulario de Búsqueda

**Test: cypress/e2e/search.cy.ts**

```typescript
describe('Search Functionality', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });

  it('debe buscar y mostrar resultados', () => {
    // Abrir búsqueda
    cy.get('[data-testid="search-button"]').click();
    
    // Escribir en input
    cy.get('[data-testid="search-input"]')
      .should('be.focused')
      .type('testing');
    
    // Verificar sugerencias
    cy.get('[data-testid="search-results"]')
      .should('be.visible')
      .find('li')
      .should('have.length.at.least', 1);
    
    // Click en resultado
    cy.get('[data-testid="search-results"]')
      .find('li')
      .first()
      .click();
    
    // Verificar navegación
    cy.url().should('include', '/docs');
  });

  it('debe mostrar mensaje cuando no hay resultados', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('asdfghjklñ');
    
    cy.get('[data-testid="search-results"]')
      .should('contain', 'No results found');
  });

  it('debe limpiar búsqueda', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('testing');
    
    // Click en botón limpiar
    cy.get('[data-testid="search-clear"]').click();
    
    // Verificar que input está vacío
    cy.get('[data-testid="search-input"]').should('have.value', '');
  });

  it('debe cerrar con tecla Escape', () => {
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-input"]').type('{esc}');
    
    // Verificar que modal está cerrado
    cy.get('[data-testid="search-modal"]').should('not.exist');
  });
});
```

## Ejemplo: Formulario de Contacto

**Test: cypress/e2e/contact-form.cy.ts**

```typescript
describe('Contact Form', () => {
  
  beforeEach(() => {
    cy.visit('/contact');
  });

  it('debe enviar formulario correctamente', () => {
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="message-textarea"]').type('This is a test message');
    
    // Aceptar términos
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Submit
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar mensaje de éxito
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain', 'Thank you');
  });

  it('debe validar email inválido', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar error
    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'valid email');
  });

  it('debe validar campos requeridos', () => {
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar errores
    cy.get('[data-testid="name-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="message-error"]').should('be.visible');
  });

  it('debe deshabilitar submit mientras envía', () => {
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="message-textarea"]').type('Message');
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Submit
    cy.get('[data-testid="submit-button"]').click();
    
    // Verificar que botón está disabled
    cy.get('[data-testid="submit-button"]')
      .should('be.disabled');
  });

  it('debe mostrar contador de caracteres', () => {
    const message = 'Hello world';
    cy.get('[data-testid="message-textarea"]').type(message);
    
    cy.get('[data-testid="char-count"]')
      .should('contain', message.length);
  });
});
```
