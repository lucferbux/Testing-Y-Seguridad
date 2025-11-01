---
sidebar_position: 2
title: "Introducción al Testing E2E"
---

# Introducción al Testing E2E

## ¿Qué es Testing End-to-End?

El testing E2E valida el **flujo completo de la aplicación** desde la perspectiva del usuario final.

**Características:**
- Simula usuario real en navegador real
- Prueba toda la stack (frontend + backend + BD)
- Valida flujos críticos de negocio
- Detecta problemas de integración

## E2E en la Pirámide de Testing

```
                /\
               /  \
              / E2E \  ← Esta sesión (10%)
             /--------\
            /          \
           / Integración\  (20%)
          /--------------\
         /                \
        /    Unitarios     \  (70%)
       /____________________\
```

**¿Por qué solo 10%?**
- Son lentos (segundos vs milisegundos)
- Frágiles (cambios UI rompen tests)
- Costosos de mantener
- Difíciles de debug

**¿Cuándo usar E2E?**
- ✅ Flujos críticos de negocio (checkout, login, registro)
- ✅ Happy paths principales
- ✅ Smoke tests de producción
- ❌ Validaciones detalladas (usar unitarios)
- ❌ Casos edge complejos (usar integración)
