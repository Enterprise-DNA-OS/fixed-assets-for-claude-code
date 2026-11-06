---
description: "Record an unchanged-estimate review."
---

# /review

Record an unchanged-estimate review.

1. Read the operator's request and identify the company or asset. Use companies or register to resolve names. Ambiguous references must be listed, never guessed.
2. Run the command below with the operator's values. Replace date placeholders with valid dates. Append --json when analysing the result.
3. Present the records with their currency and period. Mention missing evidence and failed checks. Do not infer a fact from an empty result.
4. Review residual value, remaining life and method. Use this command only for unchanged estimates. If an estimate changes, prepare a prospective migration with a before/after charge test. Never rewrite posted history. Set the next due date no later than the applicable financial year-end.

```bash
npm run assets -- review --asset=NEW-001 --on=YYYY-MM-DD --next-due=YYYY-MM-DD --estimates-unchanged --actor="Reviewer" --evidence="Review evidence reference"
```

Keep drafts local. Never send, publish, post to a ledger or delete source records.
