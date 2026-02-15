import { describe, expect, test } from "bun:test"
import type { StoryFile } from "./story"
import type { PlanDocument } from "./plan"
import type { SquadManifest } from "./squad"

describe("shared types", () => {
  test("StoryFile supports standard story structure", () => {
    //#given
    const story: StoryFile = {
      title: "Implement story_read",
      status: "DRAFT",
      tasks: [{ title: "Parse frontmatter", checked: false }],
      sections: {
        acceptanceCriteria: ["Parses markdown"],
        files: ["src/tools/story-read/index.ts"],
        devNotes: "Initial stub.",
      },
    }

    //#when
    const status = story.status

    //#then
    expect(status).toBe("DRAFT")
    expect(story.tasks[0].checked).toBe(false)
  })

  test("PlanDocument supports story-driven hierarchy", () => {
    //#given
    const plan: PlanDocument = {
      type: "story-driven",
      title: "Wave A",
      epics: [
        {
          kind: "epic",
          title: "EPIC-02",
          stories: [
            {
              kind: "story",
              title: "S01",
              tasks: [{ kind: "task", title: "Define shared types" }],
            },
          ],
        },
      ],
    }

    //#when
    const firstEpic = plan.epics?.[0]

    //#then
    expect(firstEpic?.kind).toBe("epic")
    expect(firstEpic?.stories[0].tasks[0].title).toBe("Define shared types")
  })

  test("SquadManifest supports agents and configuration", () => {
    //#given
    const manifest: SquadManifest = {
      name: "marketing",
      description: "Marketing execution squad",
      agents: [{ name: "dev", role: "Executor" }],
      config: {
        planFormat: "story-driven",
        executionRules: ["Use checkpoints"],
      },
    }

    //#when
    const firstAgent = manifest.agents[0]

    //#then
    expect(firstAgent.name).toBe("dev")
    expect(manifest.config?.planFormat).toBe("story-driven")
  })
})
