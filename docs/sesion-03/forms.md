---
sidebar_position: 7
title: "Formularios"
---

Los formularios son una de las partes más críticas de cualquier aplicación. Vamos a ver cómo testearlos en el proyecto **Taller-Testing-Security**.

## Formularios del Proyecto

El proyecto tiene estos formularios principales:

| Formulario | Ruta | Campos |
|------------|------|--------|
| Login | `/login` | email, password |
| Admin AboutMe | `/admin` | name, bio, location |
| Admin Projects | `/admin` | title, description, technologies |

---

## Comandos para Formularios

| Comando | Descripción |
|---------|-------------|
| `.type('texto')` | Escribe texto en un input |
| `.clear()` | Borra el contenido |
| `.check()` / `.uncheck()` | Checkbox/Radio |
| `.select('valor')` | Select dropdown |
| `.submit()` | Submit del form |

---

## Test del Formulario de Login

### Setup básico

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Formulario de Login', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Campos del formulario', () => {
    
    it('debe mostrar los campos requeridos', () => {
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[type="submit"]').should('be.visible');
    });

    it('debe tener los campos vacíos inicialmente', () => {
      cy.get('input[name="email"]').should('have.value', '');
      cy.get('input[name="password"]').should('have.value', '');
    });
  });

  describe('Entrada de datos', () => {
    
    it('debe escribir en el campo email', () => {
      cy.get('input[name="email"]')
        .type('test@example.com')
        .should('have.value', 'test@example.com');
    });

    it('debe escribir en el campo password', () => {
      cy.get('input[name="password"]')
        .type('password123')
        .should('have.value', 'password123');
    });

    it('debe limpiar y reescribir', () => {
      cy.get('input[name="email"]')
        .type('primero@test.com')
        .clear()
        .type('segundo@test.com')
        .should('have.value', 'segundo@test.com');
    });
  });

  describe('Validación', () => {
    
    it('debe requerir email', () => {
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // Verificar que no navega
      cy.url().should('include', '/login');
    });

    it('debe requerir password', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[type="submit"]').click();
      
      cy.url().should('include', '/login');
    });

    it('debe validar formato de email', () => {
      cy.get('input[name="email"]').type('invalidemail');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      // El email inválido no debe pasar validación HTML5
      cy.get('input[name="email"]:invalid').should('exist');
    });
  });

  describe('Submit con API', () => {
    
    it('debe enviar credenciales correctas', () => {
      cy.mockLoginApi({ success: true });
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginSuccess').its('request.body').should('deep.include', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      cy.url().should('include', '/admin');
    });

    it('debe mostrar error con credenciales incorrectas', () => {
      cy.mockLoginApi({ success: false });
      
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpass');
      cy.get('input[type="submit"]').click();
      
      cy.wait('@loginError');
      cy.contains(/invalid|error|incorrect/i).should('be.visible');
    });
  });
});
```

---

## Opciones de .type()

El comando `.type()` tiene varias opciones útiles:

```typescript
// Typing normal
cy.get('input').type('texto normal');

// Teclas especiales
cy.get('input').type('{enter}');           // Enter
cy.get('input').type('{backspace}');       // Borrar
cy.get('input').type('{selectall}');       // Seleccionar todo
cy.get('input').type('{del}');             // Delete

// Combinaciones
cy.get('input').type('{ctrl+a}');          // Ctrl+A (seleccionar todo)
cy.get('input').type('{cmd+c}');           // Cmd+C (copiar)

// Escribir lento (para debugging)
cy.get('input').type('texto', { delay: 100 });

// Forzar en elemento no enfocable
cy.get('input').type('texto', { force: true });
```

### Secuencias de teclas

```typescript
it('debe borrar y reemplazar texto', () => {
  cy.get('input[name="email"]')
    .type('viejo@email.com')
    .type('{selectall}')
    .type('nuevo@email.com')
    .should('have.value', 'nuevo@email.com');
});

it('debe navegar con teclado', () => {
  cy.get('input[name="email"]').type('test@example.com');
  cy.get('input[name="email"]').type('{tab}');
  cy.get('input[name="password"]').should('be.focused');
});
```

---

## Test de Formulario Admin

El formulario de admin permite editar el perfil del usuario.

```typescript
// cypress/e2e/admin/profile.cy.ts

describe('Formulario de Perfil Admin', () => {
  
  beforeEach(() => {
    // Mockear login y dashboard
    cy.mockLoginApi({ success: true });
    cy.mockDashboardApi();
    
    // Hacer login primero
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginSuccess');
    cy.url().should('include', '/admin');
  });

  it('debe mostrar el formulario de aboutme', () => {
    cy.get('[data-testid="aboutme-form"]').should('be.visible');
  });

  it('debe cargar datos existentes', () => {
    cy.wait('@getAboutMe');
    
    // Los campos deben tener valores precargados
    cy.get('input[name="name"]').should('not.have.value', '');
  });

  it('debe poder editar el nombre', () => {
    cy.wait('@getAboutMe');
    
    // Mockear update
    cy.intercept('PUT', '**/v1/aboutme/**', { statusCode: 200 }).as('updateAboutMe');
    
    cy.get('input[name="name"]')
      .clear()
      .type('Nuevo Nombre');
    
    cy.contains('button', /save|guardar/i).click();
    
    cy.wait('@updateAboutMe').its('request.body').should('include', {
      name: 'Nuevo Nombre'
    });
  });

  it('debe manejar textarea multilinea', () => {
    cy.get('textarea[name="bio"]')
      .clear()
      .type('Línea 1{enter}Línea 2{enter}Línea 3')
      .should('contain.value', 'Línea 1');
  });
});
```

---

## Checkbox y Radio

```typescript
describe('Formulario con checkbox y radio', () => {
  
  it('debe marcar checkbox', () => {
    cy.get('input[type="checkbox"]').check();
    cy.get('input[type="checkbox"]').should('be.checked');
  });

  it('debe desmarcar checkbox', () => {
    cy.get('input[type="checkbox"]').check();
    cy.get('input[type="checkbox"]').uncheck();
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('debe seleccionar radio button', () => {
    cy.get('input[type="radio"][value="opcion1"]').check();
    cy.get('input[type="radio"][value="opcion1"]').should('be.checked');
    cy.get('input[type="radio"][value="opcion2"]').should('not.be.checked');
  });

  it('debe marcar múltiples checkboxes', () => {
    cy.get('input[type="checkbox"]').check(['tech1', 'tech2']);
  });
});
```

---

## Select Dropdowns

```typescript
describe('Formulario con select', () => {
  
  it('debe seleccionar por valor', () => {
    cy.get('select[name="country"]').select('ES');
    cy.get('select[name="country"]').should('have.value', 'ES');
  });

  it('debe seleccionar por texto visible', () => {
    cy.get('select[name="country"]').select('España');
  });

  it('debe seleccionar múltiples valores', () => {
    cy.get('select[multiple]').select(['opcion1', 'opcion2']);
  });
});
```

---

## Usando Fixtures para Datos

```typescript
describe('Login con datos de fixture', () => {
  
  beforeEach(() => {
    cy.visit('/login');
  });

  it('debe hacer login con usuario válido', () => {
    cy.mockLoginApi({ success: true });
    
    cy.fixture('users').then((users) => {
      cy.get('input[name="email"]').type(users.validUser.email);
      cy.get('input[name="password"]').type(users.validUser.password);
      cy.get('input[type="submit"]').click();
    });
    
    cy.wait('@loginSuccess');
    cy.url().should('include', '/admin');
  });

  it('debe fallar con usuario inválido', () => {
    cy.mockLoginApi({ success: false });
    
    cy.fixture('users').then((users) => {
      cy.get('input[name="email"]').type(users.invalidUser.email);
      cy.get('input[name="password"]').type(users.invalidUser.password);
      cy.get('input[type="submit"]').click();
    });
    
    cy.wait('@loginError');
    cy.url().should('include', '/login');
  });
});
```

---

## Verificar Estado del Formulario

### Assertions comunes

```typescript
// Valor actual
cy.get('input').should('have.value', 'texto');

// Campo vacío
cy.get('input').should('have.value', '');

// Placeholder
cy.get('input').should('have.attr', 'placeholder', 'Email');

// Deshabilitado
cy.get('button').should('be.disabled');

// Habilitado
cy.get('button').should('be.enabled');

// Requerido
cy.get('input').should('have.attr', 'required');

// Tipo de input
cy.get('input').should('have.attr', 'type', 'password');

// Válido/Inválido (HTML5)
cy.get('input:valid').should('exist');
cy.get('input:invalid').should('exist');
```

---

## Errores Comunes

### El input no recibe el texto

```typescript
// ❌ El elemento puede no estar listo
cy.get('input').type('texto');

// ✅ Esperar a que sea interactuable
cy.get('input').should('be.visible').type('texto');

// ✅ Forzar si es necesario
cy.get('input').type('texto', { force: true });
```

### El formulario hace submit antes de tiempo

```typescript
// ❌ Enter dispara submit
cy.get('input').type('texto{enter}');

// ✅ Evitar enter si no es intencional
cy.get('input').type('texto');
cy.get('button[type="submit"]').click();
```

### Clear no funciona

```typescript
// ❌ Input controlado no se limpia
cy.get('input').clear();

// ✅ Seleccionar todo y sobrescribir
cy.get('input').type('{selectall}nuevo texto');
```

---

## Resumen

| Acción | Comando |
|--------|---------|
| Escribir texto | `.type('texto')` |
| Borrar contenido | `.clear()` |
| Marcar checkbox | `.check()` |
| Desmarcar checkbox | `.uncheck()` |
| Seleccionar dropdown | `.select('valor')` |
| Submit formulario | `.submit()` o click en button |
| Verificar valor | `.should('have.value', 'x')` |
| Verificar checked | `.should('be.checked')` |

---

## Próximos Pasos

Con los formularios dominados:

1. **[Intercepción](./intercept)** - Mockear APIs
2. **[Custom Commands](./custom-commands)** - Reutilizar lógica de login
