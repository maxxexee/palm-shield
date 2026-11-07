#!/usr/bin/env node
/**
 * Repository checks used by CI.
 *
 * No dependencies and no network access. It verifies that local asset references
 * resolve, that the dashboard JavaScript parses, that README links and images point
 * at real files, and that a few security invariants still hold.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const exists = (rel) => existsSync(join(root, rel));

let failures = 0;

function ok(message) {
  console.log(`ok    ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}

function check(name, condition, detail = '') {
  if (condition) ok(name);
  else fail(detail ? `${name}: ${detail}` : name);
}

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function scanMarkdown(text) {
  const lines = text.split('\n');
  const anchors = new Set();
  const links = new Set();
  const images = new Set();
  const seen = new Map();
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      const slug = slugify(heading[1]);
      if (slug) {
        const count = seen.get(slug) || 0;
        seen.set(slug, count + 1);
        anchors.add(count ? `${slug}-${count}` : slug);
      }
    }
  }

  inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    for (const match of line.matchAll(/<img[^>]+src="([^"]+)"/g)) images.add(match[1]);
    for (const match of line.matchAll(/<a[^>]+href="([^"]+)"/g)) links.add(match[1]);
    for (const match of line.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) images.add(match[1]);
    for (const match of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) links.add(match[1]);
  }

  return { anchors, links, images };
}

// 1. Files the project promises to ship.
const requiredFiles = [
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'db/schema.sql',
  'palmshield/index.html',
  'palmshield/css/styling.css',
  'palmshield/js/config.js',
  'programs/palmshield/src/vote.rs',
  'supabase/functions/psp-screen/index.ts',
  'supabase/functions/payout/index.ts',
];

for (const file of requiredFiles) check(`required file ${file}`, exists(file));

// 2. Local references in the dashboard resolve on disk.
const html = read('palmshield/index.html');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const localReferences = [
  ...new Set(references.filter((ref) => !/^(https?:|data:|#|mailto:|\/\/)/.test(ref))),
];

for (const ref of localReferences) {
  check(`asset palmshield/${ref}`, exists(join('palmshield', ref)));
}

// 3. Every dashboard script parses.
for (const ref of localReferences.filter((r) => r.endsWith('.js'))) {
  const file = join(root, 'palmshield', ref);
  if (!existsSync(file)) continue;
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  check(
    `parse palmshield/${ref}`,
    result.status === 0,
    (result.stderr || '').trim().split('\n')[0],
  );
}

// 4. README internal links, anchors, and targets.
const { anchors, links, images } = scanMarkdown(read('README.md'));

for (const link of links) {
  if (!link.startsWith('#')) continue;
  const anchor = link.slice(1);
  check(`README anchor ${link}`, anchors.has(anchor), 'no matching heading');
}

for (const target of [...links, ...images]) {
  if (/^(https?:|mailto:|#|data:)/.test(target)) continue;
  const path = target.split('#')[0];
  check(`README target ${path}`, exists(path), 'file not found');
}

// 5. Security invariants that should survive refactors.
const config = read('palmshield/js/config.js');
check(
  'dashboard does not reference a service role key',
  !/service_role/i.test(config + html),
  'service role keys must never reach the client',
);

const payout = read('supabase/functions/payout/index.ts');
check(
  'payout reads the vault key from the environment',
  /Deno\.env\.get\("VAULT_SECRET_KEY_B58"\)/.test(payout),
  'VAULT_SECRET_KEY_B58 must come from Deno.env, not a literal',
);

const rootEntries = readdirSync(root);
const committedEnv = rootEntries.filter((entry) => /^\.env($|\.(?!example|sample|template))/.test(entry));
check('no environment files committed', committedEnv.length === 0, committedEnv.join(', '));

// 6. Database policies are still declared.
const schema = read('db/schema.sql');
check('schema enables row level security', /enable row level security/i.test(schema));
check('schema declares policies', /create policy/i.test(schema));

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('\nall checks passed');
}
