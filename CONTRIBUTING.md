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
npm test              # must pass
npm run linkcheck     # source URLs must resolve
npm run archive -- --write   # snapshot sources to the Wayback Machine (optional but encouraged)
```

- The `id` is permanent — it's the citation key. Choose carefully; it is never renamed or recycled.
- One incident per file, one incident per PR.
- YAML style: 2-space indent, ISO 8601 dates, comment any uncertainty.
- `mappings` IDs (MITRE ATLAS/ATT&CK, CVE, AIID) must exist exactly as published — prefer ATLAS for AI-native techniques. `npm run validate` checks ATLAS IDs against the release in `schema/mitre-atlas.json` and rejects ATLAS techniques adapted from ATT&CK (record those in `mitre_attack`). See [docs/atlas-mapping.md](docs/atlas-mapping.md) for how to choose techniques.
- Every incident marked `status: confirmed` needs either two sources from **distinct publishers** or a first-party/government source — this is enforced by `npm run validate`.
- Sources rot. Run `npm run archive -- --write` to record a `sources[].archive_url` snapshot; `linkcheck` falls back to it when the live URL later dies. A weekly `archive` workflow also snapshots anything still missing. It never writes to the repo or opens a PR: it opens or updates one `archive`-labelled issue listing the sources still missing a snapshot. A maintainer runs `npm run archive -- --write` locally, reviews the diff and opens the PR.
- Never hand-edit `dist/`; run `npm run build` and commit the result.

## Map points

Map points (`geo.points[]`) exist only where a cited source states a location. Omit the `geo` block otherwise; never geocode `targets.countries`, an actor name, or a sector into a point.

- Every point needs a `role` (`origin` / `target`), a `basis`, an `attributed_by` that exactly matches a `sources[].publisher` on the record, an ISO 3166-1 alpha-2 `country` (null only for a non-country region centroid), coordinates, a label, and `illustrative`.
- The six bases (`taxonomy/geo-basis.yml`): `sponsor-attribution` (a source attributes the operation to a state sponsor), `operator-location` (a source states where the operators were based), `actor-location` (a source states a criminal or individual actor's country without claiming state sponsorship), `infrastructure` (where attack infrastructure was hosted; use sparingly), `victim-location` (the target's country or region), `stated-location` (a source names a precise city or facility).
- **Sponsor ≠ location.** "State-sponsored" or "government-backed" is `sponsor-attribution`, plotted at the state's centroid. It says nothing about where the operators sat; do not write `operator-location` unless a source says where they were.
- Role rules: `sponsor-attribution`, `operator-location`, `actor-location`, and `infrastructure` are origin-only; `victim-location` is target-only; `stated-location` may be either.
- Coordinates are never inferred. Every basis except `stated-location` is a centroid and must be `illustrative: true`; `stated-location` must be `illustrative: false` and may name a victim site only if a first-party or public disclosure already did.
- `researcher` and `lab-test-eval` records carry target points only (a test has no attack origin). `actor_type: unknown` records cannot carry `sponsor-attribution`, `operator-location`, or `actor-location` points.
- All of the above is enforced by `npm run validate` and unit-tested in `test/`.

## Updating an incident

Update the fields, add the new source(s), bump `last_updated`, and keep the `id` unchanged. Corrections are welcome — accuracy beats pride of authorship.

## Commits and PRs

- Conventional Commits; data changes use the `data:` scope (e.g. `data: add <id>`).
- Every data PR adds a line under `## [Unreleased]` in `CHANGELOG.md`. That section drives `unreleased_changes` in `dist/summary.json`, so consumers can see when `main` is ahead of the latest tagged release.
- CI runs `npm test`; nothing merges red.
- Trust-critical paths (`data/`, `schema/`, `taxonomy/`, `scripts/`, `.github/`) have code owners (`.github/CODEOWNERS`). For this to actually gate merges, enable branch protection on `main` with **Require a pull request before merging**, **Require review from Code Owners**, and **Require status checks to pass** (select the `validate + build` check) — these are GitHub repo settings, not files in the repo.
- If you change `schema/`, update `README.md`, the taxonomy files, and `CITATION.cff` as needed, and explain the migration in the PR.

## Releasing

The dataset follows semantic versioning: added records or enum values are a minor bump; a removed or renamed field or enum value is a major bump with a migration note. To cut a release:

1. On a `release/vX.Y.Z` branch, set the same version in `package.json` (`npm version X.Y.Z --no-git-tag-version`, which also updates `package-lock.json`) and in `CITATION.cff`, along with `date-released`.
2. Move the `[Unreleased]` notes in `CHANGELOG.md` into a dated `[X.Y.Z]` section, leaving `[Unreleased]` empty. The release workflow refuses to tag otherwise.
3. Run `npm test` and `npm run linkcheck`, commit the rebuilt `dist/` as `chore(release): vX.Y.Z`, and open a PR.
4. After the merge, `.github/workflows/release.yml` creates the `vX.Y.Z` tag and a GitHub Release. The release notes come from the changelog section, and the `dist/` artifacts and schema are attached. The workflow fails if that section is missing.

## Licensing of contributions

By contributing you agree that data contributions are licensed CC BY-SA 4.0 and code contributions MIT (see `LICENSE-data` and `LICENSE`).
