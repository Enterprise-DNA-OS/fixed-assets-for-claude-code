---
description: "Add an asset with an opening balance."
---

# /add

Add an asset with an opening balance.

1. Read the operator's request and identify the company or asset. Use companies or register to resolve names. Ambiguous references must be listed, never guessed.
2. Run the command below with the operator's values. Replace date placeholders with valid dates. Append --json when analysing the result.
3. Present the records with their currency and period. Mention missing evidence and failed checks. Do not infer a fact from an empty result.

```bash
npm run assets -- add --company="Your business" --code=NEW-001 --name="Packing bench" --category=Plant --location=Auckland --custodian="Your name" --cost=12000.00 --residual=1200.00 --opening-depreciation=0.00 --remaining-months=60 --available-date=2026-01-01 --evidence-ref=INV-001 --review-due=2026-03-31 --actor="Your name" --reason="Opening balance checked"
```

Keep drafts local. Never send, publish, post to a ledger or delete source records.
