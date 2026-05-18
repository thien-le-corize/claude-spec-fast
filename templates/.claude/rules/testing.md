# Testing Standards

> Mandatory testing rules and patterns.

---

## Requirements

| Rule | Threshold |
|------|-----------|
| 🔴 Unit test coverage (lines) | >= 80% |
| 🔴 Branch coverage | >= 75% |
| 🔴 All new features | Must have tests |
| 🔴 All bug fixes | Must have regression test |
| 🔴 Tests pass in CI | Before any merge |
| 🟡 E2E for critical flows | Auth, payment, checkout |

---

## Test Pyramid (ENFORCE this ratio)

```
         ┌─────────┐
         │   E2E   │  5%   Critical user flows ONLY
         ├─────────┤
         │  Integ  │  15%  API + DB interactions
         ├─────────┤
         │  Unit   │  80%  Pure logic, fast, isolated
         └─────────┘
```

---

## Test File Organization

```
tests/
├── unit/
│   ├── services/
│   │   └── user-service.test.ts
│   └── utils/
│       └── format.test.ts
├── integration/
│   ├── routes/
│   │   └── users.test.ts
│   └── repositories/
│       └── user-repo.test.ts
├── e2e/
│   └── auth-flow.test.ts
└── fixtures/
    ├── factories.ts          # Test data factories
    └── seeds.ts              # DB seed for integration tests
```

---

## Naming Convention

### 🔴 MUST: Describe behavior, not implementation

```typescript
// ❌ Bad — describes implementation
it('calls findUnique with correct params')
it('sets isLoading to true')

// ✅ Good — describes behavior
it('should return user when found by email')
it('should throw NOT_FOUND when user does not exist')
it('should show loading spinner while fetching data')
```

### Format: `should [behavior] when [condition]`

```typescript
describe('UserService.create', () => {
  it('should create user with hashed password', async () => { ... });
  it('should throw CONFLICT when email already exists', async () => { ... });
  it('should emit user.created event on success', async () => { ... });
  it('should rollback transaction on failure', async () => { ... });
});
```

---

## TDD Workflow (RED → GREEN → REFACTOR)

```
1. RED    — Write failing test (describes expected behavior)
2. GREEN  — Write MINIMUM code to pass
3. REFACTOR — Improve code while tests stay green
4. REPEAT
```

### Bug Fix Pattern (Prove-It)

```typescript
// 1. Write test that reproduces the bug (MUST FAIL)
it('should not double-count items with same productId — regression #142', () => {
  const items = [
    { productId: 'p1', quantity: 2, price: 100 },
    { productId: 'p1', quantity: 1, price: 100 },
  ];
  expect(calculateTotal(items)).toBe(300); // was returning 600
});

// 2. Verify it fails for the RIGHT reason
// 3. Fix the bug
// 4. Verify test passes
// 5. Run full suite — no regressions
```

---

## Unit Test Pattern

```typescript
describe('calculateDiscount', () => {
  // Use test.each for multiple cases
  it.each([
    { items: [], discount: null, expected: 0, desc: 'empty cart' },
    { items: [{ price: 100, qty: 1 }], discount: null, expected: 100, desc: 'no discount' },
    { items: [{ price: 100, qty: 2 }], discount: { type: 'percent', value: 10 }, expected: 180, desc: '10% off' },
    { items: [{ price: 50, qty: 1 }], discount: { type: 'fixed', value: 100 }, expected: 0, desc: 'discount > total (floor 0)' },
  ])('should return $expected for $desc', ({ items, discount, expected }) => {
    expect(calculateDiscount(items, discount)).toBe(expected);
  });
});
```

---

## Integration Test Pattern

```typescript
describe('POST /api/v1/users', () => {
  it('should create user and return 201', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com', name: 'Test', password: 'SecurePass123!' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: { email: 'new@test.com', name: 'Test' },
    });
    expect(res.body.data.password).toBeUndefined(); // never expose
  });

  it('should return 422 with invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email', name: 'T', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).post('/api/v1/users').send({});
    expect(res.status).toBe(401);
  });

  it('should return 409 when email already exists', async () => {
    // Create first
    await request(app).post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'dup@test.com', name: 'Test', password: 'Pass123!' });

    // Try duplicate
    const res = await request(app).post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'dup@test.com', name: 'Test2', password: 'Pass123!' });

    expect(res.status).toBe(409);
  });
});
```

---

## E2E Test Pattern (Playwright)

```typescript
test.describe('Authentication Flow', () => {
  test('user can register, login, and access dashboard', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.getByLabel('Email').fill('e2e@test.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Account created')).toBeVisible();

    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('e2e@test.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
```

---

## Test Quality Rules

| Rule | Why |
|------|-----|
| 🔴 One assertion concept per test | Clear failure messages |
| 🔴 Tests are independent | No shared mutable state |
| 🔴 No `test.skip` or `.only` in commits | CI must run all tests |
| 🔴 No flaky tests | Fix root cause, don't retry |
| 🔴 Test behavior, not implementation | Refactoring shouldn't break tests |
| 🟡 DAMP over DRY in tests | Readability > reuse |
| 🟡 Use factories for test data | Consistent, maintainable |

---

## What NOT to Test

| Don't Test | Why |
|-----------|-----|
| Third-party libraries | They have their own tests |
| Framework internals | React rendering, Express routing |
| Trivial getters/setters | No logic to verify |
| Private methods directly | Test through public API |
| Implementation details | Tests break on refactor |

---

## Test Commands (package.json)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
});
```
