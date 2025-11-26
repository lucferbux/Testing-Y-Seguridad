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

## Ejemplo Real: Proyecto Taller-Testing-Security

### Fixtures del Proyecto

**cypress/fixtures/aboutme.json**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Lucas Fernandez",
  "birthday": 631152000000,
  "nationality": "Spanish",
  "job": "Software Developer",
  "github": "https://github.com/lucferbux"
}
```

**cypress/fixtures/projects.json**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Taller Testing & Security",
    "description": "Proyecto educativo sobre testing y seguridad en aplicaciones web",
    "version": "1.0.0",
    "link": "https://github.com/lucferbux/Taller-Testing-Security",
    "tag": "education",
    "timestamp": 1700000000000
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "title": "React Dashboard",
    "description": "Dashboard administrativo con React y TypeScript",
    "version": "2.1.0",
    "link": "https://github.com/lucferbux/react-dashboard",
    "tag": "react",
    "timestamp": 1699900000000
  }
]
```

### Test de Dashboard con Intercept

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard Page', () => {
  
  describe('Carga de Datos', () => {
    
    it('debe cargar y mostrar la información del perfil', () => {
      // Interceptar las APIs del dashboard
      cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' }).as('getAboutMe');
      cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' }).as('getProjects');
      
      cy.visit('/dashboard');
      
      // Esperar a que las APIs respondan
      cy.wait(['@getAboutMe', '@getProjects']);
      
      // Verificar que se muestra la información
      cy.contains('Lucas Fernandez').should('be.visible');
      cy.contains('Taller Testing & Security').should('be.visible');
    });

    it('debe mostrar loading mientras carga los datos', () => {
      // Mockear con delay para ver el loading
      cy.intercept('GET', '**/v1/aboutme/', {
        statusCode: 200,
        body: { name: 'Test' },
        delay: 1000
      }).as('getAboutMe');
      
      cy.intercept('GET', '**/v1/projects/', {
        statusCode: 200,
        body: [],
        delay: 1000
      }).as('getProjects');
      
      cy.visit('/dashboard');
      
      // Verificar que aparece el loader
      cy.contains(/loading|cargando/i).should('be.visible');
    });
  });

  describe('Manejo de Errores', () => {
    
    it('debe mostrar mensaje de error cuando la API falla', () => {
      cy.intercept('GET', '**/v1/aboutme/', { statusCode: 500 }).as('getAboutMeError');
      cy.intercept('GET', '**/v1/projects/', { statusCode: 500 }).as('getProjectsError');
      
      cy.visit('/dashboard');
      
      // Verificar mensaje de error
      cy.contains(/error/i).should('be.visible');
    });
  });
});
```

### Test de Login con Intercept

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login Page', () => {

  describe('Login con API Mockeada', () => {
    
    it('debe hacer login exitoso y redirigir a /admin', () => {
      // Mockear la API de login con respuesta exitosa
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: { token: 'test-jwt-token' }
      }).as('loginSuccess');
      
      cy.visit('/login');
      
      // Llenar formulario
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar a que la request se complete
      cy.wait('@loginSuccess');
      
      // Verificar redirección
      cy.url().should('include', '/admin');
      
      // Verificar que el token está guardado
      cy.window().its('localStorage.token').should('eq', 'test-jwt-token');
    });

    it('debe mostrar error con credenciales inválidas', () => {
      // Mockear respuesta de error
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginError');
      
      cy.visit('/login');
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Verificar que seguimos en /login
      cy.url().should('include', '/login');
      
      // Verificar mensaje de error
      cy.contains(/invalid|error|inválid/i).should('be.visible');
    });

    it('debe verificar el payload enviado', () => {
      cy.intercept('POST', '**/auth/login', (req) => {
        // Verificar que el body contiene las credenciales
        expect(req.body).to.include('email=test%40example.com');
        expect(req.body).to.include('password=password123');
        
        req.reply({ statusCode: 200, body: { token: 'test-token' } });
      }).as('loginRequest');
      
      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginRequest');
    });
  });
});
```

### Custom Command con Intercept

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('mockDashboardApi', (options?: { 
  aboutMe?: object; 
  projects?: object[];
  delay?: number;
  error?: boolean;
}) => {
  if (options?.error) {
    cy.intercept('GET', '**/v1/aboutme/', { statusCode: 500 }).as('getAboutMeError');
    cy.intercept('GET', '**/v1/projects/', { statusCode: 500 }).as('getProjectsError');
  } else {
    cy.intercept('GET', '**/v1/aboutme/', {
      statusCode: 200,
      body: options?.aboutMe || { name: 'Test User' },
      delay: options?.delay || 0
    }).as('getAboutMe');

    cy.intercept('GET', '**/v1/projects/', {
      statusCode: 200,
      body: options?.projects || [],
      delay: options?.delay || 0
    }).as('getProjects');
  }
});

// Uso en tests:
describe('Dashboard', () => {
  it('usa custom command para mockear', () => {
    cy.mockDashboardApi({ delay: 500 });
    cy.visit('/dashboard');
    cy.wait(['@getAboutMe', '@getProjects']);
  });
});
```
