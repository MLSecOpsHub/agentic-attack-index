#!/usr/bin/env node
// Validate every incident record (including _TEMPLATE.yml) against
// schema/incident.schema.json, enforce id/filename/uniqueness rules, and
// cross-check taxonomy files against the schema enums.
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  listIncidentFiles,
  loadIncident,
  loadSchema,
  loadTaxonomies,
} from './lib.mjs';

const errors = [];
const schema = loadSchema();
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// --- taxonomy <-> schema enum cross-check -----------------------------------
const enumFromSchema = {
  category: schema.properties.category.enum,
  actor_type: schema.properties.actor_type.enum,
  status: schema.properties.status.enum,
  confidence: schema.properties.confidence.enum,
  severity: schema.properties.severity.enum,
  model_families: schema.properties.model_families.items.enum,
  lifecycle_phases: schema.properties.lifecycle_phases.items.enum,
  source_type: schema.properties.sources.items.properties.type.enum,
};

const taxonomies = loadTaxonomies();
for (const [key, schemaEnum] of Object.entries(enumFromSchema)) {
  const tax = taxonomies.find((t) => t.key === key);
  if (!tax) {
    errors.push(`taxonomy: no taxonomy file with key "${key}"`);
    continue;
  }
  const taxIds = (tax.values ?? []).map((v) => v.id);
  const missing = schemaEnum.filter((v) => !taxIds.includes(v));
  const extra = taxIds.filter((v) => !schemaEnum.includes(v));
  if (missing.length) errors.push(`taxonomy ${tax.file}: missing schema enum values: ${missing.join(', ')}`);
  if (extra.length) errors.push(`taxonomy ${tax.file}: values not in schema enum: ${extra.join(', ')}`);
}

// --- editorial invariants ----------------------------------------------------
// Source types that count as authoritative first-party/primary evidence.
const PRIMARY_SOURCE_TYPES = new Set([
  'first-party-disclosure',
  'vendor-report',
  'government-advisory',
  'research-paper',
]);
// Substrings that betray an unfilled template field slipping into a real record.
const PLACEHOLDER_MARKERS = [
  'example.com',
  'replace-me',
  'replace with',
  'placeholder',
  'todo:',
  'template-incident',
  'your-github-handle',
];

function editorialErrors(record, rel) {
  const out = [];
  const sources = record.sources ?? [];
  const types = sources.map((s) => s?.type);

  // confirmed must be well-supported: ≥2 sources, or a first-party/government
  // disclosure. A single secondary report is not "confirmed".
  if (record.status === 'confirmed') {
    const hasAuthoritative = types.some(
      (t) => t === 'first-party-disclosure' || t === 'government-advisory'
    );
    if (sources.length < 2 && !hasAuthoritative) {
      out.push(
        `${rel}: status "confirmed" needs ≥2 sources or a first-party/government source`
      );
    }
  }

  // primary confidence requires an actual primary-grade source.
  if (record.confidence === 'primary' && !types.some((t) => PRIMARY_SOURCE_TYPES.has(t))) {
    out.push(
      `${rel}: confidence "primary" needs a source of type ${[...PRIMARY_SOURCE_TYPES].join('/')}`
    );
  }

  // No unfilled template placeholders in real records.
  const scan = [record.name, record.summary, record.actor, record.added?.by]
    .concat(sources.flatMap((s) => [s?.title, s?.url, s?.archive_url, s?.publisher]))
    .filter((v) => typeof v === 'string');
  for (const value of scan) {
    const lower = value.toLowerCase();
    const hit = PLACEHOLDER_MARKERS.find((m) => lower.includes(m));
    if (hit) {
      out.push(`${rel}: placeholder value "${hit}" left in a real record ("${value.slice(0, 40)}")`);
      break;
    }
  }

  return out;
}

// --- incident records --------------------------------------------------------
const files = listIncidentFiles({ includeUnderscore: true });
const seenIds = new Map();
let checked = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  let record;
  try {
    record = loadIncident(file);
  } catch (e) {
    errors.push(`${rel}: YAML parse error — ${e.message}`);
    continue;
  }
  checked++;

  if (!validate(record)) {
    for (const err of validate.errors ?? []) {
      errors.push(`${rel}: ${err.instancePath || '/'} ${err.message}`);
    }
    continue;
  }

  const base = path.basename(file).replace(/\.ya?ml$/, '');
  const isTemplate = base.startsWith('_');
  if (!isTemplate && record.id !== base) {
    errors.push(`${rel}: id "${record.id}" must match filename "${base}"`);
  }
  if (seenIds.has(record.id)) {
    errors.push(`${rel}: duplicate id "${record.id}" (also in ${seenIds.get(record.id)})`);
  } else {
    seenIds.set(record.id, rel);
  }

  // Editorial invariants (CLAUDE.md non-negotiable #3: grade honesty).
  // These express rules the JSON Schema cannot, and apply only to real
  // records — the template legitimately carries placeholder values.
  if (!isTemplate) errors.push(...editorialErrors(record, rel));
}

if (files.length === 0) {
  errors.push('data/incidents: no incident files found (expected at least _TEMPLATE.yml)');
}

// --- report ------------------------------------------------------------------
if (errors.length) {
  console.error(`validate: FAIL — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `validate: OK — ${checked} record(s) valid against schema, ` +
    `${taxonomies.length} taxonomy file(s) in sync, ids unique.`
);
