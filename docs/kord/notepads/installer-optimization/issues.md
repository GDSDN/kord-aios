# installer-optimization — issues

## 2026-02-28T15:47:54Z Session: ses_35b53de03ffewzR9SogyZGRqRg
- (start) No issues yet.

## 2026-02-28T16:30:00Z Edge Cases and Pitfalls
### Edge Cases Encountered
1. **Recursive object merge semantics**: Initial tests expected nested objects to NOT accept any new keys, but that's incorrect for "add-only" semantics. The correct behavior is: existing keys preserved, new keys added. Fixed test expectations to match this behavior.

2. **Array handling**: Arrays are preserved wholesale from existing config - they are NOT merged or appended to. This is intentional to prevent plugin/provider array duplication.

3. **Null values**: When existing has null for a key, it takes precedence (preserved) over new values.

### Potential Pitfalls
1. **Provider config partial updates**: When user has partial provider config (e.g., some models defined), the add-only merge will preserve their models but add new ones from the installer. This may not match user expectations if they have custom model configurations.

2. **JSONC formatting**: The add-only merge writes JSON (not JSONC) after merging. Original JSONC comments/formatting may be lost. This is a known limitation.

3. **Deep nesting**: Very deeply nested configs may have unexpected merge behavior. The recursive merge handles any depth but hasn't been tested beyond 2-3 levels.

4. **Pipeline duplication drift risk**: Avoid duplicated install pipelines between validated and detected-reuse flows, or behavior will diverge over time.

## 2026-02-28T17:00:00Z Project Config Baseline Signal Gotchas
### New Detection Signal
1. **Project config baseline**: `.opencode/kord-aios.json` is now a baseline signal for project maturity detection. This changes the classification:
   - Before: `existing` = plugin + scaffold + config
   - After: `existing` = (plugin + project config) OR (plugin + scaffold + config)

2. **Maturity classification shift**: Projects with plugin + project config (`.opencode/kord-aios.json`) but no full scaffold will now be classified as `existing` instead of `partial`. This affects installer behavior.

3. **isProjectScaffolded baseline**: The function now returns `true` if either:
   - Project config exists at `.opencode/kord-aios.json`, OR
   - Full scaffold exists (docs/kord/plans AND .kord/templates)

4. **Config file path distinction**:
   - `.opencode/kord-aios.json` = project-level config (new baseline signal)
   - `kord-aios.config.jsonc` or `kord-aios.config.json` = user-level config (legacy, not a baseline signal)

## 2026-02-28T18:45:00Z writeProjectKordAiosConfig() Edge Cases
### Edge Cases Encountered
1. **Empty global config file**: When global config file exists but is empty, treated as missing and minimal $schema config is written
2. **Corrupted global config**: Failed JSON parsing treated as missing config
3. **Corrupted project config**: Failed JSON parsing during merge falls back to overwriting with global config
4. **Empty project config file**: Treated as missing, overwrites with global config

### Potential Pitfalls
1. **Path handling**: The function uses `resolve()` to create absolute paths - ensure projectDir is absolute or resolved correctly
2. **JSONC not supported for project config**: Always writes JSON format (not JSONC) to project config
3. **Schema URL**: Hardcoded schema URL - if schema location changes, this needs updating

## 2026-02-28T16:08:00Z init scaffold skip count behavior
- `init()` runs `createKordDirectory()` before `scaffoldProject()`, so `.kord/templates` can already exist on first run and be reported as skipped.
