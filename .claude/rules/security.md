# Security Rules

> 🚨 **CRITICAL** — These rules are NON-NEGOTIABLE. Violations are treated as P0 bugs.

---

## Absolute Rules (NEVER violate)

| # | Rule | Severity |
|---|------|----------|
| 1 | **NEVER** hardcode secrets, API keys, passwords, or tokens in source code | 🔴 Critical |
| 2 | **NEVER** commit `.env` files to version control | 🔴 Critical |
| 3 | **NEVER** log sensitive data (passwords, tokens, PII, credit cards) | 🔴 Critical |
| 4 | **NEVER** use `eval()`, `Function()`, or `innerHTML` with user input | 🔴 Critical |
| 5 | **NEVER** trust client-side validation alone — always validate server-side | 🔴 Critical |
| 6 | **NEVER** expose stack traces or internal errors in production responses | 🔴 Critical |
| 7 | **NEVER** store passwords in plain text | 🔴 Critical |
| 8 | **NEVER** use HTTP in production (HTTPS only) | 🔴 Critical |
| 9 | **ALWAYS** validate and sanitize ALL user input at the boundary | 🔴 Critical |
| 10 | **ALWAYS** use parameterized queries (ORM handles this) | 🔴 Critical |

---

## Authentication

### Password Hashing

```typescript
// 🔴 MUST: bcrypt with >= 12 rounds OR argon2
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // minimum 12
const hashed = await bcrypt.hash(password, SALT_ROUNDS);
const isValid = await bcrypt.compare(password, hashed);
```

### JWT Token Strategy

| Token | Expiry | Storage | Purpose |
|-------|--------|---------|---------|
| Access token | 15 minutes | Memory / httpOnly cookie | API authentication |
| Refresh token | 7 days | httpOnly cookie | Get new access token |

```typescript
// 🔴 MUST: Short-lived access tokens
const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
```

### Rate Limiting on Auth

```typescript
// 🔴 MUST: Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts' } },
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
```

---

## Authorization

### 🔴 MUST: Protect every endpoint

```typescript
// Every route that accesses user data MUST have auth middleware
router.get('/users/:id', authenticate, authorize('admin', 'self'), getUser);
router.patch('/users/:id', authenticate, authorize('admin', 'self'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```

### 🔴 MUST: Verify resource ownership

```typescript
// NEVER trust the URL parameter alone
async function getOrder(req, res) {
  const order = await orderRepo.findById(req.params.id);
  if (!order) throw new NotFoundError('Order');

  // 🔴 MUST check ownership
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    throw new ForbiddenError('You can only access your own orders');
  }

  res.json({ success: true, data: order });
}
```

---

## Input Validation

### 🔴 MUST: Validate at the boundary (before processing)

```typescript
// Use schema validation (Zod, Joi, etc.)
const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100).trim(),
});

// Apply as middleware — BEFORE controller
router.post('/users', validate(createUserSchema), createUser);
```

### 🔴 MUST: Allowlist validation (not blocklist)

```typescript
// ❌ Bad — blocklist (attacker finds what you missed)
const sanitized = input.replace(/<script>/g, '');

// ✅ Good — allowlist (only accept what you expect)
const status = z.enum(['active', 'inactive', 'pending']).parse(input);
```

---

## HTTP Security Headers

```typescript
// 🔴 MUST: Use Helmet.js or equivalent
import helmet from 'helmet';
app.use(helmet());

// Key headers set by Helmet:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Strict-Transport-Security: max-age=31536000
// X-XSS-Protection: 0 (modern browsers don't need it)
// Content-Security-Policy: ...
```

### CORS Configuration

```typescript
// 🔴 MUST: Restrictive CORS (never use origin: '*' in production)
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Data Protection

### 🔴 MUST: Never return sensitive fields in API responses

```typescript
// ❌ Bad — returns password hash
const user = await db.user.findUnique({ where: { id } });
res.json({ data: user }); // includes password!

// ✅ Good — select only safe fields
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true, createdAt: true },
});
```

### 🔴 MUST: Never log sensitive data

```typescript
// ❌ NEVER
logger.info('Login attempt', { email, password });
logger.info('Token', { token: req.headers.authorization });
logger.info('Payment', { cardNumber: payment.card });

// ✅ GOOD
logger.info('Login attempt', { email, success: true });
logger.info('Payment processed', { orderId, amount, last4: card.slice(-4) });
```

---

## File Upload Security

```typescript
// 🔴 MUST: Validate file uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: UploadedFile) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new ValidationError('File type not allowed');
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError('File too large (max 5MB)');
  }
  // 🔴 MUST: Sanitize filename
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  return safeName;
}
```

---

## Dependency Security

```bash
# 🔴 MUST: Run regularly (weekly minimum, in CI)
npm audit

# 🔴 MUST: Zero high/critical vulnerabilities before deploy
npm audit --audit-level=high

# 🟡 SHOULD: Use lockfile
# package-lock.json MUST be committed
```

---

## Environment Variables

```bash
# .env.example — committed to git (no real values)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000

# 🔴 MUST: Validate env vars at startup
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## Security Checklist (Pre-Deploy)

- [ ] No secrets in source code (`git log --all -p | grep -i "password\|secret\|key"`)
- [ ] `.env` files gitignored
- [ ] All inputs validated server-side
- [ ] Auth on all protected endpoints
- [ ] Resource ownership verified
- [ ] Rate limiting configured
- [ ] CORS restrictive
- [ ] Security headers set (Helmet)
- [ ] Passwords hashed (bcrypt >= 12 or argon2)
- [ ] JWT expiry enforced
- [ ] `npm audit` clean (no high/critical)
- [ ] Error responses don't leak internals
- [ ] File uploads validated (type, size, name)
- [ ] HTTPS enforced in production
