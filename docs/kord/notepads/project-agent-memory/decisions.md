## 2026-03-26

- Added `project_memory` config surface to `OhMyOpenCodeConfigSchema` with explicit sections: `enabled`, `budgets`, `policies`, and `capture`.
- Defined typed memory classes for foundation contracts: `decision`, `constraint`, `preference`, `thread`, `artifact`, `entity`, `gotcha`.
- Chose strict nested memory schemas to keep the config contract explicit and reject unknown toggles/policy keys.
- Replaced `ProjectMemoryConfigSchema` nested `.default({})` calls with fully populated default objects to satisfy strict TypeScript+Zod inference.
- Standardized project memory storage files into durable indexes (`active-context`, `open-threads`, `decision-index`, `entity-index`, `gotchas`, `timeline`) plus gitignored local state (`cache`, workspace/branch metadata).
- Added a dedicated distillation layer (`distill.ts`) that transforms boundary capture events into typed memory records with provenance, confidence/freshness, and workspace/branch scope metadata.
- Chose timeline-first durable dedupe by class-aware content keys so repeated compaction/checkpoint events do not create duplicate durable entries.
- Added `project-memory-capture` hook to capture only high-signal lifecycle boundaries and optionally fall back to existing session-manager history when explicit summary payloads are absent.
- Added `retrieveProjectMemory()` as the staged retrieval entry point: durable timeline read -> local SQLite/FTS query boost -> session history fallback.
- Used deterministic class-priority ranking with explicit order: active thread > constraints/preferences > decisions/gotchas > artifacts > session evidence.
- Enforced retrieval budgets at selection time using item/token caps derived from `project_memory.budgets` plus explicit per-call overrides.
- Added `project-memory` as a first-class `ContextSourceType` so memory context flows through the existing collector/injector pipeline.
- Added `createProjectMemoryContextHook(...)` to retrieve memory at runtime boundaries (`session.created` first turn and `start-work` commands) and register it via collector entries.
- Standardized injected memory preamble as an advisory contract: cited project data only, never higher priority than current system/developer/user instructions.
- Capped runtime retrieval injection with explicit per-turn budgets (`maxItems` bounded to 24 and `maxTokens` derived from config with a 2048 upper bound) before collector registration.
- Added `src/features/project-memory/controls.ts` with explicit operator functions `memory_search`, `memory_forget`, and `memory_rebuild` as the project-scoped administrative control surface.
- Chose timeline-level forget tombstones (`operation: "forget"`, `memory_id`, scoped provenance) so rebuild can enforce durable forget semantics with provenance and avoid silent resurrection.
- Chose rebuild behavior to prune by age (`pruneOlderThanDays`) and fully resync durable indexes from scoped timeline records while leaving foreign workspace/branch events untouched.
