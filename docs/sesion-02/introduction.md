---
sidebar_position: 2
title: "Testing de Integración"
---

# Testing de Integración

## ¿Qué es Testing de Integración?

Los tests de integración verifican que **múltiples unidades trabajen correctamente juntas**.

### Diferencias con Tests Unitarios

| Aspecto | Tests Unitarios | Tests de Integración |
|---------|----------------|---------------------|
| **Alcance** | Una función/componente | Múltiples componentes |
| **Dependencias** | Todas mockeadas | Algunas reales |
| **Velocidad** | Muy rápidos | Moderados |
| **Fragilidad** | Baja | Media |
| **Cobertura** | Específica | Amplia |

## ¿Cuándo Usar Tests de Integración?

### ✅ Usar cuando

- Varios componentes interactúan
- Hay lógica de negocio compartida
- Se usa Context o estado global
- Se comunica con APIs
- Hay flujos de usuario completos

### ❌ No usar cuando

- Una función pura simple
- Ya hay tests unitarios suficientes
- El tiempo de ejecución es crítico

## Estrategia de Testing

```text
Tests Unitarios (70%)
    ↓
Tests de Integración (20%)  ← Esta sesión
    ↓
Tests E2E (10%)
```

Los tests de integración son el **balance perfecto** entre velocidad y confianza, validando que las piezas del sistema funcionen correctamente en conjunto sin la lentitud de los tests E2E completos.
