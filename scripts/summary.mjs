// Derived rollups for dist/summary.json that downstream consumers (the Rogue
// Agent Watch dashboard, notebooks, papers) must read instead of recomputing,
// so every consumer quotes the same number. Counts only; no scores, no weights.

const HEADLINE_EXCLUDED = new Set(['retracted', 'superseded']);

/** Records that count toward headline figures (retracted/superseded excluded). */
export function activeRecords(incidents) {
  return incidents.filter((i) => !HEADLINE_EXCLUDED.has(i.record_status));
}

const tally = (values) => {
  const counts = {};
  for (const v of values) {
    if (v === undefined || v === null || v === '') continue;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
};

const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);
const isConfirmedLoadBearing = (i) => i.status === 'confirmed' && i.ai_role === 'load-bearing';
const year = (i) => (i.date_disclosed ?? '').slice(0, 4);

/**
 * The evidence split: how many records are both `status: confirmed` (the
 * event happened, per a primary or corroborated source) AND
 * `ai_role: load-bearing` (AI was central to the attack, not incidental).
 * This is the dataset's honesty figure — the share of catalogued "AI attack"
 * incidents that survive both grades — and the number the launch chart uses.
 */
export function evidenceSplit(incidents) {
  const active = activeRecords(incidents);
  const clb = active.filter(isConfirmedLoadBearing);

  const byYear = {};
  for (const y of [...new Set(active.map(year))].filter(Boolean).sort()) {
    const inYear = active.filter((i) => year(i) === y);
    const n = inYear.filter(isConfirmedLoadBearing).length;
    byYear[y] = { total: inYear.length, confirmed_load_bearing: n, pct: pct(n, inYear.length) };
  }

  // status × ai_role crosstab (ai_role null -> "unknown", mirroring by_ai_role).
  const byStatusAiRole = {};
  for (const s of Object.keys(tally(active.map((i) => i.status)))) {
    byStatusAiRole[s] = tally(active.filter((i) => i.status === s).map((i) => i.ai_role ?? 'unknown'));
  }

  return {
    basis: 'status == confirmed AND ai_role == load-bearing; retracted/superseded records excluded',
    total: active.length,
    confirmed_load_bearing: clb.length,
    pct: pct(clb.length, active.length),
    by_year: byYear,
    by_status_ai_role: byStatusAiRole,
    ids: clb.map((i) => i.id).sort(),
  };
}
