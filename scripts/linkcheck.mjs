#!/usr/bin/env node
// Check that every source citation in real incident records still resolves.
// Network-dependent by design — run manually or on a schedule, not in `npm test`.
// Template/underscore files are excluded.
//
// Each source is one of three states:
//   OK       — sources[].url resolves.
//   ARCHIVED — url is dead but sources[].archive_url (Wayback snapshot) resolves.
//              The citation still holds, so this is a warning, not a failure.
//   DEAD     — url is dead and there is no working archive_url. This fails the run.
import path from 'node:path';
import { listIncidentFiles, loadIncident } from './lib.mjs';

const TIMEOUT_MS = 15_000;
// url -> { ids: Set<string>, archives: Set<string> }
const sources = new Map();

for (const file of listIncidentFiles()) {
  const record = loadIncident(file);
  const id = record.id ?? path.basename(file);
  for (const src of record.sources ?? []) {
    if (!src?.url) continue;
    if (!sources.has(src.url)) sources.set(src.url, { ids: new Set(), archives: new Set() });
    const entry = sources.get(src.url);
    entry.ids.add(id);
    if (src.archive_url) entry.archives.add(src.archive_url);
  }
}

if (sources.size === 0) {
  console.log('linkcheck: OK — no incident records yet, nothing to check.');
  process.exit(0);
}

// Returns null if the URL resolves, else a short problem string.
async function resolve(url) {
  const attempt = async (method) =>
    fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'agentic-attack-index-linkcheck' },
    });
  try {
    let res = await attempt('HEAD');
    // Some servers reject HEAD; retry those with GET before failing.
    if (!res.ok && [403, 405, 501].includes(res.status)) res = await attempt('GET');
    return res.ok ? null : `HTTP ${res.status}`;
  } catch (e) {
    return e.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS}ms` : e.message;
  }
}

const warnings = []; // ARCHIVED
const dead = []; // DEAD

for (const [url, { ids, archives }] of sources) {
  const usedBy = [...ids].join(', ');
  const urlProblem = await resolve(url);
  if (!urlProblem) {
    console.log(`  ✓ ${url}`);
    continue;
  }

  // url is down — try to fall back to an archive snapshot.
  let recovered = null;
  for (const archive of archives) {
    if ((await resolve(archive)) === null) {
      recovered = archive;
      break;
    }
  }

  if (recovered) {
    warnings.push({ url, recovered, usedBy, urlProblem });
    console.warn(`  ⚠ ${url} — ${urlProblem}; served from archive: ${recovered} (used by: ${usedBy})`);
  } else {
    dead.push({ url, usedBy, urlProblem });
    const note = archives.size ? '; archive_url also unreachable' : '; no archive_url on record';
    console.error(`  ✗ ${url} — ${urlProblem}${note} (used by: ${usedBy})`);
  }
}

if (warnings.length) {
  console.warn(`\nlinkcheck: ${warnings.length} URL(s) dead but recovered from archive_url — update the source URL(s).`);
}

if (dead.length) {
  console.error(`\nlinkcheck: FAIL — ${dead.length} of ${sources.size} URL(s) unreachable with no working archive.`);
  process.exit(1);
}
console.log(`\nlinkcheck: OK — all ${sources.size} URL(s) resolve (${warnings.length} via archive fallback).`);
