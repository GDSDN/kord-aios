import { describe, test, expect } from "bun:test"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const SQUAD_SKILLS_DIR = join(__dirname)

const SKILL_DIRS = [
	"squad-creator-validate",
	"squad-creator-list",
	"squad-creator-analyze",
	"squad-creator-create",
	"squad-creator-design",
	"squad-creator-extend",
	"create-agent",
]

function readSkillContent(skillDir: string): string {
	return readFileSync(join(SQUAD_SKILLS_DIR, skillDir, "SKILL.md"), "utf-8")
}

describe("S09: Squad skill adaptation for Kord engine", () => {
	//#given - all 7 squad skill files
	const skills = SKILL_DIRS.map((dir) => ({
		name: dir,
		content: readSkillContent(dir),
	}))

	test("all 7 skill files exist and are non-empty", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content.length).toBeGreaterThan(50)
		}
		expect(skills).toHaveLength(7)
	})

	test("no JS script references remain (SquadGenerator, SquadValidator, etc.)", () => {
		//#given
		const jsScriptPatterns = [
			"SquadGenerator",
			"SquadValidator",
			"SquadLoader",
			"SquadDesigner",
			"SquadAnalyzer",
			"SquadExtender",
			"require(",
		]

		//#then
		for (const skill of skills) {
			for (const pattern of jsScriptPatterns) {
				expect(skill.content).not.toContain(pattern)
			}
		}
	})

	test("no deprecated path ./squads/ remains", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).not.toMatch(/\.\/squads\//)
		}
	})

	test("no deprecated manifest names (config.yaml, squad.yaml lowercase)", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).not.toContain("config.yaml")
			expect(skill.content).not.toMatch(/\bsquad\.yaml\b/)
		}
	})

	test("uses SQUAD.yaml (uppercase) as manifest name", () => {
		//#then - at least the validate, list, analyze, create, extend, and create-agent skills mention SQUAD.yaml
		const skillsThatMentionManifest = skills.filter((s) =>
			s.content.includes("SQUAD.yaml"),
		)
		expect(skillsThatMentionManifest.length).toBeGreaterThanOrEqual(6)
	})

	test("no Synkra-specific story references (SQS-*)", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).not.toMatch(/SQS-\d+/)
		}
	})

	test("no TASK-FORMAT-SPECIFICATION references", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).not.toContain("TASK-FORMAT-SPECIFICATION")
			expect(skill.content).not.toContain("TASK-FORMAT-SPEC")
		}
	})

	test("no Portuguese text remains", () => {
		//#given
		const portugueseTerms = [
			"Uso",
			"Parametros",
			"Elicitacao",
			"Disponiveis",
			"Gerado",
			"Sucesso",
			"Exemplo",
			"entrada",
			"saida",
			"responsavel",
			"agente",
			"estrutura",
			"automacao",
			"processos",
			"documentacao",
			"heranca",
			"Principio",
			"incompleto",
			"decorativo",
			"funcional mas",
			"Pode publicar",
		]

		//#then
		for (const skill of skills) {
			for (const term of portugueseTerms) {
				expect(skill.content).not.toContain(term)
			}
		}
	})

	test("no pack_name terminology remains", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).not.toContain("pack_name")
		}
	})

	test("no outputs/minds/ references remain (create-agent specific)", () => {
		//#given
		const createAgent = skills.find((s) => s.name === "create-agent")!

		//#then
		expect(createAgent.content).not.toContain("outputs/minds")
	})

	test("no @pedro-valerio reference remains (create-agent specific)", () => {
		//#given
		const createAgent = skills.find((s) => s.name === "create-agent")!

		//#then
		expect(createAgent.content).not.toContain("pedro-valerio")
	})

	test("no command_loader or CRITICAL_LOADER_RULE remains (create-agent specific)", () => {
		//#given
		const createAgent = skills.find((s) => s.name === "create-agent")!

		//#then
		expect(createAgent.content).not.toContain("command_loader")
		expect(createAgent.content).not.toContain("CRITICAL_LOADER_RULE")
	})

	test("no unsupported component types remain (tools, scripts, data as directories)", () => {
		//#given
		const unsupportedAsDirectories = [
			"tools/\n",
			"scripts/\n",
			"data/\n",
			"workflows/\n",
			"checklists/\n",
		]

		//#then
		for (const skill of skills) {
			for (const pattern of unsupportedAsDirectories) {
				expect(skill.content).not.toContain(pattern)
			}
		}
	})

	 test("all skills preserve frontmatter agent: squad-creator", () => {
		//#then
		for (const skill of skills) {
			expect(skill.content).toMatch(/^---\r?\n[\s\S]*?agent:\s*squad-creator[\s\S]*?---/)
		}
	})

	test("uses correct search paths (.opencode/squads/, .kord/squads/)", () => {
		//#given - skills that describe path resolution
		const pathSkills = skills.filter(
			(s) =>
				s.name === "squad-creator-validate" ||
				s.name === "squad-creator-list" ||
				s.name === "squad-creator-analyze" ||
				s.name === "squad-creator-create" ||
				s.name === "create-agent",
		)

		//#then
		for (const skill of pathSkills) {
			expect(skill.content).toContain(".opencode/squads/")
		}
	})

	test("references squad_validate tool (not JS validator scripts)", () => {
		//#given - skills that do validation
		const validationSkills = skills.filter(
			(s) =>
				s.name === "squad-creator-validate" ||
				s.name === "squad-creator-create" ||
				s.name === "squad-creator-extend" ||
				s.name === "create-agent",
		)

		//#then
		for (const skill of validationSkills) {
			expect(skill.content).toContain("squad_validate")
		}
	})

	test("all content is in English", () => {
		//#then - simple heuristic: no accented characters common in Portuguese
		for (const skill of skills) {
			expect(skill.content).not.toMatch(/[ãõçáéíóú]/i)
		}
	})
})
