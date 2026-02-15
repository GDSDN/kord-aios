export const HOOK_NAME = "quality-gate"

export const DEFAULT_MAX_ITERATIONS = 2

export const QUALITY_GATE_PROMPT = (qualityGate: string, storyPath: string) => `

---

QUALITY GATE REQUIRED

Delegate review to @${qualityGate} for story:
- ${storyPath}

Expected verdict: APPROVED | NEEDS_WORK | REJECT

---
`
