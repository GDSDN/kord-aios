export const CREATE_WORKFLOW_TEMPLATE = `You are executing the /create-workflow slash command.

## Goal

Route workflow authoring to the existing workflow runtime create path. Do not invent a second creation system.

## Steps

1. Read the provided workflow id from user input.
2. Validate id format quickly (lowercase letters, numbers, dashes only).
3. Execute the existing workflow runtime command path:
   - Use "/workflow create <id>"
   - If your runtime supports it, call the slashcommand tool with:
     - command: workflow
     - user_message: create <id>
4. Return the created file paths and a short next-step hint to run validation.

## Safety

- Reuse existing workflow runtime behavior.
- Do not create duplicate runtime logic.
`
