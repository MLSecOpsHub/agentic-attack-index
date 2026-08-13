#!/usr/bin/env node
// Build dist/ artifacts from data/incidents/*.yml. Deterministic: sorted
// records, sorted keys, no timestamps — identical input yields identical
// output. Template/underscore files are excluded. Never hand-edit dist/.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DIST_DIR, listIncidentFiles, loadIncident, sortKeysDeep } from './lib.mjs';

const incidents = listIncidentFiles()
  .map((file) => loadIncident(file))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(sortKeysDeep);

const tally = (values) => {
  const counts = {};
  for (const v of values) {
    if (v === undefined || v === null || v === '') continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return sortKeysDeep(counts);
};
const countBy = (key) => tally(incidents.map((i) => i[key]));
const countByArray = (key) =>
  tally(incidents.flatMap((i) => (Array.isArray(i[key]) ? i[key] : [])));

const summary = {
  total: incidents.length,
  by_category: countBy('category'),
  by_severity: countBy('severity'),
  by_status: countBy('status'),
  by_actor_type: countBy('actor_type'),
  by_autonomy_level: countBy('autonomy_level'),
  by_ai_role: countBy('ai_role'),
  by_model_family: countByArray('model_families'),
  by_year: tally(incidents.map((i) => (i.date_disclosed ?? '').slice(0, 4))),
  ids: incidents.map((i) => i.id),
};

mkdirSync(DIST_DIR, { recursive: true });
const write = (name, data) => {
  writeFileSync(path.join(DIST_DIR, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`build: wrote dist/${name}`);
};
write('incidents.json', incidents);
write('summary.json', summary);
console.log(`build: OK — ${incidents.length} incident(s).`);
