import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import yaml from "js-yaml"
import { WorkflowDefinitionSchema } from "./schema"
import type { LoadedWorkflow, WorkflowDefinition } from "./types"
import { loadBuiltinWorkflowAssets } from "./builtin"
import { loadAllSquads } from "../squad/loader"

function parseWorkflowYaml(content: string): WorkflowDefinition | null {
  try {
    const parsed = yaml.load(content)
    const result = WorkflowDefinitionSchema.safeParse(parsed)
    if (!result.success) {
      return null
    }
    return result.data
  } catch {
    return null
  }
}

function loadBuiltinWorkflows(): LoadedWorkflow[] {
  const loaded: LoadedWorkflow[] = []

  for (const asset of loadBuiltinWorkflowAssets()) {
    const definition = parseWorkflowYaml(asset.content)
    if (!definition) {
      continue
    }
    loaded.push({
      definition,
      source: "builtin",
      path: asset.filePath,
    })
  }

  return loaded
}

function loadProjectWorkflows(projectDir: string): LoadedWorkflow[] {
  const workflowsDir = join(projectDir, ".kord", "workflows")
  if (!existsSync(workflowsDir)) {
    return []
  }

  const loaded: LoadedWorkflow[] = []
  const entries = readdirSync(workflowsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".yaml")) {
      continue
    }
    const filePath = join(workflowsDir, entry.name)
    const content = readFileSync(filePath, "utf-8")
    const definition = parseWorkflowYaml(content)
    if (!definition) {
      continue
    }
    loaded.push({ definition, source: "project", path: filePath })
  }

  return loaded
}

function loadSquadWorkflows(projectDir: string): LoadedWorkflow[] {
  const loaded: LoadedWorkflow[] = []
  const squads = loadAllSquads(projectDir)

  for (const squad of squads.squads) {
    const workflowRefs = squad.manifest.components?.workflows ?? []
    for (const workflowRef of workflowRefs) {
      const filePath = join(squad.basePath, workflowRef)
      if (!existsSync(filePath)) {
        continue
      }

      try {
        const content = readFileSync(filePath, "utf-8")
        const definition = parseWorkflowYaml(content)
        if (!definition) {
          continue
        }

        loaded.push({ definition, source: "squad", path: filePath })
      } catch {
        continue
      }
    }
  }

  return loaded
}

export function loadWorkflowRegistry(projectDir: string): Map<string, LoadedWorkflow> {
  const registry = new Map<string, LoadedWorkflow>()

  for (const workflow of loadBuiltinWorkflows()) {
    registry.set(workflow.definition.workflow.id, workflow)
  }

  for (const workflow of loadSquadWorkflows(projectDir)) {
    // Register canonical workflow id.
    registry.set(workflow.definition.workflow.id, workflow)

    // Register stable namespaced alias for squad workflows.
    const pathParts = workflow.path.split(/[\\/]/)
    const squadsIndex = pathParts.lastIndexOf("squads")
    const squadName = squadsIndex >= 0 ? pathParts[squadsIndex + 1] : undefined
    if (squadName) {
      registry.set(`${squadName}:${workflow.definition.workflow.id}`, workflow)
    }
  }

  for (const workflow of loadProjectWorkflows(projectDir)) {
    registry.set(workflow.definition.workflow.id, workflow)
  }

  return registry
}
