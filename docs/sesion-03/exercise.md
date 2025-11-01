---
sidebar_position: 12
title: "Ejercicio Práctico"
---

# Ejercicio Práctico

## Objetivo

Crear suite completa de tests E2E para el proyecto Docusaurus, cubriendo los flujos más importantes.

## Parte 1: Flujo de Navegación (30 min)

**Tareas:**
1. Test de navegación principal (Home → Docs → Blog → Home)
2. Test de sidebar con categorías expandibles
3. Test de búsqueda con resultados
4. Test responsive (mobile y desktop)

**Criterios:**
- Usar data-testid
- Tests independientes
- Sin waits fijos
- Screenshots en fallos

## Parte 2: Flujo de Documentación (35 min)

**Tareas:**
1. Test de lectura de docs (navegación entre páginas)
2. Test de "Next/Previous" pagination
3. Test de tabla de contenidos (TOC)
4. Test de cambio de tema (light/dark)
5. Test de código copiable (copy button)

**Funcionalidades a validar:**
- URLs correctas
- Scroll to section con hash
- Persistencia de tema
- Feedback visual del copy button

## Parte 3: Flujo de Blog (25 min)

**Tareas:**
1. Test de listado de posts
2. Test de paginación de blog
3. Test de lectura de post individual
4. Test de tags/categorías
5. Test de autores

**Intercepción de APIs:**
- Mockear carga de posts
- Simular latencia
- Simular error 404

## Criterios de Evaluación

- ✅ Mínimo 15 tests E2E
- ✅ Coverage de 3 flujos principales
- ✅ Uso de custom commands
- ✅ Intercepción de requests
- ✅ Tests pasan sin errores
- ✅ Uso de best practices
- ✅ Fixtures para datos
