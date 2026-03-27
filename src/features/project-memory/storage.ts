import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import {
  PROJECT_MEMORY_DURABLE_DIR,
  PROJECT_MEMORY_LOCAL_DIR,
} from "./types"

export type ProjectMemoryDurability = "durable" | "local"

export interface ProjectMemoryFileDescriptor {
  key: string
  path: string
  durability: ProjectMemoryDurability
  gitignored: boolean
}

export interface ProjectMemoryStorageLayout {
  projectRoot: string
  workspaceId: string
  branch: string
  durableRoot: string
  localRoot: string
  files: ProjectMemoryFileDescriptor[]
}

export interface ProjectMemoryStorageOptions {
  workspaceId?: string
  branch?: string
}

interface ProjectMemoryStorageScope {
  workspaceId: string
  branch: string
  workspacePathSegment: string
  branchPathSegment: string
}

type ProjectMemoryFileData = Record<string, unknown>

interface ProjectMemoryStoredFile {
  schema: "kord.project-memory.file.v1"
  key: string
  durability: ProjectMemoryDurability
  workspace_id: string
  branch: string
  created_at: string
  updated_at: string
  provenance: {
    source: "project-memory-storage"
    workspace_scope: "workspace"
    workspace_id: string
    branch: string
    initialized_at: string
    last_initialized_at: string
  }
  data: ProjectMemoryFileData
}

function sanitizeScopeSegment(value: string, fallback: string): string {
  const trimmed = value.trim()
  const candidate = trimmed.length > 0 ? trimmed : fallback
  const sanitized = candidate
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized.length > 0 ? sanitized : fallback
}

function resolveScope(options: ProjectMemoryStorageOptions): ProjectMemoryStorageScope {
  const workspaceId = options.workspaceId?.trim() || "workspace-default"
  const branch = options.branch?.trim() || "main"

  return {
    workspaceId,
    branch,
    workspacePathSegment: sanitizeScopeSegment(workspaceId, "workspace-default"),
    branchPathSegment: sanitizeScopeSegment(branch, "main"),
  }
}

function createLayoutFiles(
  durableRoot: string,
  localRoot: string,
  scope: ProjectMemoryStorageScope,
): ProjectMemoryFileDescriptor[] {
  return [
    {
      key: "active-context",
      path: join(durableRoot, "active-context.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "open-threads",
      path: join(durableRoot, "open-threads.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "decision-index",
      path: join(durableRoot, "decision-index.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "entity-index",
      path: join(durableRoot, "entity-index.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "gotchas",
      path: join(durableRoot, "gotchas.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "timeline",
      path: join(durableRoot, "timeline.json"),
      durability: "durable",
      gitignored: false,
    },
    {
      key: "local-cache",
      path: join(localRoot, "cache.json"),
      durability: "local",
      gitignored: true,
    },
    {
      key: "branch-metadata",
      path: join(
        localRoot,
        "workspaces",
        scope.workspacePathSegment,
        "branches",
        `${scope.branchPathSegment}.json`,
      ),
      durability: "local",
      gitignored: true,
    },
    {
      key: "workspace-metadata",
      path: join(localRoot, "workspaces", scope.workspacePathSegment, "workspace.json"),
      durability: "local",
      gitignored: true,
    },
  ]
}

function getDefaultDataForKey(
  key: string,
  scope: ProjectMemoryStorageScope,
): ProjectMemoryFileData {
  if (key === "active-context") {
    return {
      active_context: null,
      last_class: null,
    }
  }

  if (key === "open-threads") {
    return {
      threads: [],
    }
  }

  if (key === "decision-index") {
    return {
      decisions_by_id: {},
      decisions_by_tag: {},
    }
  }

  if (key === "entity-index") {
    return {
      entities_by_name: {},
      entities_by_type: {},
    }
  }

  if (key === "gotchas") {
    return {
      gotchas: [],
    }
  }

  if (key === "timeline") {
    return {
      events: [],
    }
  }

  if (key === "local-cache") {
    return {
      cache: [],
    }
  }

  if (key === "branch-metadata") {
    return {
      workspace_id: scope.workspaceId,
      branch: scope.branch,
      durable_cursor: null,
    }
  }

  if (key === "workspace-metadata") {
    return {
      workspace_id: scope.workspaceId,
      last_branch: scope.branch,
      known_branches: [scope.branch],
    }
  }

  return {}
}

function readExistingFile(filePath: string): ProjectMemoryStoredFile | null {
  if (existsSync(filePath) === false) {
    return null
  }

  try {
    const raw = readFileSync(filePath, "utf8")
    const parsed = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) {
      return null
    }
    return parsed as ProjectMemoryStoredFile
  }
  catch {
    return null
  }
}

function buildStoredFile(
  descriptor: ProjectMemoryFileDescriptor,
  scope: ProjectMemoryStorageScope,
  now: string,
): ProjectMemoryStoredFile {
  const existing = readExistingFile(descriptor.path)
  const defaultData = getDefaultDataForKey(descriptor.key, scope)
  const existingData = (existing?.data && typeof existing.data === "object")
    ? existing.data
    : {}

  let data: ProjectMemoryFileData = {
    ...defaultData,
    ...existingData,
  }

  if (descriptor.key === "branch-metadata") {
    data = {
      ...data,
      workspace_id: scope.workspaceId,
      branch: scope.branch,
    }
  }

  if (descriptor.key === "workspace-metadata") {
    const existingKnownBranches = Array.isArray((existingData as { known_branches?: unknown }).known_branches)
      ? ((existingData as { known_branches: unknown[] }).known_branches
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0))
      : []

    const knownBranches = [...new Set([...existingKnownBranches, scope.branch])].sort()
    data = {
      ...data,
      workspace_id: scope.workspaceId,
      last_branch: scope.branch,
      known_branches: knownBranches,
    }
  }

  const createdAt = typeof existing?.created_at === "string" && existing.created_at.length > 0
    ? existing.created_at
    : now
  const initializedAt =
    existing?.provenance && typeof existing.provenance.initialized_at === "string" && existing.provenance.initialized_at.length > 0
      ? existing.provenance.initialized_at
      : createdAt

  return {
    schema: "kord.project-memory.file.v1",
    key: descriptor.key,
    durability: descriptor.durability,
    workspace_id: scope.workspaceId,
    branch: scope.branch,
    created_at: createdAt,
    updated_at: now,
    provenance: {
      source: "project-memory-storage",
      workspace_scope: "workspace",
      workspace_id: scope.workspaceId,
      branch: scope.branch,
      initialized_at: initializedAt,
      last_initialized_at: now,
    },
    data,
  }
}

export function getProjectMemoryStorageLayout(
  projectRoot: string,
  options: ProjectMemoryStorageOptions = {},
): ProjectMemoryStorageLayout {
  const scope = resolveScope(options)
  const durableRoot = join(projectRoot, PROJECT_MEMORY_DURABLE_DIR)
  const localRoot = join(projectRoot, PROJECT_MEMORY_LOCAL_DIR)

  return {
    projectRoot,
    workspaceId: scope.workspaceId,
    branch: scope.branch,
    durableRoot,
    localRoot,
    files: createLayoutFiles(durableRoot, localRoot, scope),
  }
}

export function initializeProjectMemoryStorage(
  projectRoot: string,
  options: ProjectMemoryStorageOptions = {},
): ProjectMemoryStorageLayout {
  const layout = getProjectMemoryStorageLayout(projectRoot, options)
  const scope = resolveScope(options)
  const now = new Date().toISOString()

  mkdirSync(layout.durableRoot, { recursive: true })
  mkdirSync(layout.localRoot, { recursive: true })

  for (const descriptor of layout.files) {
    mkdirSync(dirname(descriptor.path), { recursive: true })
    const storedFile = buildStoredFile(descriptor, scope, now)
    writeFileSync(descriptor.path, `${JSON.stringify(storedFile, null, 2)}\n`, "utf8")
  }

  return layout
}
