import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  getProjectMemoryStorageLayout,
  initializeProjectMemoryStorage,
} from "./storage"

describe("project-memory storage contract", () => {
  const TEST_DIR = join(tmpdir(), `project-memory-contract-${Date.now()}`)

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  test("uses durable and local roots under .kord/memory", () => {
    //#given
    const workspaceId = "workspace-a"
    const branch = "feature/agent-memory"

    //#when
    const layout = getProjectMemoryStorageLayout(TEST_DIR, { workspaceId, branch })

    //#then
    expect(layout.durableRoot).toBe(join(TEST_DIR, ".kord", "memory"))
    expect(layout.localRoot).toBe(join(TEST_DIR, ".kord", "memory", ".local"))
  })

  test("distinguishes durable files from gitignored local cache files", () => {
    //#given
    const layout = getProjectMemoryStorageLayout(TEST_DIR, {
      workspaceId: "workspace-a",
      branch: "feature/agent-memory",
    })

    //#when
    const durableFiles = layout.files.filter((file) => file.durability === "durable")
    const localFiles = layout.files.filter((file) => file.durability === "local")

    //#then
    expect(durableFiles.length).toBeGreaterThan(0)
    expect(localFiles.length).toBeGreaterThan(0)
    expect(durableFiles.every((file) => file.path.includes(".local") === false)).toBe(true)
    expect(durableFiles.every((file) => file.gitignored === false)).toBe(true)
    expect(localFiles.every((file) => file.path.includes(".local"))).toBe(true)
    expect(localFiles.every((file) => file.gitignored)).toBe(true)
  })

  test("scopes branch metadata by workspace and sanitized branch name", () => {
    //#given
    const layout = getProjectMemoryStorageLayout(TEST_DIR, {
      workspaceId: "workspace-a",
      branch: "feature/agent-memory",
    })

    //#when
    const branchMetadata = layout.files.find((file) => file.key === "branch-metadata")

    //#then
    expect(branchMetadata).toBeDefined()
    expect(branchMetadata?.path).toBe(
      join(
        TEST_DIR,
        ".kord",
        "memory",
        ".local",
        "workspaces",
        "workspace-a",
        "branches",
        "feature-agent-memory.json",
      ),
    )
  })

  test("preserves durable root across branch switches", () => {
    //#given
    const mainLayout = getProjectMemoryStorageLayout(TEST_DIR, {
      workspaceId: "workspace-a",
      branch: "main",
    })
    const featureLayout = getProjectMemoryStorageLayout(TEST_DIR, {
      workspaceId: "workspace-a",
      branch: "feature/agent-memory",
    })

    //#then
    expect(mainLayout.durableRoot).toBe(featureLayout.durableRoot)
    expect(mainLayout.localRoot).toBe(featureLayout.localRoot)
  })

  test("initializes expected durable and local file layout", () => {
    //#given
    const layout = initializeProjectMemoryStorage(TEST_DIR, {
      workspaceId: "workspace-a",
      branch: "feature/agent-memory",
    })

    //#then
    expect(existsSync(layout.durableRoot)).toBe(true)
    expect(existsSync(layout.localRoot)).toBe(true)
    expect(layout.files.every((file) => existsSync(file.path))).toBe(true)
  })
})
