// Shared helpers for the agentic-attack-index scripts.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const INCIDENTS_DIR = path.join(ROOT, 'data', 'incidents');
export const SCHEMA_PATH = path.join(ROOT, 'schema', 'incident.schema.json');
export const TAXONOMY_DIR = path.join(ROOT, 'taxonomy');
export const DIST_DIR = path.join(ROOT, 'dist');

export function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
}

// Files starting with "_" (e.g. _TEMPLATE.yml) are schema-validated but
// excluded from the built dataset and linkcheck.
export function listIncidentFiles({ includeUnderscore = false } = {}) {
  let names;
  try {
    names = readdirSync(INCIDENTS_DIR);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))
    .filter((n) => includeUnderscore || !n.startsWith('_'))
    .sort()
    .map((n) => path.join(INCIDENTS_DIR, n));
}

export function loadIncident(file) {
  return parse(readFileSync(file, 'utf8'));
}

export function loadTaxonomies() {
  return readdirSync(TAXONOMY_DIR)
    .filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))
    .sort()
    .map((n) => ({ file: n, ...parse(readFileSync(path.join(TAXONOMY_DIR, n), 'utf8')) }));
}

// Deterministic serialization: sort object keys recursively so the build
// output is byte-identical for identical inputs.
export function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeysDeep(value[k])])
    );
  }
  return value;
}
