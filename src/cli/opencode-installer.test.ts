import { describe, test, expect } from "bun:test"
import { detectOS, getInstallCommand, getManualInstallInstructions } from "./opencode-installer"

describe("opencode-installer", () => {
  describe("detectOS", () => {
    test("returns a valid OS type", () => {
      //#when
      const os = detectOS()

      //#then
      expect(["macos", "linux", "windows"]).toContain(os)
    })
  })

  describe("getInstallCommand", () => {
    test("macOS uses brew as primary", () => {
      //#when
      const cmd = getInstallCommand("macos")

      //#then
      expect(cmd.primary).toContain("brew")
      expect(cmd.fallback).toContain("curl")
    })

    test("linux uses curl as primary", () => {
      //#when
      const cmd = getInstallCommand("linux")

      //#then
      expect(cmd.primary).toContain("curl")
      expect(cmd.fallback).toBeNull()
    })

    test("windows uses winget as primary", () => {
      //#when
      const cmd = getInstallCommand("windows")

      //#then
      expect(cmd.primary).toContain("winget")
    })

    test("all OS commands include opencode reference", () => {
      //#then
      for (const os of ["macos", "linux", "windows"] as const) {
        const cmd = getInstallCommand(os)
        expect(cmd.primary.toLowerCase()).toContain("opencode")
      }
    })
  })

  describe("getManualInstallInstructions", () => {
    test("includes primary command", () => {
      //#when
      const instructions = getManualInstallInstructions("linux")

      //#then
      expect(instructions).toContain("curl")
      expect(instructions).toContain("opencode.ai")
    })

    test("includes fallback for macOS", () => {
      //#when
      const instructions = getManualInstallInstructions("macos")

      //#then
      expect(instructions).toContain("brew")
      expect(instructions).toContain("Or alternatively")
      expect(instructions).toContain("curl")
    })

    test("includes docs link", () => {
      //#when
      const instructions = getManualInstallInstructions("windows")

      //#then
      expect(instructions).toContain("https://opencode.ai/docs")
    })
  })
})
