# Contributing

Thanks for helping build a trustworthy record of agentic-AI attacks. Read this fully — the sourcing rules are strict on purpose.

## Ground rules (non-negotiable)

1. **No fabrication.** Every factual field must come from a cited, resolvable source. If a fact isn't in a source, leave the field `null`/empty with a `# TODO: source` comment. Never guess numbers, names, dates, coordinates, or framework IDs.
2. **Sources required.** Every record needs at least one `sources[]` entry with a working URL. No source, no record.
3. **Grade honestly.** `status` and `confidence` must reflect the sourcing. A single news article is `reported` + `secondary` (or `unverified`), never `confirmed` + `primary`.
4. **Attribution humility.** `actor: Unknown` is a valid and common value. Do not attribute beyond what sources state.
5. **Defensive framing only.** Describe incidents at attack-lifecycle level. Never include exploit code, payloads, prompts, or step-by-step offensive instructions — in records, issues, or PR discussion.
6. **Respect victims.** Only catalog already-public incidents. Name a victim organization only if a first-party or public disclosure already did; otherwise use sector/region.

## Adding an incident

```sh
npm ci
npm run new:incident -- <kebab-case-id> "Incident name"
# edit data/incidents/<id>.yml — fill every field from cited sources
npm test          # must pass
npm run linkcheck # source URLs must resolve
```

- The `id` is permanent — it's the citation key. Choose carefully; it is never renamed or recycled.
- One incident per file, one incident per PR.
- YAML style: 2-space indent, ISO 8601 dates, comment any uncertainty.
- `mappings` IDs (MITRE ATLAS/ATT&CK, CVE, AIID) must exist exactly as published — prefer ATLAS for AI-native techniques.
- Never hand-edit `dist/`; run `npm run build` and commit the result.

## Updating an incident

Update the fields, add the new source(s), bump `last_updated`, and keep the `id` unchanged. Corrections are welcome — accuracy beats pride of authorship.

## Commits and PRs

- Conventional Commits; data changes use the `data:` scope (e.g. `data: add <id>`).
- CI runs `npm test`; nothing merges red.
- If you change `schema/`, update `README.md`, the taxonomy files, and `CITATION.cff` as needed, and explain the migration in the PR.

## Licensing of contributions

By contributing you agree that data contributions are licensed CC BY-SA 4.0 and code contributions MIT (see `LICENSE-data` and `LICENSE`).
