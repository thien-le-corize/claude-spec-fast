# Monitoring & Observability Rules

> Standards for logging, metrics, tracing, and alerting.

---

## Three Pillars of Observability

| Pillar | Purpose | Tool Options |
|--------|---------|-------------|
| **Logs** | What happened | Pino, Winston, Bunyan |
| **Metrics** | How the system behaves | Prometheus + Grafana, Datadog |
| **Traces** | Why something is slow | OpenTelemetry + Jaeger, Zipkin |

---

## Logging Rules

### Log Levels

| Level | When to Use | Production? |
|-------|-------------|-------------|
| `fatal` | App cannot continue | ✅ |
| `error` | Unexpected failure requiring attention | ✅ |
| `warn` | Unexpected but recoverable | ✅ |
| `info` | Normal significant events | ✅ |
| `debug` | Detailed debugging info | ❌ (dev only) |
| `trace` | Very verbose | ❌ (never in prod) |

### 🔴 MUST: Structured JSON logs (always)

```typescript
// ✅ GOOD — structured, searchable, parseable
logger.info({
  event: 'order.placed',
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  durationMs: Date.now() - startTime,
  requestId: req.id,
});

// ❌ BAD — unstructured, cannot be queried
console.log(`Order ${orderId} placed by user ${userId}`);
```

### 🔴 MUST: Include these fields in every log

```typescript
{
  level: 'info',
  timestamp: '2026-01-01T00:00:00.000Z',  // ISO 8601
  service: '{{appName}}',
  version: '1.2.3',
  environment: 'production',
  requestId: 'uuid',          // trace across services
  event: 'order.placed',      // what happened
  durationMs: 45,             // how long (for operations)
}
```

### 🔴 MUST: Never log sensitive data

```typescript
// ❌ NEVER log these
logger.info({ password: user.password });
logger.info({ token: req.headers.authorization });
logger.info({ creditCard: payment.card });
logger.info({ ssn: user.socialSecurityNumber });

// ✅ GOOD — safe to log
logger.info({ email: user.email, userId: user.id, action: 'login' });
logger.info({ orderId, amount, last4: card.slice(-4) });
```

### Logger Setup

```typescript
// src/shared/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: process.env.APP_NAME,
    version: process.env.npm_package_version,
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // In production, output JSON. In dev, pretty print.
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

---

## Metrics

### Metric Types

| Type | Use Case | Example |
|------|----------|---------|
| **Counter** | Values that only increase | `http_requests_total` |
| **Gauge** | Values that go up/down | `active_connections` |
| **Histogram** | Distribution of values | `http_request_duration_seconds` |

### Naming Convention

```
# Pattern: {namespace}_{subsystem}_{name}_{unit}
http_request_duration_seconds       # histogram
http_requests_total                 # counter
db_query_duration_seconds           # histogram
cache_hits_total                    # counter
cache_misses_total                  # counter
queue_messages_pending              # gauge
```

### 🔴 MUST: Every service exposes RED metrics

| Metric | What | PromQL |
|--------|------|--------|
| **R**ate | Requests per second | `rate(http_requests_total[5m])` |
| **E**rrors | Error percentage | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` |
| **D**uration | Latency (p50, p95, p99) | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))` |

### 🔴 MUST: No high-cardinality labels

```typescript
// ❌ BAD — creates millions of time series
counter.labels({ userId: user.id }); // unique per user!
counter.labels({ orderId: order.id }); // unique per order!

// ✅ GOOD — bounded cardinality
counter.labels({ method: 'GET', route: '/api/v1/users', status: '200' });
```

---

## Health Checks

### 🔴 MUST: Every service has health endpoints

```typescript
// Liveness — is the process running?
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness — can it serve traffic?
app.get('/health/ready', async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`; // DB connected?
    await redis.ping();            // Cache connected?
    res.status(200).json({ status: 'ready', db: 'ok', cache: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
```

---

## Alerting Rules

### Severity Levels

| Level | Response Time | Channel | Example |
|-------|--------------|---------|---------|
| 🔴 `critical` | Immediate | PagerDuty/Phone | Service down, data loss |
| 🟠 `warning` | 30 min | Slack | High error rate, slow queries |
| 🟡 `info` | Business hours | Email/Dashboard | Unusual patterns |

### Standard Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Service Down | `up == 0` for 1 min | 🔴 Critical |
| High Error Rate | `error_rate > 5%` for 5 min | 🟠 Warning |
| High Latency | `p99 > 2s` for 5 min | 🟠 Warning |
| DB Connections Exhausted | `pool_used > 90%` for 2 min | 🔴 Critical |
| Disk Space Low | `disk_used > 85%` | 🟠 Warning |
| Queue Backlog | `pending > 1000` for 10 min | 🟠 Warning |

---

## Request Tracing

### 🔴 MUST: Propagate request ID across all logs

```typescript
// Middleware — assign request ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// All logs in this request include requestId
logger.info({ requestId: req.id, event: 'order.placed' });
```

### Distributed Tracing (for microservices)

```typescript
// Use OpenTelemetry for automatic instrumentation
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: process.env.APP_NAME,
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

---

## Dashboard Design

### Every Service Dashboard MUST have:

```
Row 1: Health overview (traffic lights: green/yellow/red)
Row 2: RED metrics (Rate, Errors, Duration)
Row 3: Resource usage (CPU, Memory, DB connections)
Row 4: Business metrics (orders/min, signups, revenue)
```

### Panel Naming Convention

```
Request Rate (req/s)
P99 Latency (ms)
Error Rate (%)
Active DB Connections
Cache Hit Rate (%)
Queue Depth
Memory Usage (MB)
```
