---
sidebar_position: 5
title: "Primer Test con Cypress"
---

# Primer Test con Cypress

## Anatomía de un Test Cypress

Antes de escribir tests, es importante entender la **estructura básica** que Cypress utiliza, heredada de frameworks como Mocha y Chai.

### Estructura Fundamental

```typescript
describe('Nombre del conjunto de tests', () => {
  
  beforeEach(() => {
    // Se ejecuta ANTES de cada test
    // Ideal para setup común
  });
  
  it('debe hacer algo específico', () => {
    // Test individual
    // Cada 'it' es un test independiente
  });
  
  it('debe hacer otra cosa', () => {
    // Otro test independiente
  });
  
  afterEach(() => {
    // Se ejecuta DESPUÉS de cada test
    // Ideal para cleanup
  });
});
```

### Bloques Principales

#### 1. `describe()` - Suite de Tests

**Propósito**: Agrupar tests relacionados.

```typescript
// Describe agrupa tests por feature o página
describe('Login Page', () => {
  // Todos los tests de la página de login
});

describe('User Profile', () => {
  // Todos los tests del perfil de usuario
});
```

**Puedes anidar describes:**

```typescript
describe('Authentication', () => {
  
  describe('Login', () => {
    it('debe permitir login exitoso', () => {});
    it('debe mostrar error con credenciales inválidas', () => {});
  });
  
  describe('Logout', () => {
    it('debe cerrar sesión correctamente', () => {});
  });
});
```

#### 2. `it()` o `test()` - Test Individual

**Propósito**: Definir un test específico.

```typescript
// 'it' y 'test' son sinónimos
it('debe cargar la homepage', () => {
  cy.visit('/');
});

// Equivalente
test('debe cargar la homepage', () => {
  cy.visit('/');
});
```

**Convención de nombres**: Usa lenguaje descriptivo que explique **qué** hace el test.

```typescript
// ❌ Mal - No descriptivo
it('test 1', () => {});

// ✅ Bien - Descriptivo
it('debe mostrar mensaje de error cuando email está vacío', () => {});
```

#### 3. Hooks de Ciclo de Vida

**`beforeEach()`**: Setup antes de cada test

```typescript
describe('Dashboard', () => {
  
  beforeEach(() => {
    // Se ejecuta antes de CADA test
    cy.login(); // Login antes de cada test
    cy.visit('/dashboard');
  });
  
  it('test 1', () => { /* dashboard ya cargado */ });
  it('test 2', () => { /* dashboard ya cargado */ });
});
```

**`before()`**: Setup una sola vez antes de todos los tests

```typescript
before(() => {
  // Se ejecuta UNA sola vez antes de todos los tests
  cy.task('db:seed'); // Seed database una vez
});
```

**`afterEach()`**: Cleanup después de cada test

```typescript
afterEach(() => {
  // Limpiar después de cada test
  cy.clearCookies();
  cy.clearLocalStorage();
});
```

**`after()`**: Cleanup una vez después de todos los tests

```typescript
after(() => {
  // Se ejecuta UNA vez al final
  cy.task('db:clear');
});
```

---

## Tu Primer Test: Homepage

Empecemos con un test simple que valida la homepage.

### Test Básico

```typescript
// cypress/e2e/homepage.cy.ts

describe('Homepage', () => {
  
  it('debe visitar la página', () => {
    // Paso 1: Navegar a la página
    cy.visit('/');
    
    // Paso 2: Verificar que algo existe
    cy.contains('Welcome');
  });
});
```

**¿Qué hace este test?**

1. **`cy.visit('/')`**: Navega a la URL base (definida en `cypress.config.ts`)
2. **`cy.contains('Welcome')`**: Busca cualquier elemento que contenga el texto "Welcome"

**Si el test pasa**: La página cargó correctamente y contiene "Welcome"
**Si falla**: O la página no cargó, o no encuentra el texto

### Agregar Más Verificaciones

```typescript
describe('Homepage', () => {
  
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('debe cargar correctamente', () => {
    // Verificar título de la página
    cy.title().should('include', 'Mi App');
    
    // Verificar elemento principal visible
    cy.get('[data-testid="hero"]').should('be.visible');
    
    // Verificar que contiene texto específico
    cy.contains('h1', 'Bienvenido').should('exist');
  });
  
  it('debe tener meta descripción', () => {
    // Verificar meta tag
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
  });
  
  it('debe mostrar navegación', () => {
    // Verificar que nav existe
    cy.get('nav').should('be.visible');
    
    // Verificar que tiene al menos 3 links
    cy.get('nav a').should('have.length.at.least', 3);
  });
});
```

---

## Ejemplo Completo: Test de Homepage con Docusaurus

Vamos a crear un test completo que valide múltiples aspectos de una página Docusaurus.

### Test Completo

```typescript
// cypress/e2e/homepage.cy.ts

describe('Homepage - Docusaurus', () => {
  
  beforeEach(() => {
    // Visitar homepage antes de cada test
    cy.visit('/');
  });

  it('debe cargar correctamente', () => {
    // Verificar título de la página
    cy.title().should('include', 'Docusaurus');
    
    // Verificar que el hero section está visible
    cy.get('[data-testid="hero"]')
      .should('be.visible')
      .and('contain', 'Welcome to Docusaurus');
    
    // Verificar que el logo existe
    cy.get('img[alt="Docusaurus logo"]').should('exist');
  });

  it('debe mostrar navegación principal', () => {
    // Verificar que navbar existe y es visible
    cy.get('nav').should('be.visible');
    
    // Verificar que tiene múltiples links
    cy.get('nav a')
      .should('have.length.at.least', 3)
      .first()
      .should('be.visible');
    
    // Verificar link específico
    cy.get('nav').contains('Docs').should('exist');
  });

  it('debe tener meta tags SEO', () => {
    // Meta descripción
    cy.get('head meta[name="description"]')
      .should('have.attr', 'content')
      .and('not.be.empty');
    
    // Open Graph tags
    cy.get('head meta[property="og:title"]')
      .should('have.attr', 'content');
    
    cy.get('head meta[property="og:description"]')
      .should('have.attr', 'content');
  });

  it('debe tener botones de CTA visibles', () => {
    // Buscar botón de "Get Started"
    cy.contains('button, a', 'Get Started')
      .should('be.visible')
      .and('have.attr', 'href');
    
    // Buscar botón secundario
    cy.contains('button, a', 'Learn More')
      .should('be.visible');
  });

  it('debe responder en menos de 3 segundos', () => {
    // Test de performance
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Marcar inicio
        win.performance.mark('start');
      },
      onLoad: (win) => {
        // Marcar fin y medir
        win.performance.mark('end');
        win.performance.measure('pageLoad', 'start', 'end');
        
        const measure = win.performance.getEntriesByName('pageLoad')[0];
        
        // Assertion de performance
        expect(measure.duration).to.be.lessThan(3000);
      },
    });
  });
  
  it('debe ser responsive', () => {
    // Test mobile
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    
    // Test tablet
    cy.viewport('ipad-2');
    cy.get('nav').should('be.visible');
    
    // Test desktop
    cy.viewport(1920, 1080);
    cy.get('nav a').should('be.visible');
  });
});
```

### Desglose de Técnicas Utilizadas

#### 1. **Selectores Diversos**

```typescript
// Por atributo data-testid (recomendado)
cy.get('[data-testid="hero"]');

// Por tag HTML
cy.get('nav');

// Por texto contenido
cy.contains('Welcome');
cy.contains('button', 'Get Started'); // Tag + texto

// Por atributo
cy.get('img[alt="Docusaurus logo"]');
cy.get('meta[name="description"]');
```

#### 2. **Encadenamiento de Assertions**

```typescript
cy.get('[data-testid="hero"]')
  .should('be.visible')        // Assertion 1
  .and('contain', 'Welcome');  // Assertion 2
```

#### 3. **Testing de Atributos**

```typescript
cy.get('meta[name="description"]')
  .should('have.attr', 'content')  // Tiene atributo 'content'
  .and('not.be.empty');            // Y no está vacío
```

#### 4. **Viewport Testing (Responsive)**

```typescript
cy.viewport('iphone-x');     // Preset de iPhone X
cy.viewport('ipad-2');       // Preset de iPad
cy.viewport(1920, 1080);     // Custom width x height
```

---

## Ejecutar Tests

### Modo Interactivo (Desarrollo)

```bash
npm run cy:open
```

**Ventajas:**
- Ves la aplicación ejecutándose en tiempo real
- Time-travel debugging
- Hot reload de tests
- Selector playground

**Uso recomendado**: Durante desarrollo y debugging.

### Modo Headless (CI/CD)

```bash
npm run cy:run
```

**Ventajas:**
- Más rápido (sin GUI)
- Ideal para CI/CD
- Genera videos y screenshots automáticamente

**Uso recomendado**: En pipelines de integración continua.

### Ejecutar Test Específico

```bash
# Con cypress run
npx cypress run --spec "cypress/e2e/homepage.cy.ts"

# Con navegador específico
npx cypress run --spec "cypress/e2e/homepage.cy.ts" --browser chrome

# En modo headed (con ventana visible)
npx cypress run --spec "cypress/e2e/homepage.cy.ts" --headed
```

---

## Debugging de Tests

### 1. Usar `cy.debug()`

```typescript
it('debe hacer algo', () => {
  cy.visit('/');
  cy.get('[data-testid="user"]').debug(); // Pausa aquí
  cy.contains('Welcome');
});
```

Abre la consola de DevTools con el elemento seleccionado.

### 2. Usar `cy.pause()`

```typescript
it('debe hacer algo', () => {
  cy.visit('/');
  cy.pause(); // Pausa la ejecución
  cy.get('[data-testid="user"]');
});
```

Pausa el test y te permite ejecutar comandos paso a paso.

### 3. Logs Personalizados

```typescript
it('debe hacer algo', () => {
  cy.log('🚀 Iniciando test de homepage');
  cy.visit('/');
  
  cy.log('✅ Verificando hero section');
  cy.get('[data-testid="hero"]').should('exist');
  
  cy.log('✅ Test completado');
});
```

### 4. Inspeccionar Variables

```typescript
it('debe obtener texto', () => {
  cy.get('[data-testid="title"]').then(($el) => {
    const text = $el.text();
    console.log('Texto encontrado:', text);
    
    // Puedes usar debugger
    debugger;
    
    expect(text).to.include('Welcome');
  });
});
```

### 5. Screenshots Manuales

```typescript
it('debe verse correctamente', () => {
  cy.visit('/');
  cy.screenshot('homepage-inicial');
  
  cy.get('[data-testid="theme-toggle"]').click();
  cy.screenshot('homepage-dark-mode');
});
```

Guarda screenshots en `cypress/screenshots/`.

---

## Errores Comunes y Soluciones

### Error 1: Element Not Found

```typescript
// ❌ Error: Element not found
cy.get('[data-testid="user"]').click();
```

**Causa**: El elemento no existe o aún no ha cargado.

**Solución 1**: Aumentar timeout

```typescript
// ✅ Esperar hasta 10 segundos
cy.get('[data-testid="user"]', { timeout: 10000 }).click();
```

**Solución 2**: Esperar condición previa

```typescript
// ✅ Esperar a que cargue primero
cy.get('[data-testid="loading"]').should('not.exist');
cy.get('[data-testid="user"]').click();
```

### Error 2: Element Not Visible

```typescript
// ❌ Error: Element is not visible
cy.get('[data-testid="modal-button"]').click();
```

**Causa**: El elemento existe pero está oculto (display: none, visibility: hidden).

**Solución**: Force click

```typescript
// ✅ Forzar click (usar con cuidado)
cy.get('[data-testid="modal-button"]').click({ force: true });
```

### Error 3: Element Covered by Another Element

```typescript
// ❌ Error: Element is being covered
cy.get('[data-testid="button"]').click();
```

**Causa**: Otro elemento (overlay, modal) está encima.

**Solución**: Cerrar overlay primero

```typescript
// ✅ Cerrar overlay antes
cy.get('[data-testid="overlay-close"]').click();
cy.get('[data-testid="button"]').click();
```

### Error 4: Cross-Origin Error

```
Cypress detected a cross-origin error
```

**Causa**: Navegaste a un dominio diferente.

**Solución**: Usar cy.origin() o mockear navegación externa

```typescript
// ✅ Remover target="_blank" para evitar nueva pestaña
cy.get('a[href="https://external.com"]')
  .invoke('removeAttr', 'target')
  .click();
```

---

## Mejores Prácticas para Primeros Tests

### 1. ✅ Tests Independientes

Cada test debe poder ejecutarse solo.

```typescript
// ✅ Bien - Test independiente
it('debe mostrar usuario', () => {
  cy.visit('/');
  cy.login(); // Setup propio
  cy.get('[data-testid="user"]').should('exist');
});
```

### 2. ✅ Usar beforeEach para Setup Común

```typescript
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard');
  });
  
  it('test 1', () => { /* dashboard listo */ });
  it('test 2', () => { /* dashboard listo */ });
});
```

### 3. ✅ Nombres Descriptivos

```typescript
// ❌ Mal
it('test 1', () => {});

// ✅ Bien
it('debe mostrar mensaje de error cuando email es inválido', () => {});
```

### 4. ✅ Un Concepto por Test

```typescript
// ❌ Mal - Test hace demasiadas cosas
it('debe funcionar el login y perfil y logout', () => {
  cy.login();
  cy.visit('/profile');
  cy.logout();
});

// ✅ Bien - Tests separados
it('debe permitir login', () => { cy.login(); });
it('debe mostrar perfil', () => { cy.visit('/profile'); });
it('debe permitir logout', () => { cy.logout(); });
```

### 5. ✅ No Uses Waits Fijos

```typescript
// ❌ Mal - Wait arbitrario
cy.wait(5000);
cy.get('[data-testid="data"]');

// ✅ Bien - Wait inteligente
cy.get('[data-testid="data"]', { timeout: 10000 }).should('exist');
```

---

## Próximos Pasos

Ahora que dominas los tests básicos, avanza a:

1. **[Selectores y Comandos](./selectors)** - Estrategias avanzadas de selección
2. **[Testing de Formularios](./forms)** - Interacciones con inputs
3. **[Intercepción de Requests](./intercept)** - Mockear APIs

:::tip Práctica
Escribe 3-5 tests para tu homepage antes de continuar. La práctica es clave para dominar Cypress.
:::
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
