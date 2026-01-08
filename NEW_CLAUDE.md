# Project Brief
Chrome Extension (Manifest V3): site blocker + extra features (profiles, schedules, focus mode, stats).
Core blocking uses declarativeNetRequest (dynamic rules). UI is popup/options.

# Goals (high level)
- Reliable blocking (DNR) with deterministic rule updates
- Simple, predictable settings model (single source of truth)
- Typed messaging between contexts (UI/content/background)
- Minimal permissions and safe defaults

# Tech stack
- TypeScript everywhere
- Vite multi-entry build (background service worker, content script, popup, options, extension pages)
- React for popup/options UI
- webextension-polyfill for Promise-based extension APIs
- ESLint + Prettier
- Vitest for unit tests

# How to run
- Install deps: `pnpm i` (or `npm i`)
- Dev build/watch: `pnpm dev`
- Prod build: `pnpm build`
- Tests: `pnpm test`
- Lint/format: `pnpm lint` / `pnpm format`
- Output directory: `dist/` (load unpacked in chrome://extensions)

# Repo layout
- src/shared: domain logic, storage abstractions, typed messaging contracts, DNR rule generation
- src/background: service worker; owns applying rules + scheduling
- src/content: in-page logic (overlay / soft block)
- src/popup, src/options: UI only; must call background via messaging or shared storage layer
- src/pages: extension pages (blocked/onboarding) if needed

# Architecture rules (IMPORTANT)
1) Only background modifies DNR rules.
   - UI/content request changes via typed messaging (RPC).
2) Settings are accessed only via shared/storage layer (no raw chrome.storage calls scattered).
3) Domain logic must stay in src/shared/domain and be unit-tested.
4) Avoid adding permissions. If you need a new permission, explain why and alternatives.

# Blocking model
- Hard block: DNR dynamic rules for URL/domain patterns.
- Soft block: content script overlay or redirect to extension blocked page for UX features (timers, "take a break", etc.)
- Always handle DNR limits gracefully (rule cap, update size). Prefer batching + user feedback.

# Messaging contract
- Define message types in `src/shared/messaging/contracts.ts`
- Implement handlers in `src/background/handlers/*`
- UI uses `src/shared/messaging/client.ts` to call background methods
- Keep payloads serializable (no functions, no DOM objects)

# Coding standards
- Prefer pure functions in shared/domain.
- No direct DOM access outside content/popup/options.
- No side effects in React components besides calling services/hooks.
- Errors: use typed Result or throw only at boundaries; log in background (not in UI).

# Do / Don’t
## Do
- Keep rule IDs stable and deterministic
- Validate user input (domains/patterns) before applying
- Write small tests for rule generation and settings migrations
- Prefer minimal changes per PR

## Don’t
- Don’t modify manifest permissions without a clear reason
- Don’t call chrome.declarativeNetRequest from UI/content
- Don’t store large data in storage.sync (use local for stats/logs)
- Don’t introduce heavy dependencies into background/content

# When unsure
- Ask 1–2 clarifying questions OR propose a safe default.
- If choice impacts permissions or blocking behavior, prefer the safer/less intrusive option.