#!/usr/bin/env node
/**
 * Publishes all skills in the monorepo to ClaWHub.
 * Reads version from each SKILL.md frontmatter and calls `clawhub publish`.
 *
 * Usage:
 *   node scripts/publish-clawhub.cjs [--dry-run] [--changelog "message"]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const changelogIdx = args.indexOf('--changelog')
const changelog = changelogIdx !== -1 ? args[changelogIdx + 1] : 'Published via CI'

const VERSION_REGEX = /version:\s*['"]?(\d+\.\d+\.\d+)/
const NAME_REGEX = /^name:\s*(.+)$/m

function parseVersion(skillMdPath) {
  const content = fs.readFileSync(skillMdPath, 'utf8')
  const match = content.match(VERSION_REGEX)
  if (!match) {
    throw new Error(`No version found in frontmatter: ${skillMdPath}`)
  }
  return match[1]
}

function parseName(skillMdPath) {
  const content = fs.readFileSync(skillMdPath, 'utf8')
  const match = content.match(NAME_REGEX)
  if (!match) {
    throw new Error(`No name found in frontmatter: ${skillMdPath}`)
  }
  // "pancakeswap/swap-planner" → "pancakeswap-swap-planner"
  return match[1].trim().replace(/\//g, '-')
}

function findSkills(pluginsDir) {
  const skills = []
  for (const pluginName of fs.readdirSync(pluginsDir)) {
    const skillsDir = path.join(pluginsDir, pluginName, 'skills')
    if (!fs.existsSync(skillsDir)) continue
    for (const skillName of fs.readdirSync(skillsDir)) {
      const skillDir = path.join(skillsDir, skillName)
      const skillMd = path.join(skillDir, 'SKILL.md')
      if (!fs.existsSync(skillMd)) continue
      skills.push({ pluginName, skillName, skillDir, skillMd })
    }
  }
  return skills
}

const rootDir = path.join(__dirname, '..')
const pluginsDir = path.join(rootDir, 'packages', 'plugins')
const skills = findSkills(pluginsDir)

if (skills.length === 0) {
  console.error('No skills found to publish.')
  process.exit(1)
}

console.log(`Found ${skills.length} skill(s) to publish${dryRun ? ' (dry run)' : ''}:\n`)

let hasErrors = false

for (const { pluginName, skillName, skillDir, skillMd } of skills) {
  let version, slug
  try {
    version = parseVersion(skillMd)
    slug = parseName(skillMd)
  } catch (e) {
    console.error(`  ❌ ${pluginName}/${skillName}: ${e.message}`)
    hasErrors = true
    continue
  }

  console.log(`  Publishing ${pluginName}/${skillName} v${version} (slug: ${slug})...`)

  if (dryRun) {
    console.log(`    [dry-run] clawhub publish "${skillDir}" --slug ${slug} --version ${version} --changelog "${changelog}" --tags latest`)
    continue
  }

  try {
    execSync(
      `clawhub publish "${skillDir}" --slug ${slug} --version ${version} --changelog "${changelog}" --tags latest`,
      { stdio: 'inherit', cwd: rootDir },
    )
    console.log(`  ✅ Published ${pluginName}/${skillName} v${version}`)
  } catch (e) {
    console.error(`  ❌ Failed to publish ${pluginName}/${skillName}: ${e.message}`)
    hasErrors = true
  }
}

console.log(`\n${hasErrors ? '❌ Some skills failed to publish' : '✅ All skills published successfully'}`)
process.exit(hasErrors ? 1 : 0)
