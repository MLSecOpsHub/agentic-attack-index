// Hermetic tests for the map-point (geo.points[]) rules: one failing fixture
// per rule, plus a check that every real record migrated to the new shape.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { geoErrors } from '../scripts/rules.mjs';
import { listIncidentFiles, loadIncident, loadSchema, loadTaxonomies } from '../scripts/lib.mjs';

const schema = loadSchema();
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

// A minimal, schema-valid record to hang fixtures on.
const base = () => ({
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
  actor_type: 'nation-state',
  sources: [
    { title: 'Fixture source', url: 'https://fixture.invalid/a', publisher: 'Fixture Publisher', type: 'vendor-report', date: '2026-01-01' },
  ],
});
const point = (over = {}) => ({
  role: 'origin',
  basis: 'sponsor-attribution',
  attributed_by: 'Fixture Publisher',
  country: 'XX',
  lat: 0,
  lng: 0,
  label: 'Fixture point',
  illustrative: true,
  ...over,
});
const withPoints = (points, over = {}) => ({ ...base(), ...over, geo: { points } });
const errorsOf = (record) => geoErrors(record, 'fixture').errors;

test('schema: a valid point passes, geo without points fails, legacy target/origin slots fail', () => {
  assert.equal(validate(withPoints([point()])), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...base(), geo: {} }), false);
  assert.equal(validate({ ...base(), geo: { points: [] } }), false, 'empty points must fail (omit geo instead)');
  assert.equal(validate({ ...base(), geo: { target: { lat: 0, lng: 0, label: 'x', illustrative: true } } }), false);
});

test('schema: basis, attributed_by, role, country are required and enum/pattern-checked', () => {
  for (const key of ['role', 'basis', 'attributed_by', 'country', 'lat', 'lng', 'label', 'illustrative']) {
    const p = point();
    delete p[key];
    assert.equal(validate(withPoints([p])), false, `missing ${key} must fail`);
  }
  assert.equal(validate(withPoints([point({ basis: 'guess' })])), false);
  assert.equal(validate(withPoints([point({ role: 'both' })])), false);
  assert.equal(validate(withPoints([point({ country: 'usa' })])), false, 'country must be ISO alpha-2 uppercase');
  assert.equal(validate(withPoints([point({ country: null })])), true, 'null country allowed by schema (rule checks illustrative)');
});

test('schema: geo_basis taxonomy matches the schema enum', () => {
  const tax = loadTaxonomies().find((t) => t.key === 'geo_basis');
  assert.ok(tax, 'taxonomy/geo-basis.yml must exist with key geo_basis');
  assert.deepEqual(tax.values.map((v) => v.id).sort(), [...schema.$defs.geoPoint.properties.basis.enum].sort());
});

test('rule: basis must be allowed for the role', () => {
  assert.equal(errorsOf(withPoints([point()])).length, 0);
  assert.match(errorsOf(withPoints([point({ role: 'target' })]))[0], /not allowed with role "target"/);
  assert.match(errorsOf(withPoints([point({ role: 'origin', basis: 'victim-location' })]))[0], /not allowed with role "origin"/);
  assert.equal(errorsOf(withPoints([point({ role: 'target', basis: 'stated-location', illustrative: false })])).length, 0);
});

test('rule: attributed_by must equal a sources[].publisher on the record', () => {
  const errs = errorsOf(withPoints([point({ attributed_by: 'Someone Else' })]));
  assert.equal(errs.length, 1);
  assert.match(errs[0], /does not match any sources\[\]\.publisher/);
});

test('rule: stated-location requires illustrative false; every other basis requires illustrative true', () => {
  assert.match(errorsOf(withPoints([point({ basis: 'stated-location', illustrative: true })]))[0], /requires illustrative: false/);
  assert.match(errorsOf(withPoints([point({ illustrative: false })]))[0], /requires illustrative: true/);
});

test('rule: country may be null only on an illustrative region centroid', () => {
  assert.equal(errorsOf(withPoints([point({ country: null })])).length, 0);
  const errs = errorsOf(withPoints([point({ basis: 'stated-location', illustrative: false, country: null })]));
  assert.ok(errs.some((e) => /country may be null only/.test(e)), errs.join('\n'));
});

test('rule: researcher and lab-test-eval records carry target points only', () => {
  for (const actor_type of ['researcher', 'lab-test-eval']) {
    const errs = errorsOf(withPoints([point()], { actor_type }));
    assert.equal(errs.length, 1, actor_type);
    assert.match(errs[0], /target points only/);
    assert.equal(errorsOf(withPoints([point({ role: 'target', basis: 'victim-location' })], { actor_type })).length, 0);
  }
});

test('rule: actor_type unknown cannot carry a point that claims who or where the actor is', () => {
  for (const basis of ['sponsor-attribution', 'operator-location', 'actor-location']) {
    const errs = errorsOf(withPoints([point({ basis })], { actor_type: 'unknown', actor: 'Unknown' }));
    assert.equal(errs.length, 1, basis);
    assert.match(errs[0], /actor_type is "unknown"/);
  }
  assert.equal(errorsOf(withPoints([point({ basis: 'infrastructure' })], { actor_type: 'unknown', actor: 'Unknown' })).length, 0);
  assert.equal(errorsOf(withPoints([point({ role: 'target', basis: 'victim-location' })], { actor_type: 'unknown', actor: 'Unknown' })).length, 0);
});

test('rule: records without geo produce no errors', () => {
  assert.equal(errorsOf(base()).length, 0);
});

test('migration: every real record validates, has no legacy geo slots, and every point is fully attributed', () => {
  const files = listIncidentFiles();
  assert.ok(files.length > 0);
  let pointCount = 0;
  for (const file of files) {
    const rec = loadIncident(file);
    assert.equal(validate(rec), true, `${file}: ${JSON.stringify(validate.errors)}`);
    assert.equal(errorsOf(rec).length, 0, `${file}: ${errorsOf(rec).join('; ')}`);
    if (rec.geo) {
      assert.equal('target' in rec.geo, false, `${file}: legacy geo.target`);
      assert.equal('origin' in rec.geo, false, `${file}: legacy geo.origin`);
      const publishers = new Set(rec.sources.map((s) => s.publisher));
      for (const p of rec.geo.points) {
        pointCount++;
        assert.ok(p.basis && p.attributed_by, `${file}: point lacks basis/attributed_by`);
        assert.ok(publishers.has(p.attributed_by), `${file}: ${p.attributed_by} is not a cited publisher`);
        assert.ok(p.country === null ? p.illustrative === true : /^[A-Z]{2}$/.test(p.country), `${file}: bad country`);
      }
    }
  }
  assert.ok(pointCount > 0, 'expected at least one migrated point');
});
