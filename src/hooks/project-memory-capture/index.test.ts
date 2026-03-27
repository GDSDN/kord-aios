import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createProjectMemoryCaptureHook } from "./index"

const TEST_DIR = join(tmpdir(), `project-memory-capture-${Date.now()}`)

describe("project-memory-capture hook", () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  test("captures compaction summary into memory candidate", async () => {
    //#given
    const hook = createProjectMemoryCaptureHook({
      directory: TEST_DIR,
      client: {},
    } as never, {
      enabled: true,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })
    const transcriptMarker = "TRANSCRIPT_DO_NOT_PERSIST"

    //#when
    await hook["experimental.session.compacting"](
      {
        sessionID: "ses_compaction_hook_001",
        summary: {
          decisions: [
            {
              summary: "Adopt capture -> distill -> durable memory pipeline",
              rationale: "Keeps continuity while avoiding transcript replay",
              tags: ["memory", "architecture"],
            },
          ],
          remaining_tasks: ["Implement retrieval ranking"],
          raw_transcript: transcriptMarker,
          supporting_paths: ["docs/kord/plans/project-agent-memory.md"],
        },
      },
      { context: [] },
    )

    //#then
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    const timelineRaw = readFileSync(timelinePath, "utf8")
    const timeline = JSON.parse(timelineRaw) as {
      data: {
        events: Array<{
          record: { class: string; created_at: string }
          provenance: { source: string }
        }>
      }
    }

    expect(timeline.data.events.length).toBeGreaterThan(0)
    expect(
      timeline.data.events.some((entry) =>
        (entry.record.class === "decision" || entry.record.class === "thread")
        && entry.provenance.source === "compaction"
        && entry.record.created_at.length > 0,
      ),
    ).toBe(true)
    expect(timelineRaw).not.toContain(transcriptMarker)
  })

  test("captures session.stop boundary into thread memory", async () => {
    //#given
    const hook = createProjectMemoryCaptureHook({
      directory: TEST_DIR,
      client: {},
    } as never, {
      enabled: true,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#when
    await hook.event({
      event: {
        type: "session.stop",
        properties: {
          info: { id: "ses_stop_hook_001" },
          summary: {
            remaining_tasks: [
              "Wire memory retrieval into context injector",
            ],
          },
        },
      },
    })

    //#then
    const openThreadsPath = join(TEST_DIR, ".kord", "memory", "open-threads.json")
    const openThreadsRaw = readFileSync(openThreadsPath, "utf8")
    const openThreads = JSON.parse(openThreadsRaw) as {
      data: {
        threads: Array<{ class: string; thread_id: string }>
      }
    }

    expect(openThreads.data.threads.some((thread) => thread.class === "thread")).toBe(true)
  })

  test("ignores non-boundary lifecycle events", async () => {
    //#given
    const hook = createProjectMemoryCaptureHook({
      directory: TEST_DIR,
      client: {},
    } as never, {
      enabled: true,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })

    //#when
    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          summary: {
            decisions: [
              {
                summary: "This should not be captured",
                rationale: "Not a boundary event",
              },
            ],
          },
        },
      },
    })

    //#then
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    if (existsSync(timelinePath)) {
      const timelineRaw = readFileSync(timelinePath, "utf8")
      const timeline = JSON.parse(timelineRaw) as { data: { events: unknown[] } }
      expect(timeline.data.events).toHaveLength(0)
    } else {
      expect(existsSync(timelinePath)).toBe(false)
    }
  })

  test("suppresses duplicates across repeated compaction boundaries", async () => {
    //#given
    const hook = createProjectMemoryCaptureHook({
      directory: TEST_DIR,
      client: {},
    } as never, {
      enabled: true,
      workspaceId: "workspace-a",
      branch: "feature/project-memory",
    })
    const input = {
      sessionID: "ses_compaction_hook_002",
      summary: {
        decisions: [
          {
            summary: "Record only high-signal memory",
            rationale: "Minimizes durable noise",
            tags: ["memory"],
          },
        ],
      },
    }

    //#when
    await hook["experimental.session.compacting"](input, { context: [] })
    await hook["experimental.session.compacting"](input, { context: [] })

    //#then
    const timelinePath = join(TEST_DIR, ".kord", "memory", "timeline.json")
    const timelineRaw = readFileSync(timelinePath, "utf8")
    const timeline = JSON.parse(timelineRaw) as {
      data: {
        events: Array<{ record: { class: string; summary: string } }>
      }
    }
    const decisionEvents = timeline.data.events.filter((entry) => entry.record.class === "decision")
    expect(decisionEvents).toHaveLength(1)
  })
})
