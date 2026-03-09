---
name: analyze-framework
description: "Comprehensive framework analysis — component discovery, usage patterns, performance bottlenecks, redundancy detection, and improvement recommendations"
agent: architect
subtask: false
argument-hint: "Target framework path or scope (full, agents, tasks, workflows, utils)"
---

# Analyze Framework

Performs comprehensive analysis of a framework or codebase to identify improvement opportunities, performance bottlenecks, component redundancies, and usage patterns.

## Parameters

- `scope` (string, optional): Analysis scope — 'full', 'agents', 'tasks', 'workflows', 'utils' (default: 'full')
- `output_format` (string, optional): Output format — 'detailed', 'summary', 'json' (default: 'detailed')
- `include_metrics` (boolean, optional): Include performance metrics (default: true)
- `include_suggestions` (boolean, optional): Include improvement suggestions (default: true)

## Pre-Conditions

- Target exists and is accessible
- Analysis tools available (file system, grep, glob)

## Process

### Step 1: Discover and Catalog Components

Scan the target to build a complete inventory:
- Agents count and descriptions
- Tasks count and categories
- Workflows and their states
- Utility modules and shared code
- Configuration files

### Step 2: Analyze Usage Patterns

For each discovered component:
- How frequently is it referenced/imported?
- Which other components depend on it?
- Are there unused or orphaned components?
- What are the cross-component dependency chains?

### Step 3: Performance Bottleneck Detection

Identify performance concerns:
- Large files (>500 lines) that may need decomposition
- Deep dependency chains that slow initialization
- Redundant or duplicated logic across components
- Heavy operations in hot paths (e.g., sync file reads, repeated parsing)

### Step 4: Redundancy and Overlap Analysis

Find overlapping functionality:
- Components with similar names or descriptions
- Functions that do similar work in different modules
- Duplicated constants, types, or configuration
- Opportunities for consolidation

### Step 5: Generate Improvement Suggestions

Prioritize recommendations by impact and effort:
- **High priority**: Performance bottlenecks, critical redundancy
- **Medium priority**: Code organization, unused components
- **Low priority**: Style consistency, documentation gaps

### Step 6: Generate Summary Report

Produce a health assessment:
- **Health Score**: 0-100 based on issues found
- **Critical Issues**: Count and descriptions
- **Warnings**: Non-blocking concerns
- **Strengths**: Positive patterns detected
- **Recommendations**: Prioritized improvement list

## Expected Output

1. **Framework Structure Overview**: Complete inventory of components
2. **Usage Analytics**: Pattern analysis and utilization metrics
3. **Performance Analysis**: Bottleneck identification and recommendations
4. **Redundancy Detection**: Overlapping functionality identification
5. **Improvement Suggestions**: Prioritized recommendations for enhancement
6. **Health Score**: Overall framework quality assessment
7. **Detailed Reports**: JSON and Markdown formats for future reference

## Error Handling

1. **Target Not Accessible**
   - Cause: Path does not exist or permissions denied
   - Resolution: Verify path and check permissions
   - Recovery: Skip inaccessible paths, continue with accessible ones

2. **Analysis Timeout**
   - Cause: Analysis exceeds time limit for large codebases
   - Resolution: Reduce analysis depth or scope
   - Recovery: Return partial results with timeout warning

3. **Memory Limit Exceeded**
   - Cause: Large codebase exceeds memory allocation
   - Resolution: Process in batches or increase memory limit
   - Recovery: Graceful degradation to summary analysis

## Security Considerations

- Read-only analysis — no modifications made to framework
- Safe file system scanning with permission checks
- Memory usage monitoring for large codebases
- Configurable analysis depth to prevent performance issues

## Completion Criteria

- [ ] All target components discovered and cataloged
- [ ] Usage patterns analyzed across components
- [ ] Performance bottlenecks identified (if any)
- [ ] Redundancy analysis complete
- [ ] Improvement suggestions generated with priority levels
- [ ] Health score calculated
- [ ] Report generated in requested format
