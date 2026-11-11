import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const config = await readFile(
  new URL("../.github/dependabot.yml", import.meta.url),
  "utf8"
)
const ecosystems = config.split("- package-ecosystem:").slice(1)

function ecosystem(name: string): string {
  const section = ecosystems.find(entry =>
    entry.trimStart().startsWith(`${name}\n`)
  )
  if (!section) throw new Error(`Missing Dependabot ecosystem: ${name}`)
  return section
}

describe("Dependabot maintenance policy", () => {
  it("validates shared action revisions together without a semver filter", () => {
    const actions = ecosystem("github-actions")
    expect(actions).toContain("shared-actions:")
    expect(actions).not.toContain("update-types:")
    expect(actions).toMatch(
      /shared-actions:\s+applies-to: version-updates\s+patterns:\s+- "\*"/
    )
  })

  it("keeps the commitlint CLI and preset in one version update", () => {
    expect(ecosystem("npm")).toMatch(
      /commitlint:\s+applies-to: version-updates\s+patterns:\s+- "@commitlint\/\*"/
    )
  })

  it("preserves daily scans, security groups and scoped commit prefixes", () => {
    for (const section of ecosystems) {
      expect(section).toContain("interval: daily")
      expect(section).toMatch(
        /security:\s+applies-to: security-updates\s+patterns:\s+- "\*"/
      )
    }
    expect(ecosystem("npm")).toContain("prefix: build(deps)")
    expect(ecosystem("github-actions")).toContain("prefix: ci(deps)")
  })
})
