#!/usr/bin/env node
// Check that every sources[].url in real incident records resolves.
// Network-dependent by design — run manually or on a schedule, not in `npm test`.
// Template/underscore files are excluded.
import path from 'node:path';
import { listIncidentFiles, loadIncident } from './lib.mjs';

const TIMEOUT_MS = 15_000;
const urls = new Map(); // url -> [record ids]

for (const file of listIncidentFiles()) {
  const record = loadIncident(file);
  for (const src of record.sources ?? []) {
    if (!src?.url) continue;
    if (!urls.has(src.url)) urls.set(src.url, []);
    urls.get(src.url).push(record.id ?? path.basename(file));
  }
}

if (urls.size === 0) {
  console.log('linkcheck: OK — no incident records yet, nothing to check.');
  process.exit(0);
}

async function check(url) {
  const attempt = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'agentic-attack-index-linkcheck' },
    });
    return res;
  };
  try {
    let res = await attempt('HEAD');
    // Some servers reject HEAD; retry those with GET before failing.
    if (!res.ok && [403, 405, 501].includes(res.status)) res = await attempt('GET');
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    return e.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS}ms` : e.message;
  }
}

const failures = [];
for (const [url, ids] of urls) {
  const problem = await check(url);
  if (problem) {
    failures.push({ url, ids, problem });
    console.error(`  ✗ ${url} — ${problem} (used by: ${ids.join(', ')})`);
  } else {
    console.log(`  ✓ ${url}`);
  }
}

if (failures.length) {
  console.error(`\nlinkcheck: FAIL — ${failures.length} of ${urls.size} URL(s) not resolving.`);
  process.exit(1);
}
console.log(`\nlinkcheck: OK — all ${urls.size} URL(s) resolve.`);
