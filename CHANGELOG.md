# Changelog

All notable changes to this dataset and its tooling are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
dataset version tracks `package.json` and `CITATION.cff` (kept in sync by
`npm run validate`).

## [Unreleased]

## [0.3.0] - 2026-09-11

### Changed (breaking)
- **Map points now carry an explicit, validated basis.** `geo.target` and
  `geo.origin` are removed (not deprecated; the schema keeps
  `additionalProperties: false`). `geo` is now either omitted or
  `{ points: [...] }`, and every point requires `role` (origin | target),
  `basis` (see `taxonomy/geo-basis.yml`: sponsor-attribution |
  operator-location | actor-location | infrastructure | victim-location |
  stated-location), `attributed_by` (must equal a `sources[].publisher` on the
  record), `country` (ISO 3166-1 alpha-2, or null only for a region centroid),
  plus the existing `lat`, `lng`, `label`, `illustrative`.
  **Consumers must read `geo.points[]`.** A state sponsor is not an operator
  location; the basis field makes the difference machine-readable instead of
  living in free-text labels.
- New validation errors (`npm run validate`, unit-tested in `test/`): basis must
  be allowed for the role; `attributed_by` must be a cited publisher;
  `stated-location` requires `illustrative: false` and every other basis
  requires `illustrative: true`; `country: null` only on an illustrative point;
  `researcher` / `lab-test-eval` records carry target points only;
  `actor_type: unknown` records cannot carry sponsor-attribution,
  operator-location, or actor-location points.
- `npm test` now also runs the hermetic `node:test` suite in `test/`.
  Editorial rules moved from `scripts/validate.mjs` into `scripts/rules.mjs`
  so they can be unit-tested; behaviour unchanged.

### Added
- Coverage expansion from 11 to 16 incidents: Morris II (research GenAI worm
  PoC), PROMPTFLUX (experimental Gemini self-modifying malware, cross-linked to
  PROMPTSTEAL), the Replit AI agent production-database deletion, ForcedLeak
  (Salesforce Agentforce indirect injection), and ServiceNow Now Assist
  agent-to-agent injection (cross-linked to ForcedLeak) — each with MITRE ATLAS
  mappings, autonomy/guardrail/AI-role classification, and Wayback snapshots.
- `taxonomy/geo-basis.yml`.
- `dist/summary.json` gained `geo_coverage { records, points, illustrative,
  by_role, by_basis }` (counts only).
- `dist/incidents.csv` gained a `geo_points` column (`role:basis:country`
  entries joined with `; `).

### Data (migration, every basis verified against the cited sources)
- `gtg-1002-ai-espionage`: origin CN re-typed `sponsor-attribution`
  (Anthropic: "assess with high confidence was a Chinese state-sponsored group").
- `promptsteal-apt28-lamehug`: origin RU `sponsor-attribution` and target UA
  `victim-location` (GTIG: "the Russian government-backed actor APT28 ...
  against Ukraine").
- `gtg-5004-ai-ransomware-raas`: origin GB `actor-location` (Anthropic report:
  "a UK-based threat actor"; no state sponsorship claimed).
- `dprk-it-worker-fraud-claude`: origin KP re-typed `sponsor-attribution`
  (sources state regime affiliation and funding, not operator location; the old
  "operator origin" label was a correction, recorded in `revisions[]`); added
  target US `victim-location` and `targets.countries: [US]` (Anthropic: "US
  Fortune 500 technology companies").
- `microsoft-openai-state-actor-llm`: four `sponsor-attribution` origin points
  (RU, KP, IR, CN) from the affiliations Microsoft states for the five actors;
  no target points, because the disclosure describes actor profiles, not
  victims of the LLM misuse.
- All other records reviewed: no cited source states a location, so no points.

## [0.2.0] - 2026-08-13

### Added
- **Record lifecycle & provenance governance:** `record_status`
  (active / disputed / retracted / superseded), `superseded_by` (validated to
  resolve), and an append-only `revisions[]` correction trail.
- **Provenance durability:** optional `sources[].archive_url`, a Wayback archiver
  (`npm run archive`, with availability/CDX/Save-Page-Now resolution), and a
  three-state `linkcheck` (OK / ARCHIVED / DEAD) that falls back to the snapshot
  when a live URL dies.
- **Review integrity:** `.github/CODEOWNERS`; `confirmed` now requires ≥2 sources
  from distinct publishers or a first-party/government source; source-URL dedup,
  `last_updated >= added.date`, and a single-publisher warning.
- **Analytical layer:** `autonomy_level`, `guardrail_bypass`, `ai_role`,
  `related[]`, and `mitigations[]` fields (with taxonomies); MITRE ATLAS/ATT&CK
  mappings across records; `owasp_llm` split from `owasp_asi`; `qwen` model family;
  a controlled `sectors` vocabulary (soft-warn).
- **Distribution & interoperability:** `dist/` now also emits NDJSON, CSV,
  per-incident JSON (`dist/incidents/<id>.json`), a STIX 2.1 bundle
  (`dist/stix/bundle.json`), and a GitHub Pages landing page (`dist/index.html`).
  `summary.json` gained `dataset_version`, `schema`, `archive_coverage`, and
  rollups by actor type, autonomy level, AI role, model family, and year.
- **Tooling:** `validate` version-sync check (`package.json` == `CITATION.cff`),
  `related[]` id resolution, new taxonomy cross-checks; a GitHub Pages deploy
  workflow.

## [0.1.0] - 2026-08-12

### Added
- Initial dataset: 11 source-linked incidents across all five categories.
- Canonical JSON Schema (draft 2020-12), controlled taxonomies, and deterministic
  `validate` / `build` / `linkcheck` tooling.
- CI gate (`validate + build` + `dist/` drift check) and a weekly scheduled
  linkcheck that files a tracked issue on failure.
