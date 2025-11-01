---
sidebar_position: 9
title: "Ejercicio Práctico"
---

# Ejercicio Práctico

## Objetivo

Implementar tests unitarios para componentes y utilidades del proyecto Docusaurus, alcanzando un coverage mínimo del 80%.

## Parte 1: Tests de Utilidades (30 minutos)

Crear archivo `src/utils/formatters.ts`:

```typescript
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### Tareas

1. Crear `src/utils/__tests__/formatters.test.ts`
2. Escribir tests para cada función
3. Cubrir casos edge (textos vacíos, null, caracteres especiales)
4. Verificar coverage con `npm run test:coverage`

## Parte 2: Tests de Componentes (45 minutos)

Crear componente `src/components/SearchBox.tsx`:

```tsx
import React, { useState } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBox({ onSearch, placeholder = 'Search...' }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="search-input"
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Tareas

1. Crear `src/components/__tests__/SearchBox.test.tsx`
2. Testear renderizado
3. Testear cambio de input
4. Testear submit del formulario
5. Testear que no se llama onSearch con query vacío
6. Verificar accesibilidad (roles, labels)

## Parte 3: Tests Avanzados con Mocks (30 minutos)

Crear `src/utils/storage.ts`:

```typescript
export class LocalStorageService {
  static get(key: string): string | null {
    return localStorage.getItem(key);
  }

  static set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}
```

### Tareas

1. Crear `src/utils/__tests__/storage.test.ts`
2. Mockear localStorage
3. Testear todos los métodos
4. Verificar que se llaman los métodos correctos

## Criterios de Evaluación

- ✅ Mínimo 10 tests unitarios
- ✅ Coverage >80% en archivos testeados
- ✅ Tests pasan sin errores
- ✅ Nombres descriptivos
- ✅ Uso correcto de matchers
- ✅ Tests independientes y repetibles
