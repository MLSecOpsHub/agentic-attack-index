#!/usr/bin/env node
// Scaffold a new incident record from data/incidents/_TEMPLATE.yml.
//   npm run new:incident -- <kebab-case-id> ["Incident name"]
// Copies the template (comments included), sets id/name/added/last_updated,
// and leaves every factual field for you to fill from sources.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { INCIDENTS_DIR } from './lib.mjs';

const [id, name] = process.argv.slice(2);
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

if (!id || !ID_RE.test(id)) {
  console.error('usage: npm run new:incident -- <kebab-case-id> ["Incident name"]');
  console.error('  id must match ^[a-z0-9]+(-[a-z0-9]+)*$ and is PERMANENT (citation key).');
  process.exit(1);
}

const target = path.join(INCIDENTS_DIR, `${id}.yml`);
if (existsSync(target)) {
  console.error(`new:incident: refusing to overwrite existing ${path.relative(process.cwd(), target)}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const template = readFileSync(path.join(INCIDENTS_DIR, '_TEMPLATE.yml'), 'utf8');

const out = template
  .replace(/^id: .*$/m, `id: ${id}`)
  .replace(/^name: .*$/m, `name: ${JSON.stringify(name ?? 'TODO: incident name')}`)
  .replace(/^date_disclosed: .*$/m, 'date_disclosed: 2026-01-01 # TODO: source — set real disclosure date')
  .replace(/^added:\n  date: .*$/m, `added:\n  date: ${today}`)
  .replace(/^last_updated: .*$/m, `last_updated: ${today}`);

writeFileSync(target, out);
console.log(`new:incident: created ${path.relative(process.cwd(), target)}`);
console.log('Next: fill every field from cited sources, then run `npm run validate`.');
