#!/usr/bin/env node
/**
 * Adds the file extension to every relative import in the build output.
 *
 * `bundle: false` is required for React Server Components, and esbuild emits specifiers
 * exactly as the source wrote them, extensionless. Bundlers resolve that; Node's own ESM
 * loader does not. ESM output points at .js, CJS at .cjs, and .d.ts files are left for
 * TypeScript to resolve by its own rules.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname

let patched = 0

/** Recursive, because `bundle: false` mirrors the source tree: src/presets becomes
 * dist/presets, and a flat readdir left every file in there importing without an
 * extension. */
function jsFilesIn(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...jsFilesIn(path))
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.cjs')) found.push(path)
  }
  return found
}

for (const path of jsFilesIn(DIST)) {
  const isEsm = path.endsWith('.js')
  const source = readFileSync(path, 'utf8')
  const extension = isEsm ? '.js' : '.cjs'

  const next = source.replace(
    /(from\s*|require\(\s*)(["'])(\.\.?\/[^"']+?)\2/g,
    (match, prefix, quote, specifier) =>
      /\.[a-z]+$/.test(specifier) ? match : `${prefix}${quote}${specifier}${extension}${quote}`
  )

  if (next !== source) {
    writeFileSync(path, next)
    patched += 1
  }
}

console.log(`extensions added in ${patched} file${patched === 1 ? '' : 's'}`)
