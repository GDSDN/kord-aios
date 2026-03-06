# Synkra Import Adaptation Report: spec-pipeline

- Source: `D:\dev\synkra-aios\.aios-core\development\workflows\spec-pipeline.yaml`
- Imported At: 2026-03-06T18:04:07.135Z

## Unchanged Fields
- workflow.id
- workflow.name
- workflow.version
- workflow.type
- workflow.description (metadata.synkra.description)
- workflow.metadata (metadata.synkra.metadata)
- workflow.sequence[].notes
- workflow.sequence[].requires
- workflow.sequence[].creates
- workflow.sequence[].updates

## Kord-Specific Substitutions
- `(none)` -> `schema_version=1`: Kord workflow schema requires explicit schema_version.
- `workflow.metadata / step metadata with Synkra runtime semantics` -> `metadata.synkra preservation blocks`: Keep non-executable runtime constructs visible without silently dropping them.
- `Synkra step shape (phase/meta/step/action/script/template)` -> `Kord sequence step shape (id/intent/requires/creates/updates + metadata.synkra.source_step)`: Map into current Kord runtime model while retaining original step richness.
- `Synkra workflow root object` -> `metadata.synkra.raw_workflow`: Preserve complete source workflow richness for future runtime parity and auditing.

## Unsupported Constructs
- `workflow.triggers`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.config`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.pre_flight`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.completion`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.error_handling`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.resume`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.integration`: Preserved in metadata.synkra for compatibility reporting; runtime execution not implemented yet.
- `workflow.sequence[0].inputs (step=gather)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[0].outputs (step=gather)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[0].on_success (step=gather)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[0].on_failure (step=gather)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[1].inputs (step=assess)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[1].outputs (step=assess)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[1].on_success (step=assess)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[1].on_failure (step=assess)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[2].inputs (step=research)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[2].outputs (step=research)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[2].on_success (step=research)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[2].on_failure (step=research)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[3].inputs (step=spec)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[3].outputs (step=spec)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[3].on_success (step=spec)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[3].on_failure (step=spec)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[4].inputs (step=critique)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[4].outputs (step=critique)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[4].on_verdict (step=critique)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[5].condition (step=revise)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[5].inputs (step=revise)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[5].outputs (step=revise)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[5].on_success (step=revise)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[6].condition (step=critique-2)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[6].inputs (step=critique-2)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[6].outputs (step=critique-2)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[6].on_verdict (step=critique-2)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[7].condition (step=plan)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[7].inputs (step=plan)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[7].outputs (step=plan)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[7].on_success (step=plan)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.

## Handling Notes
- Compatibility warnings captured: Synkra construct 'triggers' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'config' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'pre_flight' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'completion' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'error_handling' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'resume' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'integration' is preserved for reporting but not executable in current workflow runtime
- Importer preserves source notes and dependencies verbatim where schema-compatible.
- Unsupported executable constructs are reported and retained under metadata.synkra instead of dropped.
- Full source workflow object is retained under metadata.synkra.raw_workflow for traceability and auditing.
