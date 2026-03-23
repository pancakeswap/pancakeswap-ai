#!/usr/bin/env node
/**
 * sync-pcs-skill.cjs
 *
 * Keeps the pcs-skill router SKILL.md in sync across two locations:
 *   - skills/pcs-skill/SKILL.md                              ← canonical (skills.sh discovery)
 *   - packages/plugins/pancakeswap-ai/skills/pcs-skill/SKILL.md  ← plugin package copy
 *
 * The router uses WebFetch to load sub-skills at runtime — no file copying needed.
 *
 * Run: node scripts/sync-pcs-skill.cjs
 */

'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC  = path.join(ROOT, 'skills/pcs-skill/SKILL.md')
const DEST = path.join(ROOT, 'packages/plugins/pancakeswap-ai/skills/pcs-skill/SKILL.md')

if (!fs.existsSync(SRC)) {
  console.error(`ERROR: source not found: ${SRC}`)
  process.exit(1)
}

fs.copyFileSync(SRC, DEST)
console.log(`synced: skills/pcs-skill/SKILL.md → packages/plugins/pancakeswap-ai/skills/pcs-skill/SKILL.md`)
console.log('\n✓ pcs-skill router synced')
