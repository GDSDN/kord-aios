/**
 * EPIC-08 S04: Agent Authority E2E Test
 *
 * Validates that the agent-authority hook correctly enforces
 * file write permissions and git command restrictions across all agents.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createAgentAuthorityHook } from "../../src/hooks/agent-authority"
import { setSessionAgent, clearSessionAgent } from "../../src/features/claude-code-session-state"

function makeTmpDir(): string {
  const dir = join(tmpdir(), `e2e-authority-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

function makeCtx(directory: string) {
  return { directory } as any
}

const SESSION_ID = "e2e-session-authority"

describe("EPIC-08 S04: Agent Authority E2E", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
  })

  afterEach(() => {
    clearSessionAgent(SESSION_ID)
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  //#region Write Permission Enforcement

  describe("write permission enforcement", () => {
    //#given agent-authority hook with default allowlist
    //#when agents attempt file writes

    test("@dev writes to src/ → ALLOWED", async () => {
      //#then no error thrown
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c1" },
          { args: { filePath: join(tmpDir, "src/index.ts") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@pm writes to src/ → BLOCKED", async () => {
      //#then error thrown with agent name and path
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c2" },
          { args: { filePath: join(tmpDir, "src/index.ts") } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("@dev writes to docs/kord/stories/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c3" },
          { args: { filePath: join(tmpDir, "docs/kord/stories/1.1.story.md") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@architect writes to docs/kord/architecture/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "architect")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c4" },
          { args: { filePath: join(tmpDir, "docs/kord/architecture/decisions.md") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@architect writes to src/ → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "architect")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c5" },
          { args: { filePath: join(tmpDir, "src/main.ts") } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("@qa writes to docs/kord/stories/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "qa")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c6" },
          { args: { filePath: join(tmpDir, "docs/kord/stories/1.1.story.md") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@qa writes to src/ → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "qa")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c7" },
          { args: { filePath: join(tmpDir, "src/main.ts") } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("@sm writes to docs/kord/stories/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "sm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c8" },
          { args: { filePath: join(tmpDir, "docs/kord/stories/1.2.story.md") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@sm writes to src/ → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "sm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c9" },
          { args: { filePath: join(tmpDir, "src/main.ts") } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("@data-engineer writes to migrations/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "data-engineer")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c10" },
          { args: { filePath: join(tmpDir, "supabase/migrations/001_init.sql") } }
        )
      ).resolves.toBeUndefined()
    })

    test("@devops writes to .github/ → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "devops")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "c11" },
          { args: { filePath: join(tmpDir, ".github/workflows/ci.yml") } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Git Command Restrictions

  describe("git command restrictions", () => {
    //#given agent-authority hook
    //#when non-devops agents attempt git push/merge/rebase

    test("@dev runs git push → BLOCKED", async () => {
      //#then error thrown
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "bash", sessionID: SESSION_ID, callID: "g1" },
          { args: { command: "git push origin main" } }
        )
      ).rejects.toThrow(/cannot run git push/)
    })

    test("@devops runs git push → ALLOWED", async () => {
      //#then no error thrown
      setSessionAgent(SESSION_ID, "devops")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "bash", sessionID: SESSION_ID, callID: "g2" },
          { args: { command: "git push origin main" } }
        )
      ).resolves.toBeUndefined()
    })

    test("@dev runs git merge → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "bash", sessionID: SESSION_ID, callID: "g3" },
          { args: { command: "git merge feature-branch" } }
        )
      ).rejects.toThrow(/cannot run git push/)
    })

    test("@dev runs git rebase → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "bash", sessionID: SESSION_ID, callID: "g4" },
          { args: { command: "git rebase main" } }
        )
      ).rejects.toThrow(/cannot run git push/)
    })

    test("@dev runs gh pr create → BLOCKED", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "bash", sessionID: SESSION_ID, callID: "g5" },
          { args: { command: "gh pr create --title 'feat'" } }
        )
      ).rejects.toThrow(/cannot run git push/)
    })

    test("@dev runs safe git commands → ALLOWED", async () => {
      setSessionAgent(SESSION_ID, "dev")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      // git status, git diff, git log — all safe
      for (const cmd of ["git status", "git diff", "git log -5"]) {
        await expect(
          handler(
            { tool: "bash", sessionID: SESSION_ID, callID: `gs-${cmd}` },
            { args: { command: cmd } }
          )
        ).resolves.toBeUndefined()
      }
    })
  })

  //#endregion

  //#region Config Allowlist Override

  describe("config allowlist override", () => {
    //#given custom config extending default allowlist
    //#when agent writes to newly allowed path

    test("custom allowlist grants @pm write to src/ → ALLOWED", async () => {
      //#then no error thrown
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir), {
        allowlist: { pm: ["src/**"] },
      })
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "o1" },
          { args: { filePath: join(tmpDir, "src/custom.ts") } }
        )
      ).resolves.toBeUndefined()
    })

    test("custom allowlist extends but does not replace defaults", async () => {
      //#then pm can write to both default and custom paths
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir), {
        allowlist: { pm: ["src/**"] },
      })
      const handler = hook["tool.execute.before"]

      // Default pm allowlist includes docs/kord/plans/**
      await expect(
        handler(
          { tool: "write", sessionID: SESSION_ID, callID: "o2" },
          { args: { filePath: join(tmpDir, "docs/kord/plans/sprint-1.md") } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Unknown Agent Behavior

  describe("unknown agent fallback", () => {
    test("unknown session (no agent) → writes are ALLOWED (no enforcement)", async () => {
      //#given no agent set for session
      //#when write is attempted
      //#then no error (hook skips enforcement when agent unknown)
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "write", sessionID: "unknown-session", callID: "u1" },
          { args: { filePath: join(tmpDir, "src/anything.ts") } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion

  //#region Tool Name Variants

  describe("tool name variants", () => {
    test("edit_file tool is also subject to write permission", async () => {
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "edit_file", sessionID: SESSION_ID, callID: "t1" },
          { args: { filePath: join(tmpDir, "src/main.ts") } }
        )
      ).rejects.toThrow(/does not have write permission/)
    })

    test("read tools are NOT subject to write permission", async () => {
      setSessionAgent(SESSION_ID, "pm")
      const hook = createAgentAuthorityHook(makeCtx(tmpDir))
      const handler = hook["tool.execute.before"]

      await expect(
        handler(
          { tool: "read_file", sessionID: SESSION_ID, callID: "t2" },
          { args: { filePath: join(tmpDir, "src/main.ts") } }
        )
      ).resolves.toBeUndefined()
    })
  })

  //#endregion
})
