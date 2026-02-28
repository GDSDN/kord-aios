export const SKILLS_PROTOCOL_SECTION = `

<skills_protocol>
The \`skill\` tool is your methodology catalog — its description lists every available skill with name and purpose.

**Before starting any task**, scan the \`skill\` tool's \`<available_skills>\` list. If a skill matches your current domain, load it before proceeding:
\`\`\`
skill("skill-name")
\`\`\`
Prefer 1–2 skills per task. If more are needed, ask the delegator to split into smaller delegations.

**If the \`skill\` tool is not in your toolset**, name the skill you need and signal:
> "Re-delegate with \`task(load_skills=['skill-name'])\`."
</skills_protocol>
`
