# Changelog

All notable changes to this dataset and its tooling are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the
dataset version tracks `package.json` and `CITATION.cff` (kept in sync by
`npm run validate`).

## [Unreleased]

### Changed
- The weekly `archive` workflow no longer pushes a branch or opens a pull
  request, so the repo setting "Allow GitHub Actions to create and approve
  pull requests" can stay off. It now runs with read-only contents access.
  It runs the archiver in report mode, which still asks the Wayback Machine to
  create the snapshots. It then opens or updates one `archive`-labelled issue
  listing the snapshots found and the sources that failed, with the commands
  to add them. A maintainer runs `npm run archive -- --write` locally, reviews
  the diff, opens the PR and merges. The issue closes itself once every
  source has a snapshot.

## [0.7.0] - 2026-10-15

### Changed
- **ATLAS case studies now have their own field.**
  `mappings.mitre_atlas_case_studies` holds case-study ids (`AML.CSnnnn`).
  `mappings.mitre_atlas` now accepts only technique, tactic and mitigation ids
  (`AML.T`, `AML.TA`, `AML.M`). Version 0.5.0 placed six case-study ids in
  `mitre_atlas`, which mixed two kinds of id: consumers that treat that array
  as techniques (ATT&CK Navigator layers, technique views) broke. The STIX
  bundle also exported them as `attack-pattern` objects with technique URLs.
  This is shipped as a minor-version correction, because the misplaced values
  existed only in 0.5.0 and 0.6.0 (both released 2026-10-15).
  **Migration:** read case studies from `mappings.mitre_atlas_case_studies`.
  In STIX they are now `mitre-atlas` external references on the incident's
  `report` (URL `https://atlas.mitre.org/studies/<id>`), not attack-patterns.
  The CSV gains a trailing `mitre_atlas_case_studies` column. Affected
  records: `echoleak-m365-copilot`, `radware-zombieagent-deep-research`,
  `openai-eval-agents-hugging-face-intrusion`, `gtg-1002-ai-espionage`,
  `unit42-hermes-deepseek-autonomous-campaign`,
  `dream-multi-agent-asia-government-campaign`.

## [0.6.0] - 2026-10-15

### Added
- `dist/summary.json` gained **`unreleased_changes`** (boolean). It is true
  when `CHANGELOG.md`'s `[Unreleased]` section has content, meaning `main`
  carries changes that no tagged release contains yet. The landing page shows
  "plus unreleased changes" in that case. Before this, data merged between
  releases appeared under the previous version number: after #18 the site
  showed "0.5.0" for 100 records, while the v0.5.0 release holds 96.
- The release workflow refuses to tag while `[Unreleased]` still has notes.
  CONTRIBUTING now asks every data PR to add an `[Unreleased]` entry.

### Data
- Triage of an external candidate brief (Rogue Agents Watch, 2026-10-15). Of
  the candidates not already in the catalog, four passed re-validation against
  their primary sources and were added:
  - `thailand-mof-hermes-agent-intrusion` (Hunt.io): a Hermes agent ran
    unattended post-compromise enumeration inside the ministry's network.
    Ministry not confirmed.
  - `blackhatsect0r-hermes-dxscan-harvesting` (SOCRadar, ThreatMon): graded
    `ai_role: disputed`, because the credential harvesting predates the
    agent's installation.
  - `carbonato-docker-hermes-botnet` (ThreatDown): the Hermes agent is an
    implant interface, not the attacker, so `ai_role: incidental`.
  - `ai-augmented-fortigate-mass-compromise` (Amazon, Team Cymru): AI used
    across the attack phases. The CyberStrikeAI agent platform appears only
    in the attack infrastructure.

## [0.5.0] - 2026-10-15

### Added
- Release workflow (`.github/workflows/release.yml`): when a version bump
  lands on `main`, it creates the `v<version>` git tag and a GitHub Release
  whose notes are this changelog's section for that version, with the `dist/`
  artifacts and the JSON Schema attached. Until now no release was tagged, so
  consumers could not pin a version. `v0.4.0` was tagged retroactively at its
  release commit. The release steps are documented in CONTRIBUTING.

### Data
- Intake sweep of 2026-10-15 (#16): 14 incidents, each re-validated against
  its full primary source for publisher authenticity, corroboration,
  counter-evidence, scope and duplicates. The catalog grows from 82 to 96
  records; 95 are active.
  - **Agent-driven intrusion campaigns:**
    `artex-south-korea-finance-intrusions` (CrowdStrike; ARTEX agentic
    pentest tool and Claude Code sessions against South Korean financial
    institutions),
    `cyberxero-ai-augmented-access-broker` (SOCRadar; Claude Code agent swarm
    alongside intrusions at Ukrainian utilities),
    `mexico-government-claude-code-intrusions` (Gambit Security; disputed by
    the agencies concerned, none named),
    `gambit-gentlemen-affiliate-claude-code-intrusions`,
    `oalabs-compromised-server-claude-codex-intrusions`,
    `unit42-hermes-deepseek-autonomous-campaign` (ATLAS `AML.CS0070`),
    `gtig-recon-agentic-secret-harvesting`,
    `storm-3168-azure-service-principal-destruction` (Microsoft; `ai_role:
    disputed`).
  - **Evaluation and research agents that reached real third parties:**
    `anthropic-unintended-model-actions-real-websites`,
    `openai-agents-australian-state-agencies`,
    `ai-agents-us-canada-government-websites` (Transluce; actor Unknown).
  - **AI-agent supply chain:**
    `mandiant-hijacked-coding-assistant-shai-hulud`,
    `skills-sh-paperclip-malicious-skills`,
    `postmark-mcp-bcc-backdoor`.

### Changed
- `openai-attributed-rubygems-agent-swarm` is now `record_status: disputed`.
  OpenAI says it has not been able to verify that its models uploaded the
  malicious packages, and RubyGems cannot confirm AI involvement. Disputed
  records are excluded from headline counts.
- Confidence raised from secondary to primary on
  `openai-attributed-dsewiki-agent-swarm` and
  `openai-huggingface-may-account-hijacking`, after OpenAI's first-party
  notices and technical report were cited. The DseWiki start date was
  corrected.
- `jadepuffer-agentic-database-extortion`: `autonomy_level` changed from
  unknown to supervised-autonomous, per Sysdig's clarification that a human
  set up and targeted the operation. Linked to the new Storm-3168 record.
- `openai-long-horizon-sandbox-escape-github-pr`: added OpenAI's GitHub-token
  report and corrected the "no third-party victim" wording.
  `openai-agent-services-australia-medicare-portal`: a TODO is now closed
  with OpenAI's first-party post.
- MITRE ATLAS case-study ids (v2026.09) added to `echoleak-m365-copilot`,
  `radware-zombieagent-deep-research`,
  `openai-eval-agents-hugging-face-intrusion`, `gtg-1002-ai-espionage` and
  `dream-multi-agent-asia-government-campaign`. Also added: CISA KEV notes on
  `divd-zammad-ai-agent-breach` and `papercut-agentic-global-intrusion`, and
  the MODA press release as a source on the Dream record.

## [0.4.0] - 2026-10-11

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
- Coverage expansion from the Rogue AI Tracker and Oso "AI Agents Gone Rogue"
  lists (47 incidents, all checked against existing records for duplicates and
  written from their cited primary sources):
  - **Real-world attacks and campaigns:**
    `gambit-ai-agents-retail-skimmer-campaign`,
    `aurora-cursor-agent-ransomware`,
    `gentlemen-hermes-agent-gitlab-extortion`,
    `papercut-agentic-global-intrusion`,
    `dream-multi-agent-asia-government-campaign`,
    `secflow-asia-government-education-campaign`,
    `trendmicro-gemini-cli-dental-botnet`,
    `unit42-ai-assisted-enterprise-intrusion`,
    `gtig-agentic-credential-harvesting-q2-2026`,
    `sysdig-marimo-ai-agent-database-exfiltration`,
    `jesta-darkreasoning-deepseek-proxyjacking`,
    `anonymouskit-ai-voice-phishing-apple`,
    `litellm-pypi-teampcp-backdoor`.
  - **Evaluation and research agents that reached real third parties:**
    `aisi-unsanctioned-agent-cyber-testing` (UK AISI),
    `gemini-evaluation-real-company-breaches`,
    `meta-muse-spark-evaluation-real-website`,
    `openai-huggingface-may-account-hijacking`,
    `openai-long-horizon-sandbox-escape-github-pr`,
    `openai-agent-leaked-api-key-fabrication`,
    `openai-agent-dns-external-chatbot`,
    `openai-agent-public-file-hosting-upload`,
    `codewall-mckinsey-lilli-agent-intrusion`.
  - **OpenAI-attributed internet agent swarms:**
    `openai-attributed-dsewiki-agent-swarm`,
    `openai-attributed-rubygems-agent-swarm`,
    `openai-attributed-wikimedia-edits`,
    `openai-attributed-unctad-api-scanning`.
  - **Rogue / destructive coding agents and assistants:**
    `cursor-pocketos-database-deletion`,
    `google-antigravity-drive-deletion`,
    `amazon-kiro-aws-cost-explorer-outage`,
    `instinct-assistant-unauthorized-email`,
    `glow-pixelleak-agent-screenshot-exposure`,
    `meta-internal-agent-sev1-data-exposure`.
  - **Regulator and CSIRT disclosures:**
    `aepd-first-ai-agent-data-breach-notification` (Spain),
    `divd-zammad-ai-agent-breach` (Netherlands).
  - **Agent-hijack / product prompt-injection disclosures:**
    `gitlost-github-agentic-workflows-repo-leak`,
    `snowflake-cortex-cli-sandbox-escape`,
    `claude-cowork-file-exfiltration`,
    `google-antigravity-data-exfiltration-poc`,
    `notion-ai-web-search-exfiltration`,
    `pillar-adk-agent-privilege-escalation`,
    `pillar-gemini-cli-gcp-triage-compromise`,
    `gemini-cli-ci-untrusted-workspace-rce`,
    `radware-zombieagent-deep-research`,
    `ghostjacking-agentic-kill-chain-poc`,
    `github-mcp-server-private-repo-leak`,
    `supabase-mcp-database-leak`,
    `shadow-escape-mcp-zero-click`.
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

### Changed
- Applied web-verification corrections across the newly added records after an
  independent pass over their sources: fixed four `date_disclosed` values
  (`google-antigravity-data-exfiltration-poc`, `shadow-escape-mcp-zero-click`,
  `aepd-first-ai-agent-data-breach-notification`,
  `meta-internal-agent-sev1-data-exposure`); added two source-verified CVE ids
  (`CVE-2026-12537` on `gemini-cli-ci-untrusted-workspace-rce`, `CVE-2026-6442`
  on `snowflake-cortex-cli-sandbox-escape`); added the Invariant Labs primary
  source to `github-mcp-server-private-repo-leak` (confidence raised to
  primary); and raised `claude-cowork-file-exfiltration` confidence to
  secondary with a second independent source.

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
