---
name: scan
description: Scan source code and auto-generate rules, design docs based on actual codebase
---

# /scan — Source Code Analysis & Rule Generation

> "Let the code speak for itself."

## Purpose

Scan the project's source code to automatically detect patterns, tech stack, architecture, and generate/update `.claude/rules/` and `.claude/specs/design.md` based on what actually exists in the codebase.

## CRITICAL RULES

1. **Read the entire codebase first** — scan all source files before generating anything
2. **ASK before overwriting** — if rules already exist, ask user to confirm
3. **Be specific** — rules should reference actual files, patterns, and conventions found
4. **Output to `.claude/`** — all generated files go inside `.claude/`

## Workflow

### Step 1: Detect Project Structure

Scan and identify:
```
- package.json → dependencies, scripts, type (module/commonjs)
- tsconfig.json / jsconfig.json → TypeScript config
- Framework config files (next.config, vite.config, etc.)
- Folder structure (src/, app/, pages/, components/, etc.)
- Test files (*.test.*, *.spec.*, __tests__/)
- Styling (tailwind.config, postcss, styled-components)
- Database (prisma/, drizzle/, migrations/)
- Docker, CI/CD configs
```

### Step 2: Analyze Code Patterns

Read source files to detect:
```
- Naming conventions (camelCase, PascalCase, kebab-case for files)
- Import style (relative, aliases, barrel exports)
- Component patterns (functional, hooks, HOC)
- State management (zustand, redux, context)
- API patterns (REST, tRPC, GraphQL)
- Error handling patterns
- Testing patterns (describe/it, test, vitest/jest)
- Code style (semicolons, quotes, indentation)
```

### Step 3: Generate Rules

Create/update these files based on findings:

**`.claude/rules/tech-stack.md`** — Detected technologies
```markdown
# Tech Stack

## Detected
- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.x
- Styling: Tailwind CSS + shadcn/ui
- State: Zustand
- Database: Prisma + PostgreSQL
- Testing: Vitest + Playwright
- Package Manager: pnpm

## Rules
- Use ONLY these technologies
- Do not introduce new dependencies without asking
```

**`.claude/rules/code-style.md`** — Detected conventions
```markdown
# Code Style (auto-detected)

- Indentation: 2 spaces
- Quotes: single
- Semicolons: yes/no
- File naming: kebab-case
- Component naming: PascalCase
- Import order: [detected pattern]
```

**`.claude/rules/project-structure.md`** — Detected architecture
```markdown
# Project Structure (auto-detected)

src/
├── app/          → Next.js App Router pages
├── components/   → Reusable UI components
├── lib/          → Utilities and helpers
├── hooks/        → Custom React hooks
├── services/     → API/business logic
├── types/        → TypeScript types
└── styles/       → Global styles
```

**`.claude/rules/frontend.md`** — Frontend patterns (if applicable)
**`.claude/rules/api-conventions.md`** — API patterns (if applicable)
**`.claude/rules/database.md`** — Database patterns (if applicable)
**`.claude/rules/testing.md`** — Testing patterns (if applicable)

### Step 4: Generate System Design

Create `.claude/specs/design.md`:
```markdown
# System Design (auto-generated from source)

## Architecture
[Detected architecture pattern: monolith, microservices, serverless, etc.]

## Components
[List of major modules/components found]

## Data Flow
[How data moves through the system based on code analysis]

## API Endpoints
[List detected routes/endpoints]

## Database Schema
[If Prisma/Drizzle schema found, document it]
```

### Step 5: Summary & Confirm

Display what was generated:
```
Scan complete! Generated:

  ✓ rules/tech-stack.md      (Next.js, TypeScript, Prisma...)
  ✓ rules/code-style.md      (2 spaces, single quotes, no semi)
  ✓ rules/project-structure.md
  ✓ rules/frontend.md        (React patterns detected)
  ✓ rules/api-conventions.md (REST endpoints found)
  ✓ rules/database.md        (Prisma schema detected)
  ✓ rules/testing.md         (Vitest patterns found)
  ✓ specs/design.md          (System architecture)

Review the generated files and edit as needed.
```

## Options

| Flag | Description |
|------|-------------|
| `--rules-only` | Only generate rules, skip design doc |
| `--design-only` | Only generate system design |
| `--force` | Overwrite existing files without asking |
| `--dry-run` | Show what would be generated without writing |

## Output

All files saved to `.claude/rules/` and `.claude/specs/`

## Next Step

After scan, run `/spec` to create feature specs that follow the detected rules.
