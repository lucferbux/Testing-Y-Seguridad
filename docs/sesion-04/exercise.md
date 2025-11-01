---
sidebar_position: 14
title: "Ejercicio Práctico"
---

## 12. Ejercicio Práctico: Auditoría de Seguridad

### Contexto

Se te proporciona una API Express con múltiples vulnerabilidades. Tu tarea es:
1. Identificar las vulnerabilidades
2. Implementar las correcciones
3. Escribir tests que verifiquen las correcciones

### Código vulnerable

```javascript
// ❌ VULNERABLE - NO USAR EN PRODUCCIÓN
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/myapp');

// Modelo de usuario
const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // Password en texto plano
  email: String,
  role: String,
});

const User = mongoose.model('User', UserSchema);

// 1. Login sin rate limiting, vulnerable a inyección NoSQL
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({
    username: username,
    password: password
  });
  
  if (user) {
    const token = jwt.sign(
      { id: user._id },
      'secret', // Secret débil
      { expiresIn: '7d' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Registro sin validación
app.post('/api/register', async (req, res) => {
  const user = new User(req.body); // Acepta cualquier campo
  await user.save();
  res.json(user); // Expone toda la información
});

// 3. Endpoint vulnerable a XSS
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Results for: ${query}</h1>`);
});

// 4. Middleware de autenticación débil
function authenticate(req, res, next) {
  const token = req.headers.authorization;
  
  try {
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// 5. Sin validación de autorización
app.delete('/api/users/:id', authenticate, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// 6. Expone información sensible en errores
app.use((err, req, res, next) => {
  console.log(err.stack); // Log completo en consola
  res.status(500).json({
    error: err.message,
    stack: err.stack // Expone stack trace
  });
});

app.listen(3000);
```

### Tarea 1: Identificar vulnerabilidades

Enumera todas las vulnerabilidades que encuentres en el código anterior. Clasifícalas por severidad (Critical, High, Medium, Low).

**Pista**: Busca al menos 10 vulnerabilidades diferentes.

### Tarea 2: Implementar correcciones

Reescribe el código aplicando todas las medidas de seguridad vistas en la sesión:
- Helmet.js
- Rate limiting
- Validación con Joi/Zod
- Hashing de passwords con bcrypt
- Sanitización de inputs
- Variables de entorno
- Gestión correcta de errores
- CSRF protection
- Autorización adecuada

### Tarea 3: Tests de seguridad

Escribe una suite de tests que verifique:
- Headers de seguridad están presentes
- Rate limiting funciona
- NoSQL injection es prevenida
- XSS es prevenida
- Autorización funciona correctamente
- Passwords no se exponen en respuestas
