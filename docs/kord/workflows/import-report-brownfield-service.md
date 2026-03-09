# Synkra Import Adaptation Report: brownfield-service

- Source: `D:\dev\synkra-aios\.aios-core\development\workflows\brownfield-service.yaml`
- Imported At: 2026-03-06T18:04:07.096Z

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
- `workflow.sequence[5].condition (step=po-delegate-fixes)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[5].delegates_to (step=po-delegate-fixes)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[9].repeats (step=sm-create-story)`: Preserved in metadata.synkra.source_step for adaptation visibility; runtime execution support is not implemented.
- `workflow.sequence[10].condition (step=pm-review-draft-story)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[13].condition (step=dev-address-qa-feedback)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[14].condition (step=step-15)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.
- `workflow.sequence[15].condition (step=po-epic-retrospective)`: Preserved in metadata.synkra.source_step.condition; current validator/runtime does not execute string condition expressions.

## Handling Notes
- Compatibility warnings captured: Synkra construct 'triggers' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'config' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'pre_flight' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'completion' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'error_handling' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'resume' is preserved for reporting but not executable in current workflow runtime | Synkra construct 'integration' is preserved for reporting but not executable in current workflow runtime | Step 'pm-create-prd' requires 'existing_service_analysis' before it is created or updated
- Importer preserves source notes and dependencies verbatim where schema-compatible.
- Unsupported executable constructs are reported and retained under metadata.synkra instead of dropped.
- Full source workflow object is retained under metadata.synkra.raw_workflow for traceability and auditing.
