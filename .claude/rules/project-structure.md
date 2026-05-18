# Project Structure Rules

> Mandatory folder organization and architecture patterns.

---

## Layered Architecture (MANDATORY)

```
Request → Routes → Middleware → Controllers → Services → Repositories → Database
                      ↓
              (auth, validation, rate-limit)
```

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Routes** | URL mapping only | No logic, just wiring |
| **Middleware** | Cross-cutting concerns | Auth, validation, logging, rate-limit |
| **Controllers** | Request/response handling | THIN — max 10 lines, no business logic |
| **Services** | Business logic | THICK — all rules and orchestration here |
| **Repositories** | Data access | Pure CRUD, no business decisions |

---

## Import Direction (STRICT — never violate)

```
┌─────────────────────────────────────────┐
│  app/ (controllers, routes, middleware) │
│         ↓ can import from ↓             │
│  domain/ (services, repositories)       │
│         ↓ can import from ↓             │
│  infrastructure/ (db, cache, queue)     │
│                                         │
│  shared/ ← ALL layers can import       │
└─────────────────────────────────────────┘

❌ domain/ NEVER imports from app/
❌ infrastructure/ NEVER imports from app/
❌ shared/ NEVER imports from other layers
```

---

## Backend Structure

```
src/
├── app/                       # Presentation layer
│   ├── controllers/           # Route handlers (thin)
│   ├── routes/                # Route definitions
│   │   └── v1/               # Versioned routes
│   ├── middlewares/           # Express/Fastify middlewares
│   └── validators/            # Request validation schemas
│
├── domain/                    # Business logic layer
│   ├── services/              # Business logic (thick)
│   ├── repositories/          # Data access abstraction
│   └── events/                # Domain events
│
├── infrastructure/            # External services layer
│   ├── database/              # ORM client, migrations, seeds
│   ├── cache/                 # Cache client + key patterns
│   ├── queue/                 # Queue setup + workers
│   │   ├── queues/
│   │   └── workers/
│   ├── storage/               # File storage (S3, etc.)
│   └── email/                 # Email service + templates
│
├── shared/                    # Cross-cutting concerns
│   ├── configs/               # App config (validated with schema)
│   ├── constants/             # HTTP status, error codes
│   ├── errors/                # AppError + subclasses
│   ├── helpers/               # Hash, JWT, date helpers
│   ├── utils/                 # Pure utility functions
│   └── types/                 # TypeScript types/interfaces
│
├── jobs/                      # Scheduled jobs (cron)
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/              # Test data factories
│
├── app.ts                     # App setup (middleware, routes)
├── server.ts                  # Server entry (listen, graceful shutdown)
└── index.ts                   # Main entry point
```

---

## Frontend Structure

> **Rule**: Every component has its own folder with `index.ts` barrel export.
> Types, hooks, configs, utils, constants, contexts — all in their own top-level folders.
> NEVER nest types/hooks inside component folders.

```
src/
├── app/                       # Framework router (Next.js App Router, etc.)
│   ├── (public)/              # Public route group
│   ├── (auth)/                # Auth route group
│   ├── (dashboard)/           # Protected route group
│   ├── api/                   # API routes (if applicable)
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                # All UI components (each in own folder)
│   ├── ui/                    # Design system primitives
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   └── Button.styles.ts
│   │   ├── Input/
│   │   │   ├── index.ts
│   │   │   ├── Input.tsx
│   │   │   └── Input.styles.ts
│   │   └── Dialog/
│   ├── layout/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Footer/
│   ├── common/
│   │   ├── LoadingSpinner/
│   │   ├── ErrorBoundary/
│   │   └── EmptyState/
│   └── [feature-name]/        # Feature-specific components
│       ├── LoginForm/
│       ├── OrderCard/
│       └── UserAvatar/
│
├── hooks/                     # ALL hooks live here
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useOrderForm.ts
│   ├── useMediaQuery.ts
│   └── index.ts              # barrel export
│
├── types/                     # ALL TypeScript types live here
│   ├── api.types.ts
│   ├── user.types.ts
│   ├── order.types.ts
│   ├── auth.types.ts
│   ├── common.types.ts
│   └── index.ts              # barrel export
│
├── contexts/                  # ALL React contexts live here
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── ToastContext.tsx
│   └── index.ts              # barrel export
│
├── config/                    # App configuration
│   ├── env.ts                 # Environment variables (validated)
│   ├── routes.ts              # Route constants
│   ├── api.ts                 # API base URL, endpoints
│   └── index.ts
│
├── constants/                 # App constants
│   ├── messages.ts            # UI messages, labels
│   ├── validation.ts          # Validation rules
│   ├── routes.ts              # Route paths
│   └── index.ts
│
├── utils/                     # Pure utility functions
│   ├── cn.ts                  # Tailwind class merge helper
│   ├── format.ts              # Date, number, currency formatters
│   ├── validation.ts          # Validation helpers
│   ├── storage.ts             # localStorage/sessionStorage helpers
│   └── index.ts
│
├── services/                  # API calls & business logic (non-UI)
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── order.service.ts
│   └── index.ts
│
├── stores/                    # Global state (Zustand/Jotai/etc.)
│   ├── auth.store.ts
│   ├── cart.store.ts
│   └── index.ts
│
├── assets/                    # Static files
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── styles/                    # Global styles
    └── globals.css
```

### Folder Responsibility (STRICT)

| Folder | Contains | Rule |
|--------|----------|------|
| `components/` | UI components (each in own subfolder) | Only `.tsx` + `.styles.ts` + `index.ts` |
| `hooks/` | ALL custom hooks | Never inside component folders |
| `types/` | ALL TypeScript types/interfaces | Never inside component folders |
| `contexts/` | ALL React contexts | One context per file |
| `config/` | App configuration | Env vars, API config, routes |
| `constants/` | Static values | Messages, validation rules, enums |
| `utils/` | Pure utility functions | No side effects, no state |
| `services/` | API calls | HTTP requests, data transformation |
| `stores/` | Global state | Zustand/Jotai stores |
| `assets/` | Static files | Images, icons, fonts |

### Component Folder Rule

```
// 🔴 MUST: Every component = its own folder + index.ts
// 🔴 MUST: Component folder ONLY contains: index.ts + Component.tsx + Component.styles.ts + test
// 🔴 MUST: Types → types/ folder | Hooks → hooks/ folder | Contexts → contexts/ folder

ComponentName/
├── index.ts                   # export { ComponentName } from './ComponentName'
├── ComponentName.tsx          # Component code (< 150 lines)
├── ComponentName.styles.ts   # Tailwind classes
└── ComponentName.test.tsx    # Tests

// ❌ NEVER inside component folder:
// - types.ts        → goes in src/types/
// - useXxx.ts       → goes in src/hooks/
// - XxxContext.tsx   → goes in src/contexts/
// - constants.ts    → goes in src/constants/
```

---

## File Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| Source files | kebab-case | `user-service.ts` |
| React components | PascalCase | `UserCard.tsx` |
| Test files | `[name].test.ts` | `user-service.test.ts` |
| Config files | kebab-case | `app.config.ts` |
| Type files | kebab-case | `api.types.ts` |
| Constants | kebab-case | `error-codes.ts` |

---

## Environment Files

| File | Purpose | Git |
|------|---------|-----|
| `.env.example` | Template with all vars (no values) | ✅ Committed |
| `.env` | Local development values | ❌ Gitignored |
| `.env.test` | Test environment | ❌ Gitignored |
| `.env.production` | Set in CI/CD only | ❌ Never committed |

---

## Folder Decision Guide

| Question | Backend Folder | Frontend Folder |
|----------|---------------|-----------------|
| Handles HTTP request/response? | `app/controllers/` | — |
| Contains business rules? | `domain/services/` | `services/` |
| Talks to database? | `domain/repositories/` | — |
| Connects to external service? | `infrastructure/` | `api/` |
| Used everywhere? | `shared/` | `lib/` |
| Runs on schedule? | `jobs/` | — |
| Processes async work? | `infrastructure/queue/` | — |
| Reusable UI component? | — | `components/` |
| Feature-specific UI? | — | `features/[name]/components/` |
| Global state? | — | `stores/` |
| Feature state? | — | `features/[name]/stores/` |

---

## Anti-Patterns

### ❌ Flat structure (everything in src/)

```
src/
├── userController.ts
├── userService.ts
├── orderController.ts
├── orderService.ts
├── utils.ts
├── helpers.ts
└── ... 50 more files
```

### ❌ Layer-first without features

```
src/
├── controllers/    # 20 controllers
├── services/       # 20 services
├── repositories/   # 20 repositories
└── ... hard to find related code
```

### ✅ Feature-first with shared layers

```
src/
├── features/auth/       # Everything auth-related together
├── features/orders/     # Everything orders-related together
├── shared/              # Truly shared code
└── infrastructure/      # External services
```
