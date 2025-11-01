---
sidebar_position: 2
title: "¿Por qué Testing?"
---

# ¿Por qué necesitamos testing?

El testing es una parte fundamental del desarrollo de software moderno. Nos proporciona:

## 1. Confianza en el código

- Garantiza que el código funciona como se espera
- Permite refactorizar sin miedo a romper funcionalidad
- Detecta errores antes de que lleguen a producción

## 2. Documentación viva

- Los tests describen cómo debe comportarse el código
- Sirven como ejemplos de uso
- Se mantienen actualizados con el código

## 3. ROI (Return on Investment)

- Reduce tiempo de debugging
- Menor coste de mantenimiento
- Menos bugs en producción

## 4. Mejor diseño de código

- Fuerza a pensar en casos edge
- Promueve código modular y testeable
- Facilita el principio de responsabilidad única

---

## La Pirámide de Testing

```text
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integración\
              /--------------\
             /                \
            /     Unitarios    \
           /____________________\
```

### Tests Unitarios (Base - 70%)

- Rápidos de ejecutar (milisegundos)
- Fáciles de escribir y mantener
- Prueban unidades individuales de código
- Gran cantidad, alta especificidad

### Tests de Integración (Medio - 20%)

- Prueban la interacción entre componentes
- Tiempo de ejecución moderado
- Balance entre cobertura y velocidad

### Tests E2E (Punta - 10%)

- Prueban el sistema completo
- Lentos de ejecutar
- Frágiles y costosos de mantener
- Validan flujos críticos de usuario

---

## Tipos de Testing

### Testing Manual

- Ejecutado por humanos
- Lento y propenso a errores
- Necesario para UX y exploración

### Testing Automatizado

- Ejecutado por máquinas
- Rápido y repetible
- **Foco de esta sesión**

### TDD (Test-Driven Development)

```text
Red → Green → Refactor
```

1. Escribir test que falla (Red)
2. Escribir código mínimo para pasar (Green)
3. Refactorizar para mejorar (Refactor)
