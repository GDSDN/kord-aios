---
name: bootstrap-shadcn-library
description: "Bootstrap Shadcn/Radix Component Library methodology and workflow"
agent: ux-design-expert
subtask: false
---

# Bootstrap Shadcn/Radix Component Library

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

Install and curate a Shadcn UI component library leveraging Tailwind v4, Radix primitives, and project design tokens. Establish shared utilities (`cn`, `cva`), Spinner/loading patterns, and documentation scaffold.

## Prerequisites

- Tailwind v4 configured with tokens (`@theme` + dark mode)
- React/Next.js project with TypeScript
- Node.js ≥ 18
- Storybook (optional but recommended)

## Workflow

1. *Initialize Shadcn CLI**
   ```bash
   npx shadcn@latest init
   ```
   - Configure paths (`components`, `lib/utils.ts`)
   - Enable TypeScript + Tailwind + Radix defaults

2. *Install Core Utilities**
   ```bash
   npx shadcn@latest add button input card textarea badge skeleton spinner
   ```
   - Ensure `cn` helper uses `clsx` + `tailwind-merge`
   - Add `Spinner` component for loading states (if not provided by template)

3. *Map to Tokens**
   - Replace hardcoded colors with semantic token classes (`bg-primary`, etc.)
   - Align spacing/typography with design system scale
   - Add dark mode variants (`dark:bg-background`)

4. *Radix Integration**
   - Install Radix primitives as required (`@radix-ui/react-slot`, etc.)
   - Verify accessibility attributes and focus management remain intact

5. *Variant & Utility Enhancements**
   - Extend `cva` definitions to match project variants (density, destructive, ghost)
   - Add shared loading pattern (Spinner + `isLoading` prop)
   - Introduce compound variants for icon buttons, destructive actions

6. *Documentation & Storybook**
   - Create MDX or markdown docs for each component (`docs/components`)
   - Optional: Add Storybook stories using auto-generated stories from `tasks/build-component`

7. *Update State**
   - Append to `.state.yaml` (`tooling.shadcn`) with components installed, timestamp
   - Record any local overrides or follow-up actions

## Deliverables

- Populated `components/ui/` directory with Shadcn components
- Updated `lib/utils.ts` (`cn`, `formatNumber`, etc. if needed)
- Component documentation & Storybook stories (optional)
- `.state.yaml` entries for `tooling.shadcn`

## Success Criteria

- [ ] Shadcn CLI initialized with Tailwind v4-compatible paths
- [ ] Core components (button/input/card/etc.) installed and tokenized
- [ ] `cn` helper + `class-variance-authority` configured
- [ ] Spinner/loading pattern standardized across components
- [ ] Documentation/Storybook updated with usage examples
- [ ] `.state.yaml` reports bootstrap timestamp and component list

## Error Handling

- *CLI install failure**: Delete partial files, rerun `npx shadcn@latest init`
- *Radix import mismatch**: Align versions with lockfile, reinstall packages
- *Token mismatch**: Regenerate Tailwind classes or add missing semantic tokens
- *Storybook build failure**: Update Storybook to latest (v8+) and re-run

## Notes

- Prefer named exports (`export { Button }`) for tree-shaking
- Maintain parity between Shadcn variants and design token aliases
- Document manual updates (Shadcn is copy/paste — no automatic updates)
- Schedule regular audits to pull upstream improvements intentionally
