---
sidebar_position: 10
title: "Custom Commands"
---

# Custom Commands

## Crear Custom Commands

**Archivo: cypress/support/commands.ts**

```typescript
// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="submit-button"]').click();
  cy.url().should('not.include', '/login');
});

// Type declarations
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
```

**Uso:**

```typescript
describe('Dashboard', () => {
  
  beforeEach(() => {
    cy.login('user@example.com', 'password123');
  });

  it('debe mostrar dashboard después de login', () => {
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });
});
```

## Más Custom Commands Útiles

```typescript
// Drag and drop
Cypress.Commands.add('drag', (sourceSelector: string, targetSelector: string) => {
  cy.get(sourceSelector).trigger('dragstart');
  cy.get(targetSelector).trigger('drop');
});

// Take screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name: string) => {
  const timestamp = new Date().getTime();
  cy.screenshot(`${name}-${timestamp}`);
});

// Wait for element and click
Cypress.Commands.add('waitAndClick', (selector: string, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible').click();
});

// Seed database (requires backend endpoint)
Cypress.Commands.add('seedDatabase', () => {
  cy.request('POST', '/api/test/seed');
});

// Clear database
Cypress.Commands.add('clearDatabase', () => {
  cy.request('POST', '/api/test/clear');
});

declare global {
  namespace Cypress {
    interface Chainable {
      drag(source: string, target: string): Chainable<void>;
      screenshotWithTimestamp(name: string): Chainable<void>;
      waitAndClick(selector: string, timeout?: number): Chainable<void>;
      seedDatabase(): Chainable<void>;
      clearDatabase(): Chainable<void>;
    }
  }
}
```
