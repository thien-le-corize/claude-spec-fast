# Frontend Code Rules

> Mandatory rules for frontend development.
> These rules apply when using React/Next.js/Vue with Tailwind CSS and TypeScript.

---

## TypeScript Rules

### 🔴 MUST: Never use `any`

```typescript
// ❌ BAD — any hides bugs
const handleData = (data: any) => { ... }
const response: any = await fetch(url);
function parse(input: any): any { ... }

// ✅ GOOD — use proper types
const handleData = (data: UserResponse) => { ... }
const response: ApiResponse<User> = await fetch(url);
function parse(input: unknown): ParsedResult { ... }

// ✅ If truly unknown, use `unknown` + type guard
function processEvent(event: unknown): void {
  if (isClickEvent(event)) {
    handleClick(event);
  }
}
```

### 🔴 MUST: No `// @ts-ignore` or `// @ts-expect-error` without explanation

```typescript
// ❌ BAD
// @ts-ignore
const value = someLib.brokenMethod();

// ✅ GOOD — with justification
// @ts-expect-error: library v3.2 has incorrect types for this method, fixed in v4.0
const value = someLib.brokenMethod();
```

### 🔴 MUST: Explicit types for component props

```typescript
// ❌ BAD — inferred/implicit
export function Card({ title, children }) { ... }

// ✅ GOOD — explicit interface
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, description, children, className }: CardProps) { ... }
```

---

## Tailwind CSS Rules

### 🔴 MUST: Extract classes to a separate `styles.ts` file

Do NOT write long Tailwind class strings inline in components. Extract them to a co-located `styles.ts` file.

```
// File structure
features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.styles.ts    ← Tailwind classes here
```

```typescript
// ❌ BAD — long class strings inline in component
export function LoginForm() {
  return (
    <form className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Sign in
      </h2>
      <input className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
      <button className="inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        Sign in
      </button>
    </form>
  );
}
```

```typescript
// ✅ GOOD — classes extracted to styles.ts

// LoginForm.styles.ts
export const styles = {
  form: 'flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800',
  title: 'text-2xl font-bold tracking-tight text-gray-900 dark:text-white',
  input: 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
  button: 'inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} as const;

// LoginForm.tsx
import { styles } from './LoginForm.styles';
import { cn } from '@/lib/utils';

export function LoginForm({ className }: { className?: string }) {
  return (
    <form className={cn(styles.form, className)}>
      <h2 className={styles.title}>Sign in</h2>
      <input className={styles.input} />
      <button className={styles.button}>Sign in</button>
    </form>
  );
}
```

### 🔴 MUST: Use `cn()` helper to merge Tailwind classes

Never concatenate class strings manually. Always use `cn()` (clsx + tailwind-merge).

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```typescript
// ❌ BAD — manual concatenation (conflicts not resolved)
<div className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-100'} ${className}`} />

// ❌ BAD — template literal without merge (p-4 and p-2 conflict)
<div className={`p-4 ${className}`} />  // if className has p-2, both apply!

// ✅ GOOD — cn() resolves conflicts correctly
<div className={cn('px-4 py-2', isActive && 'bg-blue-500', !isActive && 'bg-gray-100', className)} />

// ✅ GOOD — cn() with styles object
<div className={cn(styles.container, isActive && styles.active, className)} />
```

### 🟡 SHOULD: Use variants pattern for component styles

```typescript
// Button.styles.ts
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variant: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  },
  size: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  },
} as const;

// Button.tsx
import { buttonStyles } from './Button.styles';
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: keyof typeof buttonStyles.variant;
  size?: keyof typeof buttonStyles.size;
  className?: string;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles.base, buttonStyles.variant[variant], buttonStyles.size[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## Component Rules

### 🔴 MUST: One component per FOLDER (not per file)

Every component gets its own folder with an `index.ts` barrel export. Never put multiple components in the same folder.

```
// ❌ BAD — multiple components in one file
// components/Cards.tsx
export function UserCard() { ... }
export function ProductCard() { ... }
export function OrderCard() { ... }

// ❌ BAD — multiple component files in one flat folder
components/
├── UserCard.tsx
├── ProductCard.tsx
├── OrderCard.tsx
├── UserCard.styles.ts
├── ProductCard.styles.ts
└── OrderCard.styles.ts

// ✅ GOOD — each component has its own folder + index.ts
components/
├── UserCard/
│   ├── index.ts               # export { UserCard } from './UserCard';
│   ├── UserCard.tsx            # Component
│   ├── UserCard.styles.ts     # Tailwind classes
│   └── UserCard.test.tsx      # Tests
├── ProductCard/
│   ├── index.ts
│   ├── ProductCard.tsx
│   ├── ProductCard.styles.ts
│   └── ProductCard.test.tsx
└── OrderCard/
    ├── index.ts
    ├── OrderCard.tsx
    ├── OrderCard.styles.ts
    └── OrderCard.test.tsx
```

### Folder structure for a component

```
ComponentName/
├── index.ts                   # 🔴 MUST — barrel export
├── ComponentName.tsx          # Component code
├── ComponentName.styles.ts   # Tailwind classes
└── ComponentName.test.tsx    # Tests (optional for simple components)
```

> **Note**: Types go in the global `types/` folder. Hooks go in the global `hooks/` folder.
> Do NOT put `types.ts` or `useXxx.ts` inside component folders.

### `index.ts` barrel export pattern

```typescript
// components/UserCard/index.ts
export { UserCard } from './UserCard';
export type { UserCardProps } from './types';

// Usage — clean imports
import { UserCard } from '@/components/UserCard';
```

### 🔴 MUST: Max 150 lines per component file

If a component exceeds 150 lines:
1. Extract sub-components into their own folders
2. Extract logic into custom hooks (`useXxx.ts`)
3. Extract styles into `.styles.ts`

```
// ❌ BAD — 300-line component, everything in one file
// components/OrderForm.tsx (300 lines of JSX + logic + styles)

// ❌ BAD — types and hooks inside component folder
components/OrderForm/
├── types.ts              # ← WRONG: types go in src/types/
└── useOrderForm.ts      # ← WRONG: hooks go in src/hooks/

// ✅ GOOD — flat top-level structure, everything in its place
src/
├── components/
│   ├── OrderForm/
│   │   ├── index.ts
│   │   ├── OrderForm.tsx          # < 150 lines, UI only
│   │   ├── OrderForm.styles.ts
│   │   └── OrderForm.test.tsx
│   ├── OrderItemList/
│   │   ├── index.ts
│   │   ├── OrderItemList.tsx
│   │   └── OrderItemList.styles.ts
│   └── OrderSummary/
│       ├── index.ts
│       ├── OrderSummary.tsx
│       └── OrderSummary.styles.ts
├── hooks/
│   ├── useOrderForm.ts           # Hook lives here (top-level)
│   ├── useOrderList.ts
│   └── index.ts
├── types/
│   ├── order.types.ts            # Types live here (top-level)
│   └── index.ts
├── contexts/
│   ├── OrderContext.tsx           # Context lives here (top-level)
│   └── index.ts
└── constants/
    ├── order.constants.ts         # Constants live here (top-level)
    └── index.ts
```

### 🔴 MUST: Component file structure

```typescript
// ComponentName/ComponentName.tsx

// 1. Imports
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { styles } from './ComponentName.styles';
import type { ComponentNameProps } from '@/types'; // types from types/ folder

// 2. Component
export function ComponentName({ title, className }: ComponentNameProps) {
  // 2a. Hooks (from hooks/ folder)
  const { isOpen, toggle } = useComponentName();

  // 2b. Render
  return (
    <div className={cn(styles.container, className)}>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
}
```

```typescript
// ComponentName/index.ts — ALWAYS required
export { ComponentName } from './ComponentName';
```

### 🔴 MUST: Types in `types/` folder — NOT inside component folder

```typescript
// ❌ BAD — types inside component folder
components/Button/types.ts

// ✅ GOOD — types in top-level types/ folder
src/
├── types/
│   ├── button.types.ts
│   ├── order.types.ts
│   ├── user.types.ts
│   ├── api.types.ts
│   ├── common.types.ts
│   └── index.ts              # barrel export all types
```

### 🔴 MUST: Hooks in `hooks/` folder — NOT inside component folder

```typescript
// ❌ BAD — hook inside component folder
components/OrderForm/useOrderForm.ts

// ✅ GOOD — hooks in top-level hooks/ folder
src/
├── hooks/
│   ├── useAuth.ts
│   ├── useOrderForm.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── index.ts              # barrel export all hooks
```

### 🔴 MUST: Top-level folder structure (flat, not nested in features)

```
src/
├── components/        # ALL components (each in own subfolder)
├── hooks/             # ALL hooks
├── types/             # ALL types
├── contexts/          # ALL React contexts
├── config/            # App configuration
├── constants/         # Static values
├── utils/             # Pure utility functions
├── services/          # API calls
├── stores/            # Global state
├── assets/            # Static files
└── styles/            # Global styles
```

### 🔴 MUST: Always accept `className` prop for customization

```typescript
// ❌ BAD — no way to customize from outside
export function Card({ title }: { title: string }) {
  return <div className="rounded-lg border p-4">{title}</div>;
}

// ✅ GOOD — className prop allows override
export function Card({ title, className }: { title: string; className?: string }) {
  return <div className={cn(styles.card, className)}>{title}</div>;
}
```

---

## State & Logic Rules

### 🔴 MUST: Extract complex logic into custom hooks

```typescript
// ❌ BAD — logic mixed with UI
export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?page=${page}&search=${search}`)
      .then(res => res.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, [page, search]);

  // ... 100 more lines of JSX
}

// ✅ GOOD — logic in hook, component is pure UI
// hooks/useUsers.ts
export function useUsers(params: { page: number; search: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.users.list(params),
  });
}

// UserList.tsx
export function UserList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useUsers({ page, search });

  if (isLoading) return <UserListSkeleton />;
  if (error) return <ErrorState onRetry={() => {}} />;
  if (!data?.length) return <EmptyState />;

  return <ul>{data.map(user => <UserCard key={user.id} user={user} />)}</ul>;
}
```

---

## Import Rules

### 🔴 MUST: Use path aliases (never deep relative paths)

```typescript
// ❌ BAD
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

// ✅ GOOD
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';
```

### 🔴 MUST: Separate type imports

```typescript
// ❌ BAD — mixed
import { UserService, User, CreateUserInput } from '@/domain/services';

// ✅ GOOD — types separated
import { UserService } from '@/domain/services';
import type { User, CreateUserInput } from '@/domain/services';
```

---

## Accessibility Rules

### 🔴 MUST: Semantic HTML

```typescript
// ❌ BAD
<div onClick={handleClick}>Click me</div>
<div className="heading">Title</div>
<span onClick={handleNav}>Go to page</span>

// ✅ GOOD
<button type="button" onClick={handleClick}>Click me</button>
<h2>Title</h2>
<a href="/page" onClick={handleNav}>Go to page</a>
```

### 🔴 MUST: Form inputs have labels

```typescript
// ❌ BAD — no label, placeholder is not a label
<input placeholder="Email" />

// ✅ GOOD
<label htmlFor="email">Email address</label>
<input id="email" type="email" placeholder="you@example.com" />
```

### 🔴 MUST: Interactive elements are keyboard accessible

```typescript
// ❌ BAD — div is not focusable or activatable by keyboard
<div onClick={handleOpen} className="cursor-pointer">Open menu</div>

// ✅ GOOD
<button type="button" onClick={handleOpen}>Open menu</button>
```

---

## Performance Rules

### 🟡 SHOULD: Lazy load heavy components

```typescript
import dynamic from 'next/dynamic';

// Heavy chart library — only load when needed
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### 🟡 SHOULD: Virtualize long lists (> 50 items)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Don't render 1000 DOM nodes — virtualize
```

### 🔴 MUST: No `useMemo`/`useCallback` without measured need

```typescript
// ❌ BAD — premature optimization
const formattedName = useMemo(() => `${first} ${last}`, [first, last]);

// ✅ GOOD — only when profiler shows re-render problem
// or when passing to memoized child component
const expensiveResult = useMemo(() => computeHeavyData(items), [items]);
```

---

## Testing Rules (Playwright + Cucumber)

### 🔴 MUST: Use Playwright with Cucumber (BDD) for E2E tests

```
src/
├── tests/
│   ├── features/              # Cucumber .feature files (Gherkin)
│   │   ├── auth/
│   │   │   ├── login.feature
│   │   │   └── register.feature
│   │   ├── orders/
│   │   │   ├── create-order.feature
│   │   │   └── cancel-order.feature
│   │   └── common/
│   │       └── navigation.feature
│   ├── steps/                 # Step definitions
│   │   ├── auth.steps.ts
│   │   ├── orders.steps.ts
│   │   ├── common.steps.ts
│   │   └── index.ts
│   ├── pages/                 # Page Object Model (POM)
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── OrderPage.ts
│   │   ├── BasePage.ts
│   │   └── index.ts
│   ├── fixtures/              # Test data & fixtures
│   │   ├── users.fixture.ts
│   │   └── orders.fixture.ts
│   ├── support/               # Helpers & hooks
│   │   ├── world.ts           # Cucumber World (shared context)
│   │   ├── hooks.ts           # Before/After hooks
│   │   └── helpers.ts         # Utility functions
│   └── playwright.config.ts   # Playwright config
```

### Feature File (Gherkin syntax)

```gherkin
# tests/features/auth/login.feature
Feature: User Login

  Background:
    Given I am on the login page

  Scenario: Successful login with valid credentials
    When I enter email "user@example.com"
    And I enter password "SecurePass123!"
    And I click the "Sign in" button
    Then I should be redirected to "/dashboard"
    And I should see the heading "Dashboard"

  Scenario: Failed login with invalid password
    When I enter email "user@example.com"
    And I enter password "wrong-password"
    And I click the "Sign in" button
    Then I should see error message "Invalid email or password"
    And I should remain on the login page

  Scenario: Login form validation
    When I click the "Sign in" button without filling the form
    Then I should see error "Email is required"
    And I should see error "Password is required"

  Scenario Outline: Login with various invalid emails
    When I enter email "<email>"
    And I enter password "SecurePass123!"
    And I click the "Sign in" button
    Then I should see error message "Enter a valid email address"

    Examples:
      | email          |
      | not-an-email   |
      | @missing.com   |
      | user@          |
```

### Step Definitions

```typescript
// tests/steps/auth.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import type { CustomWorld } from '../support/world';

Given('I am on the login page', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigate();
});

When('I enter email {string}', async function (this: CustomWorld, email: string) {
  await this.loginPage.fillEmail(email);
});

When('I enter password {string}', async function (this: CustomWorld, password: string) {
  await this.loginPage.fillPassword(password);
});

When('I click the {string} button', async function (this: CustomWorld, buttonName: string) {
  await this.loginPage.clickButton(buttonName);
});

Then('I should be redirected to {string}', async function (this: CustomWorld, path: string) {
  await expect(this.page).toHaveURL(new RegExp(`${path}$`));
});

Then('I should see the heading {string}', async function (this: CustomWorld, heading: string) {
  await expect(this.page.getByRole('heading', { name: heading })).toBeVisible();
});

Then('I should see error message {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.getByText(message)).toBeVisible();
});
```

### Page Object Model (POM)

```typescript
// tests/pages/BasePage.ts
import type { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async clickButton(name: string) {
    await this.page.getByRole('button', { name }).click();
  }

  async getHeading(name: string) {
    return this.page.getByRole('heading', { name });
  }

  async waitForNavigation(url: string) {
    await this.page.waitForURL(url);
  }
}

// tests/pages/LoginPage.ts
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly url = '/login';

  async navigate() {
    await this.page.goto(this.url);
  }

  async fillEmail(email: string) {
    await this.page.getByLabel('Email').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel('Password').fill(password);
  }

  async submit() {
    await this.clickButton('Sign in');
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
```

### Cucumber World (Shared Context)

```typescript
// tests/support/world.ts
import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { Page, Browser, BrowserContext } from '@playwright/test';
import type { LoginPage } from '../pages/LoginPage';

export interface CustomWorld extends World {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  loginPage: LoginPage;
  // Add more page objects as needed
}

setWorldConstructor(class extends World implements CustomWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  loginPage!: LoginPage;
});
```

### Hooks (Before/After)

```typescript
// tests/support/hooks.ts
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, type Browser } from '@playwright/test';
import type { CustomWorld } from './world';

let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch({ headless: true });
});

AfterAll(async function () {
  await browser.close();
});

Before(async function (this: CustomWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld) {
  await this.page.close();
  await this.context.close();
});
```

### 🔴 MUST: Test naming rules

| Rule | Convention |
|------|-----------|
| Feature files | kebab-case: `create-order.feature` |
| Step files | Match feature: `orders.steps.ts` |
| Page objects | PascalCase: `LoginPage.ts` |
| Scenarios | Business language, not technical |
| Steps | Reusable across features |

### 🔴 MUST: Page Object Model for all pages

```typescript
// ❌ BAD — selectors directly in step definitions
When('I login', async function () {
  await this.page.locator('#email-input').fill('user@test.com');
  await this.page.locator('button.submit-btn').click();
});

// ✅ GOOD — Page Object abstracts selectors
When('I login', async function () {
  await this.loginPage.login('user@test.com', 'Pass123!');
});
```

### 🟡 SHOULD: Use data-testid for test selectors

```tsx
// Component
<button data-testid="submit-order" onClick={handleSubmit}>
  Place Order
</button>

// Page Object
async submitOrder() {
  await this.page.getByTestId('submit-order').click();
}
```

### Playwright Config

```typescript
// tests/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
```

### Test Commands

```json
{
  "scripts": {
    "test:e2e": "cucumber-js --require-module ts-node/register tests/**/*.steps.ts",
    "test:e2e:headed": "HEADED=true cucumber-js --require-module ts-node/register tests/**/*.steps.ts",
    "test:e2e:report": "cucumber-js --format html:reports/cucumber.html"
  }
}
```

---

## Summary Checklist

- [ ] No `any` in TypeScript
- [ ] Tailwind classes in separate `.styles.ts` files
- [ ] `cn()` used for all class merging
- [ ] One component per folder with `index.ts`
- [ ] Max 150 lines per component
- [ ] `className` prop on all components
- [ ] Hooks in `hooks/` folder (not in component folder)
- [ ] Types in `types/` folder (not in component folder)
- [ ] Contexts in `contexts/` folder
- [ ] Semantic HTML for interactive elements
- [ ] Form inputs have labels
- [ ] Path aliases for imports
- [ ] Type imports separated
- [ ] E2E tests use Playwright + Cucumber (BDD)
- [ ] Page Object Model for all pages
- [ ] Feature files written in Gherkin (business language)
- [ ] Step definitions are reusable
