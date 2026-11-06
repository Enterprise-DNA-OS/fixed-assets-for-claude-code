# /weekly-review

Read the Monday asset exceptions.

1. Read the operator's request and identify the company or asset. Use companies or register to resolve names. Ambiguous references must be listed, never guessed.
2. Run the command below with the operator's values. Replace date placeholders with valid dates. Append --json when analysing the result.
3. Present the records with their currency and period. Mention missing evidence and failed checks. Do not infer a fact from an empty result.
4. The result combines summary, attention and custodian-load. Name the assets requiring action, their custodian and the evidence needed. Write any draft to drafts/ and never send.

```bash
npm run assets -- weekly-review
```

Keep drafts local. Never send, publish, post to a ledger or delete source records.
