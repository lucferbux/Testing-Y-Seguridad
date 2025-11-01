---
sidebar_position: 10
title: "Gestión de Secretos"
---

## 8. Gestión de Secretos y Variables de Entorno

### 8.1 ¿Qué son los secretos?

Información sensible que no debe estar en el código:
- Contraseñas de bases de datos
- API keys
- JWT secrets
- Credenciales de servicios externos
- Certificados SSL

### 8.2 Variables de entorno con dotenv

```bash
npm install dotenv
```

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRATION=24h
API_KEY=abc123xyz789
REDIS_HOST=localhost
REDIS_PORT=6379
```

```javascript
// src/config/environment.ts
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiration: string;
  apiKey: string;
  redisHost: string;
  redisPort: number;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiration: getEnvVar('JWT_EXPIRATION', '24h'),
  apiKey: getEnvVar('API_KEY'),
  redisHost: getEnvVar('REDIS_HOST', 'localhost'),
  redisPort: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),
};
```

### 8.3 Múltiples entornos con dotenv-flow

```bash
npm install dotenv-flow
```

Estructura de archivos:
```
.env                 # Valores por defecto
.env.local           # Overrides locales (no commitear)
.env.development     # Valores para desarrollo
.env.test            # Valores para tests
.env.production      # Valores para producción
```

```javascript
// src/index.ts
import dotenvFlow from 'dotenv-flow';

dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  silent: false, // Muestra errores si falta .env
});

// Ahora process.env tiene las variables cargadas
```

### 8.4 Validación de variables de entorno

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRATION: z.string(),
  API_KEY: z.string().min(20),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
});

export type Env = z.infer<typeof envSchema>;

// Validar al inicio de la aplicación
try {
  envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:');
  console.error(error);
  process.exit(1);
}

export const env = process.env as Env;
```

### 8.5 Buenas prácticas

```bash
# .gitignore - NUNCA commitear secretos
.env
.env.local
.env.*.local
*.pem
*.key
```

```bash
# .env.example - Plantilla para otros desarrolladores
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=change-me-in-production
JWT_EXPIRATION=24h
API_KEY=your-api-key-here
```

**Para producción**: Usar servicios de gestión de secretos:
- **AWS Secrets Manager**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **HashiCorp Vault**
- **Variables de entorno de la plataforma** (Heroku, Vercel, Railway)
