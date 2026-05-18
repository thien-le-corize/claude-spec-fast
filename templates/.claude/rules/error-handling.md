# Error Handling Rules

> Mandatory patterns for handling errors consistently across the application.

---

## Core Principles

| Principle | Rule |
|-----------|------|
| 🔴 **Never swallow errors** | Always log or rethrow — never empty catch |
| 🔴 **Centralized handler** | One global error handler, not scattered try/catch |
| 🔴 **Consistent format** | All errors return same response shape |
| 🔴 **Operational vs Programmer** | Distinguish expected errors from bugs |
| 🔴 **Fail fast** | Validate early, fail at the boundary |

---

## Error Classification

| Type | Example | Action |
|------|---------|--------|
| **Operational** (expected) | User not found, validation failed, rate limited | Handle gracefully, return proper HTTP status |
| **Programmer** (bug) | TypeError, null reference, missing import | Log, return 500, fix the code |
| **External** (dependency) | DB timeout, API down, network error | Retry with backoff, circuit breaker, fallback |

---

## Custom Error Class (MANDATORY)

```typescript
// src/shared/errors/app-error.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error subclasses (optional but recommended)
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      `${resource.toUpperCase()}_NOT_FOUND`,
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

---

## Throwing Errors (Service Layer)

```typescript
// ✅ GOOD — throw specific operational errors
async function findById(id: string): Promise<User> {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User', id);
  return user;
}

async function create(input: CreateUserInput): Promise<User> {
  const existing = await userRepo.findByEmail(input.email);
  if (existing) throw new ConflictError('Email already in use');

  // ... create user
}

// ❌ BAD — generic errors without context
if (!user) throw new Error('not found');
if (!user) return null; // silent failure — caller doesn't know why
```

---

## Async Error Wrapper (Controller Layer)

```typescript
// Wraps async route handlers to catch errors automatically
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
}));
// If findById throws, error goes to global handler automatically
```

---

## Global Error Handler (MANDATORY — single place)

```typescript
// src/app/middlewares/error.middleware.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1. Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn({ err, req: { method: req.method, url: req.url, requestId: req.id } });
  } else {
    logger.error({ err, req: { method: req.method, url: req.url, requestId: req.id } });
  }

  // 2. Determine response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 3. Unknown error — never expose internals
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}
```

---

## Error Response Format (MANDATORY)

```typescript
// All error responses MUST follow this shape:
interface ErrorResponse {
  success: false;
  error: {
    code: string;       // Machine-readable: 'USER_NOT_FOUND', 'VALIDATION_ERROR'
    message: string;    // Human-readable: 'User with id xyz not found'
    details?: unknown;  // Optional: validation errors array, etc.
  };
}
```

### Standard Error Codes

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Duplicate/conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down |

---

## Anti-Patterns (NEVER do this)

### ❌ Empty catch block

```typescript
// BAD — error silently swallowed
try {
  await sendEmail(user.email);
} catch (err) {
  // do nothing 💀
}

// ✅ GOOD — at minimum, log it
try {
  await sendEmail(user.email);
} catch (err) {
  logger.error({ err, context: 'Failed to send email', userId: user.id });
  // Decide: rethrow? fallback? ignore with logging?
}
```

### ❌ Catching and returning null

```typescript
// BAD — caller has no idea why it's null
async function getUser(id: string): Promise<User | null> {
  try {
    return await db.user.findUnique({ where: { id } });
  } catch {
    return null; // DB error? Network timeout? Who knows!
  }
}
```

### ❌ String errors

```typescript
// BAD — no structure, no status code
throw 'Something went wrong';
throw new Error('fail');

// ✅ GOOD — structured, actionable
throw new AppError('Payment processing failed', 502, 'PAYMENT_GATEWAY_ERROR');
```

### ❌ Exposing internals in production

```typescript
// BAD — leaks stack trace and internal details
res.status(500).json({ error: err.stack });

// ✅ GOOD — generic message in production
res.status(500).json({
  success: false,
  error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
});
```

---

## Validation Errors (Input Boundary)

```typescript
// Validate at the boundary (controller/middleware), not deep in services
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
});

// Validation middleware
export function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Validation failed', result.error.flatten());
    }
    req.body = result.data; // replace with parsed/cleaned data
    next();
  };
}
```

---

## External Service Errors (Retry + Circuit Breaker)

```typescript
// For external API calls — retry with exponential backoff
async function callExternalAPI<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        throw new AppError('External service unavailable', 503, 'SERVICE_UNAVAILABLE');
      }
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new AppError('Unreachable', 500, 'INTERNAL_ERROR');
}
```

---

## Unhandled Rejections (Process Level)

```typescript
// src/server.ts — catch unhandled errors at process level
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ err: reason }, 'Unhandled Promise Rejection');
  // Graceful shutdown
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});
```
