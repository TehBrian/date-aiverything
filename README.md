# Date Aiverything

Date Aiverything is a full-stack T3 app for a master's-level AI project.

It combines two AI paradigms on purpose:
- Creative generation with an LLM (vision + persona + strict puzzle JSON)
- Deterministic classical AI (constraint checking + recursive backtracking search)

The user uploads an object photo, the app generates a "date this object" puzzle instance, the user builds a conversation chain, and the backend validates and solves it with a real CSP-style search.

## Stack

- Next.js (App Router)
- TypeScript
- tRPC
- Prisma + Neon Postgres
- Tailwind CSS
- OpenAI SDK (provider abstraction; fallback mode supported)

## Features (MVP)

- Image upload endpoint (dev-friendly local storage)
- LLM-powered puzzle generation with strict Zod parsing
- Structured puzzle persistence in Prisma (`Puzzle` model)
- Attempt persistence in Prisma (`Attempt` model)
- Deterministic chain validation with rich per-rule feedback
- Recursive backtracking solver with pruning and diagnostics
- Playful UI with:
  - uploaded image preview
  - object persona intro
  - available action cards
  - ordered chain builder (add/reorder/remove)
  - hard rules panel
  - validation result + woo meter
  - solver diagnostics and optimal chain

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Pull environment variables from Vercel (recommended when Neon is connected):

```bash
vercel env pull .env.development.local
```

Prisma CLI reads `.env` by default. After pulling to `.env.development.local`, sync it for Prisma commands:

```bash
cp .env.development.local .env
```

If you are not using Vercel-managed envs locally, copy `.env.example` to `.env` and set values manually.

3. Generate Prisma client:

```bash
pnpm prisma generate
```

4. Run database migration:

```bash
pnpm prisma migrate dev --name init
```

5. Start dev server:

```bash
pnpm dev
```

6. Open http://localhost:3000

## Environment Variables

Defined in `.env.example` and validated in `src/env.js`.

- `POSTGRES_PRISMA_URL`
  - Prisma client connection string (pooled).
  - Auto-provided by Vercel when Neon integration is connected.
- `POSTGRES_URL_NON_POOLING`
  - Direct Postgres connection string used by Prisma migrations.
  - Auto-provided by Vercel when Neon integration is connected.
- `OPENAI_API_KEY`
  - Optional for MVP.
  - If empty, app uses deterministic fallback puzzle mode.
- `OPENAI_MODEL`
  - OpenAI model name.
  - Default: `gpt-4.1-mini`
- `MAX_UPLOAD_MB`
  - Upload file size ceiling for local upload endpoint.
  - Default: `6`

## Image Upload Design

Current MVP upload flow:

1. Client uploads file to `POST /api/upload`
2. Server validates MIME + size and writes image to `public/uploads`
3. Endpoint returns image URL (e.g. `/uploads/<file>`)
4. Puzzle generation mutation uses that URL for UI persistence
5. For local URLs, backend converts the image into a data URI for model vision input

Why this design:
- Very easy local demo for class
- Cleanly replaceable with cloud storage (UploadThing, Vercel Blob, S3)

## LLM Integration and Safety

Server-side modules:
- `src/server/llm/prompt.ts`: prompt templates
- `src/server/llm/openai-provider.ts`: OpenAI adapter
- `src/server/llm/provider.ts`: provider factory
- `src/server/llm/service.ts`: orchestration + parse/retry/fallback

Safety and robustness:
- Prompt asks for JSON-only output with deterministic constraints
- Response is parsed and validated with Zod (`puzzleDefinitionSchema`)
- Referential checks ensure all IDs/categories in constraints/scoring are valid
- On malformed output or provider failure, service falls back to deterministic canned puzzle

## Puzzle Schema

Core schema lives in `src/server/puzzle/schema.ts`.

Includes:
- object identity/persona text
- card set (8-12 cards)
- chain length (bounded)
- hard constraints (deterministic, code-checkable)
- soft scoring preferences
- difficulty

Supported hard constraints:
- `before`
- `not_adjacent`
- `at_least_one_category`
- `exactly_one_category`
- `max_category_count`
- `not_first`
- `if_then_in_sequence`

## Deterministic Constraint Engine

Files:
- `src/server/puzzle/constraints.ts`
- `src/server/puzzle/validator.ts`
- `src/server/puzzle/scoring.ts`

Design:
- Centralized evaluators by constraint type
- Two evaluation modes:
  - partial prefix checks for pruning
  - full-chain checks for final validity
- Validation returns rich metadata:
  - validity
  - score
  - woo meter
  - satisfied vs violated constraints
  - first failing index
  - duplicate/length/unknown-card issues
  - targeted hint text

## Recursive Backtracking Solver

File: `src/server/puzzle/solver.ts`

The solver is a genuine recursive search over finite state space.

Algorithm (high level):
1. Build chain position by position
2. After each step, run partial-constraint validation
3. If invalid prefix, prune branch immediately
4. At complete length, run full validation
5. Score valid solutions and keep best chain

Diagnostics returned to UI:
- nodes explored
- branches pruned
- total valid solutions
- whether pruning occurred
- best score found

This is the classical AI core of the project.

## tRPC API

Router: `src/server/api/routers/puzzle.ts`

Procedures:
- `generatePuzzleFromImage`
  - Input: image URL
  - Calls LLM service, validates schema, persists puzzle
  - Returns parsed puzzle + provider metadata
- `validateChain`
  - Input: puzzle ID + ordered card IDs
  - Deterministic validation/scoring
  - Persists `Attempt`
- `solvePuzzle`
  - Input: puzzle ID
  - Runs recursive backtracking solver
  - Returns best solution + diagnostics
- `getPuzzle`
  - Input: puzzle ID
  - Returns puzzle + recent attempts

## Data Model

Defined in `prisma/schema.prisma`.

- `Puzzle`
  - persona fields
  - image URL
  - raw LLM response
  - parsed puzzle JSON
  - metadata (difficulty, chain length)
- `Attempt`
  - submitted chain JSON
  - validity/score/woo meter
  - rich feedback JSON
  - relation to puzzle

## Fallback Mode

If `OPENAI_API_KEY` is missing or model parsing fails:
- app still generates a deterministic fallback puzzle
- full validation and backtracking solver remain fully active
- useful for offline/class demos

## Tradeoffs

What this MVP optimizes for:
- clarity of AI architecture for teaching/demo
- deterministic symbolic core
- minimal infrastructure overhead

Known tradeoffs:
- local file storage instead of cloud object storage
- no auth / user accounts
- single-provider initial implementation (OpenAI)
- no advanced explanation trace UI beyond diagnostics counters

## Future Improvements

- Replace local upload with UploadThing or Vercel Blob
- Add provider plugins (Gemini, Anthropic)
- Add richer solver explanation traces (why branches pruned)
- Difficulty templates and curriculum mode
- Puzzle history/gallery and replay analytics
- Optional auth for per-user puzzle tracking

## Development Commands

- `pnpm dev`: run app in development
- `pnpm build`: production build
- `pnpm typecheck`: TypeScript validation
- `pnpm check`: Biome lint/format check
- `pnpm check:write`: auto-fix Biome issues
- `pnpm prisma generate`: generate Prisma client
- `pnpm prisma migrate dev --name <name>`: create/apply migration
