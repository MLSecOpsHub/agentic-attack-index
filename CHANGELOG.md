# Changelog

All notable changes to this dataset and its tooling are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
dataset version tracks `package.json` and `CITATION.cff` (kept in sync by
`npm run validate`).

## [Unreleased]

### Added
- Coverage expansion from 11 to 16 incidents: Morris II (research GenAI worm
  PoC), PROMPTFLUX (experimental Gemini self-modifying malware, cross-linked to
  PROMPTSTEAL), the Replit AI agent production-database deletion, ForcedLeak
  (Salesforce Agentforce indirect injection), and ServiceNow Now Assist
  agent-to-agent injection (cross-linked to ForcedLeak) — each with MITRE ATLAS
  mappings, autonomy/guardrail/AI-role classification, and Wayback snapshots.

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
