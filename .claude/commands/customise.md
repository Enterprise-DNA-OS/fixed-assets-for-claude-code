# /customise

Read CLAUDE.md, docs/compliance.md and the current migrations. Ask the operator for the field, category or rule they want changed. Inspect the existing records first.

1. Export a backup and rehearse on a disposable database.
2. Write the next numbered migration in supabase/migrations/. Preserve existing ids and posted history.
3. Update the CLI, import mapping, views and document definitions that use the field.
4. Add a test that proves the requested behaviour and protects the old balances. For an estimate change, specify its future effective month and test the prospective charge.
5. Run npm test. Show the before/after result, apply the migration to the authorised register and read it back.

Do not change a posting convention silently. Do not overwrite historical depreciation. A new requirement does not authorise sending, publishing or a ledger connection.
