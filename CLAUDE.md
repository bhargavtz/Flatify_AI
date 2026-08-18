# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server, Turbopack, port 3000
npm run build        # production build
npm run start        # serve the production build
npm run lint         # next lint
npm run typecheck    # tsc --noEmit
npm run genkit:dev   # Genkit dev UI over src/ai/dev.ts
npm run genkit:watch # same, with reload on change
```

**There is no test framework in this project** — no test script, no jest/vitest/playwright dependency, and no `*.test.*` / `*.spec.*` files. `npm run typecheck` and `npm run lint` are the only automated checks. Don't claim tests pass, and don't add a test runner unless asked.

Prisma has no migration workflow wired up: `prisma/schema.prisma` exists, but there is no `migrations/` directory, no `prisma generate` postinstall, and no db script in `package.json`. Run `npx prisma` commands directly if you need them.

## Architecture

### The data layer is mid-migration — MongoDB is live, Postgres is not

This is the single most important thing to understand before touching data code.

- **MongoDB is the real database.** Everything user-facing reads and writes through `clientPromise` from `src/lib/mongodb.ts` (native driver) — the generation routes, `src/lib/social.ts`, and `src/lib/settings.ts`. `src/lib/mongoose.ts` is a second, separate Mongoose connector used by `src/models/User.ts`.
- **Prisma/Postgres is a beachhead.** `prisma/schema.prisma` defines a full relational schema (User, Project, Generation, CreditTransaction, Subscription, PromptHistory) and `src/lib/db.ts` exports the client, but exactly one file imports it: `src/app/api/webhooks/user-created/route.ts`. `scripts/migrate-mongo-to-postgres.ts` migrates users only.
- **Firebase is dead weight.** `firebase` and `@tanstack-query-firebase` are in `package.json` with zero imports under `src/`.
- The README describes MongoDB only and predates Prisma and Supabase. Trust the code over the README.

When adding a feature, follow the Mongo path unless the task is explicitly about the Postgres migration.

### Two overlapping domain models with different user-key conventions

Legacy logo-generation collections and the newer "Studio" social layer coexist in the same Mongo database and **key users differently**:

| Layer | Collections | User field |
| --- | --- | --- |
| Legacy generation | `novice_generations`, `professional_generations`, `image_editor_generations`, prompt history | `userId` |
| Studio social/billing | `studio_works`, `studio_profiles`, `studio_likes`, `studio_comments`, `studio_jobs`, `studio_keys`, `studio_accounts` | `clerkId` |

Both hold the same Clerk user ID. Querying with the wrong field name silently returns nothing rather than erroring — check which layer you're in before writing a filter.

### Server modules degrade instead of throwing

`src/lib/social.ts` and `src/lib/settings.ts` each wrap their DB handle in a helper that catches connection failures and returns `null`, then fall back to seed data from `src/lib/explore-seed.ts` or to hardcoded defaults. The app renders a populated Explore page with no database at all. Preserve the `if (!db) return <fallback>` shape when extending these modules — removing it turns a degraded page into a crash.

Both modules also return `{ error: string }` for expected failures rather than throwing, and each exports its own `isError` type guard. Match that convention in the module you're editing.

### API route security is centralized, and the rate limiter is per-instance

Every mutating route follows the same two-step opening from `src/lib/auth-api.ts`:

```ts
const session = await requireUser()
if (session.error) return session.error
const blocked = guardMutating(request, `gen:${session.userId}`, 12)
if (blocked) return blocked
```

`guardMutating` = same-origin check + rate limit. Genkit flows call `requireSignedIn()` instead, which rate-limits as a side effect.

Be aware: `rateLimit` is backed by a module-level `Map`, so limits are per-process — they reset on cold start and are not shared across serverless instances. Treat it as abuse-dampening, not as an enforcement boundary.

### Adding an authenticated page requires editing middleware

`src/middleware.ts` protects an explicit `createRouteMatcher` list (`/settings`, `/dashboard`, `/generate`, `/help`, `/profile`). Living under `src/app/(app)/` does **not** protect a route — the route group is a layout concern only. Add new authed paths to `isProtected`.

### Genkit AI flows

`src/ai/genkit.ts` sets a default model of `googleai/gemini-2.0-flash`, but **image generation must override it** to `googleai/gemini-2.0-flash-exp` and pass `config: { responseModalities: ['TEXT', 'IMAGE'] }`. Both are required; `IMAGE` alone returns nothing. See `src/ai/flows/generate-initial-logo.ts` for the working shape.

Flows are `'use server'` and enforce their own auth. New flows must be imported in `src/ai/dev.ts` to appear in the Genkit dev UI — note that `generate-suggestions.ts` is currently *not* registered there.

Generated images travel as base64 data URIs, not files. `MAX_DATA_URI_CHARS` in `src/lib/auth-api.ts` caps what routes will accept; `src/lib/storage.ts` caps what gets stored, at a much smaller limit.

### Three separate host allowlists

Adding an external image host, font, or API means updating each of these independently:

1. `next.config.ts` — hand-written CSP directives in `securityHeaders`
2. `next.config.ts` — `images.remotePatterns`, required for `next/image`
3. `src/lib/storage.ts` — `isSafeMediaUrl`, the runtime allowlist for user-supplied media URLs

Missing any one produces a different, confusing failure.

### User-supplied API keys are encrypted at rest

`src/lib/secret.ts` does AES-256-GCM with a scrypt-derived key. `src/lib/settings.ts` persists only the ciphertext plus `last4`; plaintext is returned solely by `getActiveUserKey` at generation time. The encryption key comes from `SETTINGS_SECRET`, which **throws in production if unset** and silently falls back to `CLERK_SECRET_KEY`, then to a hardcoded dev string, otherwise. Changing that fallback order invalidates every stored key.

### Local skills are gitignored

`.agents/skills/` holds project skills (`nextjs-best-practices`, `clerk-auth`, `shadcn`, `security-auditor`, `ux-psychology`, and others) but `.agents/` is in `.gitignore`, so they exist only on this machine. Don't assume a teammate or CI has them.

## Working agreements

Aligned with Anthropic's current guidance for Claude Opus 5 — keep these rather than adding verification or double-check instructions, which cause over-verification on this model.

Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested.

Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate.

Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer "what happened" or "what did you find," with supporting detail after it for readers who want it.

Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked.

Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work. If one subagent can complete the task, use one rather than several, and keep spawn counts low.

Never speculate about code you have not opened. If the user references a specific file, read the file before answering.
