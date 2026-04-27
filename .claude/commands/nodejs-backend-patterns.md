# Node.js Backend Patterns

Production-ready patterns for Node.js backend applications. Covers REST APIs, middleware, error handling, validation, and architecture with Express.js or Fastify.

## Framework Choice

**Fastify** (preferred for new projects): built-in logging, JSON schema validation on routes, better performance.
**Express.js**: wider ecosystem, more familiar — add `helmet`, `cors`, `compression` manually.

```ts
// Fastify route with schema validation
import Fastify from 'fastify'
const app = Fastify({ logger: true })

app.post('/vehicles', {
  schema: {
    body: {
      type: 'object',
      required: ['make', 'model', 'year'],
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'integer', minimum: 1900 },
      },
    },
  },
}, async (request, reply) => {
  const vehicle = await vehicleService.create(request.body)
  return reply.code(201).send(vehicle)
})
```

## Layered Architecture

```
src/
  controllers/    ← HTTP request/response handling only
  services/       ← business logic and validation
  repositories/   ← database access (one method per operation)
  models/         ← type definitions and schemas
  middleware/     ← auth, validation, logging, rate limiting
  lib/            ← shared utilities
```

Each layer only calls the layer below it. Controllers never touch the database.

## Service Layer

```ts
// services/vehicle.service.ts
export class VehicleService {
  constructor(private repo: VehicleRepository) {}

  async create(data: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.repo.findByVin(data.vin)
    if (existing) throw new AppError('VIN already exists', 409)
    return this.repo.create(data)
  }
}
```

## Repository Pattern

```ts
// repositories/vehicle.repository.ts
export class VehicleRepository {
  async findById(id: string): Promise<Vehicle | null> {
    return db.select().from(vehicles).where(eq(vehicles.id, id)).then(r => r[0] ?? null)
  }
  async create(data: NewVehicle): Promise<Vehicle> {
    return db.insert(vehicles).values(data).returning().then(r => r[0])
  }
}
```

## Middleware Patterns

### JWT Authentication
```ts
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

### Input Validation with Zod
```ts
import { z } from 'zod'

const CreateVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive(),
})

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return res.status(400).json({ errors: result.error.flatten() })
    req.body = result.data
    next()
  }
}
```

### Rate Limiting
```ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  store: new RedisStore({ client: redisClient }),
  standardHeaders: true,
})
```

### Structured Logging with Pino
```ts
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode, duration: Date.now() - start })
  })
  next()
})
```

## Error Handling

```ts
// Typed application errors
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Global error handler (register last)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  logger.error(err)
  res.status(500).json({ error: 'Internal server error' })
})
```

## Graceful Shutdown

```ts
const server = app.listen(PORT)

async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`)
  server.close(async () => {
    await db.end()         // close DB pool
    await redisClient.quit()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
```

## Health Check

```ts
app.get('/health', async (req, res) => {
  const dbOk = await db.query('SELECT 1').then(() => true).catch(() => false)
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
  })
})
```

## Production Checklist

- TypeScript with strict mode enabled
- All input validated at route entry (Zod)
- JWT secret and DB credentials in environment variables only
- Rate limiting on all public endpoints
- HTTPS enforced (behind reverse proxy or via HSTS)
- CORS configured explicitly — never `origin: '*'` in production
- Database connection pool (not single connection)
- Graceful shutdown handling SIGTERM/SIGINT
- Health check endpoint for load balancer probes
- Structured JSON logs (Pino) — no `console.log` in production code
