# API Conventions

> Mandatory REST API design standards.

---

## URL Structure

### 🔴 MUST follow these rules:

| Rule | Example |
|------|---------|
| Version prefix | `/api/v1/...` |
| Plural nouns for collections | `/api/v1/users`, `/api/v1/products` |
| kebab-case for multi-word | `/api/v1/user-profiles` |
| Nested for relationships | `/api/v1/users/:id/orders` |
| Max 2 levels of nesting | `/api/v1/users/:id/orders` (not deeper) |

```
✅ Good
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/orders

❌ Bad
GET    /api/getUsers
GET    /api/user/get/1
POST   /api/user_profiles/create
GET    /api/v1/users/:id/orders/:orderId/items/:itemId/reviews  (too deep)
```

### Actions (non-CRUD — use sparingly)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/payments/:id/refund
POST   /api/v1/orders/:id/cancel
```

---

## HTTP Methods

| Method | Usage | Idempotent | Body |
|--------|-------|-----------|------|
| `GET` | Read resource(s) | ✅ | No |
| `POST` | Create new resource | ❌ | Yes |
| `PUT` | Replace entire resource | ✅ | Yes |
| `PATCH` | Partial update | ✅ | Yes |
| `DELETE` | Remove resource | ✅ | No |

---

## HTTP Status Codes (MANDATORY)

| Code | When to Use |
|------|-------------|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE (no body) |
| `400` | Bad request (malformed syntax) |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (duplicate, state conflict) |
| `422` | Validation failed (correct syntax, invalid data) |
| `429` | Rate limited |
| `500` | Internal server error |
| `503` | Service unavailable (dependency down) |

---

## Response Format (MANDATORY envelope)

### Success — Single resource

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-15T10:30:00.000Z"
  }
}
```

### Success — Collection with pagination

```json
{
  "success": true,
  "data": [
    { "id": "usr_abc123", "email": "user@example.com" },
    { "id": "usr_def456", "email": "other@example.com" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Success — No data (DELETE)

```
HTTP 204 No Content
(empty body)
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Required" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}
```

---

## Query Parameters

### Pagination

```
GET /api/v1/users?page=1&limit=20
GET /api/v1/users?cursor=eyJpZCI6MTAwfQ&limit=20  (cursor-based)
```

| Param | Default | Max |
|-------|---------|-----|
| `page` | 1 | — |
| `limit` | 20 | 100 |
| `cursor` | — | — |

### Sorting

```
GET /api/v1/users?sortBy=createdAt&order=desc
GET /api/v1/products?sortBy=price&order=asc
```

### Filtering

```
GET /api/v1/products?category=electronics&minPrice=100&maxPrice=500
GET /api/v1/orders?status=pending&createdAfter=2026-01-01
```

### Searching

```
GET /api/v1/users?search=john
GET /api/v1/products?q=wireless+headphones
```

### Field selection (optional)

```
GET /api/v1/users?fields=id,email,name
```

---

## Request Body Conventions

### 🔴 MUST: Use camelCase for all fields

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "+84123456789"
}
```

### 🔴 MUST: Use ISO 8601 for dates

```json
{
  "createdAt": "2026-01-15T10:30:00.000Z",
  "expiresAt": "2026-02-15T10:30:00.000Z"
}
```

### 🔴 MUST: Use string IDs (not integers)

```json
{
  "id": "usr_abc123",
  "orderId": "ord_xyz789"
}
```

---

## Versioning Strategy

```
/api/v1/users    ← Current stable
/api/v2/users    ← Breaking changes (new version)
```

### Rules:
- **v1** is default and maintained
- **v2** only when breaking changes are unavoidable
- Deprecate old versions with `Sunset` header
- Support old version for minimum 6 months after deprecation

---

## Rate Limiting

### Headers (MUST include in responses)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
Retry-After: 60  (only on 429)
```

### Default limits

| Endpoint type | Limit |
|--------------|-------|
| Public API | 100 req / 15 min |
| Authenticated API | 1000 req / 15 min |
| Auth endpoints (login, register) | 5 req / 15 min |
| File upload | 10 req / hour |

---

## Security Headers (MUST)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## API Documentation (MANDATORY)

- Every endpoint MUST have OpenAPI/Swagger documentation
- Mount at `/api-docs` (development/staging)
- Include: request schema, response schema, error codes, examples
- Auto-generate from code when possible (Zod → OpenAPI)

---

## Anti-Patterns

### ❌ Verb in URL

```
POST /api/createUser        → POST /api/v1/users
GET  /api/getUserById/123   → GET  /api/v1/users/123
POST /api/deleteUser/123    → DELETE /api/v1/users/123
```

### ❌ Inconsistent response format

```
// Some endpoints return { data: ... }
// Others return { result: ... }
// Others return raw array [...]
→ ALWAYS use the envelope: { success, data, pagination?, error? }
```

### ❌ Exposing internal IDs

```
// BAD — auto-increment reveals business info
{ "id": 12345 }  // attacker knows there are ~12345 users

// GOOD — opaque IDs
{ "id": "usr_cuid2abc123" }
```
