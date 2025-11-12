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

```text
 PASS  src/utils/__tests__/math.test.ts
 PASS  src/components/__tests__/Button.test.tsx

--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.71 |    83.33 |   87.50 |   85.71 |
 utils/math.ts      |   100   |    100   |   100   |   100   |
 components/Button  |   80.00 |    75.00 |   83.33 |   80.00 |
--------------------|---------|----------|---------|---------|
```

**Leyendo la tabla:**

- **File**: El archivo siendo analizado
- **% Stmts**: Porcentaje de statements cubiertos
- **% Branch**: Porcentaje de branches cubiertos
- **% Funcs**: Porcentaje de funciones cubiertos
- **% Lines**: Porcentaje de líneas cubiertas

En el ejemplo:

- `math.ts` tiene cobertura perfecta (100% en todo)
- `Button` tiene buena cobertura pero le faltan algunas ramas (75% branches)
- **All files** muestra el promedio global

### Reporte HTML Detallado

Jest también genera un reporte HTML interactivo en `coverage/lcov-report/index.html`. Abre este archivo en tu navegador para ver:

- **Código con highlighting**: Verde = cubierto, Rojo = no cubierto
- **Navegación por archivos**: Explora tu codebase archivo por archivo
- **Identificación visual**: Rápidamente ve qué líneas/branches faltan

#### Ejemplo de código en reporte HTML

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {              // ✅ Cubierto (verde)
    throw new Error('Div 0'); // ❌ No cubierto (rojo)
  }
  return a / b;               // ✅ Cubierto (verde)
}
```

El reporte muestra que la línea del `throw` nunca se ejecutó, indicando que falta un test para división por cero.

## Configurar Coverage Thresholds

Los **thresholds** (umbrales) de coverage son límites mínimos que Jest puede verificar. Si el coverage cae por debajo del threshold, Jest falla, alertándote de que se está perdiendo cobertura.

### Configuración básica

```javascript
// jest.config.js
module.exports = {
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

Con esta configuración, si cualquier métrica cae por debajo del 80%, los tests fallarán con un mensaje de error.

### Thresholds por archivo/carpeta

Puedes establecer thresholds diferentes para archivos o directorios específicos:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Código crítico necesita mayor coverage
    './src/payment/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Utilities pueden tener menor threshold
    './src/utils/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

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

Algunos archivos no necesitan coverage (o no pueden testearse fácilmente):

```javascript
module.exports = {
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '\\.config\\.(js|ts)$',      // Archivos de configuración
    '/__mocks__/',                // Mocks
    '/src/types/',                // Solo tipos TypeScript
  ],
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',             // Excluir definiciones de tipos
    '!src/**/*.stories.tsx',      // Excluir stories de Storybook
    '!src/index.tsx',             // Excluir entry point
  ],
};
```

## ¿Cuánto Coverage es Suficiente?

No existe un número mágico, pero estas son las recomendaciones generales según el tipo de proyecto:

### Objetivo estándar: 70-80%

**Para la mayoría de proyectos**, un coverage de **70-80%** es un buen equilibrio entre calidad y esfuerzo:

- **Es alcanzable** sin esfuerzo desproporcionado
- **Detecta la mayoría de bugs** en código crítico
- **Permite flexibilidad** en código de bajo riesgo
- **No genera frustración** en el equipo

**Ejemplo práctico:**

```typescript
// Código crítico: payment.service.ts - 90% coverage
class PaymentService {
  processPayment(amount: number, card: Card) {
    // Cada branch testeado por su importancia
  }
}

// Código auxiliar: logger.ts - 60% coverage
class Logger {
  log(message: string) {
    // Menos crítico, coverage más relajado
  }
}
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

**Visualización de prioridades:**

```text
┌─────────────────────────────────────────┐
│      Código Crítico (90-100%)           │
│  - Pagos                                │
│  - Autenticación                        │
│  - Lógica de negocio core               │
├─────────────────────────────────────────┤
│      Código Importante (70-80%)         │
│  - Features principales                 │
│  - Validaciones                         │
│  - Transformaciones de datos            │
├─────────────────────────────────────────┤
│      Código Auxiliar (50-60%)           │
│  - Utilities                            │
│  - Helpers                              │
│  - Formatters                           │
├─────────────────────────────────────────┤
│      Código de Bajo Riesgo (<50%)       │
│  - Configuración                        │
│  - Constants                            │
│  - Types                                │
└─────────────────────────────────────────┘
```

## Buenas Prácticas

El coverage es una herramienta poderosa, pero debe usarse correctamente para obtener el máximo beneficio sin caer en trampas comunes.

### 1. Tests descriptivos y legibles

Los tests son documentación viva. Deben explicar **qué** hace el código y **por qué**.

**Nombres de tests:**

```typescript
// ❌ Mal: Vago, no explica el caso
it('works', () => { ... });

// ❌ Mal: Demasiado técnico
it('should call validateEmail with params', () => { ... });

// ✅ Bien: Claro, explica comportamiento esperado
it('debe mostrar mensaje de error cuando email es inválido', () => { ... });

// ✅ Bien: Describe el escenario específico
it('debe aceptar emails con subdominios como user@mail.company.com', () => { ... });
```

**Estructura clara:**

```typescript
describe('LoginForm', () => {
  describe('validación de email', () => {
    it('debe aceptar emails válidos', () => { ... });
    it('debe rechazar emails sin @', () => { ... });
    it('debe rechazar emails sin dominio', () => { ... });
  });

  describe('submit del formulario', () => {
    it('debe llamar onSubmit con datos correctos', () => { ... });
    it('debe mostrar loading durante submit', () => { ... });
    it('debe deshabilitar botón mientras carga', () => { ... });
  });
});
```

### 2. Un concepto por test (Single Responsibility)

Cada test debe verificar **una sola cosa**. Si falla, debe ser obvio qué está roto.

**Antipatrón - Tests que hacen demasiado:**

```typescript
// ❌ Mal: Test hace muchas cosas
it('debe manejar todo el flujo de usuario', () => {
  // 1. Testea validación
  const form = render(<RegisterForm />);
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  expect(getByText('Email inválido')).toBeInTheDocument();

  // 2. Testea guardado
  fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
  fireEvent.click(submitButton);
  expect(mockSave).toHaveBeenCalled();

  // 3. Testea navegación
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

**Mejor enfoque:**

```typescript
// ✅ Bien: Tests separados y enfocados
describe('RegisterForm', () => {
  it('debe mostrar error cuando email es inválido', () => {
    render(<RegisterForm />);
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    expect(screen.getByText('Email inválido')).toBeInTheDocument();
  });

  it('debe llamar a la API de registro con datos correctos', async () => {
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.click(submitButton);
    expect(mockAPI.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'John Doe',
    });
  });

  it('debe navegar a dashboard después de registro exitoso', async () => {
    mockAPI.register.mockResolvedValue({ success: true });
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

**Ventajas:**

- Si falla el test de validación, sé exactamente qué está roto
- Puedo ejecutar solo el test relevante durante desarrollo
- Tests más rápidos individualmente
- Mejor documentación del comportamiento

### 3. No testear detalles de implementación

Testa **qué hace** el componente, no **cómo lo hace**. Los tests deben sobrevivir refactorizaciones.

**Antipatrón - Testear state interno:**

```typescript
// ❌ Mal: Acoplado a implementación interna
it('debe actualizar state count', () => {
  const { container } = render(<Counter />);
  const component = container.querySelector('.counter');
  
  // Esto es testing de implementación
  expect(component.state.count).toBe(0);
  
  fireEvent.click(incrementButton);
  expect(component.state.count).toBe(1);
});

// Si cambias de state a useReducer, el test falla aunque la funcionalidad sea igual
```

**Mejor enfoque - Testear comportamiento observable:**

```typescript
// ✅ Bien: Testa lo que el usuario ve
it('debe incrementar el contador cuando se hace click', () => {
  render(<Counter />);
  
  // Verificar estado inicial visible
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  
  // Simular acción del usuario
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));
  
  // Verificar resultado visible
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// Este test funciona igual si cambias useState por useReducer, Context, o Zustand
```

**Qué testear vs qué NO testear:**

| ✅ Testa esto (Comportamiento) | ❌ No testes esto (Implementación) |
|--------------------------------|-----------------------------------|
| Texto renderizado | Nombres de variables de state |
| Elementos visibles | Nombres de funciones internas |
| Respuestas a eventos de usuario | Estructura de componentes |
| Llamadas a APIs | Qué hooks se usan |
| Navegación | Order de ejecución interno |

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
describe('Database Tests', () => {
  let db;

  // beforeAll: Setup costoso una sola vez
  beforeAll(async () => {
    db = await createTestDatabase();
    await db.migrate();
  });

  // beforeEach: Limpieza entre tests
  beforeEach(async () => {
    await db.clearAllTables(); // Cada test empieza limpio
  });

  it('debe insertar usuario', async () => {
    await db.users.insert({ name: 'John' });
    const users = await db.users.findAll();
    expect(users).toHaveLength(1);
  });

  it('debe buscar por ID', async () => {
    // DB está vacía gracias a beforeEach
    const user = await db.users.insert({ name: 'Jane' });
    const found = await db.users.findById(user.id);
    expect(found.name).toBe('Jane');
  });

  // afterEach: Limpieza específica si necesaria
  afterEach(() => {
    jest.clearAllMocks(); // Limpiar mocks después de cada test
  });

  // afterAll: Cleanup final
  afterAll(async () => {
    await db.close();
  });
});
```

**Buenas prácticas:**

```typescript
// ✅ Usar beforeEach para setup común
beforeEach(() => {
  mockAPI.reset();
  mockNavigate.mockClear();
  localStorage.clear();
});

// ✅ Factories para crear datos de test
const createTestUser = (overrides = {}) => ({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  ...overrides,
});

it('debe manejar usuario sin email', () => {
  const user = createTestUser({ email: null });
  expect(validateUser(user)).toBe(false);
});

// ✅ Cleanup explícito en tests con side effects
it('debe guardar en localStorage', () => {
  saveToken('abc123');
  expect(localStorage.getItem('token')).toBe('abc123');
  
  // Cleanup
  localStorage.clear();
});
```

### 6. Priorizar tests de valor

**No persigas 100% coverage ciegamente.** Enfócate en testear código que **genera valor**:

**Alto valor:**

- ✅ Lógica de negocio compleja
- ✅ Validaciones críticas
- ✅ Transformaciones de datos
- ✅ Integraciones con APIs externas
- ✅ Código con historial de bugs

**Bajo valor (pero puedes testear si es rápido):**

- 🤷 Getters/setters triviales
- 🤷 Componentes puramente presentacionales
- 🤷 Constantes y configuración
- 🤷 Código generado automáticamente

**Ejemplo priorización:**

```typescript
// Alta prioridad: Lógica compleja de pricing
describe('calculatePrice', () => {
  it('debe aplicar descuento por volumen');
  it('debe sumar impuestos según región');
  it('debe aplicar cupones correctamente');
  it('debe limitar descuento máximo al 80%');
  // ... 20 tests cubriendo todos los casos
});

// Baja prioridad: Componente visual simple
const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);
// Tal vez un test de smoke, no necesitas 10 tests
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
# Ejecutar coverage
npm run test:coverage

# Mirar reporte HTML
# "Ah, la función validateCreditCard solo tiene 60% coverage"
# "Veo que no testeo el caso de tarjetas expiradas"

# Añadir test específico
it('debe rechazar tarjetas expiradas', () => {
  const expiredCard = { number: '4111...', expiry: '01/20' };
  expect(() => validateCreditCard(expiredCard))
    .toThrow('Card expired');
});
```
