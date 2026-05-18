# Database Rules

> Mandatory patterns for database access, queries, and schema design.

---

## Core Principles

| Rule | Severity |
|------|----------|
| 🔴 **NEVER** write raw SQL in business logic — use ORM | Critical |
| 🔴 **NEVER** skip transactions for multi-step operations | Critical |
| 🔴 **NEVER** log query results containing sensitive data | Critical |
| 🔴 **ALWAYS** use connection pooling | Critical |
| 🔴 **ALWAYS** use parameterized queries | Critical |
| 🔴 **ALWAYS** paginate list queries (never unbounded) | Critical |
| 🟡 **SHOULD** select only needed fields (no SELECT *) | Important |
| 🟡 **SHOULD** add indexes on foreign keys and frequently queried columns | Important |

---

## Connection Management

```typescript
// ✅ GOOD — Singleton pattern with connection pooling
// (Example with Prisma — adapt for your ORM)
const globalForDb = global as unknown as { db: PrismaClient };

export const db =
  globalForDb.db ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

// ❌ BAD — new connection per request
app.get('/users', async (req, res) => {
  const db = new PrismaClient(); // NEVER do this
});
```

---

## Query Best Practices

### 🔴 MUST: Select only needed fields

```typescript
// ❌ Bad — fetches all columns including password
const user = await db.user.findUnique({ where: { id } });

// ✅ Good — only what's needed
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true, role: true },
});
```

### 🔴 MUST: Paginate all list queries

```typescript
// ❌ Bad — unbounded query (could return millions of rows)
const users = await db.user.findMany();

// ✅ Good — always paginated
const users = await db.user.findMany({
  take: limit,           // max 100
  skip: (page - 1) * limit,
  orderBy: { createdAt: 'desc' },
});

// ✅ Better — cursor-based for large datasets
const users = await db.user.findMany({
  take: limit,
  cursor: lastId ? { id: lastId } : undefined,
  skip: lastId ? 1 : 0,
  orderBy: { id: 'asc' },
});
```

### 🔴 MUST: Prevent N+1 queries

```typescript
// ❌ Bad — N+1 (1 query for users + N queries for orders)
const users = await db.user.findMany();
for (const user of users) {
  user.orders = await db.order.findMany({ where: { userId: user.id } });
}

// ✅ Good — single query with include/join
const users = await db.user.findMany({
  include: { orders: true },
});

// ✅ Also good — separate query with IN clause
const users = await db.user.findMany();
const userIds = users.map((u) => u.id);
const orders = await db.order.findMany({
  where: { userId: { in: userIds } },
});
```

---

## Transactions

### 🔴 MUST: Use transactions for multi-step operations

```typescript
// ✅ GOOD — atomic operation
const order = await db.$transaction(async (tx) => {
  // 1. Create order
  const order = await tx.order.create({ data: orderData });

  // 2. Decrement stock
  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });

  // 3. Create payment record
  await tx.payment.create({
    data: { orderId: order.id, amount: order.total, status: 'pending' },
  });

  return order;
});

// ❌ BAD — not atomic (if step 2 fails, step 1 already committed)
const order = await db.order.create({ data: orderData });
await db.product.update({ ... }); // if this fails, order exists without stock update
```

---

## Schema Design

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Tables | snake_case, plural | `users`, `order_items` |
| Columns | snake_case | `created_at`, `user_id` |
| Primary key | Always `id` | `id` |
| Foreign key | `{table_singular}_id` | `user_id`, `order_id` |
| Timestamps | `{event}_at` | `created_at`, `updated_at`, `deleted_at` |
| Booleans | `is_`, `has_`, `can_` | `is_active`, `has_verified_email` |
| Indexes | `idx_{table}_{columns}` | `idx_users_email` |
| Unique indexes | `uniq_{table}_{columns}` | `uniq_users_email` |
| Foreign keys | `fk_{child}_{parent}` | `fk_orders_users` |

### Schema Template

```prisma
model User {
  id        String   @id @default(cuid())    // cuid for distributed systems
  email     String   @unique
  name      String
  password  String                            // hashed, never plain
  role      Role     @default(USER)
  isActive  Boolean  @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?                         // soft delete

  orders    Order[]

  @@map("users")                              // snake_case table name
  @@index([email])
  @@index([createdAt])
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 🟡 SHOULD: Use soft delete for important data

```typescript
// Soft delete — mark as deleted, don't remove
await db.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Query active records only
const users = await db.user.findMany({
  where: { deletedAt: null },
});
```

---

## Migrations

### 🔴 MUST: Always use migration files

```bash
# Development — auto-generate migration
npx prisma migrate dev --name add_user_role

# Production — apply pending migrations (in CI/CD)
npx prisma migrate deploy

# ❌ NEVER modify database schema directly
# ❌ NEVER edit existing migration files
```

### Migration Rules

| Rule | Why |
|------|-----|
| Migrations are immutable | Once committed, never edit |
| One concern per migration | Easy to rollback |
| Test migrations on staging first | Catch issues before production |
| Have rollback plan | Know how to undo |
| Avoid destructive changes in production | Rename → add new + migrate data + drop old |

---

## Performance

### Indexing Rules

```sql
-- 🔴 MUST: Index foreign keys
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 🔴 MUST: Index frequently filtered columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- 🟡 SHOULD: Composite index for common query patterns
-- If you often query: WHERE status = 'active' AND created_at > '...'
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

-- ❌ DON'T: Index every column (slows down writes)
```

### Query Optimization Checklist

- [ ] No N+1 queries (use include/join)
- [ ] All list queries paginated
- [ ] Indexes on WHERE, JOIN, ORDER BY columns
- [ ] No SELECT * — only needed fields
- [ ] Large text/blob columns excluded from list queries
- [ ] Count queries use `_count` not `findMany().length`
- [ ] Expensive queries cached (Redis)

---

## Anti-Patterns

### ❌ Business logic in queries

```typescript
// BAD — repository making business decisions
class OrderRepository {
  async createIfValid(data) {
    if (data.total < 0) throw new Error('Invalid'); // ← business logic!
    return db.order.create({ data });
  }
}

// ✅ GOOD — repository is pure data access
class OrderRepository {
  async create(data: CreateOrderData) {
    return db.order.create({ data });
  }
}
// Business validation happens in OrderService
```

### ❌ Unbounded queries in loops

```typescript
// BAD — could process millions of records in memory
const allOrders = await db.order.findMany(); // ALL orders!
for (const order of allOrders) { ... }

// ✅ GOOD — batch processing
let cursor: string | undefined;
do {
  const batch = await db.order.findMany({
    take: 100,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
  });
  await processBatch(batch);
  cursor = batch[batch.length - 1]?.id;
} while (cursor);
```
