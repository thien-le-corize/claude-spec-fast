# Naming Conventions

> Standard naming rules for cache keys, database, queues, events, environment variables, files, and URLs.

---

## 🔑 Cache Key Naming

### Format

```
{app}:{version}:{entity}:{identifier}:{variant}
```

### Rules
- Use **colons** (`:`) as separators
- Use **lowercase snake_case** for each segment
- Always prefix with app name (avoid collision in shared Redis)
- Include version for easy cache invalidation

### Examples

```
# User data
{{appName}}:v1:user:12345:profile
{{appName}}:v1:user:12345:permissions

# Collections
{{appName}}:v1:users:active:page:1
{{appName}}:v1:products:category:electronics:page:1

# Sessions
{{appName}}:v1:session:abc123xyz

# Rate limiting
{{appName}}:v1:rate_limit:user:12345:api
{{appName}}:v1:rate_limit:ip:192.168.1.1

# Feature flags
{{appName}}:v1:feature:new_checkout:enabled

# Locks (mutex)
{{appName}}:v1:lock:payment:order:99999
```

### TTL Conventions

| Data Type | TTL |
|-----------|-----|
| User session | 7 days |
| Auth tokens | 15 minutes |
| User profile | 1 hour |
| Product catalog | 6 hours |
| Config/settings | 24 hours |
| Rate limit windows | 15 minutes |
| Temporary locks | 30 seconds |

---

## 🗄️ Database Naming

### Tables

```sql
-- snake_case, plural nouns
users
order_items
product_categories
user_role_mappings    -- junction tables: entity1_entity2_mappings
```

### Columns

```sql
id                    -- primary key (always 'id')
user_id               -- foreign key: {table_singular}_id
created_at            -- timestamps: {event}_at
updated_at
deleted_at            -- soft delete
is_active             -- booleans: is_, has_, can_
has_verified_email
email                 -- data fields: plain descriptive name
```

### Indexes

```sql
idx_users_email                    -- idx_{table}_{columns}
idx_orders_user_id_created_at
uniq_users_email                   -- unique: uniq_{table}_{columns}
fk_orders_users                    -- foreign key: fk_{child}_{parent}
```

---

## 📨 Queue & Event Naming

### Queue Names

```
# Pattern: {app}.{entity}.{action}
{{appName}}.email.send
{{appName}}.payment.process
{{appName}}.order.fulfillment
{{appName}}.notification.push
```

### Domain Event Names

```
# Pattern: {entity}.{past_tense_verb}
# Events describe things that HAPPENED

user.registered
user.email_verified
user.password_changed
order.placed
order.paid
order.shipped
order.cancelled
payment.succeeded
payment.failed
product.stock_depleted
```

### Dead Letter Queues

```
{{appName}}.email.send.dlq
{{appName}}.payment.process.dlq
```

---

## 🌍 Environment Variables

### Rules
- **UPPER_SNAKE_CASE** always
- Group by category with comments
- Be descriptive — no abbreviations

### Standard Variables

```bash
# App
NODE_ENV=production
PORT=3000
APP_NAME={{appName}}
APP_URL=https://{{appName}}.com
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://...
DB_POOL_MIN=2
DB_POOL_MAX=10

# Cache
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# External Services
SMTP_HOST=...
SMTP_PORT=587
STRIPE_SECRET_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...

# Monitoring
SENTRY_DSN=...
```

---

## 📁 File & Folder Naming

| Type | Convention | Example |
|------|-----------|---------|
| Source files | kebab-case | `user-service.ts` |
| React components | PascalCase | `UserCard.tsx` |
| Test files | `[name].test.ts` | `user-service.test.ts` |
| Config files | kebab-case | `app.config.ts` |
| Folders | kebab-case, plural | `controllers/`, `services/` |
| Docker files | kebab-case | `docker-compose.dev.yml` |

---

## 🌐 URL / Route Naming

```
# REST: plural nouns, kebab-case, versioned
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# Nested resources (max 2 levels)
GET    /api/v1/users/:id/orders

# Actions (non-CRUD, use sparingly)
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/payments/:id/refund
```

---

## 🏷️ Code Naming Summary

| Entity | Convention | Example |
|--------|-----------|---------|
| Variables & functions | camelCase | `getUserById` |
| Classes & interfaces | PascalCase | `UserService` |
| Types & enums | PascalCase | `OrderStatus` |
| Enum values | UPPER_SNAKE_CASE | `ORDER_PENDING` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Private fields | `_` prefix or `#` | `_cache`, `#secret` |
| Boolean vars | `is`, `has`, `can`, `should` | `isActive`, `hasPermission` |
| Event handlers | `on` + event | `onSubmit`, `onClick` |
| Hooks (React) | `use` prefix | `useAuth`, `useDebounce` |
| Factory functions | `create` prefix | `createUser`, `createOrder` |
| Async functions | verb describing action | `fetchUser`, `sendEmail` |
