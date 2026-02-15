#!/usr/bin/env bun
import { zodToJsonSchema } from "zod-to-json-schema"
import { OhMyOpenCodeConfigSchema } from "../src/config/schema"

const SCHEMA_OUTPUT_PATH = "assets/kord-opencode.schema.json"

async function main() {
  console.log("Generating JSON Schema...")

  const toJsonSchema = zodToJsonSchema as unknown as (
    schema: unknown,
    options?: { target: "draft7" }
  ) => Record<string, unknown>

  const jsonSchema = toJsonSchema(OhMyOpenCodeConfigSchema, {
    target: "draft7",
  })

  const finalSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/GDSDN/kord-aios/master/assets/kord-opencode.schema.json",
    title: "Kord AIOS Configuration",
    description: "Configuration schema for kord-opencode plugin",
    ...jsonSchema,
  }

  await Bun.write(SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))

  console.log(`✓ JSON Schema generated: ${SCHEMA_OUTPUT_PATH}`)
}

main()
