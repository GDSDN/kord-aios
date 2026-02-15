import type { InstallArgs, InstallConfig, ProjectMaturityStatus } from "./types"
import { detectProjectMaturity, type ProjectMaturity } from "./project-detector"
import { isKordAiosInstalled, getKordAiosVersion, detectCurrentConfig, addPluginToKordAiosConfig, writeKordAiosConfig, addAuthPlugins, addProviderConfig } from "./config-manager"
import { createKordDirectory } from "./kord-directory"
import { scaffoldProject } from "./scaffolder"
import { runPostInstallDoctor, type PostInstallDoctorResult } from "./post-install-doctor"
import packageJson from "../../package.json" with { type: "json" }

const VERSION = packageJson.version

// --- Phase Result Types ---

export interface PhaseEnvironmentResult {
  opencodeInstalled: boolean
  opencodeVersion: string | null
}

export interface PhaseDetectionResult {
  maturity: ProjectMaturity
  effectiveStatus: ProjectMaturityStatus
  isUpdate: boolean
}

export interface PhaseConfigurationResult {
  config: InstallConfig
}

export interface PhaseInstallationResult {
  pluginAdded: boolean
  pluginConfigPath: string
  configWritten: boolean
  configPath: string
  kordDirCreated: boolean
  kordDirPath: string
  authConfigured: boolean
  providerConfigured: boolean
  errors: string[]
}

export interface PhaseVerificationResult {
  doctor: PostInstallDoctorResult
  skipped: boolean
}

// --- Phase Functions ---

export async function phaseEnvironment(): Promise<PhaseEnvironmentResult> {
  const opencodeInstalled = await isKordAiosInstalled()
  const opencodeVersion = await getKordAiosVersion()
  return { opencodeInstalled, opencodeVersion }
}

export function phaseDetection(cwd: string, force?: boolean): PhaseDetectionResult {
  const maturity = detectProjectMaturity(cwd)
  const effectiveStatus: ProjectMaturityStatus = force ? "fresh" : maturity.status
  const isUpdate = effectiveStatus === "existing"
  return { maturity, effectiveStatus, isUpdate }
}

export function phaseConfiguration(config: InstallConfig): PhaseConfigurationResult {
  return { config }
}

export async function phaseInstallation(config: InstallConfig, cwd: string): Promise<PhaseInstallationResult> {
  const errors: string[] = []

  const pluginResult = await addPluginToKordAiosConfig(VERSION)
  if (!pluginResult.success) {
    errors.push(`Plugin: ${pluginResult.error}`)
    return { pluginAdded: false, pluginConfigPath: "", configWritten: false, configPath: "", kordDirCreated: false, kordDirPath: "", authConfigured: false, providerConfigured: false, errors }
  }

  let authConfigured = false
  let providerConfigured = false

  if (config.hasGemini) {
    const authResult = await addAuthPlugins(config)
    if (!authResult.success) {
      errors.push(`Auth: ${authResult.error}`)
    } else {
      authConfigured = true
    }

    const providerResult = addProviderConfig(config)
    if (!providerResult.success) {
      errors.push(`Provider: ${providerResult.error}`)
    } else {
      providerConfigured = true
    }
  }

  const kordAiosResult = writeKordAiosConfig(config)
  if (!kordAiosResult.success) {
    errors.push(`Config: ${kordAiosResult.error}`)
    return { pluginAdded: true, pluginConfigPath: pluginResult.configPath, configWritten: false, configPath: "", kordDirCreated: false, kordDirPath: "", authConfigured, providerConfigured, errors }
  }

  const kordDirResult = createKordDirectory(cwd)

  const scaffoldResult = scaffoldProject({ directory: cwd })
  if (scaffoldResult.errors.length > 0) {
    errors.push(`Scaffold: ${scaffoldResult.errors.join("; ")}`)
  }

  return {
    pluginAdded: true,
    pluginConfigPath: pluginResult.configPath,
    configWritten: true,
    configPath: kordAiosResult.configPath,
    kordDirCreated: kordDirResult.success && (kordDirResult.created ?? false),
    kordDirPath: kordDirResult.kordPath ?? "",
    authConfigured,
    providerConfigured,
    errors,
  }
}

export function phaseVerification(cwd: string, skip?: boolean): PhaseVerificationResult {
  if (skip) {
    return { doctor: { checks: [], passed: 0, total: 0 }, skipped: true }
  }
  const doctor = runPostInstallDoctor(cwd)
  return { doctor, skipped: false }
}
