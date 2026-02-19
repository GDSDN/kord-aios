# Agent Roster Par-a-Par Comparison

**Task:** 1. Agent Roster Par-a-Par Comparison  
**Date:** 2026-02-17  
**Sources:** OMOC (D:\dev\oh-my-opencode\src\agents\), Synkra (D:\dev\synkra-aios\.aios-core\development\agents\), Kord-AIOS (D:\dev\kord-aios\src\agents\)

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| OMOC agents mapped | 11 | ✅ Complete |
| Synkra methodology agents mapped | 9 | ✅ Complete |
| Kord-AIOS total agents | 20+ | ✅ Complete |
| Missing migrations | 0 | ✅ None |
| Unexpected additions | 1 | ⚠️ Plan-Analyzer (Metis split) |
| Mode Changes | 1 | ⚠️ Dev (primary → all) |

---

## OMOC → Kord-AIOS Mapping

| OMOC Agent | Kord-AIOS Agent | Role Match | Model | Mode | Notes |
|------------|-----------------|------------|-------|------|-------|
| Sisyphus | Kord | ✅ Primary orchestrator | claude-opus-4-6 | primary | Renamed per requirement |
| Atlas | Builder (Build) | ✅ Master orchestrator | claude-sonnet-4-5 | primary | Renamed per requirement |
| Prometheus | Plan | ✅ Strategic planner | claude-opus-4-6 | primary | Renamed per requirement |
| Hephaestus | Dev | ✅ Autonomous deep worker | gpt-5.3-codex | **all** ⚠️ | Mode changed from primary to all |
| Oracle | Architect | ✅ Strategic advisor | gpt-5.2 | subagent | Renamed per requirement |
| Librarian | Librarian | ✅ Docs/research | glm-4.7 | subagent | Same name |
| Explore | Explore | ✅ Fast grep | grok-code-fast-1 | subagent | Same name |
| Multimodal-Looker | Vision | ✅ Media analyzer | gemini-3-flash | subagent | Renamed per requirement |
| Metis | Analyst | ✅ Pre-planning analysis | claude-opus-4-6 | subagent | Renamed per requirement |
| Momus | Plan-Reviewer | ✅ Plan validation | gpt-5.2 | subagent | Renamed per requirement |
| Sisyphus-Junior | Dev-Junior | ✅ Category-spawned executor | claude-sonnet-4-5 | subagent | Renamed per requirement |

**Verification:** All 11 OMOC agents successfully mapped to kord-aios equivalents. All renames verified.

---

## Synkra → Kord-AIOS Mapping

| Synkra Agent | Kord-AIOS Agent | Role Match | Mode | Notes |
|--------------|-----------------|------------|------|-------|
| PM | PM | ✅ Project management | subagent | ✅ Present |
| PO | PO | ✅ Product ownership | subagent | ✅ Present |
| SM | SM | ✅ Scrum master | subagent | ✅ Present |
| QA (Quinn) | QA | ✅ Quality assurance | subagent | **Hybrid**: Synkra QA + OMOC Momus pattern |
| DevOps | DevOps | ✅ Infrastructure/CI-CD | subagent | ✅ Present |
| Data Engineer | Data-Engineer | ✅ Data pipeline | subagent | ✅ Present |
| UX Design Expert | UX-Design-Expert | ✅ Frontend/UI | subagent | ✅ Present |
| Analyst (Atlas) | Analyst | ✅ Strategic analysis | subagent | Fused with Metis lineage |
| Squad Creator | Squad-Creator | ✅ Squad creation | subagent | ✅ Present |
| aios-master (Orion)| *(absorbed)* | Framework Orchestrator | — | Absorbed by Kord orchestrator |
| Dev (Dex) | Dev | Full Stack Developer | all | Mapped via OMOC Hephaestus |
| Architect (Aria) | Architect | System Architecture | subagent | Mapped via OMOC Oracle |

**Verification:** All 9 Synkra methodology agents present in kord-aios.

---

## Kord-AIOS Full Agent Roster

### Primary Agents (3)

| Agent | Model | Purpose | Source |
|-------|-------|---------|--------|
| Kord | claude-opus-4-6 | Master orchestrator | OMOC (Sisyphus) |
| Builder (Build) | claude-sonnet-4-5 | Master orchestrator (holds todo) | OMOC (Atlas) |
| Plan | claude-opus-4-6 | Strategic planning | OMOC (Prometheus) |

### Specialist Agents (9)

| Agent | Model | Purpose | Source |
|-------|-------|---------|--------|
| Dev | gpt-5.3-codex | Autonomous deep worker | OMOC (Hephaestus) |
| Architect | gpt-5.2 | Strategic consultation | OMOC (Oracle) |
| Librarian | glm-4.7 | Docs/GitHub search | OMOC (Librarian) |
| Explore | grok-code-fast-1 | Fast contextual grep | OMOC (Explore) |
| Vision | gemini-3-flash | Media analyzer | OMOC (Multimodal-Looker) |
| Analyst | claude-opus-4-6 | Pre-planning analysis | OMOC (Metis) |
| **Plan-Analyzer** | claude-opus-4-6 | Gap analysis | **NEW** (Metis split) |
| Plan-Reviewer | gpt-5.2 | Plan validation | OMOC (Momus) |
| QA | gpt-5.2 | Quality assurance | Hybrid (Synkra + Momus) |

### Subagents (7)

| Agent | Model | Purpose | Source |
|-------|-------|---------|--------|
| Dev-Junior | claude-sonnet-4-5 | Category-spawned executor | OMOC (Sisyphus-Junior) |
| SM | — | Scrum master | Synkra |
| PM | — | Project manager | Synkra |
| PO | — | Product owner | Synkra |
| DevOps | — | Infrastructure | Synkra |
| Data-Engineer | — | Data pipeline | Synkra |
| UX-Design-Expert | — | Frontend design | Synkra |
| Squad-Creator | — | Squad manifest creation | Synkra |

---

## Model Assignments Verification

**CRITICAL FINDING:** `AGENTS.md` is outdated compared to `src/shared/model-requirements.ts`. The table below reflects the **actual code implementation**.

| Agent | Actual Fallback Chain (model-requirements.ts) | AGENTS.md Status |
|-------|-----------------------------------------------|------------------|
| Kord | claude-opus-4-6 → k2p5 → kimi-k2.5-free → glm-4.7 → glm-4.7-free | ⚠️ Stale |
| Dev | (no fallback - required) | ✅ Correct |
| Builder | k2p5 → kimi-k2.5-free → claude-sonnet-4-5 → gpt-5.2 → gemini-3-pro | ⚠️ Stale |
| Architect | gpt-5.2 → gemini-3-pro → claude-opus-4-6 | ⚠️ Stale (says none) |
| Vision | gemini-3-flash → gpt-5.2 → glm-4.6v → k2p5 → ... | ⚠️ Stale (says none) |
| Explore | grok-code-fast-1 → claude-haiku-4-5 → gpt-5-nano | ⚠️ Stale (lists gpt-5-mini) |

---

## Findings & Recommendations

### 🔴 Critical Issues
1. **Dev Agent Mode:** Changed from "primary" (OMOC) to "all" (Kord-AIOS). This is a deliberate enhancement but needs documentation.
2. **Documentation Drift:** `AGENTS.md` does not reflect the complex fallback chains implemented in `model-requirements.ts`.

### 🟡 Notable Changes
1. **Plan-Analyzer:** New agent created by splitting Metis functionality.
2. **QA Agent:** Hybrid design merging Synkra's persona with Momus's plan-review patterns.
3. **Synkra Methodology Agents:** All received new model fallback chains in Kord-AIOS (Synkra used no models).

### ✅ Verified
- All source agents migrated.
- No missing agents.
- Tool restrictions enforced.