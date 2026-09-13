// Editorial rules the JSON Schema cannot express. Pure functions over a parsed
// record so they can be unit-tested (test/) and reused by validate.mjs.
// Every function returns { errors: string[], warnings: string[] }.

// Source types that count as authoritative first-party/primary evidence.
export const PRIMARY_SOURCE_TYPES = new Set([
  'first-party-disclosure',
  'vendor-report',
  'government-advisory',
  'research-paper',
]);

// Substrings that betray an unfilled template field slipping into a real record.
export const PLACEHOLDER_MARKERS = [
  'example.com',
  'replace-me',
  'replace with',
  'placeholder',
  'todo:',
  'template-incident',
  'your-github-handle',
];

export function editorialErrors(record, rel) {
  const out = [];
  const warn = [];
  const sources = record.sources ?? [];
  const types = sources.map((s) => s?.type);
  const publishers = new Set(sources.map((s) => s?.publisher).filter(Boolean));
  const hasAuthoritative = types.some(
    (t) => t === 'first-party-disclosure' || t === 'government-advisory'
  );

  // confirmed must be independently supported: ≥2 sources from DISTINCT
  // publishers, or a first-party/government disclosure. Two sources from the
  // same publisher (or a single secondary report) is not "confirmed" — this is
  // the anti-poisoning bar against a lone outlet laundering a claim.
  if (record.status === 'confirmed' && publishers.size < 2 && !hasAuthoritative) {
    out.push(
      `${rel}: status "confirmed" needs ≥2 sources from distinct publishers or a first-party/government source`
    );
  }

  // primary confidence requires an actual primary-grade source.
  if (record.confidence === 'primary' && !types.some((t) => PRIMARY_SOURCE_TYPES.has(t))) {
    out.push(
      `${rel}: confidence "primary" needs a source of type ${[...PRIMARY_SOURCE_TYPES].join('/')}`
    );
  }

  // No duplicate source URLs within one record — a padded source list can fake
  // independence.
  const urls = sources.map((s) => s?.url).filter(Boolean);
  const dupUrl = urls.find((u, i) => urls.indexOf(u) !== i);
  if (dupUrl) out.push(`${rel}: duplicate source url "${dupUrl}"`);

  // Dates must be internally consistent (compared as ISO strings — hermetic,
  // no wall clock).
  if (record.added?.date && record.last_updated && record.last_updated < record.added.date) {
    out.push(
      `${rel}: last_updated (${record.last_updated}) is before added.date (${record.added.date})`
    );
  }

  // No unfilled template placeholders in real records.
  const scan = [record.name, record.summary, record.actor, record.added?.by]
    .concat(sources.flatMap((s) => [s?.title, s?.url, s?.archive_url, s?.publisher]))
    .filter((v) => typeof v === 'string');
  for (const value of scan) {
    const lower = value.toLowerCase();
    const hit = PLACEHOLDER_MARKERS.find((m) => lower.includes(m));
    if (hit) {
      out.push(`${rel}: placeholder value "${hit}" left in a real record ("${value.slice(0, 40)}")`);
      break;
    }
  }

  // Soft signal (non-failing): a record leaning on a single non-authoritative
  // publisher is the shape most vulnerable to a planted claim.
  if (publishers.size === 1 && !hasAuthoritative) {
    warn.push(
      `${rel}: all sources are from one publisher (${[...publishers][0]}) and none is first-party/government — add an independent corroborating source`
    );
  }

  return { errors: out, warnings: warn };
}

// --- map points (geo.points[]) -----------------------------------------------
// The basis of every point is an explicit, validated claim. These rules keep a
// state sponsor from being read as an operator location, keep researcher and
// lab records from acquiring an "attack origin", and keep every point tied to
// the publisher that stated it.

// Which bases are allowed for which role.
export const GEO_BASIS_ROLES = {
  'sponsor-attribution': ['origin'],
  'operator-location': ['origin'],
  'actor-location': ['origin'],
  infrastructure: ['origin'],
  'victim-location': ['target'],
  'stated-location': ['origin', 'target'],
};

// Bases that make a claim about who the actor is or where they are — not
// allowed when the record itself says the actor is unknown.
export const GEO_ACTOR_CLAIM_BASES = new Set([
  'sponsor-attribution',
  'operator-location',
  'actor-location',
]);

// Records with no attack origin: the "actor" ran a controlled test.
export const GEO_NO_ORIGIN_ACTOR_TYPES = new Set(['researcher', 'lab-test-eval']);

export function geoErrors(record, rel) {
  const out = [];
  const points = record.geo?.points;
  if (!Array.isArray(points)) return { errors: out, warnings: [] };

  const publishers = new Set((record.sources ?? []).map((s) => s?.publisher).filter(Boolean));

  points.forEach((p, i) => {
    const at = `${rel}: geo.points[${i}]`;
    const allowedRoles = GEO_BASIS_ROLES[p.basis];
    if (allowedRoles && !allowedRoles.includes(p.role)) {
      out.push(`${at}: basis "${p.basis}" is not allowed with role "${p.role}" (allowed: ${allowedRoles.join(', ')})`);
    }
    if (p.attributed_by && !publishers.has(p.attributed_by)) {
      out.push(
        `${at}: attributed_by "${p.attributed_by}" does not match any sources[].publisher on this record`
      );
    }
    if (p.basis === 'stated-location' && p.illustrative !== false) {
      out.push(`${at}: basis "stated-location" requires illustrative: false`);
    }
    if (p.basis !== 'stated-location' && p.illustrative !== true) {
      out.push(
        `${at}: basis "${p.basis}" is a centroid by definition and requires illustrative: true`
      );
    }
    if (p.country === null && p.illustrative !== true) {
      out.push(`${at}: country may be null only for an illustrative (region-centroid) point`);
    }
    if (GEO_NO_ORIGIN_ACTOR_TYPES.has(record.actor_type) && p.role === 'origin') {
      out.push(
        `${at}: actor_type "${record.actor_type}" records carry target points only (a test has no attack origin)`
      );
    }
    if (record.actor_type === 'unknown' && GEO_ACTOR_CLAIM_BASES.has(p.basis)) {
      out.push(
        `${at}: basis "${p.basis}" makes a claim about the actor, but actor_type is "unknown"`
      );
    }
  });

  return { errors: out, warnings: [] };
}
