import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { writeAgentModelConfig, resetAgentModelConfig } from "./writer"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const TEST_DIR = join(tmpdir(), `model-config-writer-test-${Date.now()}`)
const CONFIG_DIR = join(TEST_DIR, ".opencode")
const CONFIG_PATH = join(CONFIG_DIR, "kord-aios.json")

function readConfig(): Record<string, unknown> {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))
}

describe("writeAgentModelConfig", () => {
  beforeEach(() => {
    mkdirSync(CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  test("creates config file with fallback when file does not exist", () => {
    //#given
    rmSync(CONFIG_PATH, { force: true })

    //#when
    const result = writeAgentModelConfig("kord", {
      fallback: [{ model: "anthropic/claude-opus-4-6", variant: "max" }],
    }, TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    expect((config.agents as any)?.kord?.fallback).toEqual([
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ])
  })

  test("writes fallback to existing config", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({ agents: { kord: { temperature: 0.1 } } }, null, 2))

    //#when
    const result = writeAgentModelConfig("kord", {
      fallback: [
        { model: "anthropic/claude-opus-4-6", variant: "max" },
        { model: "openai/gpt-5.2" },
      ],
    }, TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    const kord = (config.agents as any)?.kord
    expect(kord.fallback).toEqual([
      { model: "anthropic/claude-opus-4-6", variant: "max" },
      { model: "openai/gpt-5.2" },
    ])
    expect(kord.temperature).toBe(0.1)
  })

  test("preserves existing agent fields when adding fallback", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({
      agents: {
        kord: { model: "anthropic/claude-opus-4-6", variant: "max", temperature: 0.1 },
        dev: { model: "openai/gpt-5.3-codex" },
      },
    }, null, 2))

    //#when
    const result = writeAgentModelConfig("kord", {
      fallback: [{ model: "openai/gpt-5.2" }],
    }, TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    const kord = (config.agents as any)?.kord
    expect(kord.fallback).toEqual([{ model: "openai/gpt-5.2" }])
    expect(kord.model).toBe("anthropic/claude-opus-4-6")
    expect(kord.variant).toBe("max")
    expect(kord.temperature).toBe(0.1)
    expect((config.agents as any)?.dev?.model).toBe("openai/gpt-5.3-codex")
  })

  test("writes fallback for a different agent", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2))

    //#when
    const result = writeAgentModelConfig("architect", {
      fallback: [
        { model: "openai/gpt-5.2", variant: "high" },
        { model: "google/gemini-3-pro" },
      ],
    }, TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    const architect = (config.agents as any)?.architect
    expect(architect.fallback).toEqual([
      { model: "openai/gpt-5.2", variant: "high" },
      { model: "google/gemini-3-pro" },
    ])
  })

  test("creates agents section if not present", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({ background_task: { defaultConcurrency: 5 } }, null, 2))

    //#when
    const result = writeAgentModelConfig("explore", {
      fallback: [{ model: "anthropic/claude-haiku-4-5" }],
    }, TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    expect((config.agents as any)?.explore?.fallback).toEqual([
      { model: "anthropic/claude-haiku-4-5" },
    ])
    expect((config as any).background_task?.defaultConcurrency).toBe(5)
  })
})

describe("resetAgentModelConfig", () => {
  beforeEach(() => {
    mkdirSync(CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  })

  test("removes fallback from agent", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({
      agents: {
        kord: {
          model: "anthropic/claude-opus-4-6",
          fallback: [{ model: "anthropic/claude-opus-4-6", variant: "max" }],
          temperature: 0.1,
        },
      },
    }, null, 2))

    //#when
    const result = resetAgentModelConfig("kord", TEST_DIR)

    //#then
    expect(result.success).toBe(true)
    const config = readConfig()
    const kord = (config.agents as any)?.kord
    expect(kord.fallback).toBeUndefined()
    expect(kord.model).toBe("anthropic/claude-opus-4-6")
    expect(kord.temperature).toBe(0.1)
  })

  test("handles agent not in config (no-op)", () => {
    //#given
    writeFileSync(CONFIG_PATH, JSON.stringify({ agents: { dev: { model: "openai/gpt-5.3-codex" } } }, null, 2))

    //#when
    const result = resetAgentModelConfig("kord", TEST_DIR)

    //#then
    expect(result.success).toBe(true)
  })

  test("handles missing config file gracefully", () => {
    //#given
    rmSync(CONFIG_PATH, { force: true })

    //#when
    const result = resetAgentModelConfig("kord", TEST_DIR)

    //#then
    expect(result.success).toBe(true)
  })
})
