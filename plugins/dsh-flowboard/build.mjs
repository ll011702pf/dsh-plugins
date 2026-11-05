#!/usr/bin/env node
/**
 * Builds the browser half of the dsh-flowboard bundle.
 *
 * The Client module is one file the harness module loader evaluates, so it has a
 * fixed shape: a `window.__ModuleLoader__.load({ id, factory })` wrapper whose
 * factory returns `{ inject, apply }`. The model and the panel are authored as
 * separate fragments so they can change independently, and this script
 * concatenates them in a fixed order:
 *
 *   src/client.head.js      module wrapper opening, artwork, geometry, document model
 *   src/templates.data.js   the six built-in templates of the template library
 *   src/client.tail.js      locale, text layout, exports, styles, views, the panel, registrations
 *
 * Run `node build.mjs` after editing any fragment. Pass `--check` to verify the
 * committed `client.js` is byte-identical to a fresh build without writing it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PARTS = ['src/client.head.js', 'src/templates.data.js', 'src/client.tail.js'];
const OUT = 'client.js';

/**
 * The template file is a bare array expression so it can be authored without
 * surrounding code, which means the binding it lands in is this script's job.
 * `templates.data.js` is edited by hand often enough that keeping the wrapper
 * here is what stops a stray `const` from reaching the built module.
 */
const TEMPLATE_BINDING = '    const TEMPLATES =';
const TEMPLATE_TERMINATOR = '    ;';

/** Shift every non-empty line right by `pad`, leaving blank lines untouched. */
function indent(text, pad) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => (line.trim() === '' ? line : pad + line))
    .join('\n');
}

/** The fragments join with exactly one newline and no trailing blank lines. */
function joinParts(parts) {
  return parts.map((part) => part.replace(/\r\n/g, '\n').replace(/\s+$/, '')).join('\n') + '\n';
}

async function main() {
  const check = process.argv.includes('--check');

  const parts = [];
  for (const relative of PARTS) {
    const absolute = join(HERE, relative);
    let text;
    try {
      text = await readFile(absolute, 'utf8');
    } catch (cause) {
      console.error(`build: cannot read ${relative}: ${cause.message}`);
      process.exit(1);
    }
    if (text.trim().length === 0) {
      console.error(`build: ${relative} is empty`);
      process.exit(1);
    }
    parts.push(text);
  }

  /* Bind the bare template array, then close the statement. The array is
   * indented under its binding so the generated file stays readable. */
  const built = joinParts([
    parts[0],
    TEMPLATE_BINDING + '\n' + indent(parts[1], '    '),
    TEMPLATE_TERMINATOR + '\n' + parts[2],
  ]);
  const target = join(HERE, OUT);

  if (check) {
    let current = null;
    try {
      current = await readFile(target, 'utf8');
    } catch {
      current = null;
    }
    if (current === built) {
      console.log(`build: ${OUT} is up to date (${built.length} bytes)`);
      return;
    }
    console.error(`build: ${OUT} is stale — run \`node build.mjs\``);
    process.exit(1);
  }

  await writeFile(target, built, 'utf8');
  console.log(`build: wrote ${OUT} from ${PARTS.length} fragments (${built.length} bytes)`);
}

await main();
