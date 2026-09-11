#!/usr/bin/env node
// Validate every incident record (including _TEMPLATE.yml) against
// schema/incident.schema.json, enforce id/filename/uniqueness rules, and
// cross-check taxonomy files against the schema enums.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';
import {
  listIncidentFiles,
  loadIncident,
  loadSchema,
  loadTaxonomies,
  ROOT,
} from './lib.mjs';
import { editorialErrors, geoErrors } from './rules.mjs';

const errors = [];
const warnings = [];
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
  autonomy_level: schema.properties.autonomy_level.enum,
  guardrail_bypass: schema.properties.guardrail_bypass.items.enum,
  ai_role: schema.properties.ai_role.enum,
  record_status: schema.properties.record_status.enum,
  geo_basis: schema.$defs.geoPoint.properties.basis.enum,
};

const taxonomies = loadTaxonomies();
// Recommended (soft) vocabulary for free-text target sectors.
const allowedSectors = new Set(
  (taxonomies.find((t) => t.key === 'sectors')?.values ?? []).map((v) => v.id)
);
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

// --- dataset version sync ----------------------------------------------------
// The dataset version lives in two files; a release is only coherent if they agree.
try {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const cff = parse(readFileSync(path.join(ROOT, 'CITATION.cff'), 'utf8'));
  if (String(pkg.version) !== String(cff.version)) {
    errors.push(
      `version mismatch: package.json (${pkg.version}) != CITATION.cff (${cff.version})`
    );
  }
} catch (e) {
  errors.push(`version sync check failed: ${e.message}`);
}

// --- incident records --------------------------------------------------------
const files = listIncidentFiles({ includeUnderscore: true });
const seenIds = new Map();
const relatedRefs = []; // { rel, id, related: string[] } — checked after all ids are known.
const supersedeRefs = []; // { rel, id, target } — checked after all ids are known.
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
  if (!isTemplate) {
    const editorial = editorialErrors(record, rel);
    errors.push(...editorial.errors);
    warnings.push(...editorial.warnings);
    // Map points: basis/role/attribution rules (see scripts/rules.mjs).
    errors.push(...geoErrors(record, rel).errors);
    if (Array.isArray(record.related) && record.related.length) {
      relatedRefs.push({ rel, id: record.id, related: record.related });
    }
    if (record.record_status === 'superseded') {
      if (!record.superseded_by) {
        errors.push(`${rel}: record_status "superseded" requires superseded_by`);
      } else {
        supersedeRefs.push({ rel, id: record.id, target: record.superseded_by });
      }
    } else if (record.superseded_by) {
      errors.push(`${rel}: superseded_by is only valid when record_status is "superseded"`);
    }
    for (const sec of record.targets?.sectors ?? []) {
      if (allowedSectors.size && !allowedSectors.has(sec)) {
        warnings.push(
          `${rel}: sector "${sec}" not in taxonomy/sector.yml (free-text allowed; add it there for consistent aggregation)`
        );
      }
    }
  }
}

// --- record relationships ----------------------------------------------------
// related[] ids must resolve to real records and never point at themselves.
for (const { rel, id, related } of relatedRefs) {
  for (const ref of related) {
    if (ref === id) errors.push(`${rel}: related[] references itself ("${ref}")`);
    else if (!seenIds.has(ref)) errors.push(`${rel}: related[] id "${ref}" has no matching record`);
  }
}
for (const { rel, id, target } of supersedeRefs) {
  if (target === id) errors.push(`${rel}: superseded_by points at itself ("${target}")`);
  else if (!seenIds.has(target)) errors.push(`${rel}: superseded_by "${target}" has no matching record`);
}

if (files.length === 0) {
  errors.push('data/incidents: no incident files found (expected at least _TEMPLATE.yml)');
}

// --- report ------------------------------------------------------------------
// Warnings are soft signals — they print but never change the exit code.
if (warnings.length) {
  console.warn(`validate: ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  console.warn('');
}

if (errors.length) {
  console.error(`validate: FAIL — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `validate: OK — ${checked} record(s) valid against schema, ` +
    `${taxonomies.length} taxonomy file(s) in sync, ids unique.`
);
