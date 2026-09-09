# AGENTS.md

Instructions for coding agents working in this repository. Human-facing
documentation (setup, commands, screenshots, API) lives in the repo `README.md`.

## Context

Monorepo:

- `backend/` — Node.js + Express 5 + TypeScript + PostgreSQL (CommonJS).
- `frontend/` — React 19 + TypeScript + Vite (ES modules, no semicolons).
- Root `docker-compose.yml` runs the full stack (`db` + `backend` + `frontend`).

## Commands

| What | Backend (`backend/`)        | Frontend (`frontend/`)        |
| ---- | --------------------------- | ----------------------------- |
| Dev  | `npm run dev` (port 3001)   | `npm run dev` (port 5173)     |
| Build | `npm run build` (`tsc`)     | `npm run build` (`tsc -b && vite build`) |
| Test | `npm test` (Vitest, 59)     | `npm test` (Vitest, 19)       |
| Lint | —                           | `npm run lint`                |
| Prod | `npm start` (`dist/index.js`)| —                            |

Root: `docker compose up --build` / `docker compose down`.

## Codebase map

- Backend layers: `src/routes/*.route.ts` → `src/controllers/*.controller.ts`
  (HTTP parsing) → `src/services/*.service.ts` (business logic) →
  `src/repositories/*.repository.ts` (SQL). Typed errors:
  `src/errors/http-errors.ts`.
- Frontend: `src/features/tasks/` (components, `hooks/`, `types/`, `api/`,
  `utils/`), `src/shared/` (`ui/`, `api/client.ts`), `src/pages/`. Data fetching
  lives in custom hooks (`useTask`, `useTaskColumns`, `useTaskMutations`,
  `useGlobalStats`). Labels centralized in `src/features/tasks/types/labels.ts`.
- Tests: `backend/tests/` and `frontend/tests/` (Vitest, no DB/network needed).

## Rules & gotchas

- Express 5 forwards async rejections to the central error handler
  automatically: do NOT add `asyncHandler` wrappers.
- Status is derived from subtasks (single source of truth): a task with
  children ignores direct `status` edits (`deriveStatus`/`stampStatus`).
- Effort rollup only counts leaf tasks; parents show aggregated
  `total_effort`. Do not double-count intermediate nodes.
- Cycle prevention: `parent_id` pointing to the task or a descendant is
  rejected (`assertNoCyclicParent`).
- Titles: backend enforces max 255 + capitalized first letter; the UI truncates
  visually with CSS `text-overflow: ellipsis` — no hard input limits.
- The backend runs an idempotent migration (`src/db/migrate.ts` → `schema.sql`)
  on boot. `backend/Dockerfile` copies `src/db/schema.sql` into `dist/db/`
  because `tsc` does not copy non-TS files.
- Do not add code comments unless asked.

## Workflow

- Always run the affected package's `build` + `test` (and `lint` for frontend)
  before declaring a change done.
- Commits are small and one action each; never commit unless explicitly asked.
  The developer reviews before anything is committed.

## AI usage

Developed with **opencode** (model `opencode/big-pickle`) in a paired
workflow: the agent implements, the developer reviews and validates every
change before commit. Agent config lives in `.opencode/opencode.json`. Code
quality remains the developer's responsibility; every change is visible in
the git history and covered by the automated tests.