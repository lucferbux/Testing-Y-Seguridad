---
sidebar_position: 3
title: "Conceptos Fundamentales"
---

# Conceptos Fundamentales

Antes de comenzar a escribir tests, es fundamental entender los conceptos y patrones que conforman las bases del testing efectivo. Esta sección cubre la anatomía de un test, patrones de organización, y principios que guían la escritura de buenos tests.

## Anatomía de un Test

Todos los frameworks de testing modernos, incluyendo Jest, comparten una estructura similar. Entender esta estructura te ayudará a escribir tests claros y organizados.

```typescript
describe('NombreDeLaFuncionalidad', () => {
  
  // Setup: Preparar el entorno
  beforeEach(() => {
    // Se ejecuta antes de cada test
  });

  // Test individual
  it('debe hacer algo específico', () => {
    // 1. Arrange: Preparar datos
    const input = 'valor';
    
    // 2. Act: Ejecutar la función
    const result = funcionATestear(input);
    
    // 3. Assert: Verificar resultado
    expect(result).toBe('esperado');
  });

  // Limpieza
  afterEach(() => {
    // Se ejecuta después de cada test
  });
});
```

### Elementos clave

**`describe()`**: Agrupa tests relacionados

La función `describe()` crea un **suite de tests**. Es una forma de organizar tests relacionados bajo un mismo concepto o funcionalidad. Puedes tener múltiples `describe` anidados para crear jerarquías.

```typescript
describe('Calculadora', () => {
  describe('sumar', () => {
    it('suma números positivos', () => { /* ... */ });
    it('suma números negativos', () => { /* ... */ });
  });
  
  describe('restar', () => {
    it('resta números positivos', () => { /* ... */ });
  });
});
```

Esta estructura no solo organiza tu código, sino que también genera reportes más legibles:

```text
Calculadora
  sumar
    ✓ suma números positivos
    ✓ suma números negativos
  restar
    ✓ resta números positivos
```

**`it()` o `test()`**: Define un test individual

Cada test debe verificar **un comportamiento específico**. `it()` y `test()` son equivalentes (Jest acepta ambos). El nombre del test debe completar la frase "it should..." (debe...).

```typescript
// Bien descriptivo
it('debe rechazar emails sin @', () => { /* ... */ });

// También válido
test('rechaza emails sin @', () => { /* ... */ });
```

**Hooks de ciclo de vida**:

- `beforeEach()`: Se ejecuta **antes de cada test** en el describe
- `afterEach()`: Se ejecuta **después de cada test**
- `beforeAll()`: Se ejecuta **una vez antes** de todos los tests
- `afterAll()`: Se ejecuta **una vez después** de todos los tests

Estos hooks son útiles para setup y limpieza. Por ejemplo:

```typescript
describe('Base de datos', () => {
  beforeEach(() => {
    // Crear una base de datos limpia antes de cada test
    database.clear();
    database.seed();
  });
  
  afterEach(() => {
    // Limpiar después de cada test
    database.close();
  });
  
  it('debe insertar usuario', () => {
    // La BD está limpia y lista para usar
    database.insert({ name: 'John' });
    expect(database.count()).toBe(1);
  });
});
```

## AAA Pattern (Arrange, Act, Assert)

El patrón AAA es una guía fundamental para estructurar el **contenido** de cada test individual. Este patrón hace que los tests sean más legibles y fáciles de entender, ya que sigue el flujo natural de cómo pensamos sobre el testing.

### Arrange (Preparar)

En esta fase, preparas todo lo necesario para ejecutar el test. Esto incluye:

- **Configurar datos de prueba**: Crear variables, objetos, arrays con los valores necesarios
- **Inicializar objetos**: Crear instancias de clases o componentes
- **Configurar mocks**: Preparar dependencias mockeadas con comportamientos específicos
- **Establecer estado inicial**: Configurar el sistema en el estado correcto para el test

**Ejemplo:**

```typescript
it('debe calcular el total del carrito correctamente', () => {
  // Arrange
  const producto1 = { nombre: 'Laptop', precio: 1000, cantidad: 1 };
  const producto2 = { nombre: 'Mouse', precio: 20, cantidad: 2 };
  const carrito = new Carrito();
  carrito.agregar(producto1);
  carrito.agregar(producto2);
  
  // ...
});
```

### Act (Actuar)

Esta es la parte central del test: ejecutar la acción que queremos testear. Generalmente es **una sola línea** que llama a la función, método, o interacción que estás probando.

- **Ejecutar la función/método**: Llamar al código bajo test
- **Realizar la acción a testear**: Click en botón, submit de formulario, etc.
- **Capturar el resultado**: Guardar el valor retornado para verificarlo después

**Ejemplo:**

```typescript
it('debe calcular el total del carrito correctamente', () => {
  // Arrange
  const producto1 = { nombre: 'Laptop', precio: 1000, cantidad: 1 };
  const producto2 = { nombre: 'Mouse', precio: 20, cantidad: 2 };
  const carrito = new Carrito();
  carrito.agregar(producto1);
  carrito.agregar(producto2);
  
  // Act
  const total = carrito.calcularTotal();
  
  // ...
});
```

### Assert (Afirmar)

Finalmente, verificas que el resultado es el esperado. Aquí es donde usas funciones como `expect()` para hacer aserciones sobre el resultado.

- **Verificar el resultado**: Comprobar que el valor retornado es correcto
- **Comprobar efectos secundarios**: Verificar que se llamaron funciones, se actualizó estado, etc.
- **Verificar el estado final**: Asegurar que el sistema quedó en el estado correcto

**Ejemplo completo:**

```typescript
it('debe calcular el total del carrito correctamente', () => {
  // Arrange
  const producto1 = { nombre: 'Laptop', precio: 1000, cantidad: 1 };
  const producto2 = { nombre: 'Mouse', precio: 20, cantidad: 2 };
  const carrito = new Carrito();
  carrito.agregar(producto1);
  carrito.agregar(producto2);
  
  // Act
  const total = carrito.calcularTotal();
  
  // Assert
  expect(total).toBe(1040); // 1000 + (20 * 2)
  expect(carrito.cantidadItems()).toBe(2);
});
```

### Beneficios del patrón AAA

- **Claridad**: Es inmediatamente obvio qué hace cada parte del test
- **Consistencia**: Todos los tests siguen la misma estructura
- **Facilita el mantenimiento**: Es fácil localizar y modificar cada fase
- **Detecta tests complejos**: Si cualquier fase es muy larga, puede indicar que el test (o el código) necesita refactorización

:::tip Consejo
Aunque no es obligatorio, muchos desarrolladores incluyen comentarios `// Arrange`, `// Act`, `// Assert` en sus tests para mayor claridad, especialmente cuando están aprendiendo.
:::

## Características de un Buen Test

No todos los tests son creados iguales. Un test mal escrito puede ser peor que no tener test, porque da falsa confianza o requiere mantenimiento constante. Los buenos tests siguen ciertos principios que los hacen valiosos y mantenibles.

### FIRST Principles

Los principios FIRST son un acrónimo que describe las características de tests efectivos. Estos principios fueron popularizados por Robert C. Martin (Uncle Bob) y son ampliamente aceptados en la industria.

#### Fast (Rápidos)

Los tests deben ejecutarse **rápidamente**. Idealmente, deberías poder ejecutar toda tu suite de tests en segundos, no minutos.

**Por qué es importante:**

- Tests lentos desincentivan ejecutarlos frecuentemente
- Ralentizan el ciclo de desarrollo y feedback
- Pueden bloquear pipelines de CI/CD

**Cómo lograrlo:**

- Mockea dependencias lentas (BD, APIs externas, filesystem)
- Mantén los tests unitarios puros y sin I/O
- Usa tests de integración/E2E selectivamente

```typescript
// ❌ Lento: Hace petición HTTP real
it('obtiene usuario', async () => {
  const user = await fetch('https://api.example.com/user/123');
  expect(user.name).toBe('John');
});

// ✅ Rápido: Mock de fetch
it('obtiene usuario', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ name: 'John' })
  });
  const user = await getUser('123');
  expect(user.name).toBe('John');
});
```

#### Independent (Independientes)

Cada test debe poder ejecutarse **de forma aislada**, sin depender del resultado o estado de otros tests.

**Por qué es importante:**

- Permite ejecutar tests en paralelo (más rápido)
- Facilita debugging (puedes ejecutar un test individual)
- Evita cascadas de fallos cuando un test rompe a otros

**Cómo lograrlo:**

- Usa `beforeEach` para setup fresco en cada test
- No compartas estado mutable entre tests
- Limpia estado después de cada test con `afterEach`

```typescript
// ❌ Dependiente: Los tests comparten estado
let contador = 0;

it('incrementa contador', () => {
  contador++;
  expect(contador).toBe(1);
});

it('incrementa contador otra vez', () => {
  contador++; // Depende del test anterior!
  expect(contador).toBe(2);
});

// ✅ Independiente: Cada test tiene su propio estado
it('incrementa contador', () => {
  let contador = 0;
  contador++;
  expect(contador).toBe(1);
});

it('incrementa contador otra vez', () => {
  let contador = 0;
  contador++;
  expect(contador).toBe(1); // Mismo resultado, independiente
});
```

#### Repeatable (Repetibles)

Los tests deben producir **el mismo resultado cada vez** que se ejecutan, sin importar el entorno (local, CI, otro desarrollador).

**Por qué es importante:**

- Tests que fallan aleatoriamente ("flaky tests") pierden confianza
- Dificulta identificar problemas reales
- Genera frustración en el equipo

**Cómo lograrlo:**

- No dependas de factores externos variables (tiempo actual, random, red)
- Mockea APIs externas y servicios de terceros
- Usa datos determinísticos

```typescript
// ❌ No repetible: Depende del tiempo actual
it('usuario es mayor de edad', () => {
  const usuario = { fechaNacimiento: new Date('2000-01-01') };
  expect(esMayorDeEdad(usuario)).toBe(true); // Fallará en 2024!
});

// ✅ Repetible: Mockea la fecha actual
it('usuario es mayor de edad', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01'));
  
  const usuario = { fechaNacimiento: new Date('2000-01-01') };
  expect(esMayorDeEdad(usuario)).toBe(true);
  
  jest.useRealTimers();
});
```

#### Self-validating (Auto-validantes)

Los tests deben **pasar o fallar automáticamente**, sin requerir intervención manual para interpretar los resultados.

**Por qué es importante:**

- Permite automatización completa en CI/CD
- Elimina interpretación subjetiva
- Resultados claros y binarios

**Cómo lograrlo:**

- Usa aserciones claras (`expect()`)
- No dependas de inspección manual de logs o consola
- El test debe indicar claramente qué falló

```typescript
// ❌ No auto-validante: Requiere inspección manual
it('calcula total', () => {
  const total = calcularTotal([10, 20, 30]);
  console.log('Total:', total); // Desarrollador debe verificar manualmente
});

// ✅ Auto-validante: Pasa o falla automáticamente
it('calcula total', () => {
  const total = calcularTotal([10, 20, 30]);
  expect(total).toBe(60); // Verifica automáticamente
});
```

#### Timely (Oportunos)

Los tests deben escribirse en el **momento adecuado**. Idealmente, antes o inmediatamente después del código de producción.

**Por qué es importante:**

- Tests escritos mucho después del código requieren más esfuerzo
- El código puede ser difícil de testear si no se diseñó pensando en tests
- Se pierden beneficios del diseño guiado por tests

**Enfoques:**

- **TDD**: Tests antes que código (ideal para algunos equipos)
- **Test-alongside**: Tests mientras desarrollas
- **Test-after**: Tests inmediatamente después (mínimo aceptable)

```typescript
// Timely: Escribir test junto con la funcionalidad

// 1. Escribo el test
it('valida email correcto', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

// 2. Implemento la función
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Aplicando FIRST en la práctica

Estos principios pueden parecer restrictivos, pero en realidad te guían hacia tests de alta calidad que realmente agregan valor. Cuando un test es difícil de escribir siguiendo FIRST, a menudo es una señal de que el código de producción necesita refactorización.

:::info Recordatorio
No necesitas aplicar FIRST perfectamente desde el día uno. Son guías aspiracionales. Lo importante es conocer los principios y mejorar gradualmente la calidad de tus tests.
:::
