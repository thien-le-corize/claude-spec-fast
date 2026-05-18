# Code Style Guide

> Formatting and naming conventions. Consistency is king.
> These rules apply regardless of tech stack.

---

## General Principles

- **Clarity over cleverness** — Write code that is easy to read
- **Consistency** — Follow existing patterns in the codebase
- **Automate** — Use formatter (Prettier/Biome) + linter (ESLint/Biome)

---

## Formatting

| Rule | Standard |
|------|----------|
| Indentation | **2 spaces** (no tabs) |
| Max line length | **100 characters** |
| Quotes | **Single quotes** (configurable: `{{quoteStyle}}`) |
| Semicolons | **Yes** (configurable: `{{semicolons}}`) |
| Trailing commas | **Yes** in multi-line |
| Bracket spacing | `{ value }` not `{value}` |
| Arrow parens | Always: `(x) => x` not `x => x` |

---

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Variables & functions | camelCase | `getUserById`, `isActive` |
| Classes & interfaces | PascalCase | `UserService`, `OrderRepository` |
| Types & enums | PascalCase | `OrderStatus`, `UserRole` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Files (source) | kebab-case | `user-service.ts`, `auth-middleware.ts` |
| Files (components) | PascalCase | `UserCard.tsx`, `LoginForm.tsx` |
| Folders | kebab-case | `user-profiles/`, `order-items/` |
| Database tables | snake_case (plural) | `users`, `order_items` |
| Database columns | snake_case | `created_at`, `user_id` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| CSS classes | kebab-case or utility | `btn-primary`, `text-lg` |
| API endpoints | kebab-case (plural) | `/api/v1/user-profiles` |

---

## TypeScript Specific

### 🔴 MUST: Strict mode enabled

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### 🔴 MUST: Explicit return types on exported functions

```typescript
// ❌ Bad — inferred return type
export function getUser(id: string) {
  return db.user.findUnique({ where: { id } });
}

// ✅ Good — explicit return type
export function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
```

### 🔴 MUST: No `any` without justification

```typescript
// ❌ Bad
function parse(data: any) { ... }

// ✅ Good — use unknown + type guard
function parse(data: unknown): ParsedData {
  if (!isValidData(data)) throw new Error('Invalid');
  return data as ParsedData;
}

// ✅ Acceptable — with justification
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function legacyAdapter(data: any) { // Required: third-party lib returns untyped data
  ...
}
```

### 🟡 SHOULD: Prefer `interface` for objects, `type` for unions/intersections

```typescript
// Objects → interface
interface User {
  id: string;
  email: string;
  name: string;
}

// Unions/intersections → type
type Status = 'active' | 'inactive' | 'banned';
type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date };
```

### 🟡 SHOULD: Use `readonly` for immutable data

```typescript
interface Config {
  readonly apiUrl: string;
  readonly maxRetries: number;
}
```

---

## Import Order

```typescript
// 1. Node built-ins
import path from 'node:path';
import { readFile } from 'node:fs/promises';

// 2. External dependencies
import express from 'express';
import { z } from 'zod';

// 3. Internal modules (path aliases)
import { UserService } from '@/domain/services';
import { AppError } from '@/shared/errors';

// 4. Relative imports (same feature/module)
import { validateInput } from './validators';
import type { CreateUserInput } from './types';
```

---

## File Organization

```typescript
// Order within a file:
// 1. Imports
// 2. Types/interfaces
// 3. Constants
// 4. Main export (class/function)
// 5. Helper functions (private)
```

### 🔴 MUST: One primary export per file

```typescript
// ❌ Bad — multiple unrelated exports
export class UserService { ... }
export class OrderService { ... }
export function formatDate() { ... }

// ✅ Good — one file, one responsibility
// user-service.ts
export class UserService { ... }
```

---

## Async/Await Style

```typescript
// ✅ Always use async/await
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch user', 500, 'INTERNAL_ERROR');
  }
}

// ❌ Avoid promise chains
fetchUser(id).then(user => { ... }).catch(err => { ... });
```

---

## Enforcement

| Tool | Purpose |
|------|---------|
| **Prettier** or **Biome** | Auto-format on save |
| **ESLint** or **Biome** | Catch code quality issues |
| **TypeScript** | Type safety |
| **Husky + lint-staged** | Pre-commit checks |

```json
// Recommended scripts in package.json
{
  "scripts": {
    "lint": "eslint src/ --ext .ts,.tsx",
    "format": "prettier --write src/",
    "type-check": "tsc --noEmit"
  }
}
```
