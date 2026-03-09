---
name: setup-mcp-docker
description: "Setup Docker MCP Toolkit methodology and workflow"
agent: devops
subtask: false
---

# Setup Docker MCP Toolkit

## Purpose

Configure Docker MCP Toolkit as the primary MCP infrastructure for Kord AIOS, using *HTTP transport** instead of stdio to avoid timeout issues during gateway initialization.

*Key Changes in v2.0:**
- Uses HTTP/SSE transport (fixes 30s timeout issue)
- Gateway runs as persistent Docker Compose service
- Presets: `minimal` (no API keys) and `full` (with API keys)

---

## Kord AIOS Default MCPs

| Preset | MCPs | API Key Required | Tokens |
|--------|------|------------------|--------|
| *minimal** | context7, desktop-commander, playwright | No | ~10-15k |
| *full** | minimal + exa | Yes (EXA_API_KEY) | ~20-25k |

*Minimal Preset MCPs:**
- *context7** - Library documentation lookups
- *desktop-commander** - File management + terminal commands
- *playwright** - Browser automation for testing

*Full Preset Adds:**
- *exa** - AI-powered web search (requires `EXA_API_KEY`)

---

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)

- Autonomous decision making with logging
- Installs `minimal` preset automatically
- *Best for:** Experienced users with Docker already configured

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**

- Explicit decision checkpoints
- Choose between minimal/full presets
- *Best for:** First-time setup, understanding the architecture

### 3. Pre-Flight Planning - Comprehensive Upfront Planning

- Task analysis phase (identify all ambiguities)
- Zero ambiguity execution
- *Best for:** Production environments, team-wide deployment

*Parameter:** `mode` (optional, default: `interactive`)

---

## Acceptance Criteria

```yaml
acceptance-criteria:
  - [ ] gordon-mcp.yml exists in .docker/mcp/
  - [ ] At least 3 core MCPs functional (filesystem, github, fetch)
  - [ ] Claude Code can call MCP tools
  - [ ] Token consumption reduced vs direct MCPs
```

---

## Purpose

Configure Docker MCP Toolkit as the primary MCP infrastructure for Kord AIOS, replacing 1MCP with the containerized gateway approach. This enables:
- *98.7% token reduction** via Code Mode
- *Dynamic MCP loading** (mcp-find, mcp-add, mcp-remove)
- *Sandbox execution** for workflows
- *270+ MCP catalog** access

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Claude Code / Desktop        │
└──────────────────┬──────────────────┘
                   │ Tool Calls
                   ▼
┌─────────────────────────────────────┐
│       Docker MCP Gateway            │
│   (Single entry point)              │
│                                     │
│   Features:                         │
│   • Routes to correct MCP container │
│   • OAuth management                │
│   • Dynamic discovery               │
│   • Hot-reload configs              │
└──────────────────┬──────────────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│mcp/       │ │mcp/       │ │mcp/       │
│filesystem │ │github     │ │fetch      │
│Container  │ │Container  │ │Container  │
└───────────┘ └───────────┘ └───────────┘
```

## Prerequisites

- Docker Desktop 4.50+ installed
- Docker MCP Toolkit enabled in Docker Desktop settings
- Claude Code installed
- (Optional) GitHub token for github MCP
- (Optional) Other API keys for specific MCPs

### Step 1: Docker Verification

```
ELICIT: Docker Environment Check

1. Checking Docker Desktop version...
   → Run: docker --version
   → Expected: Docker version 4.50.0 or higher
   → If lower: Guide to update Docker Desktop

2. Checking Docker MCP Toolkit...
   → Run: docker mcp --version
   → If not available: Enable in Docker Desktop > Settings > Extensions > MCP Toolkit

3. Checking Docker daemon...
   → Run: docker info
   → Must succeed before proceeding
```

### Step 2: MCP Selection

```
ELICIT: MCP Server Selection

Which MCPs do you want to enable?

CORE MCPs (Recommended):
  [x] filesystem  - File system access (read/write project files)
  [x] github      - GitHub API (repos, issues, PRs)
  [x] fetch       - HTTP requests and web scraping

DEVELOPMENT MCPs:
  [ ] postgres    - PostgreSQL database access
  [ ] sqlite      - SQLite database access
  [ ] redis       - Redis cache operations

PRODUCTIVITY MCPs:
  [ ] notion      - Notion workspace integration
  [ ] atlassian   - Jira/Confluence (ClickUp alternative)
  [ ] slack       - Slack messaging

AUTOMATION MCPs:
  [ ] puppeteer   - Browser automation
  [ ] playwright  - Advanced browser automation

→ Select MCPs to enable (comma-separated numbers or 'core' for defaults)
```

### Step 3: Preset Configuration

```
ELICIT: Preset Configuration

Presets allow loading only needed MCPs for specific workflows.

1. Create 'kord-aios-dev' preset?
   → Recommended MCPs: filesystem, github
   → Use case: Story implementation, PRs, code changes
   → Token budget: ~5-10k

2. Create 'kord-aios-research' preset?
   → Recommended MCPs: filesystem, fetch
   → Use case: Documentation, web research
   → Token budget: ~8-15k

3. Create 'kord-aios-full' preset?
   → All enabled MCPs
   → Use case: Complex multi-domain tasks
   → Token budget: Varies by MCPs

→ Which presets to create? (y/n for each)
```

### Step 4: Credentials Configuration

```
ELICIT: API Credentials

Some MCPs require authentication:

1. GitHub MCP:
   → Environment variable: GITHUB_TOKEN
   → Current status: [Set/Not Set]
   → If not set: Guide to create Personal Access Token

2. Other MCPs (if selected):
   → List required credentials
   → Guide to obtain each
```

### 1. Create Project MCP Directory

```bash
# Create .docker/mcp structure
mkdir -p .docker/mcp
```

### 2. Start Gateway as Persistent Service (HTTP Transport)

*CRITICAL:** Use HTTP transport instead of stdio to avoid 30-second timeout.

```bash
# Option A: Docker Compose (RECOMMENDED)
docker compose -f .docker/mcp/gateway-service.yml up -d

# Option B: Background process (alternative)
docker mcp gateway run --port 8080 --transport sse --watch &

# Option C: Manual foreground (for debugging)
docker mcp gateway run --port 8080 --transport sse --watch
```

*Wait for gateway to be ready:**
```bash
# Health check (retry until success)
curl -s http://localhost:8080/health || echo "Gateway starting..."
```

### 3. Enable Kord AIOS Default MCPs

```bash
# Minimal preset (no API keys required)
docker mcp server enable context7
docker mcp server enable desktop-commander
docker mcp server enable playwright

# Full preset (add exa - requires EXA_API_KEY)
docker mcp server enable exa
```

### 4. Configure Desktop-Commander Path

```bash
# Set user home directory for desktop-commander
docker mcp config write "desktop-commander:
  paths:
    - ${HOME}"
```

### 4.1 Configure API Keys (CRITICAL - Known Bug Workaround)

⚠️ *BUG:** Docker MCP Toolkit's secrets store and template interpolation do NOT work properly. Credentials set via `docker mcp secret set` or `config.yaml apiKeys` are not passed to containers for MCPs with strict config schemas.

*WORKAROUND:** Edit the catalog file directly to hardcode env values.

```yaml
# Edit: ~/.docker/mcp/catalogs/docker-mcp.yaml
# Find the MCP entry and add/modify the env section:

# Example for EXA (already working via apiKeys - no change needed):
exa:
  apiKeys:
    EXA_API_KEY: your-actual-api-key

# Example for Apify (requires catalog edit):
apify-mcp-server:
  env:
    - name: TOOLS
      value: 'actors,docs,apify/rag-web-browser'
    - name: APIFY_TOKEN
      value: 'your-actual-apify-token'
```

*Security Note:** This exposes credentials in a local file. Ensure:
1. `~/.docker/mcp/catalogs/` is not committed to any repo
2. File permissions restrict access to current user only

*Alternative config.yaml (works for some MCPs like EXA):**
```yaml
# ~/.docker/mcp/config.yaml
exa:
  apiKeys:
    EXA_API_KEY: your-api-key
```

See `add-mcp` task (Step 3.1) for detailed instructions.

### 5. Configure Claude Code (HTTP Transport)

*IMPORTANT:** Use HTTP type, NOT stdio!

```json
// ~/.claude.json
{
  "mcpServers": {
    "docker-gateway": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

*Why HTTP instead of stdio?**
- stdio: Claude Code spawns gateway → 30s timeout before init completes
- HTTP: Gateway already running → instant connection

### 6. Verify Integration

```bash
# Check gateway is running
curl http://localhost:8080/health

# List enabled servers
docker mcp server ls

# List available tools
docker mcp tools ls

# Verify configuration
docker mcp config read
```

### 7. Test in Claude Code

After restarting Claude Code:
```
/mcp
# Should show: docker-gateway (connected)
# With tools from: context7, desktop-commander, playwright
```

## Migration from 1MCP

If migrating from 1MCP:

### Step 1: Backup Current Config

```bash
cp ~/.claude.json ~/.claude.json.backup-pre-docker-mcp
```

### Step 2: Stop 1MCP Server

```bash
# Kill 1MCP process
pkill -f "1mcp serve"

# Or stop service
sudo systemctl stop 1mcp
```

### Step 3: Remove 1MCP from Claude Config

```json
// ~/.claude.json - REMOVE these entries
{
  "mcpServers": {
    // "1mcp-dev": { ... },     // REMOVE
    // "1mcp-research": { ... } // REMOVE
  }
}
```

### Step 4: Start Gateway Service

```bash
# Start gateway as persistent service
docker compose -f .docker/mcp/gateway-service.yml up -d

# Wait for health check
sleep 5
curl http://localhost:8080/health
```

### Step 5: Add Docker Gateway (HTTP Transport)

```json
// ~/.claude.json - ADD this entry (HTTP, NOT stdio!)
{
  "mcpServers": {
    "docker-gateway": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

## Validation Checklist

- [ ] Docker Desktop 4.50+ installed and running
- [ ] Docker MCP Toolkit enabled (`docker mcp --version`)
- [ ] Gateway service running (`curl http://localhost:8080/health`)
- [ ] MCPs enabled (`docker mcp server ls` shows context7, desktop-commander, playwright)
- [ ] Claude Code configured with HTTP transport
- [ ] `/mcp` in Claude Code shows docker-gateway connected
- [ ] Tools from all MCPs visible in `/mcp`

### Error: Docker Not Found

```
Resolution: Install Docker Desktop from https://docker.com/desktop
Minimum version: 4.50.0
```

### Error: MCP Toolkit Not Available

```
Resolution:
1. Open Docker Desktop
2. Go to Settings > Extensions
3. Enable "MCP Toolkit"
4. Restart Docker Desktop
```

### Error: Gateway Failed to Start

```
Resolution:
1. Check port 8080 is available: netstat -an | grep 8080
2. Try alternate port: docker mcp gateway run --port 8081
3. Check Docker logs: docker logs mcp-gateway
```

### Error: Permission Denied on Volumes

```
Resolution:
1. Check Docker has access to project directory
2. On Windows: Enable file sharing in Docker Desktop settings
3. On Linux: Add user to docker group: sudo usermod -aG docker $USER
```

## Success Output

```
✅ Docker MCP Toolkit configured successfully!

📦 MCP Gateway: Running on http://localhost:8080 (HTTP/SSE transport)
🔧 MCPs Enabled (minimal preset):
   • context7 - Library documentation
   • desktop-commander - File management + terminal
   • playwright - Browser automation

📋 Available Presets:
   • minimal - context7, desktop-commander, playwright (no API keys)
   • full - minimal + exa (requires EXA_API_KEY)

🔗 Claude Code: Connected via HTTP to docker-gateway
📊 Token Usage: ~10-15k tokens (minimal) / ~20-25k (full)

📁 Configuration:
   • Gateway service: .docker/mcp/gateway-service.yml
   • Claude config: ~/.claude.json (HTTP transport)

Next steps:
1. Restart Claude Code to connect
2. Run /mcp to verify connection
3. Use 'docker mcp server enable exa' to add web search (requires EXA_API_KEY)
```
