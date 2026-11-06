# Fixed Assets for Claude Code

Read this before acting on the register. This is a financial-book fixed asset desk for a trusted finance operator. The operator owns the accounting policy and supplies opening balances, evidence and reviewer names.

## Working rules

- Read the company, period and asset history before writing. Never guess an ambiguous name.
- Use the one CLI, npm run assets -- <command>. Every command accepts --json.
- Keep companies and currencies separate. Amounts in JSON use integer cents. Human reports show decimal amounts.
- Whole-month straight-line accounting is the only depreciation convention. First charge is the later of the month after the opening snapshot or the availability month. No charge is taken in a disposal month.
- Post only the next complete month. A different reviewer name and a reason are required. Names are attribution, not authenticated signatures.
- Estimate reviews only record unchanged values. Changes require a tested prospective migration. Do not edit historical runs or balances.
- Never send, publish, delete evidence, move money or post a journal to an accounting system. Drafts stay in drafts/.
- Read docs/compliance.md before describing any check as a legal requirement.
- Use the supplied commands in .claude/commands/ with any supported coding agent.

## Recurring jobs

| Operator asks for | Recipe |
|---|---|
| Read company currencies and last posted months | /companies |
| Read the current asset register | /register |
| Read an asset with its full history | /asset |
| Read cost and book value by company and category | /summary |
| Read overdue reviews and missing evidence | /attention |
| Read assets whose estimates need review | /review-due |
| Read assets not sighted within the annual policy | /verification-due |
| Read active assets at residual value | /fully-depreciated |
| Read book value and asset count by custodian | /custodian-load |
| Preview the next whole-month straight-line charge | /depreciation-preview |
| Record a reviewed monthly charge | /post-depreciation |
| Read posted month history | /runs |
| Read disposal proceeds and gain or loss | /disposals |
| Read imported source hashes | /imports |
| Read the register totals, proposed charge and outstanding reviews | /month-end |
| Read the Monday asset exceptions | /weekly-review |
| Check cited review requirements and local evidence policies | /compliance |
| Create a company at a month-end opening date | /add-company |
| Add an asset with an opening balance | /add |
| Record a location and custodian change | /transfer |
| Record a physical sighting | /verify |
| Record an unchanged-estimate review | /review |
| Record a reviewed disposal without changing the ledger | /dispose |
| Append an asset note | /log |
| Import a mapped FMIS CSV export atomically | /import |
| Write a complete JSON export and current register CSV | /export |
| Draft an asset evidence sheet | /draft-asset |
| Draft a disposal approval record | /draft-disposal |
| Read commands and input requirements | /help |
| Change a field or rule | /customise |
| Add a read-only report | /new-view |

## Files and verification

DATABASE_URL selects PostgreSQL. Otherwise DATA_DIR selects the local PGlite database. Apply migrations with npm run migrate. Demo seeding is for a disposable register only. npm test creates its own temporary database. TEST_DATABASE_URL must name an empty disposable database. OUTPUT_DIR chooses the location of private reports.

brand.json brands documents. views.json defines read-only dashboards. documents.json defines evidence sheets, journal proposals and disposal approvals. docs/replace-fmis.md explains the mapped import. Both CLAUDE.md and AGENTS.md route to these same 31 recipes.

Built and run through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_medium=repo&utm_campaign=fmis
