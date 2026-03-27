import { describe, expect, test } from "bun:test"
import {
  OhMyOpenCodeConfigSchema,
  ProjectMemoryConfigSchema,
} from "../../config/schema"

describe("project-memory config schema contract", () => {
  test("accepts memory settings with enabled, budgets, policies, and capture toggles", () => {
    //#given
    const config = {
      project_memory: {
        enabled: true,
        budgets: {
          durable_records: 1500,
          local_cache_records: 5000,
          durable_bytes: 1_500_000,
          local_cache_bytes: 4_000_000,
        },
        policies: {
          durable_retention: "lru",
          local_cache_retention: "branch",
          conflict_resolution: "new-version",
          workspace_scope: "workspace",
        },
        capture: {
          decision: true,
          constraint: true,
          preference: true,
          thread: true,
          artifact: true,
          entity: true,
          gotcha: true,
          branch_metadata: true,
          workspace_metadata: true,
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.project_memory?.enabled).toBe(true)
      expect(result.data.project_memory?.budgets.durable_records).toBe(1500)
      expect(result.data.project_memory?.policies.workspace_scope).toBe("workspace")
      expect(result.data.project_memory?.capture.gotcha).toBe(true)
    }
  })

  test("applies defaults when project_memory object is provided with no nested overrides", () => {
    //#given
    const input = {}

    //#when
    const result = ProjectMemoryConfigSchema.parse(input)

    //#then
    expect(result.enabled).toBe(false)
    expect(result.budgets.durable_records).toBe(5000)
    expect(result.budgets.local_cache_records).toBe(20000)
    expect(result.policies.local_cache_retention).toBe("branch")
    expect(result.capture.branch_metadata).toBe(true)
  })

  test("rejects non-positive budgets", () => {
    //#given
    const config = {
      project_memory: {
        budgets: {
          durable_records: 0,
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects unknown policy values", () => {
    //#given
    const config = {
      project_memory: {
        policies: {
          durable_retention: "forever",
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })

  test("rejects unknown capture toggles to keep config surface explicit", () => {
    //#given
    const config = {
      project_memory: {
        capture: {
          decision: true,
          unknown_toggle: true,
        },
      },
    }

    //#when
    const result = OhMyOpenCodeConfigSchema.safeParse(config)

    //#then
    expect(result.success).toBe(false)
  })
})
