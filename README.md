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

## Using the data

```sh
npm ci
npm run build     # writes dist/incidents.json and dist/summary.json
```

Or consume `dist/incidents.json` directly. Data is licensed [CC BY-SA 4.0](LICENSE-data); tooling is [MIT](LICENSE). Cite via [CITATION.cff](CITATION.cff).

## Commands

```sh
npm run validate       # schema + taxonomy + id checks (no network)
npm run build          # deterministic dist/ build
npm run linkcheck      # verify every source URL resolves (network)
npm test               # validate + build — CI gate
npm run new:incident -- <id> "Name"   # scaffold a record from the template
```

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
