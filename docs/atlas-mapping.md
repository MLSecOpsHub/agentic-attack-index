# MITRE ATLAS mapping method

How records get `mappings.mitre_atlas` and `mappings.mitre_atlas_case_studies`.
The rules below are what `npm run validate` enforces plus the editorial choices
it cannot check.

## What the validator enforces

- **Every ID exists in a named ATLAS release.** `schema/mitre-atlas.json` lists
  the tactic, technique, mitigation and case-study IDs of one MITRE ATLAS
  release (currently 2026.09). An ID that is not in it fails validation. To move
  to a newer release, download its format-6 file and run
  `npm run atlas:update -- <file>`. Never edit the JSON by hand.
- **AI-native techniques only.** ATLAS marks some techniques as adaptations of
  an ATT&CK technique, for example AML.T0049 Exploit Public-Facing Application
  (ATT&CK T1190). Those behaviours go in `mappings.mitre_attack`. An adapted
  technique whose name is specific to AI stays in ATLAS, for example AML.T0006.002
  Scan for Exposed AI Infrastructure. The list of adapted IDs is generated from
  ATLAS's own `attack-reference` field (`attack_adapted` in the JSON).
- **Case studies are separate.** `AML.CS…` IDs go in `mitre_atlas_case_studies`,
  never in `mitre_atlas`.

## Editorial rules

1. **Map only what the record's sources describe.** A technique needs a
   statement in the record (summary, impact, inline comments, `lifecycle_phases`,
   `guardrail_bypass`) that comes from a cited source. Leave a behaviour unmapped
   if the source does not describe it, even when it seems likely.
2. **Defer to MITRE where it has mapped the incident.** When ATLAS publishes a
   case study of the incident, link it in `mitre_atlas_case_studies` and include
   the techniques the case study lists, subject to the AI-native rule above. A
   case study is linked only when it documents the same incident (same
   disclosing source and event), not a similar one.
3. **Use the most specific sub-technique the source supports**, for example
   AML.T0051.001 (indirect prompt injection) rather than AML.T0051.
4. **Leave disputed AI involvement unmapped.** Records with `ai_role: disputed`
   carry `mitre_atlas: []` with a comment, because any ATLAS technique would
   assert the AI involvement the sources contest.
5. **Agents acting on their own.** Several records have no adversary: an agent
   in an evaluation or in ordinary use crossed a boundary by itself. ATLAS
   AML.T0117 (Autonomous Attack-Path Adaptation) explicitly covers agents that
   cross an authorization boundary while pursuing a benign objective, and
   AML.T0101 (Data Destruction via AI Agent Tool Invocation) describes the
   mechanism of agent-caused deletion. Inline comments say when there was no
   adversary. Where no ATLAS technique fits such a case, the field stays empty
   with a comment.
6. **Harm techniques need realized harm.** AML.T0048 External Harms and its
   sub-techniques are mapped only when the record states harm that reached
   someone through the AI system, such as funds moved by a hijacked agent or
   mail copied by a poisoned tool. They are left out of demonstrations with no
   victims even when an ATLAS case study lists them; a comment says so.
7. **Attempts count, and say so.** A technique the source describes as
   attempted but failed is still mapped, as MITRE does, with an inline comment
   that it was attempted.

## Conventions for common cases

These keep similar records mapped the same way. They follow how MITRE maps
comparable incidents in its own case studies.

| Situation the source describes | Technique |
|---|---|
| An adversary obtained or used a generative AI model or agent (including the simulated adversary of a malware proof-of-concept) | AML.T0016.002 |
| The model generated commands, scripts or code that the operation executed | AML.T0102 |
| An agent was launched inside the victim's environment | AML.T0103 |
| An agent's tool deleted or destroyed data, with or without an adversary | AML.T0101 |
| Agents did reconnaissance or target discovery autonomously | AML.T0116 |
| An agent pursued an objective with limited human direction, adapting its steps | AML.T0117 |
| An orchestrator managed several agents or sub-agents | AML.T0124 |
| Agents exchanged information with other agents | AML.T0118 (.000 via shared artifacts, .001 direct) |
| Safeguards were circumvented by prompting | AML.T0054 |
| Instructions reached the model through content it ingested | AML.T0051.001 |
| Those instructions were planted through a public-facing application (issue, ticket, form, email, post) | AML.T0093 |
| A hijacked agent invoked its tools | AML.T0053 |
| Data left through an agent tool, a rendered response, or model output | AML.T0086, AML.T0077, AML.T0057 |
| A poisoned agent tool, skill or MCP server was published and installed | AML.T0115.002, AML.T0010.005, AML.T0011.002 |

Mappings are analysis, not source facts. Reviewers who disagree with a mapping
should open an issue naming the record id and the technique.
