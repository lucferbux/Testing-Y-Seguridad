---
sidebar_position: 9
title: "Ejercicio Práctico"
---

# Ejercicio Práctico

## Objetivos

- Implementar tests de integración para Context API
- Escribir tests para Custom Hooks con side effects
- Crear tests de API con MongoDB Memory Server
- Implementar fixtures y factory functions
- Configurar y usar Mock Service Worker (MSW)

## Enunciado

### Parte 1: Preparación del Proyecto

Si aún no lo has hecho, clona el proyecto desde el repositorio:

```bash
git clone https://github.com/lucferbux/Taller-Testing-Security.git
cd Taller-Testing-Security
```

**Backend (API)**:
```bash
cd api
npm install
```

**Frontend (UI)**:
```bash
cd ui
npm install
```

Verifica que ambos proyectos tienen las dependencias de testing instaladas.

Una vez comprobemos que funciona, hay que realizar lo siguiente:

1. Habilitar `Jest`, `react-testing-library` y sus configuraciones siguiendo el contenido de la sesión 1.
2. Habilitar `supertest` y `Jest` en el backend (`api`) e implementar los test vistos en clase.

Al ya tener esto podemos proceder con la actividad.

### Parte 2: Tests de Context API (ProjectContext)

Implementa tests para el `ProjectContext` que gestiona el estado de los proyectos.

**Archivo a testear**: `ui/src/context/ProjectContext.tsx`

**Archivo de tests**: `ui/src/context/__tests__/ProjectContext.test.tsx`

Los tests deben cubrir:

1. **Estado inicial**:
   - Verificar que `projects` comienza vacío
   - Verificar que `loading` es `false` inicialmente

2. **Agregar proyecto**:
   - Llamar `addProject()` con un proyecto válido
   - Verificar que el proyecto se agrega al estado

3. **Eliminar proyecto**:
   - Agregar un proyecto
   - Llamar `deleteProject()` con el ID
   - Verificar que el proyecto se elimina

4. **Actualizar proyecto**:
   - Agregar un proyecto
   - Llamar `updateProject()` con datos actualizados
   - Verificar que los datos cambian correctamente

5. **Error handling**:
   - Intentar eliminar un proyecto inexistente
   - Verificar que no rompe la aplicación

**Pista**: Usa `renderHook` de `@testing-library/react` y crea un wrapper con el Provider.

### Parte 3: Tests de Custom Hooks (useFetchData)

Implementa tests para el hook `useFetchData` que hace fetch de datos con loading y error states.

**Archivo a testear**: `ui/src/hooks/useFetchData.ts`

**Archivo de tests**: `ui/src/hooks/__tests__/useFetchData.test.tsx`

Los tests deben cubrir:

1. **Estado inicial**:
   - `data` tiene el valor inicial proporcionado
   - `loading` es `true` en el primer render
   - `error` es `null`

2. **Fetch exitoso**:
   - Mockear una función que retorna datos
   - Verificar que `loading` cambia a `false`
   - Verificar que `data` contiene los datos retornados
   - Verificar que `error` es `null`

3. **Fetch con error**:
   - Mockear una función que lanza error
   - Verificar que `loading` cambia a `false`
   - Verificar que `error` contiene el mensaje de error
   - Verificar que `data` mantiene el valor inicial

4. **Refetch**:
   - Hacer fetch inicial
   - Llamar a `refetch()`
   - Verificar que vuelve a hacer fetch

**Pista**: Usa `jest.fn()` para mockear la función de fetch y `waitFor` para esperar cambios asíncronos.

### Parte 4: Tests de API con MongoDB Memory Server

Implementa tests para el `ProjectsRouter` usando MongoDB Memory Server.

**Archivo a testear**: `api/src/routes/ProjectsRouter.ts`

**Archivo de tests**: `api/src/routes/__tests__/ProjectsRouter.test.ts`

Los tests deben cubrir:

1. **GET /v1/projects/:id - Proyecto existente**:
   - Insertar un proyecto en la DB
   - Hacer GET request
   - Verificar status 200 y datos correctos

2. **GET /v1/projects/:id - Proyecto inexistente**:
   - Hacer GET con ID que no existe
   - Verificar status 404
   - Verificar mensaje de error

3. **POST /v1/projects - Crear proyecto válido**:
   - Enviar datos de proyecto válidos
   - Verificar status 201
   - Verificar que el proyecto se creó en la DB
   - Verificar que el password está hasheado

4. **POST /v1/users - Datos inválidos**:
   - Enviar request sin un dato necesario
   - Verificar status 400
   - Verificar mensaje de validación

**Pista**: Usa `beforeAll` para configurar MongoDB Memory Server y `beforeEach` para limpiar la DB.

### Parte 5: Fixtures y Factory Functions

Crea fixtures para los modelos del proyecto.

**Archivo 1**: `api/src/tests/fixtures/projects.ts`

Implementa:
- `validProject`: Objeto Project válido
- `invalidProjects`: Objeto con casos inválidos (sin title, sin description, etc.)
- `sampleProjects`: Array de 3-5 proyectos de ejemplo

**Archivo 2**: `api/src/tests/factories/projectFactory.ts`

Implementa:
- `buildProject(overrides?)`: Factory function que genera proyectos únicos
- `buildProjects(count)`: Genera N proyectos
- `resetProjectFactory()`: Reset del contador de IDs

**Uso en tests**: Actualiza al menos 2 tests existentes para usar estos fixtures.

### Parte 6: Test Coverage y Análisis

Ejecuta el coverage y analiza los resultados:

**Backend**:
```bash
cd api
npm run test:coverage
```

**Frontend**:
```bash
cd ui
npm run test:coverage
```

**Análisis requerido**:
1. ¿Cuál es el coverage global de cada proyecto?
2. ¿Qué archivos tienen coverage < 70%?
3. Identifica 2 líneas sin cobertura e implementa tests para cubrirlas
4. ¿Hay código muerto (dead code) que se pueda eliminar?

## Recursos de Ayuda

- Documentación vista en clase (sesión-02)
- [React Testing Library - Async Methods](https://testing-library.com/docs/dom-testing-library/api-async/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [MSW Documentation](https://mswjs.io/)
- Ejemplos en los archivos de documentación del curso

:::warning Importante
Asegúrate de que todos los tests pasen antes de entregar. Usa `npm test` para verificar.
