import { describe, expect, test } from "bun:test"
import { parsePromptModelOverride } from "./prompt-model-override"

describe("parsePromptModelOverride", () => {
  describe("'use model X' pattern", () => {
    test("extracts model from 'use model claude-opus-4-6'", () => {
      //#given
      const prompt = "use model claude-opus-4-6 for this task"

      //#when
      const result = parsePromptModelOverride(prompt)

      //#then
      expect(result).toBe("claude-opus-4-6")
    })

    test("extracts model from 'use model provider/model'", () => {
      const result = parsePromptModelOverride("use model anthropic/claude-opus-4-6 to analyze")
      expect(result).toBe("anthropic/claude-opus-4-6")
    })

    test("handles model with dots and numbers", () => {
      const result = parsePromptModelOverride("use model gpt-5.3-codex here")
      expect(result).toBe("gpt-5.3-codex")
    })
  })

  describe("'use X' pattern (without 'model' keyword)", () => {
    test("extracts model from 'use claude-opus-4-6'", () => {
      const result = parsePromptModelOverride("use claude-opus-4-6 for this")
      expect(result).toBe("claude-opus-4-6")
    })

    test("extracts provider/model from 'use openai/gpt-5.2'", () => {
      const result = parsePromptModelOverride("use openai/gpt-5.2 to debug")
      expect(result).toBe("openai/gpt-5.2")
    })
  })

  describe("'with model X' pattern", () => {
    test("extracts model from 'with model gemini-3-pro'", () => {
      const result = parsePromptModelOverride("analyze this with model gemini-3-pro")
      expect(result).toBe("gemini-3-pro")
    })

    test("extracts provider/model from 'with model google/gemini-3-flash'", () => {
      const result = parsePromptModelOverride("do it with model google/gemini-3-flash please")
      expect(result).toBe("google/gemini-3-flash")
    })
  })

  describe("'@agent must use X' pattern", () => {
    test("extracts model from '@architect must use claude-opus-4-6'", () => {
      const result = parsePromptModelOverride("@architect must use claude-opus-4-6 — analyze the auth flow")
      expect(result).toBe("claude-opus-4-6")
    })

    test("extracts provider/model from '@dev must use openai/gpt-5.3-codex'", () => {
      const result = parsePromptModelOverride("@dev must use openai/gpt-5.3-codex for this refactor")
      expect(result).toBe("openai/gpt-5.3-codex")
    })
  })

  describe("no match", () => {
    test("returns undefined for normal prompt without model override", () => {
      const result = parsePromptModelOverride("refactor the authentication module")
      expect(result).toBeUndefined()
    })

    test("returns undefined for empty string", () => {
      const result = parsePromptModelOverride("")
      expect(result).toBeUndefined()
    })

    test("does not match 'use' as a regular word in context", () => {
      const result = parsePromptModelOverride("we should use dependency injection here")
      expect(result).toBeUndefined()
    })

    test("does not match partial model-like words", () => {
      const result = parsePromptModelOverride("use the new pattern for this refactor")
      expect(result).toBeUndefined()
    })
  })

  describe("case insensitivity", () => {
    test("handles uppercase USE MODEL", () => {
      const result = parsePromptModelOverride("USE MODEL claude-opus-4-6 for this")
      expect(result).toBe("claude-opus-4-6")
    })

    test("handles mixed case With Model", () => {
      const result = parsePromptModelOverride("do it With Model gpt-5.2")
      expect(result).toBe("gpt-5.2")
    })
  })

  describe("edge cases", () => {
    test("returns first match when multiple overrides present", () => {
      const result = parsePromptModelOverride("use model claude-opus-4-6, or maybe use model gpt-5.2")
      expect(result).toBe("claude-opus-4-6")
    })

    test("handles model name at end of string", () => {
      const result = parsePromptModelOverride("use model claude-opus-4-6")
      expect(result).toBe("claude-opus-4-6")
    })

    test("handles surrounding punctuation", () => {
      const result = parsePromptModelOverride("(use model claude-opus-4-6)")
      expect(result).toBe("claude-opus-4-6")
    })
  })
})
