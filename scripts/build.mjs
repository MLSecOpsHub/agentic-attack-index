#!/usr/bin/env node
// Build dist/ artifacts from data/incidents/*.yml. Deterministic: sorted
// records, sorted keys, no timestamps — identical input yields identical
// output. Template/underscore files are excluded. Never hand-edit dist/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  DIST_DIR,
  ROOT,
  listIncidentFiles,
  loadIncident,
  loadSchema,
  sortKeysDeep,
} from './lib.mjs';
import { buildStixBundle } from './stix.mjs';

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const schema = loadSchema();

const incidents = listIncidentFiles()
  .map((file) => loadIncident(file))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(sortKeysDeep);

// --- summary rollups ---------------------------------------------------------
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

let sourceCount = 0;
let archivedCount = 0;
for (const inc of incidents) {
  for (const src of inc.sources ?? []) {
    sourceCount++;
    if (src.archive_url) archivedCount++;
  }
}

const summary = {
  dataset_version: pkg.version,
  schema: schema.$id,
  total: incidents.length,
  archive_coverage: {
    sources: sourceCount,
    archived: archivedCount,
    pct: sourceCount ? Math.round((archivedCount / sourceCount) * 100) : 0,
  },
  by_category: countBy('category'),
  by_severity: countBy('severity'),
  by_status: countBy('status'),
  by_actor_type: countBy('actor_type'),
  by_autonomy_level: tally(incidents.map((i) => i.autonomy_level ?? 'unknown')),
  by_ai_role: tally(incidents.map((i) => i.ai_role ?? 'unknown')),
  by_model_family: countByArray('model_families'),
  by_year: tally(incidents.map((i) => (i.date_disclosed ?? '').slice(0, 4))),
  ids: incidents.map((i) => i.id),
};

// --- flat formats (NDJSON, CSV) ----------------------------------------------
const ndjson = incidents.map((i) => JSON.stringify(i)).join('\n') + '\n';

const CSV_COLUMNS = [
  ['id', (i) => i.id],
  ['name', (i) => i.name],
  ['date_disclosed', (i) => i.date_disclosed],
  ['status', (i) => i.status],
  ['confidence', (i) => i.confidence],
  ['category', (i) => i.category],
  ['severity', (i) => i.severity],
  ['actor', (i) => i.actor],
  ['actor_type', (i) => i.actor_type],
  ['autonomy_level', (i) => i.autonomy_level],
  ['ai_role', (i) => i.ai_role],
  ['model_families', (i) => i.model_families],
  ['guardrail_bypass', (i) => i.guardrail_bypass],
  ['mitre_atlas', (i) => i.mappings?.mitre_atlas],
  ['mitre_attack', (i) => i.mappings?.mitre_attack],
  ['cve', (i) => i.mappings?.cve],
  ['countries', (i) => i.targets?.countries],
  ['sectors', (i) => i.targets?.sectors],
];
const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join('; ') : `${v ?? ''}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv =
  [
    CSV_COLUMNS.map(([h]) => h).join(','),
    ...incidents.map((i) => CSV_COLUMNS.map(([, get]) => csvCell(get(i))).join(',')),
  ].join('\n') + '\n';

// --- landing page (GitHub Pages entry; no timestamps → deterministic) --------
const esc = (s) => `${s}`.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rows = incidents
  .map(
    (i) =>
      `<tr><td><code>${esc(i.id)}</code></td><td>${esc(i.name)}</td>` +
      `<td>${esc(i.date_disclosed)}</td><td>${esc(i.status)}</td>` +
      `<td>${esc(i.category)}</td></tr>`
  )
  .join('\n');
const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Agentic Attack Index — dataset ${esc(pkg.version)}</title>
<style>
:root{color-scheme:light dark}
body{font-family:system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #8884}
code{font-size:.85em}
.artifacts a{margin-right:1rem}
</style>
</head>
<body>
<h1>Agentic Attack Index</h1>
<p>Open, source-linked dataset of real-world AI-agent cyberattacks. Dataset version <strong>${esc(pkg.version)}</strong>, ${incidents.length} incidents.</p>
<p class="artifacts">Artifacts:
<a href="./incidents.json">incidents.json</a>
<a href="./summary.json">summary.json</a>
<a href="./incidents.ndjson">incidents.ndjson</a>
<a href="./incidents.csv">incidents.csv</a>
<a href="./stix/bundle.json">STIX 2.1 bundle</a>
</p>
<table>
<thead><tr><th>id</th><th>name</th><th>disclosed</th><th>status</th><th>category</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p>Data licensed CC BY-SA 4.0. See the <a href="https://github.com/MLSecOpsHub/agentic-attack-index">repository</a>.</p>
</body>
</html>
`;

// --- write -------------------------------------------------------------------
mkdirSync(DIST_DIR, { recursive: true });
mkdirSync(path.join(DIST_DIR, 'incidents'), { recursive: true });
mkdirSync(path.join(DIST_DIR, 'stix'), { recursive: true });

const writeJson = (name, data) => {
  writeFileSync(path.join(DIST_DIR, name), JSON.stringify(data, null, 2) + '\n');
  console.log(`build: wrote dist/${name}`);
};
const writeText = (name, text) => {
  writeFileSync(path.join(DIST_DIR, name), text);
  console.log(`build: wrote dist/${name}`);
};

writeJson('incidents.json', incidents);
writeJson('summary.json', summary);
writeText('incidents.ndjson', ndjson);
writeText('incidents.csv', csv);
writeJson('stix/bundle.json', buildStixBundle(incidents));
writeText('index.html', indexHtml);
for (const inc of incidents) {
  writeFileSync(
    path.join(DIST_DIR, 'incidents', `${inc.id}.json`),
    JSON.stringify(inc, null, 2) + '\n'
  );
}
console.log(`build: wrote dist/incidents/ (${incidents.length} per-incident file(s))`);
console.log(`build: OK — ${incidents.length} incident(s).`);
