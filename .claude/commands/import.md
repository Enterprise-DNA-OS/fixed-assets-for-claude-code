---
description: "Import a mapped FMIS CSV export atomically."
---

# /import

Import a mapped FMIS CSV export atomically.

1. Read the operator's request and identify the company or asset. Use companies or register to resolve names. Ambiguous references must be listed, never guessed.
2. Run the command below with the operator's values. Replace date placeholders with valid dates. Append --json when analysing the result.
3. Present the records with their currency and period. Mention missing evidence and failed checks. Do not infer a fact from an empty result.
4. Read docs/replace-fmis.md. Check the actual CSV headings and opening balances. Run the dry run first. Compare counts and totals before removing --dry-run. Retain the vendor export and attachments separately.

```bash
npm run assets -- import fmis --company="Your business" --file=fixtures/fmis-assets.csv --mapping=fixtures/fmis-mapping.json --as-of=2025-12-31 --actor="Your name" --dry-run
```

Keep drafts local. Never send, publish, post to a ledger or delete source records.
