---
sidebar_position: 6
title: "Testing de Componentes React"
---

El testing de componentes React es fundamental para asegurar que nuestra interfaz de usuario funciona correctamente. En esta sección aprenderemos a testear componentes del proyecto **Taller-Testing-Security** usando React Testing Library, desde componentes simples hasta componentes complejos con hooks y styled-components.

## Contexto del Proyecto

Los componentes que testearemos pertenecen al frontend del proyecto **Taller-Testing-Security/ui**, que incluye:

- **Loader.tsx**: Componente simple de presentación que muestra un spinner y mensaje
- **ProjectCard.tsx**: Componente complejo con:
  - Hooks personalizados (`useAuth`, `useToggle`)
  - Styled Components para estilos
  - Lógica condicional basada en autenticación
  - Interacciones de usuario (menu dropdown, botones)

Estos son componentes **reales de producción**, lo que hace que los tests sean más relevantes y aplicables a proyectos reales.

## React Testing Library: Filosofía

React Testing Library (RTL) fue creado por Kent C. Dodds con una filosofía muy clara: **testear componentes de la misma forma que los usuarios los usan**.

### Principios fundamentales

#### ❌ No probar detalles de implementación

Los detalles de implementación son aspectos internos del componente que el usuario no ve ni le importan. Por ejemplo:

- **State interno**: Cómo el componente gestiona su estado
- **Nombres de funciones**: Qué funciones se llaman internamente
- **Estructura de props**: Cómo se pasan props entre componentes hijos

**¿Por qué evitar testear implementación?**

Cuando testeas detalles de implementación, tus tests se vuelven **frágiles**. Cualquier refactorización rompe los tests, incluso si el comportamiento visible no cambia.

```tsx
// ❌ Mal: Testea state interno
it('incrementa contador', () => {
  const { container } = render(<Counter />);
  expect(container.state.count).toBe(0); // Detalles internos!
});

// ✅ Bien: Testea comportamiento observable
it('incrementa contador', () => {
  render(<Counter />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### ✅ Probar comportamiento observable

El comportamiento observable es lo que el usuario **ve y experimenta**:

- Texto renderizado en pantalla
- Botones que puede hacer click
- Inputs donde puede escribir
- Navegación que ocurre
- Mensajes de error o éxito

Testear comportamiento hace tus tests más **resilientes** a refactorizaciones y más **valiosos** porque verifican lo que realmente importa.

#### ✅ Usar selectores accesibles

RTL promueve usar selectores que **mejoran la accesibilidad**. Si tu test no puede encontrar un elemento usando selectores accesibles, probablemente tampoco pueda un lector de pantalla.

**Jerarquía de selectores (de mejor a peor):**

1. `getByRole`: Elementos por rol ARIA
2. `getByLabelText`: Inputs con labels asociados
3. `getByPlaceholderText`: Por placeholder
4. `getByText`: Por texto visible
5. `getByTestId`: Como último recurso

Esta filosofía no solo mejora tus tests, sino también la **accesibilidad de tu aplicación**.

## Ejemplo 1: Componente de Presentación Simple - Loader

Comencemos con `Loader.tsx`, un componente simple de presentación que muestra un spinner de carga y un mensaje. Es perfecto para aprender los fundamentos de testing de componentes React.

### Código: src/components/elements/Loader.tsx

```tsx
import React from 'react';
import styled from 'styled-components';
import icnLoader from './loader.svg';
import { themes } from '../../styles/ColorStyles';
import { Caption } from '../../styles/TextStyles';

export type LoaderProps = {
  message: string;
};

const Loader = ({ message }: LoaderProps) => (
  <LoaderWrapper>
    <LoaderCard>
      <LoaderImg src={icnLoader} alt={message} />
      <LoaderMsg>{message}</LoaderMsg>
    </LoaderCard>
  </LoaderWrapper>
);

export default Loader;

const LoaderWrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${themes.light.loadingScreen};
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoaderCard = styled.div`
  font-size: 24px;
  text-align: center;
  color: ${themes.dark.text1};
`;

const LoaderImg = styled.img`
  margin: 0 auto;
  margin-bottom: 20px;
`;

const LoaderMsg = styled(Caption)``;
```

### Características del componente

- **Props**: Solo recibe `message` (string)
- **Renderizado**: Muestra imagen SVG y texto del mensaje
- **Estilos**: Usa Styled Components con theming
- **Complejidad**: Muy baja, sin estado ni lógica
- **Uso real**: Se muestra mientras cargan datos del backend

Este componente es perfecto para aprender:
- Renderizado básico de componentes
- Testing de props
- Verificación de elementos en el DOM
- Testing con Styled Components
- Manejo de assets (SVG importado)

### Test: src/components/elements/\__tests__/Loader.test.tsx

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
  
  it('debe renderizar el mensaje correctamente', () => {
    const testMessage = 'Cargando datos...';
    render(<Loader message={testMessage} />);
    
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('debe renderizar la imagen del loader', () => {
    const testMessage = 'Loading';
    render(<Loader message={testMessage} />);
    
    // Buscar por alt text (accesibilidad)
    const loaderImage = screen.getByAltText(testMessage);
    expect(loaderImage).toBeInTheDocument();
    expect(loaderImage).toHaveAttribute('src');
  });

  it('debe renderizar con diferentes mensajes', () => {
    const { rerender } = render(<Loader message="Primer mensaje" />);
    expect(screen.getByText('Primer mensaje')).toBeInTheDocument();
    
    // Re-renderizar con nuevo mensaje
    rerender(<Loader message="Segundo mensaje" />);
    expect(screen.getByText('Segundo mensaje')).toBeInTheDocument();
    expect(screen.queryByText('Primer mensaje')).not.toBeInTheDocument();
  });

  it('debe tener la estructura DOM correcta', () => {
    const testMessage = 'Test';
    const { container } = render(<Loader message={testMessage} />);
    
    // Verificar que hay un contenedor principal (LoaderWrapper)
    expect(container.firstChild).toBeInTheDocument();
    
    // Verificar que contiene tanto imagen como mensaje
    const image = screen.getByAltText(testMessage);
    const text = screen.getByText(testMessage);
    expect(image).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });
});
```

### Desglosando el test del Loader

#### `render()` - Renderizar el componente

```tsx
render(<Loader message={testMessage} />);
```

`render()` es la función principal de RTL. Renderiza el componente en un DOM virtual (jsdom) donde podemos interactuar con él. No necesitas un navegador real.

**Características importantes**:
- Monta el componente como lo haría React
- Maneja Styled Components automáticamente
- Mockea assets (SVG) gracias a `jest.config.cjs`

#### `screen` - Acceder al DOM renderizado

```tsx
screen.getByText('Cargando datos...')
screen.getByAltText(testMessage)
```

`screen` es un objeto que proporciona queries para encontrar elementos. Es el punto de entrada principal para todas las queries.

**Tipos de queries**:
- `getBy`: Lanza error si no encuentra (para aserciones)
- `queryBy`: Retorna null si no encuentra (para verificar ausencia)
- `findBy`: Async, espera a que aparezca

#### Testing de props

```tsx
it('debe renderizar el mensaje correctamente', () => {
  const testMessage = 'Cargando datos...';
  render(<Loader message={testMessage} />);
  expect(screen.getByText(testMessage)).toBeInTheDocument();
});
```

Verificamos que el componente **usa la prop correctamente**. No testeamos cómo se implementa internamente, solo que el mensaje aparece en la UI.

#### Testing de re-renderizado

```tsx
const { rerender } = render(<Loader message="Primer mensaje" />);
rerender(<Loader message="Segundo mensaje" />);
```

`rerender()` actualiza el componente con nuevas props. Útil para verificar que el componente **reacciona a cambios de props**.

#### Accesibilidad con alt text

```tsx
const loaderImage = screen.getByAltText(testMessage);
```

Usar `getByAltText` verifica dos cosas:
1. La imagen existe
2. Tiene un `alt` text apropiado (accesibilidad)

Si cambias el alt text, el test sigue pasando (no es un detalle de implementación).

### Matchers de jest-dom

```tsx
expect(element).toBeInTheDocument();  // Elemento existe en el DOM
expect(element).toHaveAttribute('src');  // Tiene atributo específico
expect(element).not.toBeInTheDocument();  // Elemento NO existe
```

Estos matchers vienen de `@testing-library/jest-dom` (importado en `jest.setup.cjs`) y hacen los tests más legibles y expresivos.

## Ejemplo 2: Componente Complejo - ProjectCard

Ahora vamos con un componente mucho más complejo que demuestra testing avanzado: `ProjectCard.tsx`. Este componente incluye:

- **Hooks personalizados** (`useAuth`, `useToggle`)
- **Lógica condicional** basada en autenticación
- **Interacciones de usuario** (clicks, menu dropdown)
- **Callbacks** pasados como props
- **Styled Components** dinámicos

### Código: src/components/cards/ProjectCard.tsx (simplificado)

```tsx
import React from 'react';
import styled from 'styled-components';
import useAuth from '../../hooks/useAuth';
import useToggle from '../../hooks/useToogle';
import { Project } from '../../model/project';

interface ProjectCardProps {
  project: Project;
  closeButton: (element: React.MouseEvent<HTMLElement>, id: string) => void;
  updateButton: (element: React.MouseEvent<HTMLElement>, project: Project) => void;
  captionText?: string;
}

const ProjectCard = (props: ProjectCardProps) => {
  const { project } = props;
  const { user } = useAuth();  // Hook: usuario autenticado o null
  const [isVisible, toggle] = useToggle(false);  // Hook: estado del menu

  const toggleMenu = (element: React.MouseEvent<HTMLElement>) => {
    element.preventDefault();
    element.stopPropagation();
    toggle();
  };

  return (
    <Wrapper href={project.link} target="_blank" rel="noopener">
      <CardWrapper>
        <CardInfo>
          <CardVersion>
            <CardVersionText>{project.version}</CardVersionText>
          </CardVersion>
          {user && (  // Solo muestra botón si hay usuario autenticado
            <KebabButton onClick={toggleMenu}>
              <KebabDot />
              <KebabDot />
              <KebabDot />
            </KebabButton>
          )}
        </CardInfo>
        {user && isVisible && (  // Menu solo visible si autenticado Y toggled
          <>
            <MenuDropDownOverlay onClick={toggleMenu} />
            <MenuDropDown>
              <MenuDropDownItem
                isWarning={false}
                onClick={(e) => props.updateButton(e, project)}
              >
                Update
              </MenuDropDownItem>
              <MenuDropDownItem
                isWarning={true}
                onClick={(e) => {
                  props.closeButton(e, project._id ?? '');
                  toggle();
                }}
              >
                Delete
              </MenuDropDownItem>
            </MenuDropDown>
          </>
        )}
        <CardCaption data-testid="caption">
          {props.captionText ? props.captionText : ''}
        </CardCaption>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardWrapper>
    </Wrapper>
  );
};

export default ProjectCard;
```

### Características del componente

- **Hooks**: `useAuth` (contexto), `useToggle` (estado local)
- **Lógica condicional**: UI diferente si autenticado vs no autenticado
- **Interacciones complejas**: Menu dropdown con overlay
- **Props functions**: Callbacks para update/delete
- **Data testid**: `data-testid="caption"` para testing específico

### Test: src/components/cards/\__tests__/ProjectCard.test.tsx

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectCard from '../ProjectCard';
import useAuth from '../../../hooks/useAuth';
import { Project } from '../../../model/project';

// Mock de api-client-factory (necesario para evitar import.meta.env)
jest.mock('../../../api/api-client-factory');

// Mock del hook useAuth
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProjectCard', () => {
  const mockCloseButton = jest.fn();
  const mockUpdateButton = jest.fn();

  const mockProject: Project = {
    _id: '123',
    title: 'Test Project',
    description: 'A test project description',
    link: 'https://example.com',
    version: 'v1.0',
    tag: 'React',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar información del proyecto', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined, 
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('A test project description')).toBeInTheDocument();
      expect(screen.getByText('v1.0')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('debe renderizar caption text cuando se proporciona', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
          captionText="Featured Project"
        />
      );

      expect(screen.getByTestId('caption')).toHaveTextContent('Featured Project');
    });

    it('debe tener un link al proyecto', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      const { container } = render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const link = container.querySelector('a[href="https://example.com"]');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener');
    });
  });

  describe('Comportamiento con autenticación', () => {
    it('NO debe mostrar botón kebab cuando no hay usuario', () => {
      mockUseAuth.mockReturnValue({ 
        user: undefined,
        isLoading: false,
        login: jest.fn(), 
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // No debe haber botón con 3 puntos
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('debe mostrar botón kebab cuando hay usuario autenticado', () => {
      mockUseAuth.mockReturnValue({ 
        user: { _id: 'user1', email: 'test@example.com', active: true },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loadUser: jest.fn()
      });
      
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Interacciones del menu dropdown', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ 
        user: { _id: 'user1', email: 'test@example.com', active: true },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        loadUser: jest.fn()
      });
    });

    it('debe mostrar menu al hacer click en kebab button', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Inicialmente el menu no está visible
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();

      // Click en el botón kebab (primer botón)
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Ahora el menu debe estar visible
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('debe llamar updateButton al hacer click en Update', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Abrir menu
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Click en Update
      const updateBtn = screen.getByText('Update');
      fireEvent.click(updateBtn);

      expect(mockUpdateButton).toHaveBeenCalledTimes(1);
      expect(mockUpdateButton).toHaveBeenCalledWith(
        expect.any(Object),  // Event
        mockProject
      );
    });

    it('debe llamar closeButton al hacer click en Delete', () => {
      render(
        <ProjectCard
          project={mockProject}
          closeButton={mockCloseButton}
          updateButton={mockUpdateButton}
        />
      );

      // Abrir menu
      const kebabButton = screen.getAllByRole('button')[0];
      fireEvent.click(kebabButton);

      // Click en Delete
      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn);

      expect(mockCloseButton).toHaveBeenCalledTimes(1);
      expect(mockCloseButton).toHaveBeenCalledWith(
        expect.any(Object),  // Event
        '123'  // project._id
      );
    });
  });
});
```

### Desglosando el Test de ProjectCard

Este test demuestra conceptos avanzados de testing en React. Vamos a analizarlo por partes.

#### 1. Mocking de Hooks Personalizados

```tsx
// Mock del hook useAuth
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Luego en cada test:
mockUseAuth.mockReturnValue({ 
  user: { _id: 'user1', email: 'test@example.com', active: true },
  login: jest.fn(),
  logout: jest.fn()
});
```

**¿Por qué mockear hooks?**

- `useAuth` consume un Context que no existe en el entorno de testing
- Queremos controlar el estado de autenticación para cada test
- Podemos probar diferentes escenarios (autenticado vs no autenticado)

**Tipos de retorno del mock:**

- `user: undefined` → Usuario no autenticado
- `user: { ... }` → Usuario autenticado con datos

:::tip Principio: Solo Mockear lo Necesario
En estos tests **NO mockeamos useToggle**. ¿Por qué?

- El hook `useToggle` es simple y no tiene dependencias externas
- Funciona perfectamente en el entorno de test sin mockear
- Mockear innecesariamente aumenta la complejidad y fragilidad de los tests

**Regla general**: Solo mockea cuando sea necesario:
- ✅ Mockear: APIs externas, contextos complejos, módulos con side effects
- ❌ No mockear: Hooks simples, utilidades puras, funciones sin dependencias

Este es un ejemplo de testing pragmático: usar implementaciones reales cuando sea posible.
:::

#### 2. Mock de API Client Factory

```tsx
jest.mock('../../../api/api-client-factory', () => ({
  getApiClient: jest.fn(),
}));
```

Este mock es necesario porque:

- El módulo usa `import.meta.env` que puede causar problemas en Jest
- No queremos hacer llamadas reales a APIs en tests unitarios
- Nos permite aislar el componente de dependencias externas

#### 3. Datos de Test Realistas

```tsx
const mockProject: Project = {
  _id: '123',
  title: 'Test Project',
  description: 'A test project description',
  version: 'v1.0',
  link: 'https://example.com',
  tag: 'React',
  timestamp: Date.now(),
};
```

Usamos **objetos completos** que coinciden con el tipo `Project`. Esto:

- Hace el test más realista
- Evita errores de TypeScript
- Documenta la estructura de datos esperada
- Incluye todos los campos requeridos (como `timestamp`)

#### 4. Testing de Renderizado Condicional

```tsx
it('NO debe mostrar botón kebab cuando no hay usuario', () => {
  mockUseAuth.mockReturnValue({ 
    user: undefined, 
    isLoading: false, 
    loadUser: jest.fn() 
  });
  render(<ProjectCard ... />);
  
  const buttons = screen.queryAllByRole('button');
  expect(buttons).toHaveLength(0);
});

it('debe mostrar botón kebab cuando hay usuario autenticado', () => {
  mockUseAuth.mockReturnValue({ 
    user: { name: 'Test User' }, 
    isLoading: false, 
    loadUser: jest.fn() 
  });
  render(<ProjectCard ... />);
  
  const buttons = screen.getAllByRole('button');
  expect(buttons.length).toBeGreaterThan(0);
});
```

**Patrón importante**: Testear **ambos casos** del condicional `{user && <Component />}`.

- Sin usuario → No hay botones
- Con usuario → Hay botones

Nota el uso de `queryAllByRole` (no lanza error si no encuentra) vs `getAllByRole` (lanza error).

#### 5. Testing de Interacciones en Secuencia

```tsx
it('debe mostrar menu al hacer click en kebab button', () => {
  // 1. Estado inicial
  expect(screen.queryByText('Update')).not.toBeInTheDocument();
  
  // 2. Acción del usuario
  const kebabButton = screen.getAllByRole('button')[0];
  fireEvent.click(kebabButton);
  
  // 3. Nuevo estado
  expect(screen.getByText('Update')).toBeInTheDocument();
});
```

Este patrón AAA (Arrange-Act-Assert) extendido:

1. **Arrange**: Verificar estado inicial
2. **Act**: Simular interacción
3. **Assert**: Verificar nuevo estado

Demuestra que el toggle **funciona correctamente**.

#### 6. Testing de Callbacks

```tsx
it('debe llamar updateButton al hacer click en Update', () => {
  // Abrir menu
  const kebabButton = screen.getAllByRole('button')[0];
  fireEvent.click(kebabButton);
  
  // Click en Update
  const updateBtn = screen.getByText('Update');
  fireEvent.click(updateBtn);
  
  expect(mockUpdateButton).toHaveBeenCalledTimes(1);
  expect(mockUpdateButton).toHaveBeenCalledWith(
    expect.any(Object),  // Event object
    mockProject          // Project data
  );
});
```

Verificamos que:

- La función callback se llamó
- Se llamó exactamente 1 vez
- Se llamó con los argumentos correctos

**expect.any(Object)**: No nos importa el objeto Event exacto, solo que sea un objeto.

#### 7. Using data-testid

```tsx
// En el componente:
<CardCaption data-testid="caption">
  {props.captionText ? props.captionText : ''}
</CardCaption>

// En el test:
expect(screen.getByTestId('caption')).toHaveTextContent('Featured Project');
```

`data-testid` es el **último recurso** cuando no hay forma accesible de seleccionar un elemento. Úsalo solo cuando:

- No tiene texto único
- No tiene rol ARIA
- No tiene label
- Es puramente visual/decorativo

#### 8. Uso de container.querySelector

```tsx
const { container } = render(<ProjectCard ... />);
const link = container.querySelector('a[href="https://example.com"]');
expect(link).toHaveAttribute('target', '_blank');
```

`container.querySelector` permite usar selectores CSS cuando las queries de RTL no son suficientes. Útil para:

- Atributos específicos
- Relaciones parent-child complejas
- Pseudo-selectores

Pero úsalo **con moderación**: prefiere queries accesibles.

## Mejores Prácticas de Testing en React

Basándonos en los ejemplos reales de Taller-Testing-Security, estas son las mejores prácticas:

### 1. Organiza tests con describe anidados

```tsx
describe('ProjectCard', () => {
  describe('Renderizado básico', () => {
    // Tests de renderizado
  });
  
  describe('Comportamiento con autenticación', () => {
    // Tests condicionales
  });
  
  describe('Interacciones del menu dropdown', () => {
    // Tests de interacción
  });
});
```

Esto hace los tests más legibles y permite setup específico por sección.

### 2. beforeEach para limpieza de mocks

```tsx
beforeEach(() => {
  jest.clearAllMocks();
});
```

Asegura que los mocks no se contaminen entre tests.

### 3. Usa TypeScript para datos de test

```tsx
const mockProject: Project = { ... };
```

TypeScript te obliga a usar la estructura correcta y documenta los tipos.

### 4. Mock solo lo necesario

- ✅ Mock: Hooks de contexto, dependencias externas
- ❌ No mock: Lógica del componente, estado local simple

### 5. Testea comportamiento, no implementación

```tsx
// ❌ Mal
expect(component.state.isVisible).toBe(true);

// ✅ Bien
expect(screen.getByText('Update')).toBeInTheDocument();
```

### 6. Usa queries accesibles

Orden de preferencia:

1. `getByRole` - Mejor para accesibilidad
2. `getByLabelText` - Para forms
3. `getByText` - Para contenido visible
4. `getByTestId` - Último recurso

### 7. Nombres descriptivos de tests

```tsx
// ❌ Mal
it('works', () => { ... });

// ✅ Bien
it('debe mostrar menu al hacer click en kebab button', () => { ... });
```

El nombre debe describir **qué** testeas y **qué** esperas que pase.
