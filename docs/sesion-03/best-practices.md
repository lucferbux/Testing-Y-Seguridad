---
sidebar_position: 11
title: "Best Practices"
---

# Best Practices

## 1. Don't Test External Sites

```typescript
// ❌ Mal
it('should link to GitHub', () => {
  cy.visit('https://github.com/facebook/react');
  cy.contains('React');
});

// ✅ Bien
it('should have GitHub link', () => {
  cy.get('[data-testid="github-link"]')
    .should('have.attr', 'href')
    .and('include', 'github.com');
});
```

## 2. Use data-testid

```typescript
// ❌ Mal: Selector frágil
cy.get('.btn.btn-primary.submit-button');

// ✅ Bien: Selector estable
cy.get('[data-testid="submit-button"]');
```

## 3. No Uses Waits Fijos

```typescript
// ❌ Mal
cy.wait(5000); // Espera arbitraria

// ✅ Bien
cy.get('[data-testid="data"]', { timeout: 10000 }).should('exist');
```

## 4. Agrupa Tests Relacionados

```typescript
describe('User Authentication', () => {
  describe('Login', () => {
    it('debe hacer login exitoso', () => {});
    it('debe mostrar error con credenciales incorrectas', () => {});
  });

  describe('Logout', () => {
    it('debe hacer logout', () => {});
  });
});
```

## 5. Limpia Estado Entre Tests

```typescript
describe('Tests', () => {
  
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearDatabase(); // Custom command
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

## 6. Tests Independientes

```typescript
// ❌ Mal: Tests dependen del orden
it('creates user', () => {
  cy.createUser('John');
});

it('finds user', () => {
  cy.findUser('John'); // Depende del test anterior
});

// ✅ Bien: Cada test es independiente
it('finds user', () => {
  cy.createUser('John');
  cy.findUser('John');
});
```

## 7. Usa Aliases

```typescript
it('should work with aliases', () => {
  cy.get('[data-testid="user-list"]').as('userList');
  cy.get('[data-testid="search-input"]').as('searchInput');
  
  cy.get('@searchInput').type('Alice');
  cy.get('@userList').should('contain', 'Alice');
});
```

## 8. Screenshots en Errores

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    screenshotOnRunFailure: true,
    video: true,
  },
});
```

## 9. Organiza Tests por Feature

```
cypress/e2e/
├── auth/
│   ├── login.cy.ts
│   ├── logout.cy.ts
│   └── registration.cy.ts
├── blog/
│   ├── posts-list.cy.ts
│   └── post-detail.cy.ts
└── search/
    └── search.cy.ts
```

## 10. Page Object Pattern (Opcional)

```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login');
  }

  fillEmail(email: string) {
    cy.get('[data-testid="email-input"]').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('[data-testid="password-input"]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-testid="submit-button"]').click();
    return this;
  }

  login(email: string, password: string) {
    this.fillEmail(email).fillPassword(password).submit();
  }
}

// Uso
import { LoginPage } from '../support/pages/LoginPage';

describe('Login', () => {
  const loginPage = new LoginPage();

  it('should login', () => {
    loginPage.visit();
    loginPage.login('user@example.com', 'password123');
  });
});
```
