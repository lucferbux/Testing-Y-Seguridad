---
sidebar_position: 4
title: "Injection Attacks"
---

## 2. Injection Attacks

### 2.1 ¿Qué es una inyección?

Ocurre cuando un atacante puede insertar código malicioso en una consulta o comando que la aplicación ejecuta.

### 2.2 SQL Injection (aunque usamos MongoDB)

Ejemplo vulnerable en SQL:

```javascript
// ❌ VULNERABLE
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// Ataque: GET /user?id=1 OR 1=1
// Resultado: Devuelve TODOS los usuarios
```

**Solución**: Usar prepared statements o ORMs

```javascript
// ✅ SEGURO
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    res.json(results);
  });
});
```

### 2.3 NoSQL Injection (MongoDB)

MongoDB también es vulnerable a inyecciones:

```javascript
// ❌ VULNERABLE
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({
    username: username,
    password: password
  });
  
  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Ataque con:
// { "username": "admin", "password": { "$ne": null } }
// Esto busca usuarios donde password != null
```

**Solución**: Sanitizar entradas y usar operadores seguros

```javascript
// ✅ SEGURO
import mongoSanitize from 'express-mongo-sanitize';

app.use(mongoSanitize()); // Middleware que elimina $ y .

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validar que sean strings
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  const user = await User.findOne({
    username: username,
    password: hashPassword(password) // Nunca guardes passwords en texto plano
  });
  
  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});
```

### 2.4 Command Injection

Ejecutar comandos del sistema es extremadamente peligroso:

```javascript
// ❌ VULNERABLE
const { exec } = require('child_process');

app.get('/ping', (req, res) => {
  const host = req.query.host;
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(stdout);
  });
});

// Ataque: GET /ping?host=google.com;rm -rf /
```

**Solución**: Evitar exec/eval, validar estrictamente

```javascript
// ✅ MEJOR
import validator from 'validator';

app.get('/ping', (req, res) => {
  const host = req.query.host;
  
  // Validar que es un dominio o IP válida
  if (!validator.isFQDN(host) && !validator.isIP(host)) {
    return res.status(400).json({ error: 'Invalid host' });
  }
  
  // Usar librería específica en lugar de exec
  ping.promise.probe(host).then(result => {
    res.json(result);
  });
});
```
