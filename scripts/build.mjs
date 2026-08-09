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

const countBy = (key) => {
  const counts = {};
  for (const inc of incidents) counts[inc[key]] = (counts[inc[key]] ?? 0) + 1;
  return sortKeysDeep(counts);
};

const summary = {
  total: incidents.length,
  by_category: countBy('category'),
  by_severity: countBy('severity'),
  by_status: countBy('status'),
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
