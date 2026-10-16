// Hermetic tests for the MITRE ATLAS mapping split: techniques/tactics/
// mitigations live in mappings.mitre_atlas, case studies in
// mappings.mitre_atlas_case_studies, and the STIX export keeps them apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { listIncidentFiles, loadAtlas, loadIncident, loadSchema } from '../scripts/lib.mjs';
import { mappingErrors } from '../scripts/rules.mjs';
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

// --- ATLAS ids must exist as published (schema/mitre-atlas.json) -------------
const atlas = loadAtlas();
const atlasErrors = (mappings) => mappingErrors(base(mappings), 'fixture.yml', atlas).errors;

test('mitre-atlas.json names its ATLAS release and its adapted techniques exist', () => {
  assert.match(atlas.version, /^\d{4}\.\d{2}$/);
  assert.ok(Object.keys(atlas.techniques).length > 100);
  for (const id of Object.keys(atlas.attack_adapted)) assert.ok(atlas.techniques[id], `${id} not a technique`);
});

test('mappingErrors accepts published technique, tactic, mitigation and case-study ids', () => {
  assert.deepEqual(
    atlasErrors({ mitre_atlas: ['AML.T0051.001', 'AML.TA0002', 'AML.M0015'], mitre_atlas_case_studies: ['AML.CS0059'] }),
    []
  );
});

test('mappingErrors rejects ids that are not in the ATLAS release', () => {
  assert.equal(atlasErrors({ mitre_atlas: ['AML.T9999'] }).length, 1);
  assert.equal(atlasErrors({ mitre_atlas: ['AML.TA0099'] }).length, 1);
  assert.equal(atlasErrors({ mitre_atlas_case_studies: ['AML.CS9999'] }).length, 1);
});

test('mappingErrors sends ATT&CK-adapted ATLAS techniques to mitre_attack', () => {
  const [err] = atlasErrors({ mitre_atlas: ['AML.T0049'] });
  assert.match(err, /ATT&CK T1190/);
  // An adapted sub-technique that is specific to AI stays in mitre_atlas.
  assert.deepEqual(atlasErrors({ mitre_atlas: ['AML.T0006.002'] }), []);
});

test('every real record maps only published, AI-native ATLAS ids', () => {
  for (const file of listIncidentFiles()) {
    const inc = loadIncident(file);
    assert.deepEqual(mappingErrors(inc, inc.id, atlas).errors, []);
  }
});
