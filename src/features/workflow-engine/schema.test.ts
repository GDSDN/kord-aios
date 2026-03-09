import { describe, expect, test } from "bun:test"
import yaml from "js-yaml"
import { WorkflowDefinitionSchema } from "./schema"
import { loadBuiltinWorkflowAssets } from "./builtin"

describe("workflow schema", () => {
  test("accepts all currently supported step intents", () => {
    const intents = [
      "brainstorm",
      "interview",
      "research",
      "agent",
      "parallel",
      "gate",
      "handoff_to_plan",
    ]

    for (const intent of intents) {
      const workflowId = `intent-${intent.replaceAll("_", "-")}`
      const result = WorkflowDefinitionSchema.safeParse({
        schema_version: "1",
        workflow: {
          id: workflowId,
          name: `Intent ${intent}`,
          version: "1.0.0",
        },
        sequence: [
          {
            id: "step-1",
            intent,
          },
        ],
      })

      expect(result.success).toBe(true)
    }
  })

  test("accepts Synkra-compatible rich workflow structure", () => {
    const result = WorkflowDefinitionSchema.safeParse({
      schema_version: "1",
      workflow: {
        id: "synkra-compat-rich",
        name: "Synkra Compat Rich",
        version: "1.0.0",
        type: "development",
      },
      runner_agent: "kord",
      metadata: {
        source: "synkra",
        confirmation_required: true,
        priority: 2,
      },
      inputs: [
        {
          id: "project_type",
          title: "Project type",
          type: "select",
          required: true,
          options: ["greenfield", "brownfield"],
        },
      ],
      resources: [
        {
          id: "existing_readme",
          type: "document",
          path: "README.md",
          required: false,
        },
      ],
      allowlist: {
        tools: ["Read", "Write", "Bash"],
        paths: ["docs/**", "src/**"],
      },
      sequence: [
        {
          id: "discover",
          intent: "interview",
          creates: ["docs/kord/notes/discovery.md"],
        },
        {
          id: "analyze",
          intent: "research",
          requires: [
            "docs/kord/notes/discovery.md",
            { id: "existing_readme", from: "resources", optional: true },
          ],
          creates: [{ id: "docs/kord/analyses/analysis.md" }],
          when: { any_of: ["inputs.project_type"], equals: { "inputs.project_type": "brownfield" } },
        },
        {
          id: "fanout",
          intent: "parallel",
          requires: ["docs/kord/analyses/analysis.md"],
          creates: ["docs/kord/workflows/branches.json"],
          optional: true,
          skip_if: { exists: ["artifacts.skip_parallel"] },
        },
        {
          id: "validate",
          intent: "gate",
          requires: ["docs/kord/workflows/branches.json"],
          confirmation_required: true,
          updates: ["docs/kord/workflows/validation.md"],
        },
        {
          id: "handoff",
          intent: "handoff_to_plan",
          requires: ["docs/kord/workflows/validation.md"],
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  test("accepts nested metadata blocks used by Synkra importer", () => {
    const result = WorkflowDefinitionSchema.safeParse({
      schema_version: "1",
      workflow: {
        id: "imported-synkra-metadata",
        name: "Imported Synkra Metadata",
        version: "1.0.0",
        metadata: {
          synkra: {
            project_types: ["pipeline", "automation"],
            decision_guidance: {
              when_to_use: ["complex projects"],
            },
          },
        },
      },
      metadata: {
        source: "synkra",
        synkra: {
          config: {
            strictGate: true,
            maxRetries: 2,
          },
        },
      },
      sequence: [
        {
          id: "step-1",
          intent: "agent",
          metadata: {
            synkra: {
              source_step: {
                step: "gather",
                script: "return true",
              },
            },
          },
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  test("keeps backward compatibility for workflow.runner_agent", () => {
    const result = WorkflowDefinitionSchema.safeParse({
      schema_version: "1",
      workflow: {
        id: "legacy-runner-agent",
        name: "Legacy Runner Agent",
        version: "1.0.0",
        runner_agent: "kord",
      },
      sequence: [
        {
          id: "kickoff",
          intent: "interview",
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  test("rejects workflow definitions without schema_version", () => {
    const result = WorkflowDefinitionSchema.safeParse({
      workflow: {
        id: "missing-schema-version",
        name: "Missing schema version",
        version: "1.0.0",
      },
      sequence: [
        {
          id: "kickoff",
          intent: "interview",
        },
      ],
    })

    expect(result.success).toBe(false)
  })

  test("accepts every builtin workflow asset", () => {
    const assets = loadBuiltinWorkflowAssets()

    expect(assets).toHaveLength(14)

    for (const asset of assets) {
      const parsed = yaml.load(asset.content)
      const result = WorkflowDefinitionSchema.safeParse(parsed)

      expect(result.success, asset.id).toBe(true)
    }
  })
})
