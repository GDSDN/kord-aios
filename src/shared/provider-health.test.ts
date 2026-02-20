import { afterEach, describe, expect, test, spyOn } from "bun:test"
import {
  clearProviderHealth,
  getProviderBanInfo,
  isProviderHealthy,
  markProviderUnhealthy,
} from "./provider-health"

describe("provider-health", () => {
  afterEach(() => {
    clearProviderHealth()
  })

  test("marks provider as unhealthy", () => {
    //#when
    markProviderUnhealthy("openai", "quota")

    //#then
    expect(isProviderHealthy("openai")).toBe(false)
    const ban = getProviderBanInfo("openai")
    expect(ban).not.toBeNull()
    expect(ban?.reason).toBe("quota")
  })

  test("ban expires after TTL", () => {
    //#given
    const nowSpy = spyOn(Date, "now")
    nowSpy.mockReturnValue(1_000)

    //#when
    markProviderUnhealthy("anthropic", "quota", 1_000)

    //#then
    expect(isProviderHealthy("anthropic")).toBe(false)

    //#when
    nowSpy.mockReturnValue(2_500)

    //#then
    expect(isProviderHealthy("anthropic")).toBe(true)
    expect(getProviderBanInfo("anthropic")).toBeNull()

    nowSpy.mockRestore()
  })

  test("healthy providers remain healthy", () => {
    expect(isProviderHealthy("google")).toBe(true)
    expect(getProviderBanInfo("google")).toBeNull()
  })
})
