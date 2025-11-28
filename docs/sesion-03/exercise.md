---
sidebar_position: 12
title: "Ejercicio Práctico"
---

# Ejercicio Práctico

## Objetivos

- Configurar Cypress en el proyecto `Taller-Testing-Security/ui`
- Implementar tests E2E para el flujo de login
- Crear tests para el dashboard con intercepción de APIs
- Desarrollar custom commands reutilizables
- Implementar tests de flujos completos de usuario

## Enunciado

### Parte 1: Preparación del Proyecto

Si aún no lo has hecho, clona el proyecto desde el repositorio:

```bash
git clone https://github.com/lucferbux/Taller-Testing-Security.git
cd Taller-Testing-Security/ui
npm install
```

Verifica que Cypress está instalado y el proyecto arranca correctamente:

```bash
npm run dev          # Arranca en http://localhost:5173
npm run cy:open      # Abre Cypress Test Runner
```

Una vez comprobemos que funciona, hay que realizar lo siguiente:

1. Revisar la estructura de Cypress en `cypress/` (e2e, fixtures, support)
2. Familiarizarse con los custom commands en `cypress/support/commands.ts`
3. Revisar la configuración en `cypress.config.ts`

### Parte 2: Tests de Login

Implementa tests adicionales para el flujo de login.

**Archivo a editar**: `cypress/e2e/auth/login.cy.ts`

Los tests deben cubrir:

1. **Validación de campos vacíos**:
   - Intentar submit sin email ni password
   - Verificar que aparece mensaje de error

2. **Login exitoso con mock**:
   - Usar `cy.mockLoginApi()` para simular respuesta exitosa
   - Llenar formulario con credenciales válidas
   - Verificar que la petición se envía correctamente

3. **Login fallido**:
   - Usar `cy.mockLoginApi({ success: false })`
   - Verificar que aparece mensaje de error
   - Verificar que seguimos en `/login`

4. **Estado de loading**:
   - Usar `cy.mockLoginApi({ delay: 1000 })`
   - Verificar que aparece indicador de loading

**Pista**: Usa los custom commands `mockLoginApi` ya definidos en el proyecto.

### Parte 3: Tests de Dashboard

Implementa tests para la página de dashboard.

**Archivo a editar**: `cypress/e2e/dashboard/dashboard.cy.ts`

Los tests deben cubrir:

1. **Carga de datos con fixtures**:
   - Interceptar APIs con `{ fixture: 'aboutme.json' }` y `{ fixture: 'projects.json' }`
   - Verificar que se muestran los datos del fixture

2. **Estado de loading**:
   - Usar `cy.mockDashboardApi({ delay: 1000 })`
   - Verificar que aparece loading mientras carga

3. **Manejo de errores**:
   - Usar `cy.mockDashboardApi({ error: true })`
   - Verificar que aparece mensaje de error

4. **Navegación desde dashboard**:
   - Verificar navegación a Home desde el header
   - Verificar que la URL cambia correctamente

**Pista**: Usa `cy.wait(['@getAboutMe', '@getProjects'])` para esperar las peticiones.

### Parte 4: Custom Commands

Crea un nuevo custom command para simplificar tests.

**Archivo a editar**: `cypress/support/commands.ts`

Implementa:

1. **`cy.getByTestId(testId)`**: Ya existe, pero asegúrate de usarlo en tus tests

2. **`cy.checkAuth()`**: Ya existe, verifica que funciona correctamente

3. **Nuevo comando `cy.visitWithMocks(path, options)`**:
   - Configura los mocks de API automáticamente
   - Visita la página especificada
   - Ejemplo de uso: `cy.visitWithMocks('/dashboard', { delay: 500 })`

```typescript
Cypress.Commands.add('visitWithMocks', (path: string, options?: {
  delay?: number;
  error?: boolean;
}) => {
  cy.mockDashboardApi(options);
  cy.visit(path);
});

// Añadir al namespace
declare global {
  namespace Cypress {
    interface Chainable {
      visitWithMocks(path: string, options?: { delay?: number; error?: boolean }): Chainable<void>;
    }
  }
}
```

### Parte 5: Test de Flujo Completo

Implementa un test E2E que cubra un flujo completo de usuario.

**Archivo a editar**: `cypress/e2e/flows/user-journey.cy.ts`

El test debe cubrir:

1. **Flujo Landing → Dashboard → Login**:
   - Visitar la landing page
   - Navegar al dashboard
   - Verificar que se muestran los datos
   - Navegar a login
   - Completar el formulario de login
   - Verificar que la petición se envía correctamente

2. **Verificar datos en cada paso**:
   - En landing: verificar título visible
   - En dashboard: verificar datos cargados
   - En login: verificar formulario funcional

**Pista**: Configura todos los mocks necesarios antes de empezar el flujo.

### Parte 6: Tests Adicionales (Bonus)

Implementa al menos **2 tests adicionales** de tu elección:

**Opción A - Test Responsive**:
```typescript
it('debe funcionar en viewport mobile', () => {
  cy.viewport('iphone-x');
  cy.visit('/');
  // Verificar que elementos se adaptan
});
```

**Opción B - Test de Navegación con Teclado**:
```typescript
it('debe permitir navegar con teclado en login', () => {
  cy.visit('/login');
  cy.get('input[name="email"]').focus().type('test@example.com');
  cy.get('input[name="password"]').focus().type('password123');
  // Verificar navegación
});
```

**Opción C - Test de Verificación de Request Body**:
```typescript
it('debe enviar credenciales correctamente', () => {
  cy.intercept('POST', '**/auth/login', (req) => {
    expect(req.body).to.include('email');
    req.reply({ statusCode: 200, body: { token: '...' } });
  }).as('login');
  // Completar flujo y verificar
});
```

## Ejecutar Tests

```bash
# Modo interactivo (desarrollo)
npm run cy:open

# Modo headless (CI/CD)
npm run cy:run

# Ejecutar archivo específico
npm run cy:run -- --spec "cypress/e2e/auth/login.cy.ts"

# Con servidor automático
npm run test:e2e
```

:::warning Importante
Asegúrate de que todos los tests pasen antes de entregar. Usa `npm run cy:run` para verificar.
:::
