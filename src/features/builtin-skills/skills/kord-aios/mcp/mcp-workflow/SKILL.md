---
name: mcp-workflow
description: "MCP Workflow Creation Task methodology and workflow"
agent: dev
subtask: false
---

# MCP Workflow Creation Task

### Step 1: Workflow Basics

```
ELICIT: Workflow Definition

Let's create a new MCP workflow!

1. Workflow name (kebab-case):
   Example: scrape-classify, batch-process, api-sync
   → _______________

2. Brief description:
   What does this workflow do?
   → _______________

3. Category:
   [ ] Data Processing (scraping, ETL, transformation)
   [ ] Automation (scheduled tasks, batch operations)
   [ ] Integration (API sync, cross-system operations)
   [ ] Analysis (metrics, reports, classification)
   → Select: ___
```

### Step 2: MCP Selection

```
ELICIT: MCP Selection

Which MCPs will your workflow use?

Available MCPs:
  [x] fs        - File system operations
  [ ] fetch     - HTTP requests, web scraping
  [ ] github    - GitHub API operations
  [ ] postgres  - PostgreSQL database
  [ ] notion    - Notion workspace
  [ ] puppeteer - Browser automation

→ Select MCPs (comma-separated): _______________

Note: Ensure selected MCPs are enabled.
Check with: docker mcp tools ls
```

### Step 3: Input/Output Specification

```
ELICIT: Input/Output

Define workflow parameters:

INPUT PARAMETERS:
1. Parameter name: _______________
   Type: [string/number/boolean/array/object]
   Required: [y/n]
   Default: _______________
   Description: _______________

→ Add another parameter? (y/n): ___

OUTPUT FORMAT:
1. [ ] JSON object (structured data)
2. [ ] Plain text (logs, reports)
3. [ ] File path (write to file)
4. [ ] Custom format

→ Select output format: ___
```

### Step 4: Workflow Logic

```
ELICIT: Workflow Steps

Describe the workflow logic:

What are the main steps?

Example for "scrape-classify":
1. Fetch URL content (fetch MCP)
2. Extract text from HTML (local processing)
3. Classify content (local processing)
4. Save results to file (fs MCP)

Your workflow steps:
1. _______________
2. _______________
3. _______________
4. _______________

→ Any additional steps? (y/n): ___
```

### Step 5: Error Handling

```
ELICIT: Error Handling

How should errors be handled?

1. [ ] Fail fast - Stop on first error
2. [ ] Continue - Log errors, continue processing
3. [ ] Retry - Retry failed operations (specify retries)

→ Select strategy: ___

Retry attempts (if selected): ___
```

---

### 1. Create Workflow File

Use template: `mcp-workflow.js`

```javascript
/**
 * {WORKFLOW_NAME}
 * {WORKFLOW_DESCRIPTION}
 *
 * MCPs: {MCP_LIST}
 * Token Savings: ~98.7%
 */

'use strict';

const WORKFLOW_META = {
  name: '{workflow_name}',
  version: '1.0.0',
  description: '{workflow_description}',
  mcps_required: [{mcp_list}],
};

async function runWorkflow(params) {
  const startTime = Date.now();

  try {
    // Step 1: {step1_description}
    console.log('[1/{total}] {step1_action}...');
    // Implementation

    // Step 2: {step2_description}
    console.log('[2/{total}] {step2_action}...');
    // Implementation

    // Return minimal result to LLM
    return {
      success: true,
      // Minimal output fields
      processingTime: `${Date.now() - startTime}ms`,
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { runWorkflow, WORKFLOW_META };
```

### 2. Save to Workflows Directory

```bash
# File location
scripts/mcp-workflows/{workflow_name}.js

# Make executable (Linux/macOS)
chmod +x scripts/mcp-workflows/{workflow_name}.js
```

### 3. Test the Workflow

```bash
# Run in Docker MCP
docker mcp exec ./scripts/mcp-workflows/{workflow_name}.js

# With parameters
docker mcp exec ./scripts/mcp-workflows/{workflow_name}.js --param value
```

### 4. Document the Workflow

Add entry to scripts/mcp-workflows/README.md:

```markdown

### {workflow_name}

*Purpose:** {workflow_description}

*MCPs:** {mcp_list}

*Usage:**
\`\`\`bash
docker mcp exec ./scripts/mcp-workflows/{workflow_name}.js --param value
\`\`\`

*Parameters:**
- `param1` - Description (required/optional)
- `param2` - Description (required/optional)
```

---

## Success Output

```
✅ MCP Workflow Created Successfully!

📄 File: scripts/mcp-workflows/{workflow_name}.js
📝 Description: {workflow_description}

🔧 MCPs Used:
   • fs - File system operations
   • fetch - HTTP requests

📋 Parameters:
   • url (required) - URL to process
   • output (optional) - Output file path

🚀 Run with:
   docker mcp exec ./scripts/mcp-workflows/{workflow_name}.js --url https://example.com

💾 Token Savings: ~98.7% vs direct LLM processing

Next steps:
1. Test: docker mcp exec ./scripts/mcp-workflows/{workflow_name}.js --help
2. Customize: Edit the workflow logic
3. Document: Update scripts/mcp-workflows/README.md
```

---

### Data Processing

```javascript
async function processData(params) {
  const { inputPath, outputPath } = params;

  // Read input (fs MCP)
  const data = await mcp.fs.readFile(inputPath);

  // Process locally (no tokens)
  const processed = transform(JSON.parse(data));

  // Write output (fs MCP)
  await mcp.fs.writeFile(outputPath, JSON.stringify(processed));

  return { success: true, recordsProcessed: processed.length };
}
```

### Web Scraping

```javascript
async function scrapeWeb(params) {
  const { url, selector } = params;

  // Fetch page (fetch MCP)
  const html = await mcp.fetch.get(url);

  // Extract data locally (no tokens)
  const extracted = extractData(html, selector);

  return { success: true, itemsFound: extracted.length };
}
```

### API Integration

```javascript
async function syncData(params) {
  const { sourceApi, targetPath } = params;

  // Fetch from API (fetch MCP)
  const response = await mcp.fetch.get(sourceApi);

  // Transform locally (no tokens)
  const transformed = mapToLocalFormat(response);

  // Save locally (fs MCP)
  await mcp.fs.writeFile(targetPath, JSON.stringify(transformed));

  return { success: true, recordsSynced: transformed.length };
}
```

---

## Token Savings Comparison

| Approach | Tokens | Processing |
|----------|--------|------------|
| Direct LLM | ~10,000 | LLM context |
| MCP Tool Calls | ~5,000 | Tool overhead |
| *Code Mode** | ~130 | *Sandbox** |

*Savings: ~98.7%**

---
