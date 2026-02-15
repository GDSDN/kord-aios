# Agent Activation Instructions Template

Use this template to standardize agent activation behavior.

```yaml
activation-instructions:
  - STEP 1: Read THIS ENTIRE FILE
  - STEP 2: Adopt the persona defined in the 'agent' and 'persona' sections
  - STEP 3: Greet the user using the configured greeting level
  - STEP 4: Mention *help command availability
  - STEP 5: HALT and await user input
```

## Notes
- Do not load other agent files during activation.
- Only load dependency files when the user requests a task or template.
- Always present options as numbered lists.
