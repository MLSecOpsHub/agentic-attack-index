// Hermetic tests for the MITRE ATLAS mapping split: techniques/tactics/
// mitigations live in mappings.mitre_atlas, case studies in
// mappings.mitre_atlas_case_studies, and the STIX export keeps them apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { listIncidentFiles, loadIncident, loadSchema } from '../scripts/lib.mjs';
import { buildStixBundle } from '../scripts/stix.mjs';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(loadSchema());

const base = (mappings) => ({
  id: 'fixture-record',
  name: 'Fixture',
  summary: 'Fixture summary long enough to satisfy the schema minimum length.',
  date_disclosed: '2026-01-01',
  status: 'reported',
  confidence: 'secondary',
  category: 'ai-orchestrated-campaign',
  severity: 'low',
  models: [],
  model_families: ['other'],
  actor: 'Fixture actor',
  actor_type: 'unknown',
  mappings,
  sources: [
    { title: 'Fixture source', url: 'https://fixture.invalid/a', publisher: 'Fixture Publisher', type: 'vendor-report', date: '2026-01-01' },
  ],
});

test('mitre_atlas accepts technique, tactic and mitigation ids', () => {
  assert.equal(validate(base({ mitre_atlas: ['AML.T0051.001', 'AML.TA0002', 'AML.M0015'] })), true, JSON.stringify(validate.errors));
});

test('mitre_atlas rejects case-study ids', () => {
  assert.equal(validate(base({ mitre_atlas: ['AML.CS0059'] })), false);
});

test('mitre_atlas_case_studies accepts only case-study ids', () => {
  assert.equal(validate(base({ mitre_atlas_case_studies: ['AML.CS0059'] })), true, JSON.stringify(validate.errors));
  assert.equal(validate(base({ mitre_atlas_case_studies: ['AML.T0051'] })), false);
});

test('STIX: case studies are report references, never attack-patterns', () => {
  const rec = base({ mitre_atlas: ['AML.T0051'], mitre_atlas_case_studies: ['AML.CS0059'] });
  const { objects } = buildStixBundle([rec]);
  const patterns = objects.filter((o) => o.type === 'attack-pattern').map((o) => o.name);
  assert.deepEqual(patterns, ['AML.T0051']);
  const report = objects.find((o) => o.type === 'report');
  assert.ok(report.external_references.some((r) => r.external_id === 'AML.CS0059' && r.url.endsWith('/studies/AML.CS0059')));
});

test('no real record carries a case-study id in mitre_atlas', () => {
  for (const file of listIncidentFiles()) {
    const inc = loadIncident(file);
    for (const id of inc.mappings?.mitre_atlas ?? []) {
      assert.doesNotMatch(id, /^AML\.CS/, `${inc.id}: ${id} belongs in mitre_atlas_case_studies`);
    }
  }
});
