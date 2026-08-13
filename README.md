# Agentic Attack Index

An open, source-linked dataset of real-world cyberattacks executed or orchestrated by AI agents, plus notable offensive/agentic-AI incidents. This repository is the data layer behind the **Rogue Agent Watch** tracker, published by [MLSecOpsHub](https://mlsecopshub.com).

> The product is trust: every factual field in every record is backed by a cited, resolvable source. Accuracy and provenance matter more than volume or speed.

## Who this is for

Defenders, researchers, journalists, and policymakers who need a grounded, citable record of how AI agents are being used in real attacks — with honest grading of what is confirmed, reported, or lab-only.

## Dataset layout

| Path | What it is |
| --- | --- |
| `data/incidents/<id>.yml` | One record per incident — the source of truth |
| `schema/incident.schema.json` | Canonical JSON Schema (draft 2020-12) — authoritative |
| `taxonomy/*.yml` | Controlled vocabularies (categories, actor types, severities, …) |
| `dist/` | Generated JSON artifacts — never hand-edited |

Each record carries a stable `id` (its permanent citation key), a lifecycle-level defensive summary, verification `status` (`confirmed` / `reported` / `test-eval`), sourcing `confidence` (`primary` / `secondary` / `unverified`), and at least one resolvable source.

Records also carry an analytical layer for defenders: an agentic **`autonomy_level`**, a **`guardrail_bypass`** classification (how safety controls were circumvented), an **`ai_role`** skepticism axis (how central AI actually was, independent of status), **MITRE ATLAS / ATT&CK** mappings, OWASP references, `related[]` links between records from the same report or campaign, and `mitigations`. `dist/summary.json` rolls these up (by category, severity, status, actor type, autonomy level, AI role, model family, and year).

## Using the data

```sh
npm ci
npm run build     # writes the dist/ artifacts below
```

`npm run build` emits, deterministically:

| Artifact | Format |
| --- | --- |
| `dist/incidents.json` | full dataset (array) |
| `dist/incidents.ndjson` | newline-delimited JSON (streaming) |
| `dist/incidents.csv` | flattened columns for spreadsheets |
| `dist/incidents/<id>.json` | one file per incident (stable per-record URL) |
| `dist/summary.json` | counts + rollups (category, severity, status, actor type, autonomy level, AI role, model family, year) + `archive_coverage` |
| `dist/stix/bundle.json` | STIX 2.1 bundle (reports + ATLAS/ATT&CK attack-patterns + CVE vulnerabilities) for TIP/MISP ingestion |
| `dist/index.html` | landing page (served via GitHub Pages) |

Or consume `dist/incidents.json` directly. Data is licensed [CC BY-SA 4.0](LICENSE-data); tooling is [MIT](LICENSE). Cite via [CITATION.cff](CITATION.cff); see [CHANGELOG.md](CHANGELOG.md) for dataset changes.

## Commands

```sh
npm run validate       # schema + taxonomy + id + editorial checks (no network)
npm run build          # deterministic dist/ build
npm run linkcheck      # verify every source URL resolves, falling back to archive_url (network)
npm run archive        # propose Wayback snapshots for sources (add --write to save them)
npm test               # validate + build — CI gate
npm run new:incident -- <id> "Name"   # scaffold a record from the template
```

Source citations are protected against link rot: each source can carry an `archive_url`
(a Wayback snapshot, populated by `npm run archive`). `linkcheck` treats a source as
healthy when either its live URL or its archive snapshot resolves, and only fails when
both are unreachable.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: one incident per PR, every fact sourced, `npm test` green. No exploit code, payloads, or offensive how-tos — ever.

## Scope and ethics

- Only already-public incidents are cataloged, linking the disclosing party.
- Victim organizations are named only when a first-party or public disclosure already named them.
- `Unknown` is a valid actor; attribution never goes beyond what sources state.
- Incidents are described at attack-lifecycle level. This is a defensive dataset.

## License

- **Code** (schema, scripts, docs): [MIT](LICENSE)
- **Data** (`data/`, `taxonomy/`, `dist/`): [CC BY-SA 4.0](LICENSE-data)
