---
name: plan
description: Decompose specs into small, verifiable tasks with dependency ordering
---

# /plan — Planning & Task Breakdown

> "Vertical slices, not horizontal layers."

## Purpose

Transform a specification into an ordered list of small, verifiable tasks. Each task delivers end-to-end functionality.

## CRITICAL RULES

1. **ALL output files MUST be saved inside `.claude/specs/`** — NEVER create a `tasks/` folder at project root
2. **Spec chung (requirements, design, tasks) nằm ở root `.claude/specs/`** — KHÔNG tạo subfolder cho project name
3. **Child specs chỉ tạo khi thực hiện phase** — mỗi phase/module = 1 subfolder
4. **Read the spec from `.claude/specs/requirements.md`** before planning
5. **Ask step-by-step** — don't dump everything at once
6. **Vertical slices** — each task delivers complete functionality (DB + API + UI)

## Prerequisites

- A specification exists in `.claude/specs/` (created by `/spec`)
- Understanding of the codebase structure

## Workflow

### Phase 1: Analysis (Read-Only)

1. **Read the spec** — Check `.claude/specs/` for requirements.md, design.md
2. **Survey the codebase** — Identify relevant files, patterns, and integration points
3. **Map dependencies** — Which components depend on which?

> **Do NOT modify code during planning.**

### Phase 2: Vertical Slicing

Break work into **vertical slices** — each slice delivers complete functionality through all layers:

```
❌ Horizontal (anti-pattern):
   Task 1: Create all DB models
   Task 2: Create all API routes
   Task 3: Create all UI components

✅ Vertical (correct):
   Task 1: User can create a task (DB + API + UI)
   Task 2: User can view task list (DB + API + UI)
   Task 3: User can mark task complete (DB + API + UI)
```

### Phase 3: Task Definition

Each task must include:

```markdown
## Task: [Short description]

**Objective**: [What this achieves]

**Files to modify**:
- `src/models/task.ts`
- `src/routes/tasks.ts`
- `src/components/TaskList.tsx`

**Acceptance Criteria**:
- [ ] User can [action]
- [ ] [Validation] is enforced
- [ ] Test covers [scenario]

**Dependencies**: [Task IDs this depends on]
```

### Phase 4: Ordering

Order tasks by:
1. **Foundation first** — DB models, types, shared utilities
2. **Risk-first** — Tackle uncertain/complex items early
3. **Dependencies** — Respect the dependency graph
4. **Quick wins** — Early momentum with smaller tasks

## Output

**IMPORTANT: Save ALL files inside `.claude/specs/`**

Structure:
```
.claude/specs/
├── requirements.md    ← Spec chung (tổng dự án) — tạo bởi /spec
├── design.md          ← Design chung — tạo bởi /spec
├── tasks.md           ← Task list chung (mỗi task = 1 phase/module)
│
├── auth/              ← Child spec (tạo khi thực hiện phase auth)
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   └── changelog.md
│
└── products/          ← Child spec (tạo khi thực hiện phase products)
    └── ...
```

- `/spec` → tạo `.claude/specs/requirements.md` (spec chung)
- `/plan` → tạo `.claude/specs/tasks.md` (task list chung, mỗi task = 1 phase)
- Khi thực hiện 1 phase → tạo child spec folder `.claude/specs/<phase-name>/`

Format for tasks.md:

```markdown
# Tasks

| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| 1  | Setup project structure | pending | Foundation |
| 2  | User registration (DB + API + UI) | pending | Depends on 1 |
| 3  | User login (DB + API + UI) | pending | Depends on 1 |
| 4  | CRUD tasks (DB + API + UI) | pending | Depends on 2,3 |
| 5  | Categories & filtering | pending | Depends on 4 |
```

## Next Step

After plan is approved, run `/build` to implement tasks incrementally.
