export const WORKFLOW_TEMPLATE = `You are executing the Kord workflow runtime command.

## What This Command Does

- Lists registered workflows
- Validates workflow definitions
- Starts or continues workflow runs
- Supports pause/abort/status lifecycle actions
- Scaffolds new workflow + alias command

## Usage

- /workflow list
- /workflow validate <workflow-id>
- /workflow <workflow-id>
- /workflow continue <workflow-id>
- /workflow pause <workflow-id>
- /workflow abort <workflow-id>
- /workflow status
- /workflow create <workflow-id>

## Runtime Contract

The workflow runtime hook reads tags below and executes deterministic workflow actions.
`
