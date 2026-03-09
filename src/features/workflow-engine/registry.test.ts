import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { loadBuiltinWorkflowAssets } from "./builtin"
import { loadWorkflowRegistry } from "./registry"

describe("workflow registry builtin assets", () => {
  test("loads builtin workflow definitions from shipped yaml assets", () => {
    const registry = loadWorkflowRegistry(join(tmpdir(), `workflow-registry-${randomUUID()}`))
    const greenfield = registry.get("greenfield-fullstack")

    expect(greenfield).toBeDefined()
    expect(greenfield?.source).toBe("builtin")
    expect(greenfield?.path).toContain("src")
    expect(greenfield?.path).toContain("features")
    expect(greenfield?.path).toContain("builtin-workflows")
    expect(greenfield?.path).toContain("greenfield-fullstack.yaml")
    expect(existsSync(greenfield!.path)).toBe(true)

    const rawAsset = readFileSync(greenfield!.path, "utf-8")
    expect(rawAsset).toContain("schema_version:")
    expect(greenfield?.definition.workflow.id).toBe("greenfield-fullstack")
  })

  test("builtin asset loader exposes current shipped workflow files", () => {
    const assets = loadBuiltinWorkflowAssets()
    const ids = assets.map((asset) => asset.id)

    expect(ids).toContain("greenfield-fullstack")
    expect(ids).toContain("brownfield-discovery")
    expect(ids.length).toBeGreaterThan(2)

    const expectedBrownfieldPath = join(
      import.meta.dir,
      "..",
      "builtin-workflows",
      "brownfield-discovery.yaml",
    )
    const brownfield = assets.find(asset => asset.id === "brownfield-discovery")

    expect(brownfield).toBeDefined()
    expect(brownfield?.filePath).toBe(expectedBrownfieldPath)
    expect(brownfield?.content).toContain("workflow:")
  })
})
