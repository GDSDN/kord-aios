# Issues

## 2026-03-02 Bootstrap
- Notepad initialized for squad-execution plan.

## 2026-03-02 Schema Extension
- No issues encountered during implementation.

## 2026-03-02 Chief Task Permission Auto-Enable
- No issues encountered during implementation.
- Note: TypeScript type error resolved using type assertion - SDK's `AgentConfig.permission` type is strict but runtime supports arbitrary tool names.

## 2026-03-02 Agent-Authority Convention Paths + Name Collision Validation
- Test fixture conflict: Built-in squad was named `dev` which collided with built-in agent name `dev`.
- Resolution: Renamed built-in squad from `dev` to `code` and updated agent key from `dev-junior` to `developer`.
- Required updating 8+ test assertions to use new squad name `code`.
- No other issues encountered.

## 2026-03-02 Squad Fallback Store + Write Paths Wiring
- No issues encountered during implementation.
- All new code follows existing patterns (Map-based store, normalize/get/set functions).

## 2026-03-02 Task 7 Integration Tests + Full Verification
- No implementation issues encountered while adding integration coverage.
