---
sidebar_position: 9
title: "Ejercicio Práctico"
---

# Ejercicio Práctico

## Objetivos

- Configurar Jest y React Testing Library en un proyecto React + TypeScript + Vite
- Implementar tests unitarios para funciones de utilidad
- Implementar tests para componentes React
- Medir y analizar el test coverage

## Enunciado

### Parte 1: Configuración Inicial

Clona el proyecto desde el repositorio:

```bash
git clone https://github.com/lucferbux/Proyecto-Testing-Y-Seguridad.git
cd Proyecto-Testing-Y-Seguridad/ui
```

Instala las dependencias y verifica que el proyecto funciona correctamente.

### Parte 2: Configuración de Jest

Configura Jest en el proyecto siguiendo la documentación vista en clase. Debes:

- Instalar las dependencias necesarias para Jest, TypeScript y React Testing Library
- Crear los archivos de configuración (`jest.config.cjs`, `jest.setup.cjs`)
- Configurar los mocks para archivos estáticos
- Añadir scripts de test en `package.json`

Verifica que Jest ejecuta correctamente aunque no haya tests.

### Parte 3: Tests de Funciones Utilitarias

Implementa tests para el archivo `src/utils/auth.ts`. Los tests deben cubrir:

- `setAuthToken()`
- `removeAuthToken()`
- `isTokenActive()`
- `getAccessToken()`
- `getCurrentUser()`

Incluye casos de éxito, error y edge cases. Ejecuta los tests y verifica el coverage.

### Parte 4: Tests de Componentes React

Implementa tests para el componente `src/components/elements/Loader.tsx`. Los tests deben verificar:

- Renderizado del mensaje
- Renderizado de la imagen
- Comportamiento con diferentes props
- Estructura del DOM

Ejecuta los tests y verifica el coverage del componente.

### Parte 5: Tests Adicionales

Implementa tests para dos módulos adicionales de tu elección:

**Un componente:**
- `src/components/cards/ProjectCard.tsx`
- `src/components/cards/SessionCard.tsx`
- `src/components/elements/Title.tsx`
- Cualquier otro componente del proyecto

**Una función o módulo:**
- `src/api/http-api-client.ts`
- `src/utils/config.ts`
- Cualquier otra función de utilidad

Cada módulo debe tener al menos 4 tests que cubran diferentes escenarios.

### Parte 6: Análisis de Coverage

Genera el reporte de coverage y analiza los resultados:

- ¿Cuál es el coverage global?
- ¿Qué módulos tienen mejor/peor coverage?
- ¿Qué líneas no están cubiertas y por qué?

Identifica al menos 2 líneas sin cobertura e implementa tests para cubrirlas.

## Entregables

- Configuración completa de Jest
- Archivo `src/utils/__tests__/auth.test.ts`
- Archivo `src/components/elements/__tests__/Loader.test.tsx`
- 2 archivos de test adicionales
- Reporte de coverage generado
- Todos los tests ejecutándose correctamente
