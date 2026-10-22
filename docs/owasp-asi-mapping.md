# OWASP Top 10 for Agentic Applications mapping method

How records get `mappings.owasp_asi`. The rules below are what `npm run validate`
enforces plus the editorial choices it cannot check. They mirror
[atlas-mapping.md](atlas-mapping.md): ATLAS stays the preferred, AI-native
framework; OWASP ids are a second, coarser lens for defenders who organise work
around the OWASP lists.

## Which taxonomy

`owasp_asi` maps to the **OWASP Top 10 for Agentic Applications, 2026 edition**
(OWASP GenAI Security Project, Agentic Security Initiative; published December
2025, CC BY-SA 4.0). Ids are `ASI01`–`ASI10`.

It does **not** map to the T-numbered threats (T1 Memory Poisoning through
T15 Human Manipulation) of the earlier OWASP *Agentic AI – Threats and
Mitigations* guide (version 1.1 as currently published at
https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/). The Top
10 document cross-references that guide itself (for example ASI01 corresponds
to T06 Goal Manipulation), so anyone holding T-numbered mappings should
re-derive them from the Top 10 definitions rather than translate mechanically.

`owasp_llm` is separate: it holds OWASP Top 10 for LLM Applications ids
(`LLM01`–`LLM10`). A record may carry both when the sources support both; the
Top 10 for Agentic Applications draws the boundary in each entry (ASI01 versus
LLM01 prompt injection, ASI02/ASI03 versus LLM06 excessive agency, ASI04 versus
LLM03 supply chain, ASI06 versus LLM01 one-time inputs).

## What the validator enforces

- **Every id is in the pinned edition.** `schema/owasp-asi.json` names the
  edition and lists its ten ids and titles. The schema pattern
  `^ASI(0[1-9]|10)$` accepts exactly those ids, and a test fails if the pin and
  the pattern ever disagree. To move to a newer edition, update `version`,
  `published`, `source` and `ids` together, then adjust the pattern if the id
  set changes. OWASP publishes no machine-readable release file, so the pin is
  hand-maintained from the PDF's table of contents.
- **Ids are unique per record** and the field is an array, empty by default.

## Editorial rules

1. **Map only what the record's sources describe.** An ASI entry needs a
   statement in the record (summary, impact, inline comments,
   `lifecycle_phases`, `guardrail_bypass`) that comes from a cited source. Leave
   an entry unmapped if the source does not describe it, even when it seems
   likely. Empty is better than inferred; the field is not backfilled for
   coverage.
2. **Map the mechanism the source states, not the whole chain.** Each ASI entry
   scopes itself against its neighbours. Use the entry whose definition the
   source's description matches, and add a second only when the source
   describes that second mechanism too (for example a prompt-injected agent
   that then ran attacker-chosen code supports ASI01 and ASI05; a hijacked
   agent that merely called its tools supports ASI01 and ASI02).
3. **Leave disputed AI involvement unmapped.** Records with `ai_role: disputed`
   carry `owasp_asi: []`, as they do for ATLAS, because any entry would assert
   the agentic involvement the sources contest.
4. **Agents acting on their own.** Entries ASI02, ASI05, ASI08 and ASI10 cover
   harm with no adversary (misalignment, unsafe delegation, drift). Map them
   only when the source describes the agent's own behaviour as the cause; say
   in an inline comment that there was no adversary.
5. **Attempts count, and say so.** A mechanism the source describes as
   attempted but failed is still mapped, with an inline comment.
6. **Comment every id** with the phrase from the record that supports it, as
   the ATLAS mappings do, so reviewers can check the mapping against the text.

## Conventions for common cases

The left column paraphrases each entry's own definition in the 2026 document.
Where the source describes the situation, that entry applies.

| Situation the source describes | Id |
|---|---|
| Attacker-controlled content (prompt, tool output, document, forged agent message, poisoned data) redirected the agent's objectives, task selection or decisions | ASI01 Agent Goal Hijack |
| The agent applied a legitimate tool it was authorised to use in an unsafe or unintended way: deleted data, over-called an API, exfiltrated information | ASI02 Tool Misuse and Exploitation |
| Delegation chains, inherited or cached credentials, or the agent's identity were used to escalate access or act beyond its authorisation | ASI03 Identity and Privilege Abuse |
| A third-party model, tool, plug-in, MCP server, skill, dataset, registry entry or other agent in the agent's chain was malicious, compromised or tampered with | ASI04 Agentic Supply Chain Vulnerabilities |
| Code the agent generated or was induced to run led to host or container compromise, persistence or sandbox escape | ASI05 Unexpected Code Execution (RCE) |
| Stored memory, retrieved context, summaries or a RAG store were corrupted so later reasoning or tool use went wrong | ASI06 Memory & Context Poisoning |
| Messages between agents were intercepted, spoofed, manipulated or blocked for lack of authentication, integrity or authorisation | ASI07 Insecure Inter-Agent Communication |
| A single fault propagated across agents, tools or workflows into system-wide harm; the source describes the propagation, not just the origin | ASI08 Cascading Failures |
| Humans approved or performed the harmful action because they trusted the agent's output, rationale or persona | ASI09 Human-Agent Trust Exploitation |
| An agent deviated from its intended function or scope and kept acting harmfully or deceptively after the initial compromise or drift | ASI10 Rogue Agents |

Mappings are analysis, not source facts. Reviewers who disagree with a mapping
should open an issue naming the record id and the entry.

Entry titles and definitions are from the OWASP Top 10 for Agentic Applications
(2026), © OWASP GenAI Security Project, CC BY-SA 4.0, paraphrased here.
