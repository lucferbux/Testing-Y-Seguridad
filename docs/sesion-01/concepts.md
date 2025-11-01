---
sidebar_position: 3
title: "Conceptos Fundamentales"
---

# Conceptos Fundamentales

## Anatomía de un Test

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

## AAA Pattern (Arrange, Act, Assert)

### Arrange (Preparar)

- Configurar datos de prueba
- Inicializar objetos
- Configurar mocks

### Act (Actuar)

- Ejecutar la función/método
- Realizar la acción a testear

### Assert (Afirmar)

- Verificar el resultado
- Comprobar efectos secundarios

## Características de un Buen Test

### FIRST Principles:

- **F**ast: Rápidos de ejecutar
- **I**ndependent: No dependen de otros tests
- **R**epeatable: Resultados consistentes
- **S**elf-validating: Pasa o falla sin intervención manual
- **T**imely: Escritos a tiempo (idealmente antes del código)
