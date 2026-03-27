import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  distillAndPersistProjectMemoryEvent,
  distillProjectMemoryEvent,
  scrubSecretLikeContent,
} from "./distill"

const TEST_DIR = join(tmpdir(), `project-memory-distill-${Date.now()}`)

describe("project-memory distillation", () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  test("distills compaction input into typed memory items with metadata", () => {
    //#given
    const event = {
      source: "compaction",
      session_id: "ses_compaction_001",
      decisions: [
        {
          summary: "Use durable repo memory under .kord/memory",
          rationale: "Allows project-shared continuity without transcript replay",
          tags: ["memory", "storage"],
        },
      ],
      remaining_tasks: ["Implement retrieval ranking for memory context injection"],
      supporting_paths: ["docs/kord/plans/project-agent-memory.md"],
      captured_at: "2026-03-26T12:00:00.000Z",
    }

    //#when
    const result = distillProjectMemoryEvent(event, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#then
    expect(result.items.length).toBeGreaterThanOrEqual(2)

    const decision = result.items.find((item) => item.record.class === "decision")
    expect(decision).toBeDefined()
    expect(decision?.record.class).toBe("decision")
    expect(decision?.provenance.source).toBe("compaction")
    expect(decision?.scope.workspace_id).toBe("workspace-a")
    expect(decision?.scope.branch).toBe("feature/project-memory")
    expect(decision?.confidence).toBeGreaterThan(0)
    expect(decision?.freshness).toBeGreaterThan(0)

    const thread = result.items.find((item) => item.record.class === "thread")
    expect(thread).toBeDefined()
  })

  test("scrubs secret-like content before durable write", () => {
    //#given
    const event = {
      source: "session-stop",
      session_id: "ses_stop_001",
      decisions: [
        {
          summary: "Use API token sk-live-12345678901234567890 only via env",
          rationale: "Never store API secrets in config files",
          tags: ["security"],
        },
      ],
      captured_at: "2026-03-26T12:05:00.000Z",
    }

    //#when
    distillAndPersistProjectMemoryEvent(TEST_DIR, event, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#then
    const decisionIndexPath = join(TEST_DIR, ".kord", "memory", "decision-index.json")
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    const decisionPayload = readFileSync(decisionIndexPath, "utf8")
    const timelinePayload = readFileSync(timelinePath, "utf8")

    expect(decisionPayload).not.toContain("sk-live-12345678901234567890")
    expect(timelinePayload).not.toContain("sk-live-12345678901234567890")
    expect(decisionPayload).toContain("[REDACTED_SECRET]")
  })

  test("suppresses duplicate candidates before durable write", () => {
    //#given
    const event = {
      source: "checkpoint",
      session_id: "ses_checkpoint_001",
      decisions: [
        {
          summary: "Prefer typed memory classes over raw transcript dumps",
          rationale: "Typed memory remains bounded and queryable",
          tags: ["memory"],
        },
      ],
      captured_at: "2026-03-26T12:10:00.000Z",
    }

    //#when
    distillAndPersistProjectMemoryEvent(TEST_DIR, event, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })
    distillAndPersistProjectMemoryEvent(TEST_DIR, event, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#then
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    const timelineRaw = readFileSync(timelinePath, "utf8")
    const timeline = JSON.parse(timelineRaw) as {
      data: {
        events: Array<{ record: { class: string; summary: string } }>
      }
    }

    const decisionEvents = timeline.data.events.filter((item) => item.record.class === "decision")
    expect(decisionEvents).toHaveLength(1)
  })

  test("does not promote raw transcript blobs into durable memory", () => {
    //#given
    const transcriptMarker = "TRANSCRIPT_MARKER_DO_NOT_STORE"
    const event = {
      source: "compaction",
      session_id: "ses_compaction_002",
      decisions: [
        {
          summary: "Capture high-signal work state only",
          rationale: "Avoid durable transcript duplication",
          tags: ["memory", "distillation"],
        },
      ],
      raw_transcript: `User: ${transcriptMarker}`,
      captured_at: "2026-03-26T12:15:00.000Z",
    }

    //#when
    distillAndPersistProjectMemoryEvent(TEST_DIR, event, {
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#then
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    const timelinePayload = readFileSync(timelinePath, "utf8")
    expect(timelinePayload).not.toContain(transcriptMarker)
  })

  test("scrubSecretLikeContent masks known credential shapes", () => {
    //#given
    const input = "token=ghp_abcdefghijklmnopqrstuvwxyz123456 and password: hunter2"

    //#when
    const scrubbed = scrubSecretLikeContent(input)

    //#then
    expect(scrubbed).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456")
    expect(scrubbed).not.toContain("hunter2")
    expect(scrubbed).toContain("[REDACTED_SECRET]")
  })
})
