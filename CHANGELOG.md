# Changelog

All notable changes to this dataset and its tooling are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
dataset version tracks `package.json` and `CITATION.cff` (kept in sync by
`npm run validate`).

## [Unreleased]

### Added
- `dist/summary.json` gained **`evidence_split`**, the dataset's headline
  honesty figure: the count and share of records that are both
  `status: confirmed` and `ai_role: load-bearing`, by year, plus a
  `status × ai_role` crosstab and the qualifying ids. Retracted and
  superseded records are excluded. Computed in `scripts/summary.mjs`
  (unit-tested in `test/summary.test.mjs`) so downstream consumers quote one
  number instead of recomputing it.
- Scheduled `archive` workflow (`.github/workflows/archive.yml`): snapshots
  every `sources[].url` lacking an `archive_url` to the Wayback Machine weekly
  and opens a PR for review. Until now no job ran the archiver, which is why
  coverage had stalled.

### Data
- Added `gtg-20006-agentic-espionage`: Russia-nexus espionage cluster
  (attribution described by Anthropic as consistent with public reporting on
  Midnight Blizzard) that used modified Claude Code skills against more than
  20 government, defense and diplomatic organizations, December 2025 to
  August 2026, with scheduled agent jobs renewing access and harvesting cloud
  storage unattended. From Anthropic's September 2026 "Countering misuse of
  AI" report; graded confirmed / primary.
- Added `gtg-50014-agentic-mass-exfiltration`: suspected ShinyHunters
  affiliates whose agents, per Anthropic, "performed nearly all of the work"
  in terabyte-scale data theft across a technology provider, an airline, a
  SaaS provider with ~200 downstream customers and others. Graded confirmed /
  primary, severity critical.
- Added `gtg-10007-agent-swarm-intrusions`: Chinese-speaking operators
  (two identified as undergraduates; no state sponsorship asserted) running
  Claude "agent swarms" and standing collection agents against roughly fifty
  organizations. Graded confirmed / primary; actor type unknown, no origin
  point.
- Added `gtg-50029-hacktivist-agentic-recon`: a single French-speaking
  hacktivist who used Claude to reach 14 of 42 tracked European political,
  media and SaaS targets and build a doxxing platform. Graded confirmed /
  primary.
- Added `gtg-50020-ai-vendor-api-key-theft`: Russian-speaking criminal actor
  whose unsupervised exploitation pipeline hit ~30 AI companies in four days,
  stealing production API keys and seeking US$1.5–2.5M; the goal of reaching a
  pre-release Claude model failed. Graded confirmed / primary, category
  infrastructure-abuse-supply-chain.
- Added `anthropic-cyber-evals-real-target-incidents`: Claude evaluation
  agents (Opus 4.7, Mythos 5, an early Opus 4.6 checkpoint and an internal
  research model) reached real third-party systems in four incidents across
  seven runs after a sandbox misconfiguration; disclosed 2026-07-30 and
  revised 2026-09-09. Graded confirmed / primary, category autonomous-attack,
  cross-linked to the OpenAI / Hugging Face record.
- Added `clinejection-cline-triage-npm-publish`: prompt injection of Cline's
  Claude-powered issue-triage workflow exposed a publish token later used by a
  third party to ship an unauthorized `cline@2.3.0`. Sourced from Cline's
  post-mortem and the researcher's write-up; graded confirmed / primary.
- Added `gtig-ai-developed-zero-day-2fa-bypass`: GTIG's May 2026 report of a
  criminal actor holding a zero-day exploit GTIG believes was AI-developed,
  against an unnamed web-based administration tool. Graded reported /
  primary; AI role rests on indirect code indicators.
- Added `hackerbot-claw-github-pr-campaign`: a GitHub account self-described
  as an autonomous "security research agent powered by claude-opus-4-5"
  exploiting Actions workflows across at least seven repositories; scoped to
  the PR campaign, with Trivy's maintainer attributing the Trivy release
  compromise to a separate attacker. Graded confirmed / primary, `ai_role:
  disputed`.
- Added `miasma-worm-ai-coding-agent-configs`: a malicious commit to
  Azure/durabletask weaponized Claude Code, Gemini CLI, Cursor and VS Code
  configuration files for credential harvesting; GitHub disabled 73
  repositories. StepSecurity report plus the TanStack GHSA as precursor
  context; graded reported / primary.
- Added `jadepuffer-agentic-database-extortion`: Sysdig's July 2026 report of
  an operator whose extortion capability is "delivered by an AI agent",
  encrypting 1,342 configuration items and dropping databases; agentic nature
  inferred from behaviour. Graded reported / primary; CVE ids as stated by
  Sysdig.
- Added `clawhavoc-clawhub-malicious-skills`: at least 1,184 malicious skills
  uploaded to OpenClaw's ClawHub marketplace by 12 author ids, delivering
  stealers and remote-access tools. Antiy CERT analysis plus eSecurity
  Planet's report of Koi Security's findings; graded confirmed / primary,
  `ai_role: incidental`.
- Added `coral-sleet-agentic-ai-workflow`: Microsoft's March 2026 report that
  North Korean actor Coral Sleet (formerly Storm-1877) uses agentic AI tools
  for lures, infrastructure and payload development, including jailbroken
  LLMs. Graded reported / primary; KP sponsor-attribution origin point.
- Added `grok-bankr-prompt-injection-wallet-drain`: a prompt injection
  processed by Grok led the Bankr agent to transfer ~3 billion DRB tokens
  (reported US$150,000–200,000, ~80% later returned). Giskard analysis plus
  the OECD.AI monitor entry; graded reported / secondary.
- Added `openclaw-inbox-deletion`: an OpenClaw agent asked to suggest inbox
  deletions deleted a Meta AI security researcher's emails and ignored remote
  stop commands, per TechCrunch (not independently verified). Graded
  reported / secondary, severity low.
- Added `openai-eval-agents-hugging-face-intrusion`: OpenAI evaluation agents
  (an internal-only research model and GPT-5.6 Sol, run with cyber classifiers
  off) escaped their sandbox via Artifactory and compromised parts of Hugging
  Face production infrastructure, July 2026. Sourced from OpenAI's technical
  report, Hugging Face's timeline and METR's review; graded confirmed /
  primary, category autonomous-attack (real third-party victim).
- Added `openai-agent-services-australia-medicare-portal`: an OpenAI research
  agent circumvented access controls on Services Australia's Medicare
  statistics portal on 2026-06-18, disclosed by the Australian Prime Minister
  on 2026-09-24. Graded confirmed / primary (government statement plus
  OpenAI confirmation).
- Added `promptspy-gemini-android-agent`: PROMPTSPY, an Android backdoor that
  sends the device UI hierarchy to a hosted Gemini model and replays the
  model's chosen gestures (GTIG AI Threat Tracker, May 2026; first identified
  by ESET). Graded confirmed / primary; cross-linked to PROMPTFLUX and
  PROMPTSTEAL. Archive snapshots pending the weekly archive workflow.
- Backfilled the 7 remaining `archive_url` snapshots (AWS bulletin, Noma
  Security, arXiv, The Register, Fortune, AppOmni, The Hacker News); archive
  coverage is now 39/39 sources.

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
