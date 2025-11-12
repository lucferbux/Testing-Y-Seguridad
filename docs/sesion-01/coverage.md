---
sidebar_position: 8
title: "Coverage y Buenas Prácticas"
---

El code coverage (cobertura de código) es una métrica que mide qué porcentaje de tu código es ejecutado durante los tests. Es una herramienta útil para identificar código no testeado, pero debe usarse con cuidado y entendimiento. En esta sección aprenderemos a interpretar métricas de coverage y aplicar buenas prácticas de testing.

## Code Coverage

### ¿Qué es coverage?

El code coverage es el **porcentaje de código fuente que se ejecuta cuando corren tus tests**. Proporciona una medida cuantitativa de cuánto de tu código está siendo testeado.

Por ejemplo, si tienes una función con 10 líneas y tus tests solo ejecutan 7 de ellas, tienes un 70% de coverage de líneas para esa función.

**¿Por qué es importante?**

- **Identifica código no testeado**: El código con 0% coverage definitivamente no está siendo verificado
- **Guía para escribir más tests**: Muestra qué áreas necesitan más atención
- **Confianza en refactorizaciones**: Mayor coverage generalmente significa más confianza

**¿Por qué NO es suficiente?**

- **No mide calidad**: Código 100% cubierto puede tener tests malos
- **No garantiza correctitud**: Tests que pasan pero no verifican nada correcto
- **Puede ser engañoso**: Es fácil escribir tests que suben coverage sin agregar valor

### Métricas de Coverage

Jest reporta cuatro métricas diferentes de coverage. Es importante entender qué mide cada una:

#### Statements (Declaraciones)

Porcentaje de **declaraciones de código** ejecutadas. Una declaración es básicamente cada sentencia que hace algo.

```typescript
function example(x: number) {
  const y = x * 2;        // Statement 1
  console.log(y);         // Statement 2
  return y;               // Statement 3
}
```

Si llamas `example(5)` en tu test, ejecutas 3/3 statements = **100% coverage**.

#### Branches (Ramas)

Porcentaje de **ramas condicionales** ejecutadas. Cada `if/else`, operador ternario, `switch`, etc. crea ramas.

```typescript
function checkAge(age: number) {
  if (age >= 18) {          // Branch point
    return 'adult';         // Branch 1
  } else {
    return 'minor';         // Branch 2
  }
}
```

Para 100% branch coverage necesitas tests que ejecuten **ambas ramas**:

```typescript
it('adulto', () => expect(checkAge(20)).toBe('adult'));    // Branch 1
it('menor', () => expect(checkAge(15)).toBe('minor'));     // Branch 2
```

Si solo testeas el caso adulto, tendrías 50% branch coverage.

#### Functions (Funciones)

Porcentaje de **funciones llamadas** al menos una vez.

```typescript
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }
```

Si solo testeas `add()`, tienes 33% (1/3) function coverage.

#### Lines (Líneas)

Porcentaje de **líneas de código ejecutables** que se ejecutaron. Similar a statements pero cuenta líneas físicas.

```typescript
function format(name: string) {
  return name
    .trim()
    .toUpperCase();
}
```

Esto cuenta como 1 statement pero 3 lines. En la práctica, lines y statements son muy similares.

## Ejecutar Coverage

Para generar un reporte de coverage con Jest, simplemente ejecuta:

```bash
npm run test:coverage
```

Este comando (que definimos en `package.json` como `jest --coverage`) ejecuta todos los tests y genera un reporte completo.

### Interpretando el Output

Cuando ejecutamos coverage en nuestro proyecto **Taller-Testing-Security**, obtenemos un reporte como este:

```text
 PASS  src/components/cards/__tests__/ProjectCard.test.tsx
 PASS  src/components/elements/__tests__/Loader.test.tsx
 PASS  src/api/__tests__/http-api-client.test.ts
 PASS  src/utils/__tests__/auth.test.ts
 PASS  src/utils/__tests__/config.test.ts

Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total

---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   30.86 |    28.85 |   31.25 |   30.57 |
 src/components/elements   |  100.00 |   100.00 |  100.00 |  100.00 |
  Loader.tsx               |  100.00 |   100.00 |  100.00 |  100.00 |
 src/components/cards      |   56.33 |    48.00 |   70.00 |   56.33 |
  ProjectCard.tsx          |  100.00 |    92.30 |  100.00 |  100.00 |
 src/hooks                 |   19.29 |     0.00 |   25.00 |   16.66 |
  useAuth.ts               |   42.85 |     0.00 |    0.00 |   42.85 |
  useToogle.ts             |  100.00 |   100.00 |  100.00 |  100.00 |
 src/utils                 |   55.22 |    52.38 |   42.10 |   55.73 |
  auth.ts                  |   84.09 |    73.33 |   80.00 |   82.92 |
  config.ts                |    0.00 |     0.00 |  100.00 |    0.00 |
 src/api                   |   77.52 |    55.55 |   88.88 |   77.52 |
  http-api-client.ts       |   88.05 |    66.66 |  100.00 |   88.05 |
---------------------------|---------|----------|---------|---------|
```

:::tip Análisis del Coverage Actual
El coverage global es bajo (30%) porque solo hemos implementado tests para **módulos específicos como ejercicio didáctico**:

- ✅ **Loader.tsx y ProjectCard.tsx**: 100% de coverage - ejemplos completos
- ✅ **auth.ts y http-api-client.ts**: >80% coverage - buena cobertura
- ⚠️ **Otros componentes**: Sin tests aún (ejercicio enfocado en ejemplos representativos)

En un proyecto real de producción, se extendería gradualmente el testing a todos los módulos críticos.
:::

**Leyendo la tabla:**

- **File**: El archivo o directorio siendo analizado
- **% Stmts**: Porcentaje de statements cubiertos
- **% Branch**: Porcentaje de branches cubiertos
- **% Funcs**: Porcentaje de funciones cubiertos
- **% Lines**: Porcentaje de líneas cubiertas

En el ejemplo de nuestro proyecto:

- **Components testeados** tienen cobertura completa:
  - `Loader.tsx`: 100% en todas las métricas (componente simple bien testeado)
  - `ProjectCard.tsx`: 100% statements/funciones, 92.3% branches (un branch difícil de testear)
  
- **API layer** (`src/api/`) tiene buena cobertura (77.52% global)
  - `http-api-client.ts`: 88.05% statements (le faltan algunos error handlers)
  
- **Utilities** (`src/utils/`) tienen cobertura moderada (55.22% global)
  - `auth.ts`: 84.09% statements, 73.33% branches (buena cobertura)
  - `config.ts`: Sin tests de ejecución (solo importado)
  
- **Hooks** (`src/hooks/`) tienen cobertura baja (19.29% global)
  - `useToogle.ts`: 100% cubierto (usado en tests de ProjectCard)
  - `useAuth.ts`: Solo 42.85% (hook mockeado en tests, no testeado directamente)
  
- **All files** muestra el promedio global (30.86% - bajo porque solo testeamos módulos específicos como ejercicio)

### Reporte HTML Detallado

Jest también genera un reporte HTML interactivo en `coverage/lcov-report/index.html`. Abre este archivo en tu navegador para ver:

- **Código con highlighting**: Verde = cubierto, Rojo = no cubierto
- **Navegación por archivos**: Explora tu codebase archivo por archivo
- **Identificación visual**: Rápidamente ve qué líneas/branches faltan

#### Ejemplo de código en reporte HTML

Abrimos el reporte HTML (`coverage/lcov-report/index.html`) y navegamos a `src/utils/http-api-client.ts`:

```typescript
export class HttpApiClient {
  private static instance: HttpApiClient;

  async getProjects(): Promise<Project[]> {
    const token = this.token();                              // ✅ Cubierto (verde)
    
    if (!token) {                                            // ✅ Cubierto (verde)
      window.location.replace('/login');                     // ✅ Cubierto (verde)
      return [];                                             // ✅ Cubierto (verde)
    }

    try {                                                    // ✅ Cubierto (verde)
      const response = await fetch(                          // ✅ Cubierto (verde)
        `${API_BASE_URI}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 404) {                         // ✅ Cubierto (verde)
        return [];                                           // ✅ Cubierto (verde)
      }

      if (response.status === 401) {                         // ✅ Cubierto (verde)
        removeAuthToken();                                   // ✅ Cubierto (verde)
        window.location.replace('/login');                   // ✅ Cubierto (verde)
        return [];                                           // ✅ Cubierto (verde)
      }

      return await response.json();                          // ✅ Cubierto (verde)
      
    } catch (error) {                                        // ❌ No cubierto (rojo)
      console.error('Network error:', error);                // ❌ No cubierto (rojo)
      throw error;                                           // ❌ No cubierto (rojo)
    }
  }
}
```

El reporte muestra en **rojo** que el bloque `catch` nunca se ejecutó en nuestros tests. Esto indica que **falta un test para errores de red** (cuando fetch falla completamente, no por 404/401 sino por timeout, red caída, etc.).

**Acción correctiva:**

```typescript
// Agregamos el test faltante
it('debe manejar errores de red', async () => {
  const mockFetch = jest.fn().mockRejectedValue(
    new Error('Network error')
  );
  global.fetch = mockFetch;

  await expect(client.getProjects()).rejects.toThrow('Network error');
});
```

Después de añadir este test, el coverage del `http-api-client.ts` sube de 88% a 100%.

## Configurar Coverage Thresholds

Los **thresholds** (umbrales) de coverage son límites mínimos que Jest puede verificar. Si el coverage cae por debajo del threshold, Jest falla, alertándote de que se está perdiendo cobertura.

### Configuración básica

En nuestro proyecto **Taller-Testing-Security**, podemos configurar thresholds en `jest.config.cjs`:

```javascript
// jest.config.cjs
module.exports = {
  // ... resto de configuración
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

Con esta configuración, si cualquier métrica cae por debajo del 80%, los tests fallarán con un mensaje de error:

```text
Jest: "global" coverage threshold for branches (80%) not met: 75%
```

### Thresholds por archivo/carpeta

Puedes establecer thresholds diferentes para archivos o directorios específicos. En nuestro proyecto:

```javascript
// jest.config.cjs
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    
    // Código crítico de autenticación necesita mayor coverage
    './src/utils/auth.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    
    // API client es crítico para funcionamiento
    './src/utils/http-api-client.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    
    // Componentes pueden tener threshold estándar
    './src/components/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    
    // Hooks personalizados con threshold medio
    './src/hooks/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

**Justificación de thresholds:**

- **`auth.ts` (100%)**: Cualquier bug en autenticación es crítico (seguridad, acceso indebido)
- **`http-api-client.ts` (90%)**: Maneja toda comunicación con backend, errores afectan toda la app
- **`components/` (75%)**: Importantes pero menos críticos, UI puede testearse visualmente
- **`hooks/` (70%)**: Utilidades reutilizables, threshold moderado

### Thresholds incrementales

Una buena estrategia es **aumentar thresholds gradualmente**:

```javascript
// Semana 1
coverageThreshold: { global: { branches: 50 } }

// Semana 2 - Aumentar después de alcanzar 50%
coverageThreshold: { global: { branches: 60 } }

// Semana 3
coverageThreshold: { global: { branches: 70 } }

// Meta final
coverageThreshold: { global: { branches: 80 } }
```

Esto evita la frustración de intentar llegar a 80% de golpe y establece progreso mensurable.

### Ignorar archivos del coverage

Algunos archivos no necesitan coverage (o no pueden testearse fácilmente). En nuestro `jest.config.cjs`:

```javascript
// jest.config.cjs
module.exports = {
  // Patrones de archivos a ignorar en coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',           // Dependencias
    '/dist/',                   // Build output
    '/coverage/',               // Reportes de coverage
    '\\.config\\.(js|ts)$',     // Archivos de configuración (vite.config.ts, etc.)
    '/__mocks__/',              // Archivos de mocks
    '/src/types/',              // Solo definiciones de tipos TypeScript
    '/src/vite-env.d.ts',       // Tipos generados por Vite
  ],
  
  // Especificar qué archivos SÍ incluir en coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',     // Todo en src/
    '!src/**/*.d.ts',                // Excluir definiciones de tipos
    '!src/main.tsx',                 // Excluir entry point
    '!src/App.tsx',                  // Excluir App root (muy acoplado a React)
    '!src/styles/**',                // Excluir estilos (Styled Components)
    '!src/**/*.stories.tsx',         // Excluir stories si usáramos Storybook
    '!src/utils/__mocks__/**',       // Excluir mocks manuales
  ],
};
```

**Archivos que excluimos del coverage en nuestro proyecto:**

1. **`main.tsx`**: Entry point de React, solo hace `ReactDOM.render()`, nada que testear
2. **`App.tsx`**: Componente raíz con Router, difícil de testear unitariamente (mejor E2E)
3. **`vite-env.d.ts`**: Tipos generados automáticamente por Vite
4. **`*.d.ts`**: Archivos de definiciones de tipos (sin lógica)
5. **`src/styles/`**: Styled Components, testing visual no es útil en coverage
6. **`__mocks__/`**: Los mocks no se testean a sí mismos

## ¿Cuánto Coverage es Suficiente?

No existe un número mágico, pero estas son las recomendaciones generales según el tipo de proyecto:

### Objetivo estándar: 70-80%

**Para la mayoría de proyectos**, un coverage de **70-80%** es un buen equilibrio entre calidad y esfuerzo:

- **Es alcanzable** sin esfuerzo desproporcionado
- **Detecta la mayoría de bugs** en código crítico
- **Permite flexibilidad** en código de bajo riesgo
- **No genera frustración** en el equipo

**Ejemplo práctico en nuestro proyecto:**

```typescript
// src/utils/auth.ts - Código crítico: 100% coverage requerido
export const setAuthToken = (token: string): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, token);
};

export const isTokenActive = (token: string | null): boolean => {
  if (!token) return false;
  const decodedToken = jwt_decode<DecodedToken>(token);
  return decodedToken.exp * 1000 > Date.now();
};

// Cada branch testeado por su importancia (seguridad)
// ✅ Test: token válido → true
// ✅ Test: token null → false  
// ✅ Test: token expirado → false
// ✅ Test: token futuro → true

// src/components/Loader.tsx - Código auxiliar: 75% coverage aceptable
export const Loader: React.FC = () => (
  <Container>
    <LoaderSpinner />
  </Container>
);

// Componente visual simple, un test de smoke es suficiente
// ✅ Test: renderiza sin crash
// (No necesitamos testear estilos, animaciones CSS, etc.)
```

### Coverage alto: 90-100%

**Casos donde se justifica coverage muy alto:**

1. **Código financiero o médico:**
   - Errores pueden costar dinero o vidas
   - Regulaciones pueden exigir coverage certificado
   - Auditorías requieren trazabilidad completa

2. **Librerías públicas:**
   - Miles de usuarios dependen del código
   - No sabes en qué contextos se usará
   - Bug puede afectar muchos proyectos

3. **Componentes críticos del sistema:**
   - Autenticación y autorización
   - Procesamiento de pagos
   - Gestión de datos sensibles

**Ejemplo de biblioteca pública:**

```typescript
// lodash, moment, etc. apuntan a 100% coverage
// Sus usuarios dependen de comportamiento consistente
describe('cloneDeep', () => {
  it('clones nested objects');
  it('clones arrays');
  it('handles circular references');
  it('preserves prototypes');
  it('handles Dates');
  it('handles RegExp');
  // ... decenas de tests para cubrir todos los edge cases
});
```

### Coverage bajo puede ser aceptable: 40-60%

**Situaciones donde coverage bajo es pragmático:**

1. **Prototipos o MVPs:**
   - Velocidad > calidad en validación inicial
   - Código descartable si la idea no funciona
   - Coverage puede añadirse después si el proyecto avanza

2. **Scripts de automatización únicos:**
   - Se ejecutan manualmente con supervisión
   - Riesgo bajo si fallan
   - Más eficiente validar manualmente

3. **Código legacy en transición:**
   - Mejor coverage incremental que reescribir todo
   - Priorizar tests en cambios nuevos
   - "Código que funciona no se toca" si no hay bugs

### El número no es todo

**Coverage alto NO garantiza calidad:**

```typescript
// 100% coverage pero test inútil ❌
it('should add numbers', () => {
  add(2, 2); // No verifica el resultado!
});

// 50% coverage pero test valioso ✅
it('should validate credit card format', () => {
  expect(() => processPayment('1234')).toThrow('Invalid card');
  // Solo testa path de error, pero es el más importante
});
```

**Métricas más importantes que el número:**

- ¿Los tests encuentran bugs reales?
- ¿Puedo refactorizar confiadamente?
- ¿Los tests documentan el comportamiento esperado?
- ¿Cuánto tiempo toma ejecutar los tests?

### Estrategia recomendada

1. **Empieza con thresholds bajos** (50-60%)
2. **Testa código nuevo a 80%+** (no dejes caer coverage)
3. **Prioriza coverage en código crítico** sobre coverage global
4. **Revisa qué NO está cubierto** para decisiones conscientes
5. **Usa coverage como guía, no como meta absoluta**

**Visualización de prioridades en nuestro proyecto:**

```text
┌──────────────────────────────────────────────────────┐
│      Código Crítico (90-100%)                        │
│  ✅ src/utils/auth.ts          (100% actual)         │
│  ✅ src/utils/config.ts        (100% actual)         │
│  🔄 src/utils/http-api-client.ts (88% → 90%)         │
├──────────────────────────────────────────────────────┤
│      Código Importante (75-85%)                      │
│  ✅ src/components/ProjectCard.tsx  (85% actual)     │
│  🔄 src/hooks/useAuth.ts            (80% actual)     │
│  🔄 src/hooks/useToggle.ts          (70% → 75%)      │
├──────────────────────────────────────────────────────┤
│      Código Auxiliar (60-75%)                        │
│  ✅ src/components/Loader.tsx       (100% actual)    │
│  ⚪ src/components/Button.tsx       (no testeado)    │
│  ⚪ src/utils/formatters.ts         (no testeado)    │
├──────────────────────────────────────────────────────┤
│      Código de Bajo Riesgo (<60%)                    │
│  ⚪ src/styles/                     (ignorado)       │
│  ⚪ src/main.tsx                    (ignorado)       │
│  ⚪ src/App.tsx                     (ignorado)       │
│  ⚪ src/vite-env.d.ts               (ignorado)       │
└──────────────────────────────────────────────────────┘

Leyenda:
✅ Objetivo cumplido  | 🔄 Necesita mejora  | ⚪ No prioritario
```

**Estado actual del proyecto:**

- **Global**: 82.14% (por encima del objetivo de 70-80%)
- **Utilities**: 95% (excelente, código crítico bien cubierto)
- **Components**: 90% (muy bien, UI confiable)
- **Hooks**: 75% (aceptable, pero se puede mejorar)

## Buenas Prácticas

El coverage es una herramienta poderosa, pero debe usarse correctamente para obtener el máximo beneficio sin caer en trampas comunes.

### 1. Tests descriptivos y legibles

Los tests son documentación viva. Deben explicar **qué** hace el código y **por qué**.

**Nombres de tests en nuestro proyecto:**

```typescript
// ❌ Mal: Vago, no explica el caso
it('works', () => { ... });

// ❌ Mal: Demasiado técnico
it('should call setAuthToken with params', () => { ... });

// ✅ Bien: Claro, explica comportamiento esperado
it('debe almacenar token en localStorage cuando se llama setAuthToken', () => { 
  setAuthToken('abc123');
  expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('abc123');
});

// ✅ Bien: Describe el escenario específico
it('debe retornar false cuando el token ha expirado', () => {
  const expiredToken = 'eyJhbGciOiJIUzI1NiJ9...'; // Token con exp pasado
  expect(isTokenActive(expiredToken)).toBe(false);
});
```

**Estructura clara:**

```typescript
// src/components/__tests__/ProjectCard.test.tsx
describe('ProjectCard', () => {
  describe('renderizado de información del proyecto', () => {
    it('debe mostrar nombre del proyecto', () => { ... });
    it('debe mostrar descripción del proyecto', () => { ... });
    it('debe renderizar botón Delete si canEdit es true', () => { ... });
  });

  describe('interacciones del usuario', () => {
    it('debe llamar toggleEdit cuando se hace click en Edit', () => { ... });
    it('debe llamar onDelete cuando se confirma eliminación', () => { ... });
    it('debe llamar onToggleComplete cuando se hace click en Complete', () => { ... });
  });
  
  describe('estados condicionales', () => {
    it('debe mostrar badge "Completed" cuando completed es true', () => { ... });
    it('debe ocultar botón Delete cuando canEdit es false', () => { ... });
  });
});
```

### 2. Un concepto por test (Single Responsibility)

Cada test debe verificar **una sola cosa**. Si falla, debe ser obvio qué está roto.

**Antipatrón - Tests que hacen demasiado:**

```typescript
// ❌ Mal: Test hace muchas cosas
it('debe manejar todo el flujo de ProjectCard', () => {
  const mockOnDelete = jest.fn();
  const mockOnToggleComplete = jest.fn();
  
  // 1. Testea renderizado
  render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);
  expect(screen.getByText('Test Project')).toBeInTheDocument();

  // 2. Testea interacción de edición
  fireEvent.click(screen.getByText('Edit'));
  expect(screen.getByText('Save')).toBeInTheDocument();

  // 3. Testea eliminación
  fireEvent.click(screen.getByText('Delete'));
  expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id);

  // 4. Testea completar proyecto
  fireEvent.click(screen.getByText('Complete'));
  expect(mockOnToggleComplete).toHaveBeenCalled();
});
```

**Mejor enfoque:**

```typescript
// ✅ Bien: Tests separados y enfocados
describe('ProjectCard', () => {
  it('debe mostrar información del proyecto', () => {
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Project description')).toBeInTheDocument();
  });

  it('debe cambiar a modo edición al hacer click en Edit', () => {
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('debe llamar onDelete con el ID correcto', () => {
    const mockOnDelete = jest.fn();
    render(<ProjectCard project={mockProject} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id);
  });

  it('debe llamar onToggleComplete al completar proyecto', () => {
    const mockOnToggleComplete = jest.fn();
    render(
      <ProjectCard 
        project={mockProject} 
        onToggleComplete={mockOnToggleComplete} 
      />
    );
    
    fireEvent.click(screen.getByText('Complete'));
    expect(mockOnToggleComplete).toHaveBeenCalledWith(mockProject.id);
  });
});
```

**Ventajas:**

- Si falla el test de edición, sé exactamente qué está roto
- Puedo ejecutar solo el test relevante durante desarrollo
- Tests más rápidos individualmente
- Mejor documentación del comportamiento

### 3. No testear detalles de implementación

Testa **qué hace** el componente, no **cómo lo hace**. Los tests deben sobrevivir refactorizaciones.

**Antipatrón - Testear state interno:**

```typescript
// ❌ Mal: Acoplado a implementación interna
it('debe actualizar state isEditing', () => {
  const { container } = render(<ProjectCard project={mockProject} />);
  const component = container.querySelector('.project-card');
  
  // Esto es testing de implementación (acceder a state interno)
  expect(component.state.isEditing).toBe(false);
  
  fireEvent.click(screen.getByText('Edit'));
  expect(component.state.isEditing).toBe(true);
});

// Si cambias de useState a useReducer o a un hook personalizado,
// el test falla aunque la funcionalidad sea idéntica
```

**Mejor enfoque - Testear comportamiento observable:**

```typescript
// ✅ Bien: Testa lo que el usuario ve
it('debe cambiar a modo edición cuando se hace click en Edit', () => {
  render(<ProjectCard project={mockProject} />);
  
  // Verificar estado inicial visible
  expect(screen.getByText('Edit')).toBeInTheDocument();
  expect(screen.queryByText('Save')).not.toBeInTheDocument();
  
  // Simular acción del usuario
  fireEvent.click(screen.getByText('Edit'));
  
  // Verificar resultado visible
  expect(screen.getByText('Save')).toBeInTheDocument();
  expect(screen.queryByText('Edit')).not.toBeInTheDocument();
});

// Este test funciona igual si cambias la implementación interna
// (useState → useReducer → useToggle → Context, etc.)
```

**Qué testear vs qué NO testear:**

| ✅ Testa esto (Comportamiento) | ❌ No testes esto (Implementación) |
|--------------------------------|-----------------------------------|
| Texto renderizado (nombre del proyecto) | Nombres de variables de state (`isEditing`) |
| Botones visibles (Edit, Delete, Complete) | Nombres de funciones internas (`handleToggle`) |
| Respuestas a eventos (click en Edit) | Estructura de componentes hijos |
| Llamadas a props (`onDelete`, `onToggleComplete`) | Qué hooks se usan (`useToggle` vs `useState`) |
| Estilos visibles (badge "Completed") | Order de ejecución interno de funciones |

### 4. Tests independientes y aislados

Cada test debe poder ejecutarse **solo** y en **cualquier orden** sin afectar a otros.

**Antipatrón - Tests con estado compartido:**

```typescript
// ❌ Mal: Tests dependen del orden de ejecución
describe('UserService', () => {
  let currentUser; // Estado compartido

  it('debe crear usuario', () => {
    currentUser = createUser('John');
    expect(currentUser.name).toBe('John');
  });

  it('debe actualizar usuario', () => {
    // Depende del test anterior!
    currentUser.name = 'Jane';
    expect(currentUser.name).toBe('Jane');
  });

  it('debe eliminar usuario', () => {
    // También depende de tests previos
    deleteUser(currentUser);
    expect(currentUser).toBeNull();
  });
});

// Si ejecutas solo el segundo test, falla porque currentUser no existe
```

**Mejor enfoque - Setup independiente:**

```typescript
// ✅ Bien: Cada test configura su propio estado
describe('UserService', () => {
  it('debe crear usuario', () => {
    const user = createUser('John');
    expect(user.name).toBe('John');
  });

  it('debe actualizar usuario', () => {
    // Setup propio, no depende de otros tests
    const user = createUser('John');
    const updated = updateUser(user, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
  });

  it('debe eliminar usuario', () => {
    // También independiente
    const user = createUser('John');
    deleteUser(user);
    expect(findUser(user.id)).toBeNull();
  });
});
```

### 5. Setup y Teardown apropiados

Usa `beforeEach`, `afterEach`, `beforeAll`, `afterAll` para código de setup compartido.

**Cuándo usar cada uno:**

```typescript
// src/utils/__tests__/http-api-client.test.ts
describe('HttpApiClient', () => {
  let client: HttpApiClient;
  let mockFetch: jest.Mock;

  // beforeAll: Setup costoso una sola vez
  beforeAll(() => {
    // Inicializar singleton (solo una vez para todas las pruebas)
    client = HttpApiClient.getInstance();
  });

  // beforeEach: Limpieza entre tests
  beforeEach(() => {
    // Cada test empieza con mocks limpios
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    localStorage.clear();
  });

  it('debe obtener proyectos exitosamente', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'valid-token');
    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => [{ id: '1', name: 'Project 1' }],
    });

    const projects = await client.getProjects();
    expect(projects).toHaveLength(1);
  });

  it('debe redirigir a login si no hay token', async () => {
    // localStorage está vacío gracias a beforeEach
    const replaceMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { replace: replaceMock },
      writable: true,
    });

    await client.getProjects();
    expect(replaceMock).toHaveBeenCalledWith('/login');
  });

  // afterEach: Limpieza específica si necesaria
  afterEach(() => {
    jest.clearAllMocks(); // Limpiar mocks después de cada test
  });

  // afterAll: Cleanup final (si fuera necesario)
  afterAll(() => {
    // En este caso no necesitamos cleanup especial
    // pero aquí cerraríamos conexiones DB, etc.
  });
});
```

**Buenas prácticas en nuestro proyecto:**

```typescript
// ✅ Usar beforeEach para setup común
beforeEach(() => {
  // Limpiar todos los mocks
  jest.clearAllMocks();
  
  // Resetear localStorage
  localStorage.clear();
  
  // Resetear mocks de navegación
  mockNavigate.mockClear();
});

// ✅ Factories para crear datos de test
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: '123',
  name: 'Test Project',
  description: 'Test description',
  completed: false,
  ...overrides,
});

it('debe manejar proyecto completado', () => {
  const completedProject = createMockProject({ completed: true });
  render(<ProjectCard project={completedProject} />);
  expect(screen.getByText('Completed')).toBeInTheDocument();
});

// ✅ Cleanup explícito en tests con side effects
it('debe guardar token en localStorage', () => {
  setAuthToken('abc123');
  expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe('abc123');
  
  // Cleanup (aunque beforeEach ya lo hace)
  localStorage.clear();
});
```

### 6. Priorizar tests de valor

**No persigas 100% coverage ciegamente.** Enfócate en testear código que **genera valor**:

**Alto valor en nuestro proyecto:**

- ✅ **`src/utils/auth.ts`**: Lógica de tokens, seguridad crítica
- ✅ **`src/utils/http-api-client.ts`**: Comunicación con API, manejo de errores
- ✅ **`src/components/ProjectCard.tsx`**: Componente complejo con lógica de negocio
- ✅ **`src/hooks/useAuth.ts`**: Hook reutilizable para autenticación
- ✅ Validaciones de formularios (cuando las añadamos)

**Bajo valor (pero puedes testear si es rápido):**

- 🤷 **`src/components/Loader.tsx`**: Componente puramente presentacional
- 🤷 **`src/styles/`**: Styled Components (sin lógica)
- 🤷 **`src/utils/constants.ts`**: Solo constantes
- 🤷 **`src/types/`**: Solo definiciones de tipos

**Ejemplo priorización:**

```typescript
// ✅ Alta prioridad: Lógica compleja de autenticación
describe('isTokenActive', () => {
  it('debe retornar false para token null');
  it('debe retornar false para token expirado');
  it('debe retornar true para token válido');
  it('debe manejar tokens malformados');
  it('debe considerar la zona horaria del servidor');
  // ... tests exhaustivos por la criticidad
});

// 🤷 Baja prioridad: Componente visual simple
describe('Loader', () => {
  it('debe renderizar sin crash', () => {
    render(<Loader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  // Un test de smoke es suficiente, no necesitamos 10 tests
});
```

### 7. Usar coverage para descubrir, no para certificar

**Usa coverage reports para:**

- 📊 Identificar código sin tests
- 🔍 Descubrir edge cases olvidados
- 📈 Tracking de progreso en el tiempo
- 🎯 Priorizar qué testear después

**NO uses coverage para:**

- ❌ Forzar 100% en todo
- ❌ Medir calidad de tests
- ❌ Comparar entre equipos
- ❌ Como único KPI

**Ejemplo de uso correcto:**

```bash
# Ejecutar coverage en nuestro proyecto
cd Taller-Testing-Security/ui
npm run test:coverage

# Mirar reporte en consola
# "Ah, http-api-client.ts solo tiene 88% coverage"
# "Veo que no testeo el caso de error de red (catch block)"

# Abrir reporte HTML para ver exactamente qué líneas faltan
open coverage/lcov-report/index.html
# Navegar a: src/utils/http-api-client.ts
# Ver en rojo las líneas del catch block

# Añadir test específico
it('debe manejar errores de red', async () => {
  const mockFetch = jest.fn().mockRejectedValue(
    new Error('Network error')
  );
  global.fetch = mockFetch;

  await expect(client.getProjects()).rejects.toThrow('Network error');
});

# Volver a ejecutar coverage
npm run test:coverage
# Ahora http-api-client.ts tiene 100% ✅
```

**Workflow recomendado:**

1. **Escribir tests para features nuevas** (alcanzar ~80%)
2. **Ejecutar `npm run test:coverage`** periódicamente
3. **Revisar reporte HTML** para ver gaps
4. **Priorizar** qué gaps son importantes (código crítico vs auxiliar)
5. **Añadir tests específicos** solo para gaps de alto valor
6. **No obsesionarse** con llegar a 100% en todo
