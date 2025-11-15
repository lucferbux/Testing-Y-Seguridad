---
sidebar_position: 1
title: "Introducción"
---

# Sesión 2: Testing de Integración

**Duración:** 1.5 horas  
**Objetivos:** Dominar el testing de integración entre componentes y APIs, validando la interacción completa del sistema

---

## 📋 Contenido de la Sesión

En la sesión anterior nos enfocamos en el testing unitario, probando componentes y funciones de forma aislada mediante mocks. Ahora daremos un paso más allá: **testing de integración**.

El testing de integración valida que múltiples componentes, módulos o servicios funcionen correctamente cuando se combinan. Mientras que los tests unitarios verifican que cada pieza funciona individualmente (como probar que un motor de coche arranca), los tests de integración aseguran que estas piezas encajan correctamente y se comunican sin problemas (como probar que el motor conectado a la transmisión mueve las ruedas).

### ¿Por qué es importante el testing de integración?

Los componentes de una aplicación real raramente existen en aislamiento completo. Un formulario de login necesita comunicarse con un contexto de autenticación, que a su vez se comunica con una API, que interactúa con una base de datos. Los tests de integración verifican que toda esta cadena funciona correctamente, detectando problemas que los tests unitarios no pueden ver:

- **Problemas de comunicación**: ¿El componente pasa los datos correctos al contexto?
- **Cambios de estado**: ¿El contexto actualiza correctamente todos los componentes suscritos?
- **Formatos incompatibles**: ¿La API devuelve los datos en el formato que espera el frontend?
- **Timing issues**: ¿Los componentes manejan correctamente las operaciones asíncronas?

En aplicaciones modernas con arquitecturas complejas (Context API, custom hooks, llamadas a APIs), el testing de integración es esencial para garantizar que el sistema funciona como un todo cohesivo.

### Contenido de esta sesión

Esta sesión cubre los siguientes temas progresivos:

1. **[Conceptos de Testing de Integración](./introduction)**
   - Diferencias entre testing unitario e integración
   - Niveles de integración: componente, API, sistema
   - Cuándo usar cada tipo de test
   - Estrategias: Big Bang vs Incremental

2. **[Testing con React Context](./context-testing)**
   - Probando componentes que consumen Context
   - Testing de múltiples providers anidados
   - Casos de uso: AuthContext, ThemeContext
   - Custom render functions para simplificar tests

3. **[Testing de Custom Hooks](./hooks-testing)**
   - Usando `@testing-library/react-hooks`
   - Probando hooks con estado y efectos
   - Testing de hooks que dependen de Context
   - Manejo de actualizaciones asíncronas

4. **[Testing de APIs con Supertest](./api-testing)**
   - Configuración de Supertest para Express
   - Testing de endpoints REST (GET, POST, PUT, DELETE)
   - Validación de respuestas y códigos de estado
   - Manejo de autenticación en tests

5. **[Fixtures y Test Data](./fixtures)**
   - Creación de datos de prueba reutilizables
   - Factory functions para objetos complejos
   - Seeders para bases de datos de test
   - Evitando duplicación en tests

6. **[Mock Service Worker (MSW)](./msw)**
   - Introducción a MSW para mockear APIs
   - Configuración de handlers para requests
   - Testing de estados: loading, success, error
   - Ventajas sobre fetch mocking tradicional

7. **[Testing de Autenticación](./auth-testing)**
   - Flujos completos de login/logout
   - Tokens y headers de autenticación
   - Protección de rutas
   - Testing de sesiones y persistencia

8. **[Ejercicio Práctico](./exercise)**
   - Implementación guiada paso a paso
   - Tests de componentes con Context
   - Tests de API endpoints
   - Análisis de coverage de integración

9. **[Recursos Adicionales](./recursos)**
   - Documentación oficial y tutoriales
   - Herramientas complementarias
   - Preparación para Testing E2E

---

## 🎯 Objetivos de Aprendizaje

Al finalizar esta sesión, serás capaz de:

- ✅ Identificar cuándo usar tests de integración vs unitarios
- ✅ Testear componentes que dependen de React Context
- ✅ Probar custom hooks con estado complejo
- ✅ Validar endpoints de API con Supertest
- ✅ Crear fixtures y datos de prueba reutilizables
- ✅ Usar MSW para mockear APIs de forma realista
- ✅ Testear flujos de autenticación completos
- ✅ Combinar múltiples técnicas en tests de integración completos

---

## Prerequisitos

Antes de comenzar esta sesión, debes estar familiarizado con:

- ✅ **Testing unitario con Jest** (cubierto en Sesión 1)
- ✅ **React Testing Library** para componentes básicos
- ✅ **Mocks y Spies** en Jest
- ✅ **Promises y async/await** en JavaScript
- ✅ **React Context API** (conceptos básicos)
- ✅ **Hooks personalizados** en React

---

## 🚀 Comenzar

Comienza con **[Conceptos de Testing de Integración](./introduction)** para entender las bases teóricas, o salta directamente a **[Testing con React Context](./context-testing)** si ya estás familiarizado con los conceptos.

:::tip Consejo de Aprendizaje
El testing de integración puede ser desafiante al principio porque involucra múltiples piezas trabajando juntas. Si te sientes abrumado, recuerda: empieza con integraciones simples (2 componentes) y ve aumentando la complejidad gradualmente.
:::

:::info Recuerda
Los tests de integración complementan, no reemplazan, los tests unitarios. La pirámide de testing sigue aplicando: más tests unitarios (70%), menos tests de integración (20%), mínimos tests E2E (10%).
:::
