---
name: export-design-tokens-dtcg
description: "Export Design Tokens to W3C DTCG methodology and workflow"
agent: ux-design-expert
subtask: false
---

# Export Design Tokens to W3C DTCG

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Autonomous decision making with logging
- Minimal user interaction
- *Best for:** Simple, deterministic tasks

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**

- Explicit decision checkpoints
- Educational explanations
- *Best for:** Learning, complex decisions

### 3. Pre-Flight Planning - Comprehensive Upfront Planning

- Task analysis phase (identify all ambiguities)
- Zero ambiguity execution
- *Best for:** Ambiguous requirements, critical work

*Parameter:** `mode` (optional, default: `interactive`)

---

## Acceptance Criteria

*Purpose:** Definitive pass/fail criteria for task completion

*Checklist:**

```yaml
acceptance-criteria:
  - [ ] Task completed as expected; side effects documented
    type: acceptance-criterion
    blocker: true
    validation: |
      Assert task completed as expected; side effects documented
    error_message: "Acceptance criterion not met: Task completed as expected; side effects documented"
```

---

## Error Handling

*Strategy:** retry

*Common Errors:**

1. *Error:** Task Not Found
   - *Cause:** Specified task not registered in system
   - *Resolution:** Verify task name and registration
   - *Recovery:** List available tasks, suggest similar

2. *Error:** Invalid Parameters
   - *Cause:** Task parameters do not match expected schema
   - *Resolution:** Validate parameters against task definition
   - *Recovery:** Provide parameter template, reject execution

3. *Error:** Execution Timeout
   - *Cause:** Task exceeds maximum execution time
   - *Resolution:** Optimize task or increase timeout
   - *Recovery:** Kill task, cleanup resources, log state

---

## Description

Produce W3C Design Tokens (DTCG v2025.10) exports from the canonical YAML tokens file. Validates schema compliance, OKLCH color usage, and publishes artifacts for downstream platforms (web, iOS, Android, Flutter).

## Prerequisites

- tokens.yaml generated via tokenize (core/semantic/component layers present)
- Node.js ≥ 18 / Python ≥ 3.10 (for validation tools)
- DTCG CLI or schema validator installed (`npm install -g @designtokens/cli` recommended)

## Workflow

1. *Load Source Tokens**
   - Read `tokens.yaml` and confirm metadata (dtcg_spec, color_space)
   - Ensure layers exist: `core`, `semantic`, `component`
   - Verify coverage >95% stored in `.state.yaml`

2. *Generate DTCG JSON**
   - Transform YAML into DTCG JSON structure
   - Ensure each token includes `$type`, `$value`, optional `$description`
   - Map references using `{layers.semantic.color.primary}` style
   - Save as `tokens.dtcg.json`

3. *Produce Platform Bundles (Optional)**
   - Run Style Dictionary / custom scripts for platform-specific outputs
   - Targets: web (CSS), Android (XML), iOS (Swift), Flutter (Dart)
   - Store under `tokens/exports/{platform}/`

4. *Validate**
   - `dtcg validate tokens.dtcg.json`
   - Lint OKLCH values (ensure `oklch()` format, fallback to hex flagged)
   - Confirm references resolve (no missing paths)

5. *Document & Publish**
   - Update `docs/tokens/README.md` with export details, version, changelog
   - Attach validator output and coverage metrics
   - Update `.state.yaml` (tokens.dtcg path, validator status, timestamp)

## Output

- `tokens.dtcg.json` (W3C compliant)
- Optional platform bundles (CSS, Android XML, Swift, Flutter)
- Validation report (`tokens/validation/dtcg-report.json`)
- Updated `.state.yaml` tokens section

## Success Criteria

- [ ] tokens.dtcg.json passes W3C validator with zero errors
- [ ] OKLCH color space used; fallbacks documented
- [ ] References (`$value`) resolve across layers
- [ ] Platform exports updated (if enabled) and smoke-tested
- [ ] Documentation + changelog refreshed with version/date
- [ ] `.state.yaml` reflects dtcg export path and status

## Error Handling

- *Invalid schema**: Capture validator output, fix offending tokens, rerun export
- *Missing reference**: Trace YAML source, ensure token exists or adjust alias
- *Unsupported color format**: Convert to OKLCH or fallback with explanation
- *Platform export failure**: Roll back platform-specific step, flag follow-up action

## Notes

- Keep token versions semantically versioned (e.g., 1.1.0 for new tokens)
- Coordinate with platform teams before breaking changes (e.g., renaming tokens)
- Store validation reports alongside artifacts for audit/compliance
