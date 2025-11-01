---
sidebar_position: 5
title: "Cross-Site Scripting (XSS)"
---

## 3. Cross-Site Scripting (XSS)

### 3.1 ¿Qué es XSS?

Un atacante inyecta JavaScript malicioso que se ejecuta en el navegador de otros usuarios.

### 3.2 Tipos de XSS

**Reflected XSS** (Reflejado):
```javascript
// ❌ VULNERABLE
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Resultados para: ${query}</h1>`);
});

// Ataque: GET /search?q=<script>alert('XSS')</script>
```

**Stored XSS** (Almacenado):
```javascript
// ❌ VULNERABLE
app.post('/comment', async (req, res) => {
  const { text } = req.body;
  await Comment.create({ text }); // Guarda sin sanitizar
  res.redirect('/comments');
});

app.get('/comments', async (req, res) => {
  const comments = await Comment.find();
  // Si renderizas con innerHTML o dangerouslySetInnerHTML
  // el script se ejecutará
});
```

### 3.3 Prevención de XSS

**En el Backend**:

```javascript
import DOMPurify from 'isomorphic-dompurify';

app.post('/comment', async (req, res) => {
  const { text } = req.body;
  
  // Sanitizar HTML peligroso
  const cleanText = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });
  
  await Comment.create({ text: cleanText });
  res.json({ success: true });
});
```

**En el Frontend (React)**:

```tsx
// ✅ SEGURO - React escapa automáticamente
function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          {comment.text} {/* Escapado automáticamente */}
        </div>
      ))}
    </div>
  );
}

// ❌ PELIGROSO - Solo usar con contenido sanitizado
function RichComment({ html }: { html: string }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// ✅ MEJOR - Sanitizar antes de renderizar
import DOMPurify from 'dompurify';

function SafeRichComment({ html }: { html: string }) {
  const cleanHtml = DOMPurify.sanitize(html);
  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  );
}
```

**Content Security Policy (CSP)**:

```javascript
import helmet from 'helmet';

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Evita 'unsafe-inline' en producción
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
```
