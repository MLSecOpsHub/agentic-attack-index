#!/usr/bin/env node
// Populate sources[].archive_url with a Wayback Machine snapshot so records
// survive link rot. Network-dependent by design — run manually or on a
// schedule, never in the deterministic `npm test`.
//
//   npm run archive              # report mode: propose archive_url, no writes
//   npm run archive -- --write   # write archive_url back into the YAML records
//
// Idempotent: sources that already carry an archive_url are skipped. Failures
// (timeouts, Save Page Now rate limits) are logged and skipped, never fatal;
// the run exits non-zero only if there were candidates and none could be
// archived at all.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { listIncidentFiles, loadIncident } from './lib.mjs';

const WRITE = process.argv.includes('--write');
const TIMEOUT_MS = 30_000;
const UA = 'agentic-attack-index-archive';

const setTimeoutP = (ms) => new Promise((r) => setTimeout(r, ms));

// Ask the Wayback availability API for the closest existing snapshot.
async function findSnapshot(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(api, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': UA },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const snap = data?.archived_snapshots?.closest;
    if (snap?.available && snap.url) return snap.url.replace(/^http:\/\//, 'https://');
  } catch {
    /* fall through to null */
  }
  return null;
}

// The CDX index often answers when the availability API is rate-limiting.
// Returns the most recent HTTP-200 capture, or null.
async function findViaCdx(url) {
  const api =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    '&output=json&limit=-1&filter=statuscode:200';
  try {
    const res = await fetch(api, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': UA },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    // rows[0] is the column header; each row is [urlkey, timestamp, original, ...].
    if (Array.isArray(rows) && rows.length > 1) {
      const [, timestamp, original] = rows[rows.length - 1];
      return `https://web.archive.org/web/${timestamp}/${original}`;
    }
  } catch {
    /* fall through to null */
  }
  return null;
}

// Trigger Save Page Now, then re-query availability for the fresh snapshot.
async function saveSnapshot(url) {
  try {
    await fetch(`https://web.archive.org/save/${url}`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': UA },
    });
  } catch {
    /* SPN is best-effort; the availability re-check below is the source of truth */
  }
  await setTimeoutP(3000);
  return findSnapshot(url);
}

// Resolve the best archive_url for a source url, or null if none could be made.
async function resolveArchive(url) {
  const existing = await findSnapshot(url);
  if (existing) return { url: existing, how: 'existing snapshot' };
  const viaCdx = await findViaCdx(url);
  if (viaCdx) return { url: viaCdx, how: 'existing snapshot (cdx)' };
  const saved = await saveSnapshot(url);
  if (saved) return { url: saved, how: 'saved (new snapshot)' };
  return null;
}

const files = listIncidentFiles();
let candidates = 0;
let resolved = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const record = loadIncident(file);
  const sources = record.sources ?? [];

  // First pass: figure out what each source needs (read-only).
  const updates = []; // { index, url, archiveUrl, how }
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    if (!src?.url || src.archive_url) continue;
    candidates++;
    const got = await resolveArchive(src.url);
    if (got) {
      resolved++;
      updates.push({ index: i, url: src.url, archiveUrl: got.url, how: got.how });
    } else {
      updates.push({ index: i, url: src.url, archiveUrl: null, how: 'FAILED' });
    }
  }

  if (updates.length === 0) continue;
  console.log(`\n${rel}`);
  for (const u of updates) {
    if (u.archiveUrl) console.log(`  ✓ ${u.url}\n      → ${u.archiveUrl}  (${u.how})`);
    else console.log(`  ✗ ${u.url}\n      → could not archive (${u.how})`);
  }

  // Second pass: insert `archive_url` as a new line right after the matching
  // `url:` line. Targeted text edit (not a YAML re-serialization) so all other
  // formatting — folded block scalars, comments, quoting — is byte-preserved.
  if (WRITE) {
    const lines = readFileSync(file, 'utf8').split('\n');
    let wrote = 0;
    for (const u of updates) {
      if (!u.archiveUrl) continue;
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(\s*)url:\s*"?([^"\s]+)"?\s*$/);
        if (m && m[2] === u.url) {
          if (/^\s*archive_url:/.test(lines[i + 1] ?? '')) break; // already present
          lines.splice(i + 1, 0, `${m[1]}archive_url: "${u.archiveUrl}"`);
          wrote++;
          break;
        }
      }
    }
    if (wrote) {
      writeFileSync(file, lines.join('\n'));
      console.log(`  wrote ${wrote} archive_url value(s) to ${rel}`);
    }
  }
}

console.log(
  `\narchive: ${resolved}/${candidates} source(s) archived` +
    (WRITE ? ' (written)' : ' (report only — re-run with --write to save)') +
    '.'
);
if (candidates === 0) console.log('archive: nothing to do — every source already has an archive_url.');
if (candidates > 0 && resolved === 0) {
  console.error('archive: FAIL — could not archive any source (network/rate-limit?).');
  process.exit(1);
}
