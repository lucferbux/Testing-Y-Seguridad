---
sidebar_position: 9
title: "Intercepción de Requests"
---

# Intercepción de Requests

## cy.intercept()

Interceptar requests HTTP para:
- Mockear respuestas
- Verificar requests
- Simular errores
- Control de timing

## Ejemplo: Mockear API

```typescript
describe('API Mocking', () => {
  
  it('debe cargar usuarios desde API', () => {
    // Interceptar request y mockear respuesta
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }).as('getUsers');
    
    cy.visit('/users');
    
    // Esperar a que request se complete
    cy.wait('@getUsers');
    
    // Verificar que datos se muestran
    cy.contains('Alice').should('be.visible');
    cy.contains('Bob').should('be.visible');
  });

  it('debe manejar error de API', () => {
    cy.intercept('GET', '/api/users', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('getUsersError');
    
    cy.visit('/users');
    cy.wait('@getUsersError');
    
    // Verificar mensaje de error
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Error loading users');
  });

  it('debe verificar payload de POST', () => {
    cy.intercept('POST', '/api/users').as('createUser');
    
    cy.visit('/users/new');
    
    // Llenar formulario
    cy.get('[data-testid="name-input"]').type('Charlie');
    cy.get('[data-testid="email-input"]').type('charlie@example.com');
    cy.get('[data-testid="submit"]').click();
    
    // Verificar request
    cy.wait('@createUser').its('request.body').should('deep.equal', {
      name: 'Charlie',
      email: 'charlie@example.com',
    });
  });
});
```

## Ejemplo: Simular Latencia

```typescript
describe('Loading States', () => {
  
  it('debe mostrar loading durante fetch', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.reply((res) => {
        // Delay de 2 segundos
        res.delay = 2000;
        res.send({
          statusCode: 200,
          body: [{ id: 1, name: 'Alice' }],
        });
      });
    }).as('getUsers');
    
    cy.visit('/users');
    
    // Verificar loading
    cy.get('[data-testid="loading"]').should('be.visible');
    
    // Esperar respuesta
    cy.wait('@getUsers');
    
    // Verificar loading desapareció
    cy.get('[data-testid="loading"]').should('not.exist');
    cy.contains('Alice').should('be.visible');
  });
});
```

## Fixtures

```typescript
// cypress/fixtures/users.json
[
  {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  },
  {
    "id": 2,
    "name": "Bob",
    "email": "bob@example.com"
  }
]
```

```typescript
describe('Using Fixtures', () => {
  
  it('debe usar datos de fixture', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
    
    cy.visit('/users');
    cy.wait('@getUsers');
    
    cy.contains('Alice').should('be.visible');
    cy.contains('Bob').should('be.visible');
  });
});
```
