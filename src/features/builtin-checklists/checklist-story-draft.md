---
title: "Story Draft Checklist"
type: checklist
status: active
created: "{DATE}"
---

# Story Draft Checklist

Use this checklist before submitting a story for PO validation.

## Structure

- [ ] Title is clear and action-oriented (verb + object)
- [ ] User Story states role, capability, and value (not implementation)
- [ ] Scope is a single deliverable (no hidden sub-stories)
- [ ] Acceptance Criteria are objectively testable (pass/fail)
- [ ] Story includes explicit verification steps (commands or manual steps) tied to AC

## Content

- [ ] Technical Notes include concrete file paths and patterns to follow
- [ ] Dependencies are explicit and actionable (what must exist first)
- [ ] Risks include at least one mitigation (even if "accept risk")
- [ ] "Must NOT" section exists to prevent scope creep

## Quality

- [ ] No ambiguous language ("should", "nice", "as needed") without criteria
- [ ] No placeholders like "TODO" or "TBD" without a follow-up task
- [ ] If behavior changes are risky, rollback plan is described

## Evidence

- [ ] Story references where results will be saved (e.g. \`docs/kord/stories/\`)
- [ ] Verification commands are realistic for this repo (prefer \`bun test\`, \`bun run build\`)
