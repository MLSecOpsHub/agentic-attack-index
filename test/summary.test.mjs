// Hermetic tests for the derived summary rollups in scripts/summary.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceSplit, activeRecords } from '../scripts/summary.mjs';
import { listIncidentFiles, loadIncident } from '../scripts/lib.mjs';

const rec = (over = {}) => ({
  id: 'r',
  date_disclosed: '2025-06-01',
  status: 'confirmed',
  ai_role: 'load-bearing',
  ...over,
});

test('evidence_split counts only records that are confirmed AND load-bearing', () => {
  const out = evidenceSplit([
    rec({ id: 'a' }),
    rec({ id: 'b', status: 'reported' }),
    rec({ id: 'c', ai_role: 'significant' }),
    rec({ id: 'd', status: 'test-eval', ai_role: 'incidental' }),
  ]);
  assert.equal(out.total, 4);
  assert.equal(out.confirmed_load_bearing, 1);
  assert.equal(out.pct, 25);
  assert.deepEqual(out.ids, ['a']);
  assert.deepEqual(out.by_status_ai_role, {
    confirmed: { 'load-bearing': 1, significant: 1 },
    reported: { 'load-bearing': 1 },
    'test-eval': { incidental: 1 },
  });
});

test('evidence_split excludes retracted and superseded records from every figure', () => {
  const out = evidenceSplit([
    rec({ id: 'a' }),
    rec({ id: 'b', record_status: 'retracted' }),
    rec({ id: 'c', record_status: 'superseded' }),
    rec({ id: 'd', record_status: 'disputed' }), // disputed stays in; it is still a live claim
  ]);
  assert.equal(out.total, 2);
  assert.equal(out.confirmed_load_bearing, 2);
  assert.deepEqual(out.ids, ['a', 'd']);
  assert.equal(activeRecords([rec({ record_status: 'active' }), rec({ record_status: 'retracted' })]).length, 1);
});

test('evidence_split by_year is keyed on the disclosure year, sorted, with per-year pct', () => {
  const out = evidenceSplit([
    rec({ id: 'a', date_disclosed: '2025-01-01' }),
    rec({ id: 'b', date_disclosed: '2025-02-01', status: 'reported' }),
    rec({ id: 'c', date_disclosed: '2024-12-31' }),
  ]);
  assert.deepEqual(Object.keys(out.by_year), ['2024', '2025']);
  assert.deepEqual(out.by_year['2025'], { total: 2, confirmed_load_bearing: 1, pct: 50 });
  assert.deepEqual(out.by_year['2024'], { total: 1, confirmed_load_bearing: 1, pct: 100 });
});

test('evidence_split: null ai_role is tallied as "unknown", mirroring by_ai_role', () => {
  const out = evidenceSplit([rec({ id: 'a', ai_role: null })]);
  assert.deepEqual(out.by_status_ai_role, { confirmed: { unknown: 1 } });
  assert.equal(out.confirmed_load_bearing, 0);
});

test('evidence_split over the real dataset is internally consistent', () => {
  const incidents = listIncidentFiles().map((f) => loadIncident(f));
  const out = evidenceSplit(incidents);
  assert.equal(out.total, activeRecords(incidents).length);
  assert.equal(out.ids.length, out.confirmed_load_bearing);
  const yearSum = Object.values(out.by_year).reduce((n, y) => n + y.confirmed_load_bearing, 0);
  assert.equal(yearSum, out.confirmed_load_bearing);
  assert.ok(out.confirmed_load_bearing <= out.total);
});
