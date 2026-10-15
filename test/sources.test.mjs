// Hermetic tests for source URL rules: url must be http(s); archive_url must be
// a Wayback Machine snapshot, so no other host can be introduced as an archive.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { loadSchema } from '../scripts/lib.mjs';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(loadSchema());

const withSource = (src) => ({
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
  sources: [{ title: 'Fixture source', url: 'https://fixture.invalid/a', publisher: 'Fixture Publisher', type: 'vendor-report', date: '2026-01-01', ...src }],
});

test('archive_url accepts a Wayback snapshot with a 14-digit timestamp', () => {
  assert.equal(validate(withSource({ archive_url: 'https://web.archive.org/web/20261015120000/https://fixture.invalid/a' })), true, JSON.stringify(validate.errors));
});

for (const bad of [
  'https://evil.example/web/20261015120000/https://fixture.invalid/a', // another host
  'http://web.archive.org/web/20261015120000/https://fixture.invalid/a', // not https
  'https://web.archive.org/web/0/https://fixture.invalid/a', // no timestamp
  'https://web.archive.org.evil.example/web/20261015120000/x', // look-alike host
  'javascript:alert(1)', // script scheme
]) {
  test(`archive_url rejects ${bad}`, () => {
    assert.equal(validate(withSource({ archive_url: bad })), false);
  });
}

test('url rejects non-http(s) schemes', () => {
  assert.equal(validate(withSource({ url: 'javascript:alert(1)' })), false);
  assert.equal(validate(withSource({ url: 'data:text/html,x' })), false);
});
