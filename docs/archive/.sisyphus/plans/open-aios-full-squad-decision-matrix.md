# Kord AIOS Full Squad Decision Matrix (Main + Specialists)

Date: 2026-02-08
Goal: Define the complete fusion team (OMOC + AIOS) with direct replacements, absorptions, and role levels.

## 1) Assumptions and Direction

- Assumption: "omomo" in your message refers to `momus`.
- Direct rename policy stays active: no alias compatibility layer.
- `docs/kord-aios/*` is canonical source of truth for story-driven artifacts.
- Prompt style baseline remains OMOC (multi-provider execution quality), with AIOS methodology injected.

## 2) Evidence Anchors Used for This Matrix

- OMOC orchestration and delegation center:
  - `src/agents/sisyphus.ts:165`
  - `src/agents/atlas/default.ts:13`
  - `src/agents/atlas/index.ts:4`
- OMOC specialist capabilities:
  - `src/agents/hephaestus.ts:96` (deep autonomous worker)
  - `src/agents/sisyphus-junior/index.ts:2` (focused executor)
  - `src/agents/oracle.ts:8` (strategic advisor)
  - `src/agents/librarian.ts:7` (external docs/OSS research)
  - `src/agents/explore.ts:7` (internal codebase exploration)
  - `src/agents/metis.ts:8` (pre-planning consultant)
  - `src/agents/momus.ts:9` (plan reviewer)
  - `src/agents/multimodal-looker.ts:7` (media interpreter)
- AIOS framework authority and role model:
  - `.claude/commands/AIOS/agents/aios-master.md:55`
  - `docs/architecture/command-authority-matrix.md:11`
  - `docs/guides/user-guide.md:80`

## 3) Role Levels for Kord AIOS

- **L0 - Framework Governor**: policy, authority matrix, story-state legality
- **L1 - Workflow Orchestrators**: interactive/autonomous execution orchestration
- **L2 - Domain Specialists**: architecture, QA, product, ops, data, UX, analysis
- **L3 - Utility/Execution Specialists**: deep coding, junior coding, research, exploration, multimodal parsing

## 4) Main Agents (Already Decided, Reconfirmed)

| Target Agent | Level | Absorbs | Strongest In | Decision |
|---|---|---|---|---|
| `@kord` | L0 | `aios-master` + governance slice of `sisyphus`/`atlas` | Framework governance, authority matrix, story-state policy | Keep as single governor |
| `@plan` | L1 | `prometheus` (+ metis/momus loop policy) | requirement decomposition and planning | Replace directly |
| `@build` | L1 | `sisyphus` execution orchestration | interactive orchestration + delegation | Replace directly |
| `@build-loop` | L1 | `atlas` | autonomous task-loop orchestration + verification | Replace directly |

## 5) Specialist + Utility Matrix (Full Fusion Team)

| OMOC Agent | Current Strength | AIOS Pair | Who Absorbs Who | Target Name | Level | Migration Action |
|---|---|---|---|---|---|---|
| `hephaestus` | deep autonomous implementation and complex problem solving | `@dev` (complex stories) | AIOS `@dev` absorbs capability as advanced tier | `@dev-senior` | L3 | Replace and optimize prompt |
| `sisyphus-junior` | focused atomic execution, low delegation | `@dev` (simple scoped work) | AIOS `@dev` absorbs capability as basic tier | `@dev-junior` | L3 | Replace and optimize prompt |
| `oracle` | high-IQ architecture/debug consulting | `@architect` (decision support) | `@architect` absorbs Oracle as internal escalation engine | no new public name | L2/L3 bridge | Keep component internal; no new agent persona |
| `metis` | pre-planning ambiguity/risk detection | `@analyst` + `@plan` preflight | `@plan` absorbs Metis protocol internally | no new public name | L1/L3 bridge | Fuse into plan pipeline; no new agent persona |
| `momus` | practical plan review / blocker detection | `@qa` + planning QA | `@qa` and `@kord` absorb Momus as internal gate checker | no new public name | L2/L3 bridge | Keep component internal; no public duplication with QA |
| `librarian` | external docs + OSS evidence search | AIOS research commands + analyst needs | Keep OMOC tool strength and expose with role naming | `@researcher` | L3 | Rename directly from librarian |
| `explore` | internal codebase mapping and pattern discovery | dev/architect/qa all need it | Keep as internal search specialist | `@code-explorer` | L3 | Rename directly from explore |
| `multimodal-looker` | PDF/image/diagram interpretation | QA/UX/Data use cases | Keep as shared utility | `@multimodal-analyst` | L3 | Rename with same constraints |

## 6) What Happens to OMOC Agents Not Directly Replaced

1. `oracle` is **not deleted**; it becomes an internal escalation engine used by `@architect` (read-only).
2. `metis` is **not deleted**; it becomes a mandatory internal preflight stage for `@plan` on ambiguous/high-risk requests.
3. `momus` is **not deleted**; it becomes an internal gate checker used by `@qa` and `@kord`.
4. `librarian` is renamed to `@researcher` and promoted as first-class external knowledge specialist.
5. `explore` is renamed to `@code-explorer` and remains first-class internal discovery specialist.
6. `multimodal-looker` is retained as media interpreter under `@multimodal-analyst`.

## 7) New Agent Needed?

Recommendation: **No brand-new core agent right now**.

Why:
- Existing OMOC specialists already cover missing capability clusters (preflight, review, deep execution, research, exploration, multimodal).
- The gap is contract orchestration, not capability inventory.
- Creating a new core agent now increases prompt and routing complexity before contracts are stable.

Only create a new agent later if one of these appears:
- repeated cross-role overload in Kord,
- measurable routing ambiguity between plan/build-loop,
- clear unmet capability not covered by existing specialists.

## 8) Prompt Refactor Strategy (Specialists)

For every retained/fused OMOC specialist prompt:
- keep OMOC structural style (strict phases, hard blocks, tool discipline, verification bias),
- inject AIOS methodology fields (story-state policy, command authority ownership, gate vocabulary),
- define explicit escalation in/out contracts to avoid role bleed.

Priority order for prompt refactor:
1. `@kord`
2. `@plan`, `@build`, `@build-loop`
3. `@dev-senior`, `@dev-junior`
4. `@researcher`, `@code-explorer`
5. `@multimodal-analyst` plus internal engines (`oracle`, `metis`, `momus`) wired into public roles

## 9) Decision Summary

- You were right to force this: OMOC specialists are too important to drop.
- We do not keep old names; we do direct replacement/rename.
- We do keep most OMOC specialist engines by fusing them into AIOS-first squad contracts.
- `librarian -> @researcher` is approved.
- "omomo" (`momus`) stays as internal engine capability under `@qa/@kord`, not a new public role.
