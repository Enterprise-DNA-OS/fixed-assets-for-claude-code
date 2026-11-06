# /post-depreciation

Record a reviewed monthly charge.

1. Read the operator's request and identify the company or asset. Use companies or register to resolve names. Ambiguous references must be listed, never guessed.
2. Run the command below with the operator's values. Replace date placeholders with valid dates. Append --json when analysing the result.
3. Present the records with their currency and period. Mention missing evidence and failed checks. Do not infer a fact from an empty result.
4. Read the affected records and show the calculation first. Record the two actual people named by the operator. These names are attribution, not authenticated approval. Nothing sends a journal to the ledger.

```bash
npm run assets -- post-depreciation --company="Your business" --period=YYYY-MM-DD --actor="Preparer" --reviewer="Reviewer" --reason="Checked against the opening register"
```

Keep drafts local. Never send, publish, post to a ledger or delete source records.
