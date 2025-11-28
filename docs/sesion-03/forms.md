---
sidebar_position: 7
title: "Testing de Formularios"
---

Los formularios son uno de los elementos más críticos de una aplicación web. Cypress ofrece APIs intuitivas para interactuar con inputs, validaciones y envíos de formulario.

## Ejemplo Real: Formulario de Login (Taller-Testing-Security)

El proyecto tiene un formulario de login en `/login` que usa inputs de email y password.

### Estructura del Formulario

```tsx
// ui/src/components/routes/Login.tsx (simplificado)
<form onSubmit={doLogin}>
  <input
    name="email"
    type="email"
    placeholder="Email"
    value={username}
    onChange={onChangeUsername}
  />
  <input
    name="password"
    type="password"
    placeholder="Password"
    value={password}
    onChange={onChangePassword}
  />
  <input type="submit" value="Log In" />
  {errorMsg && <ErrorDescription>{errorMsg}</ErrorDescription>}
</form>
```

### Test Completo del Formulario de Login

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login Page', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('UI Elements', () => {
    
    it('debe mostrar el formulario de login correctamente', () => {
      // Verificar que los elementos del formulario existen
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[type="submit"]').should('be.visible');
    });
  });

  describe('Validación de Formulario', () => {
    
    it('debe mostrar error cuando los campos están vacíos', () => {
      // Click en submit sin llenar campos
      cy.get('input[type="submit"]').click();
      
      // Verificar mensaje de error
      cy.contains(/username|password|email|usuario|contraseña/i).should('be.visible');
    });

    it('debe mostrar error con solo email', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[type="submit"]').click();
      
      // Debe mostrar error porque falta password
      cy.contains(/username|password|email|usuario|contraseña/i).should('be.visible');
    });
  });

  describe('Login con API Mockeada', () => {
    
    /**
     * IMPORTANTE: La app usa jwt_decode para extraer información del token,
     * por lo que necesitamos usar un JWT válido en los mocks.
     * 
     * Este JWT tiene un payload con:
     * { "_id": "507f1f77bcf86cd799439011", "email": "test@example.com", "iat": 1700000000, "exp": 1900000000 }
     */
    const validJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.Qs8nKjZ7GJXK7YjA_rOqwM7hK5dYWLNg8c3d_mLc8Z0';

    it('debe hacer login exitoso y redirigir a /admin', () => {
      // Mockear la API de login con un JWT válido
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: { token: validJwtToken }
      }).as('loginSuccess');
      
      // Llenar formulario
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Esperar a que la request se complete
      cy.wait('@loginSuccess');
      
      // Verificar que la petición se hizo correctamente
      cy.get('@loginSuccess').its('request.body').should('include', 'email=test%40example.com');
      
      // Nota: La redirección depende de que jwt_decode procese el token correctamente
      // El token se almacena en localStorage como objeto JSON con estructura específica
    });

    it('debe mostrar error con credenciales inválidas', () => {
      cy.intercept('POST', '**/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginError');
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Verificar que seguimos en /login
      cy.url().should('include', '/login');
      
      // Verificar mensaje de error
      cy.contains(/invalid|error|inválid/i).should('be.visible');
    });
  });

  describe('Usando Fixtures', () => {
    
    it('debe hacer login con datos de fixture', () => {
      // Usar custom command mockLoginApi que incluye un JWT válido
      cy.mockLoginApi({ success: true });
      
      cy.fixture('users').then((users) => {
        cy.get('input[name="email"]').type(users.validUser.email);
        cy.get('input[name="password"]').type(users.validUser.password);
        cy.get('input[type="submit"]').click();
        
        cy.wait('@loginSuccess');
        cy.url().should('include', '/admin');
      });
    });
  });
});
```

## Ejemplo: Formulario de Admin (Crear Proyecto)

El proyecto tiene un formulario en `/admin` para crear nuevos proyectos.

```typescript
// cypress/e2e/admin/create-project.cy.ts

describe('Admin - Crear Proyecto', () => {
  
  beforeEach(() => {
    // Mockear login y APIs necesarias
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { token: 'admin-token' }
    }).as('login');
    
    // Login primero
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="password"]').type('admin123');
    cy.get('input[type="submit"]').click();
    cy.wait('@login');
  });

  it('debe crear un nuevo proyecto', () => {
    // Mockear el POST de proyecto
    cy.intercept('POST', '**/v1/projects', {
      statusCode: 200,
      body: {
        _id: 'new-project-id',
        title: 'Nuevo Proyecto E2E',
        description: 'Creado en test E2E',
        version: '1.0.0',
        link: 'https://github.com/test',
        tag: 'testing',
        timestamp: Date.now()
      }
    }).as('createProject');
    
    // Mockear también el dashboard para cuando redirija
    cy.intercept('GET', '**/v1/aboutme/', { fixture: 'aboutme.json' });
    cy.intercept('GET', '**/v1/projects/', { fixture: 'projects.json' });
    
    // Llenar el formulario
    cy.get('input[name="title"]').type('Nuevo Proyecto E2E');
    cy.get('input[name="description"]').type('Creado en test E2E');
    cy.get('input[name="link"]').type('https://github.com/test');
    cy.get('input[name="tags"]').type('testing');
    cy.get('input[name="version"]').type('1.0.0');
    
    // Submit
    cy.get('input[type="submit"]').click();
    
    // Verificar request
    cy.wait('@createProject').its('request.body').should((body) => {
      expect(body).to.have.property('title', 'Nuevo Proyecto E2E');
      expect(body).to.have.property('description', 'Creado en test E2E');
    });
    
    // Debería redirigir al dashboard
    cy.url().should('include', '/dashboard');
  });

  it('debe deshabilitar submit con campos vacíos', () => {
    // El botón submit debería estar deshabilitado si faltan campos
    cy.get('input[type="submit"]').should('be.disabled');
    
    // Llenar solo algunos campos
    cy.get('input[name="title"]').type('Solo Titulo');
    
    // Aún debería estar deshabilitado
    cy.get('input[type="submit"]').should('be.disabled');
  });

  it('debe poder resetear el formulario', () => {
    // Llenar campos
    cy.get('input[name="title"]').type('Proyecto a borrar');
    cy.get('input[name="description"]').type('Descripción a borrar');
    
    // Click en reset
    cy.get('input[type="reset"]').click();
    
    // Verificar que los campos están vacíos
    cy.get('input[name="title"]').should('have.value', '');
    cy.get('input[name="description"]').should('have.value', '');
  });
});
```

## Técnicas de Testing de Formularios

### 1. Llenado de Inputs

```typescript
// Texto simple
cy.get('input[name="email"]').type('user@example.com');

// Limpiar antes de escribir
cy.get('input[name="email"]').clear().type('new@example.com');

// Caracteres especiales
cy.get('input[name="password"]').type('p@ssw0rd!{enter}');

// Typing lento (útil para debugging)
cy.get('input').type('slow typing', { delay: 100 });
```

### 2. Verificaciones de Estado

```typescript
// Verificar valor
cy.get('input[name="email"]').should('have.value', 'user@example.com');

// Verificar que está vacío
cy.get('input[name="email"]').should('have.value', '');

// Verificar placeholder
cy.get('input[name="email"]').should('have.attr', 'placeholder', 'Email');

// Verificar disabled
cy.get('button[type="submit"]').should('be.disabled');
cy.get('button[type="submit"]').should('not.be.disabled');
```

### 3. Interacción con Checkboxes y Radios

```typescript
// Checkbox
cy.get('[data-testid="terms-checkbox"]').check();
cy.get('[data-testid="terms-checkbox"]').uncheck();
cy.get('[data-testid="terms-checkbox"]').should('be.checked');

// Radio buttons
cy.get('[data-testid="option-1"]').check();
cy.get('[data-testid="option-1"]').should('be.checked');
```

### 4. Selects y Dropdowns

```typescript
// Select nativo
cy.get('select[name="country"]').select('Spain');
cy.get('select[name="country"]').select('ES'); // Por value

// Verificar selección
cy.get('select[name="country"]').should('have.value', 'ES');
```

## Buenas Prácticas

1. **Usar selectores semánticos**: `input[name="email"]` en vez de clases CSS
2. **Mockear APIs**: No depender de backend real para tests de UI
3. **Verificar estados**: Loading, success, error
4. **Limpiar estado**: Usar `beforeEach` para reset
5. **Tests aislados**: Cada test debe poder ejecutarse solo
