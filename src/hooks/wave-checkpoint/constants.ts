/**
 * Wave-Checkpoint Constants
 */

/** Default checkpoint mode — auto skips checkpoints, interactive pauses for @po. */
export const DEFAULT_CHECKPOINT_MODE = "auto" as const

/** Template for the checkpoint prompt sent to @po in interactive mode. */
export const CHECKPOINT_PROMPT_TEMPLATE = `## Wave Checkpoint

**Wave {WAVE_NUMBER} Complete**{WAVE_NAME}

### Summary
- **Completed**: {COMPLETED}/{TOTAL} items
{FAILED_LINE}
### Next Wave
{NEXT_WAVE_INFO}

### Total Progress
Wave {WAVE_NUMBER} of {TOTAL_WAVES}

---

**Decide the next action:**
- **GO** — Continue to the next wave
- **PAUSE** — Pause execution; wait for the user to resume
- **REVIEW** — Re-evaluate the plan before continuing
- **ABORT** — Stop execution entirely

What is your decision?`

/** Prompt when all waves are complete. */
export const ALL_WAVES_COMPLETE_TEMPLATE = `## All Waves Complete

**Wave {WAVE_NUMBER} was the final wave.**{WAVE_NAME}

### Summary
- **Completed**: {COMPLETED}/{TOTAL} items
{FAILED_LINE}
### Total Waves: {TOTAL_WAVES} — All done!

The plan has been fully executed. Report final status to the user.`
