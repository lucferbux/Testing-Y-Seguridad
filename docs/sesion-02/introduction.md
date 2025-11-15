---
sidebar_position: 2
title: "Testing de Integración"
---

# Conceptos de Testing de Integración

## ¿Qué es el Testing de Integración?

El testing de integración es el proceso de probar la interacción entre múltiples componentes, módulos o sistemas para verificar que funcionan correctamente cuando se combinan. A diferencia del testing unitario, que aísla completamente cada pieza mediante mocks y stubs, el testing de integración valida las **interfaces** y la **comunicación** entre las partes del sistema.

### Analogía del Mundo Real

Imagina construir un ordenador:

- **Testing Unitario**: Probar que el procesador funciona, que la RAM funciona, que el disco duro funciona... cada componente **individualmente**. Cada pieza pasa sus pruebas en aislamiento.
  
- **Testing de Integración**: Conectar el procesador a la placa base, añadir la RAM, conectar el disco duro, y verificar que todos **se comunican correctamente** entre sí. ¿La placa base reconoce la RAM? ¿El procesador puede acceder al disco?

- **Testing E2E**: Encender el ordenador completo, instalar el sistema operativo, y usarlo para realizar tareas reales como navegar por internet o editar documentos.

Ningún nivel reemplaza al otro. Todos son necesarios para garantizar calidad en diferentes aspectos del sistema.

## Unitario vs Integración: Diferencias Clave

### Testing Unitario

**Características:**
- Prueba **una sola función o componente** de forma aislada
- Todas las dependencias son **mockeadas** o **stubbeadas**
- **Rápido de ejecutar** (milisegundos por test)
- **Fácil de mantener** porque el alcance es pequeño y específico
- **Altamente específico** - cuando falla, sabes exactamente qué pieza está rota
- **Fácil de escribir** porque no necesitas configurar dependencias reales

**Ejemplo de Test Unitario:**
```typescript
// Testing UNITARIO de una función pura
import { calculateTotal } from './math';

describe('calculateTotal', () => {
  it('debe sumar correctamente dos números', () => {
    // No hay dependencias - solo lógica pura
    expect(calculateTotal(10, 5)).toBe(15);
  });
  
  it('debe manejar números negativos', () => {
    expect(calculateTotal(-10, 5)).toBe(-5);
  });
});
```

### Testing de Integración

**Características:**
- Prueba **múltiples componentes trabajando juntos**
- Solo se mockean **dependencias externas** (APIs, base de datos, servicios de terceros)
- Las dependencias internas son **reales** (Context, hooks, componentes)
- **Más lento** que tests unitarios (segundos en lugar de milisegundos)
- **Más complejo** de configurar y mantener
- **Detecta problemas de integración** que los tests unitarios no pueden ver
- **Más parecido a producción** porque usa código real

**Ejemplo de Test de Integración:**
```typescript
// Testing de INTEGRACIÓN de componente + contexto + hook
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from './context/AuthContext';
import { UserProfile } from './components/UserProfile';

describe('UserProfile con AuthContext', () => {
  it('debe mostrar el nombre del usuario autenticado', () => {
    const mockUser = { name: 'Juan', email: 'juan@test.com' };
    
    // Renderiza con el Provider REAL (no mockeado)
    render(
      <AuthProvider value={{ user: mockUser, isAuthenticated: true }}>
        <UserProfile />
      </AuthProvider>
    );
    
    // Verifica la integración completa
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });
  
  it('debe llamar logout cuando se hace click en el botón', async () => {
    const mockLogout = jest.fn();
    
    render(
      <AuthProvider value={{ user: mockUser, logout: mockLogout }}>
        <UserProfile />
      </AuthProvider>
    );
    
    fireEvent.click(screen.getByText('Logout'));
    
    // Verifica que la comunicación entre componente y contexto funciona
    expect(mockLogout).toHaveBeenCalled();
  });
});
```

### Comparación Directa

| Aspecto | Testing Unitario | Testing de Integración |
|---------|------------------|------------------------|
| **Alcance** | Una función/componente | Múltiples módulos/componentes |
| **Dependencias** | Todas mockeadas | Solo externas mockeadas |
| **Velocidad** | Muy rápido (< 10ms) | Moderado (100ms - 2s) |
| **Complejidad Setup** | Baja - solo la unidad | Media-Alta - múltiples piezas |
| **Mantenimiento** | Fácil - cambios localizados | Requiere más esfuerzo |
| **Confiabilidad** | Alta para unidades | Alta para integraciones |
| **Detecta** | Bugs en lógica individual | Bugs en comunicación/interfaces |
| **Fragilidad** | Baja - aislado | Media - depende de varias piezas |
| **Parecido a prod** | Bajo - todo mockeado | Alto - código real |

## Niveles de Integración

El testing de integración no es binario (todo o nada). Existen diferentes niveles según cuántos componentes integres y qué tan cerca estés de un test E2E completo:

### 1. Integración de Componentes (Component Integration)

Prueba **2-3 componentes React** trabajando juntos, típicamente un componente padre con sus hijos directos.

**Ejemplo:**
```tsx
// ProductCard usa internamente PriceDisplay y AddToCartButton
<ProductCard product={product}>
  <PriceDisplay price={product.price} />
  <AddToCartButton onAdd={handleAdd} />
</ProductCard>
```

**Qué testeas:**
- ✅ El padre pasa props correctamente a los hijos
- ✅ Los hijos renderan correctamente con esas props
- ✅ Los eventos de los hijos se propagan al padre
- ✅ El estado compartido se mantiene consistente

**Ejemplo de Test:**
```typescript
it('debe añadir producto al carrito cuando se hace click', () => {
  const mockProduct = { id: '1', name: 'Laptop', price: 999 };
  const mockOnAdd = jest.fn();
  
  render(<ProductCard product={mockProduct} onAdd={mockOnAdd} />);
  
  // Interactúa con el componente hijo
  fireEvent.click(screen.getByText('Add to Cart'));
  
  // Verifica que el padre recibe el evento
  expect(mockOnAdd).toHaveBeenCalledWith(mockProduct);
});
```

### 2. Integración con Context/Estado (State Integration)

Prueba componentes que consumen **React Context**, **Redux**, o cualquier **state management library**.

**Ejemplo:**
```tsx
// Component consume AuthContext
const UserMenu = () => {
  const { user, logout } = useAuth(); // ← Consume context real
  return (
    <div>
      <span>{user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

**Qué testeas:**
- ✅ El componente lee correctamente del contexto
- ✅ Los cambios en el contexto se reflejan en el componente
- ✅ Las acciones del componente actualizan el contexto
- ✅ Múltiples componentes comparten el mismo estado

**Ejemplo de Test:**
```typescript
it('debe actualizar el nombre cuando cambia en el contexto', () => {
  const { rerender } = render(
    <AuthProvider value={{ user: { name: 'Alice' } }}>
      <UserMenu />
    </AuthProvider>
  );
  
  expect(screen.getByText('Alice')).toBeInTheDocument();
  
  // Cambia el contexto
  rerender(
    <AuthProvider value={{ user: { name: 'Bob' } }}>
      <UserMenu />
    </AuthProvider>
  );
  
  // Verifica que el componente se actualiza
  expect(screen.getByText('Bob')).toBeInTheDocument();
});
```

### 3. Integración con Hooks (Hook Integration)

Prueba **custom hooks** que tienen lógica compleja y dependen de otros hooks o contextos.

**Ejemplo:**
```typescript
// Hook usa múltiples hooks internos y estado
const useFetchUser = (id: string) => {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setLoading(true);
    fetchUser(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
  
  return { data, loading, error };
};
```

**Qué testeas:**
- ✅ El hook maneja el estado correctamente
- ✅ Los efectos se ejecutan en el momento correcto
- ✅ El hook responde a cambios en props/dependencias
- ✅ El cleanup de efectos funciona correctamente

### 4. Integración con APIs (API Integration)

Prueba la **comunicación real** con endpoints de backend usando herramientas como Supertest.

**Ejemplo:**
```typescript
// Test de endpoint Express completo
import request from 'supertest';
import app from './server';

describe('GET /api/users/:id', () => {
  it('debe retornar el usuario si existe', async () => {
    const response = await request(app)
      .get('/api/users/123')
      .expect(200);
    
    expect(response.body).toMatchObject({
      id: '123',
      name: expect.any(String),
      email: expect.any(String)
    });
  });
});
```

**Qué testeas:**
- ✅ El endpoint responde con el código HTTP correcto
- ✅ El formato de la respuesta es el esperado
- ✅ La autenticación/autorización funciona
- ✅ Los errores se manejan apropiadamente
- ✅ Los middlewares se ejecutan en orden

## ¿Cuándo Usar Tests de Integración?

### ✅ Usa Tests de Integración Cuando:

#### 1. Múltiples componentes interactúan
```typescript
// CheckoutFlow tiene múltiples pasos y componentes interdependientes
<CheckoutFlow>
  <CartSummary />       {/* Lee del carrito */}
  <ShippingForm />      {/* Actualiza dirección */}
  <PaymentForm />       {/* Procesa pago */}
  <OrderConfirmation /> {/* Muestra resultado */}
</CheckoutFlow>
```
Un test unitario de cada componente individual no garantiza que el flujo completo funcione.

#### 2. Componentes dependen de Context
```typescript
// UserProfile NECESITA AuthContext para funcionar
const UserProfile = () => {
  const { user } = useAuth(); // No puede mockearse fácilmente sin perder valor
  if (!user) return <Login />;
  return <div>{user.name}</div>;
};
```
Mockear el hook `useAuth` en un test unitario significa que no estás probando la integración real con el contexto.

#### 3. Lógica compleja de estado compartido
```typescript
// Wizard con estado compartido entre múltiples pasos
const MultiStepWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  // Cada paso actualiza formData y step
  // El test debe verificar que los datos persisten entre pasos
};
```

#### 4. Flujos de autenticación/autorización
```typescript
// Login actualiza contexto, guarda token, y redirige
const handleLogin = async (credentials) => {
  const user = await login(credentials);  // API call
  setUser(user);                          // Actualiza contexto
  localStorage.setItem('token', user.token); // Persiste token
  navigate('/dashboard');                 // Redirige
};
```
Un test de integración verifica que toda esta cadena funciona correctamente.

#### 5. Endpoints de API con múltiples capas
```typescript
// Endpoint que pasa por middlewares, valida, procesa y guarda
app.post('/api/orders', 
  authenticate,           // Middleware 1
  validateOrder,          // Middleware 2
  async (req, res) => {   // Handler
    const order = await createOrder(req.body);
    await sendEmail(order);
    await updateInventory(order);
    res.json(order);
  }
);
```
Un test de integración verifica que todas estas capas trabajan correctamente juntas.

### ❌ No Uses Tests de Integración Cuando:

#### 1. La función es pura y simple
```typescript
// Mejor test unitario - no hay integración que probar
const add = (a: number, b: number) => a + b;
const formatDate = (date: Date) => date.toISOString();
```

#### 2. El componente no tiene dependencias reales
```typescript
// Mejor test unitario - componente totalmente independiente
const Button = ({ label, onClick }: ButtonProps) => (
  <button onClick={onClick}>{label}</button>
);
```

#### 3. Ya tienes cobertura unitaria completa y la integración es trivial
```typescript
// Si ComponentA y ComponentB están 100% testeados unitariamente
// Y solo se renderan juntos sin interacción compleja
const Parent = () => (
  <div>
    <ComponentA />
    <ComponentB />
  </div>
);
```
En este caso, un test de integración podría ser redundante.

#### 4. La integración es demasiado compleja para un test de integración
```typescript
// Flujo completo: Login → Browse → Add to Cart → Checkout → Payment → Confirmation
// Esto debería ser un test E2E, no de integración
```

## Estrategias de Integración

### Big Bang Integration

**Concepto**: Integrar todos los componentes de una vez y testear el sistema completo.

**Ventajas:**
- ✅ Menos archivos de test - un test cubre mucho
- ✅ Detecta problemas de integración global
- ✅ Se parece más al uso real de la aplicación

**Desventajas:**
- ❌ Difícil identificar dónde está el problema cuando falla
- ❌ Requiere que todos los componentes estén listos
- ❌ Tests muy lentos (segundos o minutos)
- ❌ Frágiles - cualquier cambio puede romper el test

**Cuándo usar:**
- Sistemas muy pequeños (< 5 componentes)
- Cuando todos los componentes son estables
- Como complemento, no como estrategia principal

### Incremental Integration (Recomendado)

**Concepto**: Integrar componentes **gradualmente**, testeando cada integración por separado.

**Ventajas:**
- ✅ Fácil identificar qué integración específica falla
- ✅ Permite desarrollo paralelo de componentes
- ✅ Tests más rápidos (cada uno prueba menos)
- ✅ Más mantenibles - cambios afectan menos tests
- ✅ Mejor granularidad en el feedback

**Desventajas:**
- ❌ Más archivos de test que mantener
- ❌ Puede perderse alguna integración específica
- ❌ Requiere más planificación

**Cuándo usar:**
- Sistemas medianos y grandes (recomendado como default)
- Desarrollo en equipo
- Cuando quieres feedback rápido y específico
- Para mantener tests mantenibles a largo plazo

## Estrategia Recomendada

En la práctica, la mejor estrategia es una **combinación**:

1. **Base sólida de tests unitarios (70%)**
   - Todas las funciones puras
   - Componentes simples sin dependencias
   - Lógica de negocio aislada

2. **Tests de integración incrementales (20%)**
   - Integraciones críticas (auth, carrito, checkout)
   - Componentes con Context
   - Custom hooks complejos
   - Endpoints de API importantes

3. **Algunos tests Big Bang / E2E (10%)**
   - Flujos críticos de negocio completos
   - Happy paths principales
   - Verificación de que todo el sistema funciona junto

Esta distribución te da:
- ✅ Feedback rápido (tests unitarios)
- ✅ Confianza en integraciones (tests incrementales)
- ✅ Validación de flujos completos (E2E selectivos)

:::tip Consejo Práctico
Empieza siempre con tests unitarios. Cuando encuentres un bug que los tests unitarios no detectaron porque involucra la interacción entre componentes, **ese es el momento** de añadir un test de integración.
:::

:::warning Cuidado
No caigas en la trampa de escribir solo tests de integración Big Bang pensando que te ahorras tiempo. Terminarás con tests lentos, frágiles y difíciles de debuggear. Los tests unitarios son la base, los de integración son el complemento.
:::
