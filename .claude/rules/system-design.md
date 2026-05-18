# System Design Rules

> Principles for designing scalable, reliable systems.
> Based on "Designing Data-Intensive Applications" and industry best practices.

---

## Core Principles

### CAP Theorem

A distributed system can only guarantee 2 of 3:

| Property | Meaning | Example Systems |
|----------|---------|-----------------|
| **Consistency** | Every read gets the latest write | PostgreSQL, MySQL |
| **Availability** | Every request gets a response | Cassandra, DynamoDB |
| **Partition Tolerance** | System works despite network splits | All distributed systems |

> **Rule**: For most web apps, choose **CP** (consistency + partition tolerance).
> Use **AP** only when eventual consistency is acceptable (analytics, feeds, caches).

### Design for Failure

- Every external call CAN fail — handle it
- Use **circuit breakers** to prevent cascade failures
- Use **bulkhead pattern** to isolate failures
- Implement **graceful degradation** (serve cached/partial data when deps fail)
- Design for **idempotency** (safe to retry)

---

## Scalability Decision Tree

```
What's the bottleneck?
├── CPU-bound (computation)?
│   └── Horizontal scaling (more instances)
│
├── Database-bound (queries slow)?
│   ├── Add indexes → check EXPLAIN
│   ├── Add read replicas (read-heavy)
│   ├── Add caching layer (Redis)
│   ├── Optimize queries (N+1, SELECT *)
│   └── Last resort: sharding
│
├── I/O-bound (waiting for external)?
│   ├── Make async (queue)
│   ├── Add timeout + retry
│   └── Circuit breaker
│
├── Memory-bound?
│   ├── Stream instead of load-all
│   ├── Pagination
│   └── Batch processing
```

### Scale by Traffic

| DAU | Database | Cache | Architecture | Team |
|-----|----------|-------|--------------|------|
| < 10K | Single instance | Optional | Monolith | 1-5 devs |
| 10K-100K | + Read replica | Required (Redis) | Modular monolith | 5-15 devs |
| 100K-1M | Sharding or managed | Redis Cluster | Selective microservices | 15-50 devs |
| > 1M | Distributed | Multi-layer | Full microservices | 50+ devs |

---

## Caching Strategies

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| **Cache-Aside** | App checks cache → miss → fetch DB → store cache | Read-heavy, tolerates stale |
| **Write-Through** | Write to cache + DB simultaneously | Must be consistent |
| **Write-Behind** | Write to cache → async write to DB | High write throughput |
| **Read-Through** | Cache fetches from DB on miss | Simplify app code |

### Cache Decision

```
Should I cache this?
├── Read frequently (> 10x more reads than writes)? → YES
├── Expensive to compute/fetch? → YES
├── Can tolerate stale data (even briefly)? → YES
├── Changes every request? → NO, don't cache
├── User-specific + rarely accessed? → Probably NO
```

### Cache Invalidation Rules

```typescript
// 🔴 MUST: Invalidate on write
async function updateUser(id: string, data: UpdateUserInput) {
  const user = await userRepo.update(id, data);
  await cache.del(`{{appName}}:v1:user:${id}:profile`); // invalidate
  return user;
}

// 🟡 SHOULD: Use TTL as safety net (even with invalidation)
await cache.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL
```

---

## Async Patterns

### When to Use Queues

| Scenario | Sync or Async? |
|----------|---------------|
| User waiting for response | Sync |
| Email/notification | Async (queue) |
| PDF/image generation | Async (queue) |
| Payment processing | Sync (user needs result) |
| Analytics/logging | Async (fire-and-forget) |
| Data export | Async (queue + notify when done) |

### Event-Driven Architecture

```typescript
// Publish domain events instead of direct service calls
// This decouples services

// ✅ GOOD — event-driven
await eventBus.emit('order.placed', { orderId, userId, total });
// Email service, inventory service, analytics — all subscribe independently

// ❌ BAD — tight coupling
await emailService.sendOrderConfirmation(order);
await inventoryService.decrementStock(order.items);
await analyticsService.trackPurchase(order);
```

---

## API Design Patterns

### Rate Limiting Algorithms

| Algorithm | Best For |
|-----------|----------|
| **Token Bucket** | Burst traffic allowed (API gateways) |
| **Sliding Window** | Most accurate, fair |
| **Fixed Window** | Simple, but spiky at boundaries |

### Idempotency

```typescript
// 🔴 MUST: Critical operations (payments, orders) need idempotency keys
// Client sends: Idempotency-Key: <uuid>
// Server checks: if key exists → return cached result (don't process again)

async function processPayment(req: Request) {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // Check if already processed
  const existing = await cache.get(`idempotency:${idempotencyKey}`);
  if (existing) return JSON.parse(existing); // return cached result
  
  // Process payment
  const result = await paymentGateway.charge(req.body);
  
  // Cache result for 24h
  await cache.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(result));
  return result;
}
```

### Pagination

```
Offset-based: ?page=2&limit=20
  ✅ Simple, supports "jump to page"
  ❌ Slow on large offsets (OFFSET 10000)

Cursor-based: ?cursor=<encoded>&limit=20
  ✅ Fast regardless of position
  ✅ Consistent with real-time data
  ❌ No "jump to page N"

Rule: Use cursor-based for > 10K records or real-time feeds
```

---

## Reliability Patterns

### Circuit Breaker

```
CLOSED (normal) → failures exceed threshold → OPEN (reject all)
                                                    ↓ (after timeout)
                                              HALF-OPEN (allow 1 probe)
                                                    ↓
                                    success → CLOSED | failure → OPEN
```

### Retry with Exponential Backoff

```typescript
// 🔴 MUST: Never retry without backoff (will DDoS the failing service)
const delay = Math.min(
  BASE_DELAY * 2 ** attempt + Math.random() * 1000, // jitter
  MAX_DELAY,
);
```

### Health Checks

```
GET /health        → Liveness (is process running?)
GET /health/ready  → Readiness (can serve traffic? DB connected? Cache connected?)
```

---

## Back-of-Envelope Estimation

| Operation | Latency |
|-----------|---------|
| L1 cache | 0.5 ns |
| RAM access | 100 ns |
| SSD read | 150 μs |
| Network (same DC) | 0.5 ms |
| Redis GET | 0.5-1 ms |
| PostgreSQL simple query | 1-5 ms |
| Network (cross-continent) | 150 ms |
| HDD seek | 10 ms |

> **Rule**: If you need < 5ms response, it must be in Redis or memory.
> If you need < 50ms, PostgreSQL with proper indexes works.

---

## Anti-Patterns

### ❌ Premature optimization

```
Adding Redis, read replicas, CDN, and sharding
before measuring if single PostgreSQL is the bottleneck.
→ Measure first, optimize second.
```

### ❌ Distributed monolith

```
"Microservices" that all share one database
and must be deployed together.
→ If you can't deploy independently, it's not a microservice.
```

### ❌ Big-bang migration

```
"Rewrite everything as microservices in one quarter"
→ Always incremental. Strangler fig pattern.
```

### ❌ Ignoring failure modes

```
"The database will always be available"
→ What happens when it's not? Timeout? Fallback? Queue?
```
