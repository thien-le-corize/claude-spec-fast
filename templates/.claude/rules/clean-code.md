# Clean Code Rules

> Mandatory rules for writing clean, maintainable code.
> These rules apply regardless of tech stack.

---

## Severity

| Level | Meaning |
|-------|---------|
| 🔴 **MUST** | Violation = code review rejection |
| 🟡 **SHOULD** | Strong recommendation, exceptions need justification |
| 🟢 **MAY** | Optional best practice |

---

## 📦 Variables

### 🔴 MUST: Use meaningful, pronounceable names

```typescript
// ❌ Bad
const yyyymmdstr = new Date().toISOString().slice(0, 10);
const d = new Date();
const u = await getUser();

// ✅ Good
const currentDate = new Date().toISOString().slice(0, 10);
const createdAt = new Date();
const currentUser = await getUser();
```

### 🔴 MUST: No magic numbers — use named constants

```typescript
// ❌ Bad
setTimeout(fn, 86400000);
if (retries > 3) throw new Error('Failed');

// ✅ Good
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setTimeout(fn, ONE_DAY_MS);

const MAX_RETRIES = 3;
if (retries > MAX_RETRIES) throw new Error('Failed');
```

### 🔴 MUST: Same vocabulary for same concept

```typescript
// ❌ Bad — 3 names for the same thing
getUserInfo();
getClientData();
getCustomerRecord();

// ✅ Good — one name
getUser();
```

### 🟡 SHOULD: Use explanatory variables for complex expressions

```typescript
// ❌ Hard to read
if (user.age >= 18 && user.country === 'VN' && user.verified && !user.banned) {}

// ✅ Clear intent
const isEligible = user.age >= 18 && user.country === 'VN';
const isActive = user.verified && !user.banned;
if (isEligible && isActive) {}
```

### 🔴 MUST: No single-letter variables (except loop counters)

```typescript
// ❌ Bad
locations.forEach(l => dispatch(l));

// ✅ Good
locations.forEach(location => dispatch(location));
```

---

## 🔧 Functions

### 🔴 MUST: Functions do ONE thing

```typescript
// ❌ Bad — does 3 things
async function processUser(user) {
  const validated = validateUser(user);
  const saved = await db.user.create({ data: validated });
  await sendWelcomeEmail(saved.email);
  return saved;
}

// ✅ Good — each function does one thing
async function createUser(input: CreateUserInput) {
  const validated = validateUserInput(input);
  const user = await saveUser(validated);
  await emitUserCreatedEvent(user);
  return user;
}
```

### 🔴 MUST: Max 3 parameters — use object for more

```typescript
// ❌ Bad
function createMenu(title, body, buttonText, cancellable, theme) {}

// ✅ Good
function createMenu(options: CreateMenuOptions) {}

interface CreateMenuOptions {
  title: string;
  body: string;
  buttonText: string;
  cancellable?: boolean;
  theme?: Theme;
}
```

### 🔴 MUST: Function names describe what they do

```typescript
// ❌ Bad — unclear
addToDate(date, 1);
handle(data);
process(items);

// ✅ Good — clear intent
addDaysToDate(date, 1);
validatePaymentData(data);
filterActiveItems(items);
```

### 🟡 SHOULD: Max 30 lines per function

If a function exceeds 30 lines, extract helper functions.

### 🔴 MUST: No side effects in pure functions

```typescript
// ❌ Bad — mutates input
function addItem(cart, item) {
  cart.push(item); // mutates original
  return cart;
}

// ✅ Good — returns new value
function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  return [...cart, item];
}
```

### 🔴 MUST: No flag parameters — split into separate functions

```typescript
// ❌ Bad
function createFile(name: string, isTemp: boolean) {
  if (isTemp) { /* ... */ } else { /* ... */ }
}

// ✅ Good
function createFile(name: string) { /* ... */ }
function createTempFile(name: string) { /* ... */ }
```

---

## 🏛️ Classes & Modules

### 🔴 MUST: Single Responsibility Principle

One class/module = one reason to change.

```typescript
// ❌ Bad — UserService does auth + profile + notifications
class UserService {
  login() {}
  updateProfile() {}
  sendNotification() {}
}

// ✅ Good — separated concerns
class AuthService { login() {} }
class ProfileService { updateProfile() {} }
class NotificationService { send() {} }
```

### 🟡 SHOULD: Prefer composition over inheritance

```typescript
// ❌ Fragile inheritance chain
class Animal {}
class Dog extends Animal {}
class RobotDog extends Dog {} // 🤔 is it really a Dog?

// ✅ Composition
class RobotDog {
  constructor(
    private movement: MovementBehavior,
    private sound: SoundBehavior,
  ) {}
}
```

### 🔴 MUST: Depend on abstractions, not concretions (DI)

```typescript
// ❌ Bad — tightly coupled
class OrderService {
  private db = new PrismaClient(); // hard dependency
}

// ✅ Good — injectable
class OrderService {
  constructor(private readonly orderRepo: OrderRepository) {}
}
```

---

## ⚡ Async / Concurrency

### 🔴 MUST: Use async/await over raw Promises

```typescript
// ❌ Bad
fetchUser(id).then(user => fetchOrders(user.id)).then(orders => { ... }).catch(err => { ... });

// ✅ Good
try {
  const user = await fetchUser(id);
  const orders = await fetchOrders(user.id);
} catch (err) {
  handleError(err);
}
```

### 🟡 SHOULD: Use Promise.all for independent async operations

```typescript
// ❌ Sequential (slow)
const user = await getUser(id);
const orders = await getOrders(id);
const notifications = await getNotifications(id);

// ✅ Parallel (fast)
const [user, orders, notifications] = await Promise.all([
  getUser(id),
  getOrders(id),
  getNotifications(id),
]);
```

---

## 🗒️ Comments

### 🔴 MUST: Comment WHY, never WHAT

```typescript
// ❌ Bad — states the obvious
// Set x to 5
const x = 5;

// ✅ Good — explains WHY
// Retry 3x because OAuth2 tokens can have clock skew up to 30s
const MAX_RETRIES = 3;
```

### 🔴 MUST: No commented-out code — delete it (git has history)

### 🔴 MUST: No TODO without issue reference

```typescript
// ❌ Bad
// TODO: fix this later

// ✅ Good
// TODO(#142): handle edge case when user has no orders
```

---

## 🚫 Dead Code

### 🔴 MUST: Remove dead code immediately

- Unused functions
- Unreachable code paths
- Unused imports
- Commented-out blocks

Git history preserves everything. Dead code is noise.

---

## Enforcement

These rules are checked via:
1. **Code review** — reviewer MUST reject violations of 🔴 rules
2. **Linter** — ESLint/Biome configured to catch common violations
3. **AI agent** — follows these rules when generating code
