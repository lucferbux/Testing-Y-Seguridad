---
sidebar_position: 3
title: "¿Qué es Cypress?"
---

# ¿Qué es Cypress?

## Introducción

**Cypress** es un framework moderno de testing E2E específicamente diseñado para la web. A diferencia de herramientas tradicionales como Selenium, Cypress fue construido **desde cero para el desarrollo web moderno**, priorizando la experiencia del desarrollador y la facilidad de uso.

### ¿Por qué Cypress es Especial?

Cypress se ejecuta **directamente en el navegador**, en el mismo run-loop que tu aplicación. Esto significa que tiene acceso completo a:

- El DOM en tiempo real
- El objeto `window`
- Los eventos del navegador
- El stack de red (XHR/Fetch)

Esta arquitectura única permite a Cypress:

1. **Controlar completamente el comportamiento de la app**: Puede modificar estado, interceptar requests, manipular tiempo
2. **Ver todo lo que sucede**: Snapshots automáticos, videos, logs detallados
3. **Ofrecer debugging superior**: Time-travel, pause, step-by-step execution

---

## Cypress vs Otras Herramientas

| **Aspecto** | **Cypress** | **Selenium** | **Playwright** |
|-------------|-------------|--------------|----------------|
| **Arquitectura** | Corre EN el navegador | Corre FUERA del navegador | Corre FUERA del navegador |
| **Setup** | `npm install cypress` | Requiere drivers + server | Más complejo que Cypress |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐ Básico | ⭐⭐⭐⭐ Muy bueno |
| **Time-travel Debugging** | ✅ Sí (built-in) | ❌ No | ⚠️ Limitado |
| **Automatic Waiting** | ✅ Sí (inteligente) | ❌ Requiere explicit waits | ✅ Sí |
| **Screenshots/Videos** | ✅ Automático | ⚠️ Manual | ✅ Automático |
| **Network Stubbing** | ✅ `cy.intercept()` potente | ⚠️ Limitado | ✅ Sí |
| **Multi-tab Support** | ❌ No (limitación) | ✅ Sí | ✅ Sí |
| **Cross-browser** | Chrome, Firefox, Edge, Electron | Todos los navegadores | Chromium, Firefox, WebKit |
| **Velocidad** | ⚡ Rápido | 🐌 Lento | ⚡⚡ Muy rápido |
| **Comunidad** | 🔥 Grande y activa | 📚 Madura pero antigua | 📈 Creciendo |
| **Uso Principal** | Apps web modernas (SPAs) | Apps legacy + multi-browser | Automatización compleja |

### Análisis Detallado

#### 🎯 Cypress: La Mejor Developer Experience

**Setup en 2 comandos:**

```bash
npm install --save-dev cypress
npx cypress open
```

**Comparado con Selenium:**

```bash
# Selenium requiere:
# 1. Instalar Selenium
# 2. Descargar WebDriver (ChromeDriver, GeckoDriver, etc.)
# 3. Configurar paths
# 4. Levantar Selenium Server
# 5. Escribir código boilerplate
```

**Resultado**: Cypress te ahorra **horas de configuración**.

#### ⚡ Automatic Waiting: Sin Waits Manuales

**Problema en Selenium:**

```javascript
// ❌ Selenium: Necesitas waits explícitos
await driver.wait(until.elementLocated(By.id('submit')), 5000);
await driver.wait(until.elementIsVisible(submitButton), 3000);
await submitButton.click();
```

**Solución en Cypress:**

```typescript
// ✅ Cypress: Automático, inteligente
cy.get('#submit').click(); // Espera hasta que existe, es visible y clickeable
```

Cypress espera automáticamente hasta que:

- El elemento existe en el DOM
- El elemento es visible
- El elemento no está disabled
- El elemento no está cubierto por otro elemento
- El elemento terminó de animar

#### 🔍 Time-Travel Debugging

**Característica Única**: Cypress toma **snapshots del DOM** en cada paso.

```typescript
cy.visit('/');              // Snapshot 1
cy.get('[data-testid="login"]').click(); // Snapshot 2
cy.get('[data-testid="email"]').type('user@example.com'); // Snapshot 3
```

Si el test falla, puedes:

1. **Hovear sobre cada comando** en el log
2. **Ver el estado exacto del DOM** en ese momento
3. **Volver atrás en el tiempo**

**Esto no existe en Selenium**.

---

## Ventajas de Cypress

### 1. Developer Experience Excepcional

#### 🎨 Interfaz Visual Intuitiva

```bash
npx cypress open  # Abre Test Runner interactivo
```

**Funcionalidades:**

- **Vista en tiempo real**: Ves tu app mientras los tests corren
- **Selector Playground**: Herramienta para encontrar selectores óptimos
- **Command Log**: Cada comando con timing y resultado
- **App Preview**: La app ejecutándose paso a paso

#### 📝 Sintaxis Clara

**Cypress:**

```typescript
cy.visit('/login');
cy.get('[data-testid="email"]').type('user@example.com');
cy.get('[data-testid="password"]').type('password123');
cy.get('[data-testid="submit"]').click();
cy.url().should('include', '/dashboard');
```

**Selenium (comparación):**

```javascript
await driver.get('http://localhost:3000/login');
await driver.findElement(By.css('[data-testid="email"]')).sendKeys('user@example.com');
await driver.findElement(By.css('[data-testid="password"]')).sendKeys('password123');
await driver.findElement(By.css('[data-testid="submit"]')).click();
const url = await driver.getCurrentUrl();
assert(url.includes('/dashboard'));
```

**Diferencias:**

- ✅ Menos boilerplate
- ✅ Encadenamiento fluido
- ✅ Assertions integradas
- ✅ Sin async/await explícito

### 2. Arquitectura Única

#### 🏗️ Cypress Corre EN el Navegador

**Arquitectura Tradicional (Selenium):**

```
[Test Code] → [WebDriver Server] → [Browser Driver] → [Browser]
```

**Arquitectura Cypress:**

```
[Browser]
  ├── [App Code]  ← Tu aplicación
  └── [Cypress]   ← Tests en el mismo contexto
```

**Ventajas:**

- ✅ Acceso completo al DOM
- ✅ Mismo run-loop
- ✅ Sin serialización
- ✅ Control del tiempo

#### 🎭 Network Stubbing Potente

```typescript
// Stub: Reemplazar respuesta
cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');

// Spy: Monitorear sin modificar
cy.intercept('POST', '/api/users').as('createUser');

// Modify: Cambiar solo parte
cy.intercept('GET', '/api/user/1', (req) => {
  req.reply((res) => {
    res.body.name = 'Modified Name';
  });
});

// Simulate delay
cy.intercept('GET', '/api/slow', (req) => {
  req.reply({ delay: 3000, body: { data: 'slow' } });
});
```

**Casos de uso:**

- Testing offline (mockear APIs)
- Error handling (simular 500, 404)
- Loading states (delays)
- Verify payloads

### 3. Features Potentes

#### 🔄 Automatic Retry

```typescript
// Se re-ejecuta cada 50ms durante 4 segundos
cy.get('[data-testid="message"]').should('contain', 'Success');
```

**¿Por qué importante?** Apps modernas cambian el DOM constantemente (React re-renders, async data).

#### 📸 Screenshots y Videos Automáticos

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

**Resultado:**

```
cypress/
├── screenshots/
│   └── login.cy.ts/
│       └── should-login (failed).png
└── videos/
    └── login.cy.ts.mp4
```

#### 🔍 Comandos de Debugging

```typescript
cy.pause();  // Pausar ejecución
cy.get('[data-testid="user"]').debug();  // Inspeccionar
cy.log('Verificando login...');  // Log personalizado

cy.get('[data-testid="user"]').then(($el) => {
  debugger; // Breakpoint
  console.log($el.text());
});
```

---

## Limitaciones de Cypress

### 1. 🚫 No Soporta Multi-Tab

```typescript
// ❌ NO funciona
cy.visit('/page1');
cy.window().open('/page2', '_blank'); // No existe
```

**Workaround:**

```typescript
// Puedes remover target="_blank"
cy.get('a[target="_blank"]').invoke('removeAttr', 'target').click();
```

**Alternativas**: Playwright o Selenium

### 2. 🌐 Navegadores Limitados

**Soportados:**

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Electron
- ❌ Safari (NO)
- ❌ IE11 (NO)

**Impacto**: Si necesitas Safari, usa Playwright o Selenium.

### 3. ⚡ Comandos No Son Promesas

```typescript
// ❌ NO funciona
const text = cy.get('[data-testid="name"]').text(); // undefined

// ✅ CORRECTO
cy.get('[data-testid="name"]').then(($el) => {
  const text = $el.text();
  console.log(text);
});
```

### 4. 🔒 Same-Origin por Defecto

```typescript
// ❌ Error
cy.visit('https://example.com');
cy.visit('https://another-site.com'); // Cross-origin error
```

**Workaround (experimental):**

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    chromeWebSecurity: false,  // No recomendado
  },
});
```

---

## ¿Cuándo Elegir Cypress?

### ✅ Cypress es Ideal Para:

1. **Apps web modernas (SPAs)**: React, Vue, Angular, Svelte
2. **Equipos que priorizan DX**: Developer experience
3. **Testing rápido e iterativo**: Feedback inmediato
4. **CI/CD pipelines**: Integración fácil
5. **Testing de APIs**: `cy.request()` es excelente

### ⚠️ Considera Alternativas Si:

1. **Necesitas Safari**: Playwright o Selenium
2. **Multi-tab crítico**: Playwright
3. **Mobile nativo**: Appium
4. **Apps legacy**: Selenium

---

## Conclusión

Cypress es la herramienta **más amigable** para desarrolladores en E2E testing. Su arquitectura única, automatic waiting y debugging excepcional la hacen ideal para apps web modernas.

**Regla de oro**: Si construyes SPAs con React/Vue/Angular, Cypress es tu mejor opción.

**Siguiente**: [Instalación y Configuración](./setup)
