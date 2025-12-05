---
sidebar_position: 6
title: "Selectores"
---

Los selectores son fundamentales para escribir tests mantenibles. Cypress recomienda usar atributos `data-*` en lugar de selectores frágiles como clases CSS.

## Jerarquía de Selectores

De mejor a peor práctica:

| Prioridad | Tipo | Ejemplo | Robustez |
|-----------|------|---------|----------|
| 1️⃣ | data-testid | `[data-testid="login-button"]` | ✅ Muy alta |
| 2️⃣ | data-cy | `[data-cy="submit"]` | ✅ Muy alta |
| 3️⃣ | Rol accesible | `button[role="submit"]` | ✅ Alta |
| 4️⃣ | Texto visible | `cy.contains('Login')` | ⚠️ Media |
| 5️⃣ | ID | `#login-button` | ⚠️ Media |
| 6️⃣ | Clase CSS | `.btn-primary` | ❌ Baja |
| 7️⃣ | Tag genérico | `button` | ❌ Muy baja |

---

## Implementación en el Proyecto

### Paso 1: Agregar data-testid en los componentes

En los componentes React del proyecto, añadimos atributos `data-testid`:

```tsx
// ui/src/components/LoginForm.tsx
const LoginForm = () => {
  return (
    <form data-testid="login-form">
      <input 
        type="email" 
        name="email"
        data-testid="email-input"
        placeholder="Email"
      />
      <input 
        type="password" 
        name="password"
        data-testid="password-input"
        placeholder="Password"
      />
      <button 
        type="submit"
        data-testid="login-submit"
      >
        Login
      </button>
    </form>
  );
};
```

### Paso 2: Custom command para selectores

El proyecto tiene un custom command `getByTestId` para simplificar:

```typescript
// cypress/support/commands.ts

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});
```

### Paso 3: Usar en tests

```typescript
// Antes - verbose
cy.get('[data-testid="email-input"]').type('test@example.com');

// Después - con custom command
cy.getByTestId('email-input').type('test@example.com');
```

---

## Selectores en el Proyecto

Estos son los elementos principales y sus selectores en **Taller-Testing-Security**:

### Login Page

| Elemento | Selector |
|----------|----------|
| Formulario | `input[name="email"]` |
| Email input | `input[name="email"]` |
| Password input | `input[name="password"]` |
| Submit button | `input[type="submit"]` |

### Dashboard

| Elemento | Selector |
|----------|----------|
| Perfil usuario | `[data-testid="user-profile"]` |
| Lista proyectos | `[data-testid="projects-list"]` |
| Proyecto individual | `[data-testid="project-card"]` |
| Loading spinner | `[data-testid="loading"]` |

### Admin Page

| Elemento | Selector |
|----------|----------|
| Header admin | `[data-testid="admin-header"]` |
| Formulario aboutme | `[data-testid="aboutme-form"]` |
| Lista proyectos | `[data-testid="admin-projects"]` |

---

## Métodos de Selección en Cypress

### cy.get()

Selecciona por CSS selector:

```typescript
// Por atributo
cy.get('[data-testid="login-button"]');

// Por ID
cy.get('#main-content');

// Por clase
cy.get('.btn-primary');

// Por atributo name
cy.get('input[name="email"]');

// Combinados
cy.get('form[data-testid="login-form"] input[name="email"]');
```

### cy.contains()

Selecciona por texto visible:

```typescript
// Texto exacto
cy.contains('Login');

// Regex
cy.contains(/dashboard/i);

// Combinado con selector
cy.contains('button', 'Submit');

// Regex case-insensitive
cy.contains('h1', /bienvenido/i);
```

### cy.find()

Busca dentro de un elemento:

```typescript
cy.get('[data-testid="login-form"]')
  .find('input[name="email"]')
  .type('test@example.com');

cy.get('[data-testid="projects-list"]')
  .find('[data-testid="project-card"]')
  .should('have.length.gte', 1);
```

### cy.within()

Ejecuta comandos dentro de un scope:

```typescript
cy.get('[data-testid="login-form"]').within(() => {
  // Todos estos comandos buscan DENTRO del form
  cy.get('input[name="email"]').type('test@example.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('input[type="submit"]').click();
});
```

---

## Ejemplos Prácticos del Proyecto

### Test de Login con selectores

```typescript
// cypress/e2e/auth/login.cy.ts

describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('debe hacer login correctamente', () => {
    cy.mockLoginApi({ success: true });
    
    // Usando selectores por name (disponibles en el proyecto)
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[type="submit"]').click();
    
    cy.wait('@loginSuccess');
    cy.url().should('include', '/admin');
  });
});
```

### Test de Dashboard con selectores

```typescript
// cypress/e2e/dashboard/dashboard.cy.ts

describe('Dashboard', () => {
  beforeEach(() => {
    cy.mockDashboardApi();
    cy.visit('/dashboard');
    cy.wait(['@getAboutMe', '@getProjects']);
  });

  it('debe mostrar información del perfil', () => {
    // Verificar que existe el contenedor
    cy.get('[data-testid="user-profile"]').should('be.visible');
    
    // Verificar texto dentro
    cy.contains('Lucas Fernandez').should('be.visible');
  });

  it('debe mostrar lista de proyectos', () => {
    cy.get('[data-testid="projects-list"]')
      .find('[data-testid="project-card"]')
      .should('have.length.gte', 1);
  });
});
```

### Test con within()

```typescript
it('debe editar proyecto dentro del formulario', () => {
  cy.get('[data-testid="project-form"]').within(() => {
    cy.get('input[name="title"]').clear().type('Nuevo título');
    cy.get('textarea[name="description"]').clear().type('Nueva descripción');
    cy.contains('button', 'Guardar').click();
  });
});
```

---

## Selectores Avanzados

### Por posición

```typescript
// Primer elemento
cy.get('[data-testid="project-card"]').first();

// Último elemento
cy.get('[data-testid="project-card"]').last();

// Por índice (0-based)
cy.get('[data-testid="project-card"]').eq(2);
```

### Por estado

```typescript
// Elementos visibles
cy.get('button:visible');

// Elementos habilitados
cy.get('input:enabled');

// Elementos deshabilitados
cy.get('button:disabled');

// Checkbox marcados
cy.get('input[type="checkbox"]:checked');
```

### Filtrar resultados

```typescript
// Filtrar por contenido
cy.get('[data-testid="project-card"]')
  .filter(':contains("React")')
  .should('have.length', 2);

// Filtrar por atributo
cy.get('input')
  .filter('[required]')
  .should('have.length', 2);
```

### Navegar el DOM

```typescript
// Padre
cy.get('[data-testid="submit"]').parent();

// Ancestro específico
cy.get('[data-testid="submit"]').closest('form');

// Hermanos
cy.get('[data-testid="item-1"]').siblings();

// Siguiente hermano
cy.get('[data-testid="item-1"]').next();

// Hermano anterior
cy.get('[data-testid="item-2"]').prev();
```

---

## Mejores Prácticas

### ✅ Hacer

```typescript
// Usar data-testid
cy.get('[data-testid="login-button"]').click();

// Ser específico
cy.get('form[data-testid="login-form"]')
  .find('input[name="email"]')
  .type('test@example.com');

// Usar custom command
cy.getByTestId('login-button').click();

// Combinar con contains para verificar
cy.get('[data-testid="user-name"]').should('contain', 'Lucas');
```

### ❌ Evitar

```typescript
// Clases de CSS (pueden cambiar)
cy.get('.MuiButton-containedPrimary').click();

// Selectores muy largos
cy.get('div > div > form > div > input').type('email');

// Índices sin contexto
cy.get('button').eq(3).click();

// XPath (no soportado nativamente)
// cy.xpath() requiere plugin
```

---

## Debugging de Selectores

### Cypress Selector Playground

1. Abre Cypress con `npm run test:e2e:open`
2. Haz clic en el icono de "crosshair" 🎯
3. Pasa el mouse sobre cualquier elemento
4. Cypress sugiere el mejor selector

### Verificar que selector funciona

```typescript
it('debug selector', () => {
  cy.visit('/login');
  
  // Verificar cuántos elementos encuentra
  cy.get('input').then($inputs => {
    cy.log(`Encontrados: ${$inputs.length} inputs`);
  });
  
  // Debug en DevTools
  cy.get('input[name="email"]').debug();
});
```

### Listar elementos encontrados

```typescript
cy.get('[data-testid^="project-"]').each(($el, index) => {
  cy.log(`Proyecto ${index}: ${$el.text()}`);
});
```

---

## Resumen

| Comando | Uso |
|---------|-----|
| `cy.get(selector)` | Seleccionar por CSS |
| `cy.contains(text)` | Seleccionar por texto |
| `cy.find(selector)` | Buscar dentro de elemento |
| `cy.within(fn)` | Scope de comandos |
| `.first()` / `.last()` / `.eq(n)` | Por posición |
| `.filter()` | Filtrar resultados |
| `.parent()` / `.closest()` | Navegar DOM |

---

## Próximos Pasos

Con los selectores dominados:

1. **[Formularios](./forms)** - Testing de inputs y validaciones
2. **[Intercepción](./intercept)** - Mockear APIs
3. **[Custom Commands](./custom-commands)** - Reutilizar lógica
