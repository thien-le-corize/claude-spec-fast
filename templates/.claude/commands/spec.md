---
name: spec
description: Spec before code — step-by-step interactive PRD creation
---

# /spec — Specification-Driven Development

> "Plan the work, then work the plan."

## Purpose

Create a comprehensive specification document **before** writing any code through a guided, step-by-step conversation.

## CRITICAL RULES

1. **ASK ONE QUESTION AT A TIME** — ONLY ONE. Never combine multiple questions.
2. **WAIT for user response** before asking the next question
3. **Number each step** clearly (Step 1/10, Step 2/10...)
4. **Offer numbered choices** — user just types a number
5. **Allow custom answer** — user can type their own answer instead of picking a number
6. **Keep each question SHORT** — max 5-6 lines including options
7. **Respond in the user's language** (check settings.json → language field)

## Workflow

### Phase 1: Discovery (Step-by-Step, ONE question per message)

---

**Step 1/10 — Tên dự án**
```
Tên dự án/feature là gì?
```
(User tự gõ tên)

---

**Step 2/10 — Loại dự án**
```
Loại dự án?

1. Web app
2. Mobile app
3. API/Backend service
4. CLI tool
5. Library/Package
6. Full-stack (web + API)
```

---

**Step 3/10 — Đối tượng sử dụng**
```
Ai sẽ dùng?

1. Cá nhân (chỉ mình tôi)
2. Team nhỏ (2-10 người)
3. Public app (ai cũng đăng ký được)
4. Enterprise/B2B
```

---

**Step 4/10 — Frontend**
```
Frontend dùng công nghệ gì?

1. Next.js (App Router)
2. Next.js (Pages Router)
3. React + Vite
4. Vue 3
5. Nuxt 3
6. Angular
7. Svelte/SvelteKit
8. Astro
9. Không có frontend (API only)
10. Khác (gõ tên)
```

---

**Step 5/10 — Backend**
```
Backend dùng công nghệ gì?

1. Next.js API Routes
2. Express.js
3. Fastify
4. NestJS
5. Hono
6. tRPC
7. Supabase (BaaS)
8. Firebase
9. Go (Gin/Fiber)
10. Python (FastAPI/Django)
11. Khác (gõ tên)
```

---

**Step 6/10 — Database**
```
Database?

1. PostgreSQL
2. MySQL
3. SQLite
4. MongoDB
5. Supabase (PostgreSQL hosted)
6. PlanetScale (MySQL hosted)
7. Redis (cache only)
8. Không cần DB
9. Khác (gõ tên)
```

---

**Step 7/10 — Authentication**
```
Auth dùng gì?

1. NextAuth.js / Auth.js
2. Clerk
3. Supabase Auth
4. Firebase Auth
5. JWT + bcrypt (tự build)
6. Passport.js
7. Không cần auth
8. Khác (gõ tên)
```

---

**Step 8/10 — Core Features (MVP)**
```
Tính năng chính cho v1? (liệt kê hoặc gõ số)

Gợi ý phổ biến:
1. CRUD cơ bản
2. Authentication (đăng ký/đăng nhập)
3. Dashboard/Admin panel
4. Search & Filter
5. File upload
6. Real-time (WebSocket)
7. Payment integration
8. Email notifications
9. API public
10. Multi-language (i18n)

Hoặc tự gõ: "CRUD tasks, categories, due dates, search"
```

---

**Step 9/10 — Deployment**
```
Deploy ở đâu?

1. Vercel
2. Railway
3. Fly.io
4. AWS (EC2/ECS/Lambda)
5. DigitalOcean
6. Self-hosted (VPS)
7. Chưa quyết định
```

---

**Step 10/10 — Ghi chú thêm**
```
Có yêu cầu đặc biệt nào không?
(Gõ "không" nếu không có)

Ví dụ: "cần SEO tốt", "phải responsive", "cần CI/CD", "monorepo"...
```

---

### Phase 2: Generate Specification

Sau khi có đủ 10 câu trả lời, tạo spec document:

```markdown
# Feature: [Tên từ Step 1]

## Objective
[Mô tả ngắn dựa trên câu trả lời]

## Target Users
[Từ Step 3]

## Tech Stack
- Frontend: [Step 4]
- Backend: [Step 5]
- Database: [Step 6]
- Auth: [Step 7]
- Deploy: [Step 9]

## Core Features (MVP)
1. [Feature] — [Acceptance criteria]
2. [Feature] — [Acceptance criteria]
...

## Out of Scope (v1)
- [Những gì chưa làm]

## Data Models
[Gợi ý dựa trên features]

## API Design
[Gợi ý endpoints]

## Testing Strategy
- Unit: [core logic]
- Integration: [API]
- E2E: [critical flows]
```

### Phase 3: Confirm

```
Đây là spec của bạn. Bạn muốn:

1. Lưu và tiếp tục → /plan
2. Sửa lại phần nào đó
3. Làm lại từ đầu
```

## Output

- Lưu vào `.claude/specs/requirements.md` (spec chung của toàn dự án)
- Gợi ý: "Gõ /plan để phân chia tasks"
