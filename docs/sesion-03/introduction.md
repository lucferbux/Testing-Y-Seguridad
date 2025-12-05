---
sidebar_position: 2
title: "Introducción al Testing E2E"
---

# Introducción al Testing E2E

## ¿Qué es Testing End-to-End?

El **testing E2E** (End-to-End) es el tipo de testing que más se acerca a la experiencia real del usuario final. Mientras que otros tipos de tests se enfocan en partes específicas del sistema, el testing E2E **valida flujos completos desde la perspectiva del usuario**, simulando interacciones reales con la interfaz tal como lo haría una persona navegando tu aplicación.

Imagina que estás construyendo un e-commerce. Puedes tener cientos de tests unitarios verificando que cada función calcula correctamente los precios, y decenas de tests de integración comprobando que el carrito de compras se comunica correctamente con la API. **Pero ninguno de estos tests te garantiza que un usuario real puede completar una compra**. Ahí es donde entra el testing E2E.

**Características del Testing E2E:**

- **Simula usuario real en navegador real**: Abre Chrome, Firefox o Edge y ejecuta clicks, escribe texto, navega páginas
- **Prueba toda la stack**: Frontend (React/Vue/Angular) + Backend (API) + Base de Datos + Servicios externos
- **Valida flujos críticos de negocio**: Registro, login, compra, pago, etc.
- **Detecta problemas de integración**: Errores que solo aparecen cuando todo el sistema trabaja junto
- **Provee confianza máxima**: Si un test E2E pasa, sabes que el flujo funciona de principio a fin

## E2E en la Pirámide de Testing

```
                 /\
                /  \
               /    \
              / E2E  \  ← Esta sesión (10%)
             /--------\    Flujos completos de usuario
            /          \   Lentos, costosos, alta confianza
           / Integración\  (20%)
          /--------------\  Módulos trabajando juntos
         /                \
        /    Unitarios     \  (70%)
       /____________________\ Funciones aisladas, rápidos
```

Esta pirámide representa la distribución recomendada de tests en un proyecto maduro. Los números (70/20/10) no son reglas estrictas, pero son una guía probada por la industria que balancea **confianza, velocidad y costo de mantenimiento**.

### ¿Por qué solo 10% E2E?

Aunque los tests E2E proveen la mayor confianza, tienen costos que justifican usarlos con moderación:

#### 1. **Velocidad** 🐌

- **Test unitario**: 1-10 milisegundos
- **Test de integración**: 100-1000 milisegundos
- **Test E2E**: 10-120 segundos

**Ejemplo real**: Una suite de 100 tests E2E puede tardar 100 minutos en ejecutarse, mientras 100 tests unitarios tardan 5 segundos.

#### 2. **Fragilidad** 💔

Un simple cambio en el HTML puede romper decenas de tests:

```html
<!-- Antes -->
<button class="btn-submit">Enviar</button>

<!-- Después -->
<button class="button button--primary">Enviar</button>
```

Todos los tests con `cy.get('.btn-submit')` fallarán aunque la funcionalidad esté intacta.

**Solución**: Usar selectores estables como `data-testid`.

#### 3. **Costo de Infraestructura** 💰

Los tests E2E requieren:
- Levantar toda la aplicación (frontend + backend + DB)
- Ejecutar en navegadores reales
- Mayor tiempo de CI/CD
- Más recursos de debugging

#### 4. **Dificultad de Debugging** 🔍

Cuando un test E2E falla, puede ser por múltiples razones:
- ¿Problema en frontend?
- ¿La API retornó error?
- ¿La DB no tiene datos?
- ¿El selector cambió?
- ¿Network timeout?

### ¿Cuándo usar E2E?

#### ✅ Casos Ideales

**1. Flujos Críticos de Negocio**
- **E-commerce**: Proceso completo de compra (buscar → agregar → pagar)
- **SaaS**: Registro y onboarding de usuarios
- **Banca**: Transferencias de dinero
- **Educación**: Inscripción a cursos

**2. Happy Paths Principales**
- Flujo más común que usan tus usuarios
- Caminos sin errores que deben funcionar siempre

**3. Integraciones Complejas**
- Login con OAuth (Google, Facebook)
- Pagos con Stripe/PayPal
- Integración con servicios externos

**4. Smoke Tests de Producción**
- Tests mínimos que verifican que la app está viva
- Ejecutados después de cada deploy

#### ❌ Casos NO Recomendados

**1. Validaciones Detalladas** → Usar unitarios
```typescript
// ❌ NO uses E2E para esto
it('debe calcular descuento correctamente', () => {
  cy.visit('/products/1');
  cy.get('[data-testid="price"]').should('contain', '$90');
});

// ✅ USA test unitario
test('calculateDiscount debe aplicar porcentaje', () => {
  expect(calculateDiscount(100, 10)).toBe(90);
});
```

**2. Casos Edge Complejos** → Usar integración
```typescript
// ❌ NO uses E2E para validar 20 combinaciones de inputs
// ✅ USA tests de integración o unitarios con test.each()
```

**3. Testing de Componentes Aislados** → Usar tests de componente
```typescript
// ❌ NO uses E2E para testear un botón
// ✅ USA @testing-library/react
```
