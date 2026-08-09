<!-- Data PRs: one incident per PR. Use a Conventional Commit title, e.g. `data: add <id>`. -->

## What

<!-- One or two sentences: what this PR adds or changes. -->

## Checklist (Definition of done)

- [ ] `npm test` passes locally (validate + build, `dist/` rebuilt and committed)
- [ ] Every changed record has ≥1 source with a working URL (`npm run linkcheck`)
- [ ] `status` / `confidence` honestly reflect the sourcing (no upgrade beyond sources)
- [ ] All enum values and `mappings` IDs exist exactly as published — nothing invented
- [ ] `id` is new and permanent (no rename/recycle of existing ids)
- [ ] No exploit code, payloads, prompts, or step-by-step offensive detail
- [ ] Victim orgs named only where a public/first-party disclosure already named them
- [ ] Schema changed? README, taxonomy files, and CITATION.cff updated accordingly
