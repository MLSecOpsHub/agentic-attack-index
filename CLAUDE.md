# CLAUDE.md — agentic-attack-index

Project memory for Claude Code. Read this fully before any task. Keep changes consistent with it; if a request conflicts with the Non-negotiables, refuse and explain.

## What this is
`agentic-attack-index` is an open, source-linked dataset of real-world cyberattacks executed or orchestrated by AI agents (and offensive/agentic-AI incidents). It is the data layer behind the Rogue Agent Watch tracker, published by MLSecOpsHub (https://github.com/MLSecOpsHub, https://mlsecopshub.com).
Audience: defenders, researchers, journalists, policymakers. The product is trust. Accuracy and provenance matter more than volume or speed.

## Non-negotiables (never violate)
1. No fabrication. Every factual field must come from a cited, resolvable source. If a fact is not in a source, leave the field empty/null and add a `# TODO: source` — never guess, never invent numbers, names, dates, or URLs.
2. Sources required. Every incident record MUST have ≥1 real `sources[]` entry with a working URL. No source → record is invalid.
3. Grade honesty. Set `status` (confirmed | reported | test-eval) and `confidence` (primary | secondary | unverified) accurately. Never present a secondary/single-source claim as confirmed/primary.
4. Attribution humility. `Unknown` is a valid actor. Do not assign attribution beyond what sources state.
5. Defensive framing only. Describe incidents at lifecycle level (recon → … → impact). Never include working exploit code, payloads, prompts, or step-by-step offensive instructions.
6. Public + victim-respecting. Only catalog already-public incidents; link the disclosing party. Name a victim org only if a first-party/public disclosure already did; otherwise use sector/region.
7. Deterministic & valid. Nothing merges unless `npm run validate` and `npm run build` pass. The build is reproducible.

## Repo map
data/incidents/<id>.yml     # one record per incident (source of truth)
schema/incident.schema.json # canonical JSON Schema (draft 2020-12) — authoritative
taxonomy/*.yml              # controlled vocabularies
scripts/{validate,build,linkcheck,new-incident}.mjs
dist/                       # generated artifacts (do not hand-edit)
docs/  .github/  CITATION.cff  LICENSE  LICENSE-data  README.md  CONTRIBUTING.md  SECURITY.md

## Commands (self-verify; never claim done without a green run)
npm run validate | npm run build | npm run linkcheck | npm test | npm run new:incident

## Data model (JSON Schema is authoritative)
Record = data/incidents/<id>.yml. `id` = stable kebab-case slug, permanent (it is the citation key).
Required: id, name, summary, date_disclosed, status, confidence, category, severity, models[], model_families[], actor, actor_type, sources[≥1].
Also: autonomy_pct(0–100|null), autonomy_level, guardrail_bypass[], ai_role, related[] (ids of other records; must resolve), mitigations[], targets{orgs_affected,records_exfiltrated,sectors[],countries[]}, geo{target{lat,lng,label,illustrative}, origin|null}, lifecycle_phases[], mappings{mitre_atlas[],mitre_attack[],owasp_llm[],owasp_asi[],cve[],aiid[]}, impact, sources[{title,url,archive_url?,publisher,type,date}], added{date,by}, last_updated.
Enums: category(ai-orchestrated-campaign|autonomous-attack|lab-escape-eval|agent-hijack-prompt-injection|infrastructure-abuse-supply-chain) · actor_type(nation-state|cybercriminal|single-operator|lab-test-eval|researcher|unknown) · status(confirmed|reported|test-eval) · confidence(primary|secondary|unverified) · severity(critical|high|medium|low) · model_families(claude|openai-gpt|openai-codex|gemini|deepseek|qwen|llama|mistral|hermes|other) · autonomy_level(tool-assisted|human-in-the-loop|supervised-autonomous|fully-autonomous|not-applicable|unknown) · guardrail_bypass(jailbreak|open-weight-model|legitimate-tool-abuse|indirect-prompt-injection|none-observed|unknown) · ai_role(load-bearing|significant|incidental|disputed|unknown) · lifecycle_phases(recon|resource-dev|initial-access|execution|credential-access|privilege-escalation|persistence|exfiltration|deception-social-eng|impact). owasp_llm = OWASP LLM Top 10 (LLMnn); owasp_asi = OWASP Agentic Security Initiative. mitre_atlas preferred (AI-native); mitre_attack for traditional TTPs; never invent an ID.

## Conventions
Conventional Commits; data changes use `data:` scope. One incident per file / per PR. YAML: 2-space, ISO dates, comment uncertainty. Never hand-edit dist/. Data = CC-BY-SA-4.0, code = MIT; keep CITATION.cff current.

## Definition of done
npm test green · every changed record has ≥1 resolving source · enums valid · id unique & stable · dist/ rebuilt · README/CITATION updated if schema changed · no operational exploit detail.

## Do NOT
Invent facts/sources/IDs/coordinates/stats; upgrade secondary to confirmed; add exploit how-tos; name unconfirmed victims; rename/recycle an id; hand-edit dist/; add heavy deps; commit secrets.
