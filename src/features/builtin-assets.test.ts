import { describe, expect, test } from "bun:test"
import { listBuiltinAssetFiles, readBuiltinAsset } from "./builtin-assets"

describe("builtin asset loader", () => {
  test("reads builtin instruction content", () => {
    const content = readBuiltinAsset("builtin-instructions", "kord-rules.md")

    expect(content).toContain("Kord AIOS")
  })

  test("lists builtin workflow assets", () => {
    const files = listBuiltinAssetFiles("builtin-workflows", ".yaml")

    expect(files).toContain("greenfield-fullstack.yaml")
    expect(files).toContain("development-cycle.yaml")
  })
})
