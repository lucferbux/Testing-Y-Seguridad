---
sidebar_position: 12
title: "Testing de Seguridad"
---

## 10. Testing de seguridad

### 10.1 Test de headers de seguridad

```typescript
// tests/security-headers.test.ts
import request from 'supertest';
import app from '../app';

describe('Security Headers', () => {
  it('debe incluir headers de seguridad básicos', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
  
  it('debe incluir Content-Security-Policy', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });
  
  it('no debe revelar información del servidor', async () => {
    const res = await request(app).get('/');
    
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
```

### 10.2 Test de autenticación

```typescript
// tests/auth-security.test.ts
import request from 'supertest';
import app from '../app';

describe('Authentication Security', () => {
  it('debe rechazar credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('token');
  });
  
  it('debe establecer cookies HttpOnly', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'correctpassword' });
    
    expect(res.status).toBe(200);
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('Secure'); // En producción
  });
  
  it('debe prevenir inyección NoSQL en login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: { $ne: null },
        password: { $ne: null }
      });
    
    expect(res.status).toBe(400); // Bad request por validación
  });
});
```

### 10.3 Test de autorización

```typescript
// tests/authorization.test.ts
import request from 'supertest';
import app from '../app';
import { generateToken } from '../utils/jwt';

describe('Authorization', () => {
  let userToken: string;
  let adminToken: string;
  
  beforeAll(() => {
    userToken = generateToken({ id: '1', role: 'user' });
    adminToken = generateToken({ id: '2', role: 'admin' });
  });
  
  it('debe rechazar acceso sin token', async () => {
    const res = await request(app)
      .get('/api/admin/users');
    
    expect(res.status).toBe(401);
  });
  
  it('debe rechazar token inválido', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(res.status).toBe(401);
  });
  
  it('debe rechazar usuarios sin permisos', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(403); // Forbidden
  });
  
  it('debe permitir acceso a admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
  });
});
```

### 10.4 Test de validación de inputs

```typescript
// tests/input-validation.test.ts
import request from 'supertest';
import app from '../app';

describe('Input Validation', () => {
  describe('POST /api/users', () => {
    it('debe rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'SecurePass123!'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('email')
        })
      );
    });
    
    it('debe rechazar password débil', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password'
        })
      );
    });
    
    it('debe sanitizar campos desconocidos', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          isAdmin: true, // Campo no permitido
          maliciousScript: '<script>alert("xss")</script>'
        });
      
      expect(res.status).toBe(201);
      
      // Verificar que campos no permitidos se ignoraron
      const user = res.body;
      expect(user.isAdmin).toBeUndefined();
      expect(user.maliciousScript).toBeUndefined();
    });
  });
});
```
