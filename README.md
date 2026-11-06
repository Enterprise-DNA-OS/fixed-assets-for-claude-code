# Fixed Assets for Claude Code

Know what your assets cost, what they are worth on the books and which records need attention.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and try the demo. | Your asset classes, reports, opening exports and review controls. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=fmis) · [Instead of FMIS Fixed Assets](https://enterprisedna.co/omni/instead-of/fmis)

## Start with the asset review

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/fixed-assets-for-claude-code.git
cd fixed-assets-for-claude-code
npm install
npm test
npm run demo
npm run assets -- weekly-review
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. CLAUDE.md and AGENTS.md share 31 command recipes and one CLI with 29 commands. Every CLI command accepts --json. Names match without case sensitivity, unique id prefixes work, and ambiguous references list candidates and exit 1.

PGlite works locally without a server. DATABASE_URL selects PostgreSQL. DATA_DIR chooses the embedded database and OUTPUT_DIR chooses private reports. The demo is fictional and includes overdue reviews, missing invoices, missing custodians and stale sightings. Never seed a live register. PostgreSQL demo seeding requires ALLOW_DEMO_DATABASE=1.

## Five finance rituals

- /month-end: read category totals, preview next month's depreciation and inspect outstanding reviews.
- /post-depreciation: record a complete month with a preparer, different reviewer and reason.
- /verification-due and /verify: find assets due for a sighting and record the evidence.
- /review-due and /review: review useful life, residual value and method, with a dated conclusion.
- /dispose and /draft-disposal: record proceeds and book value, then prepare the approval sheet.

/weekly-review combines totals, attention and custodian workload. /transfer and /log retain movement reasons and notes.

## The calculation you own

Each asset has cost, accumulated depreciation at an agreed opening month end, residual value and remaining life in months. Only the remaining depreciable amount is allocated. The base uses whole-month straight-line charges from the later of the next month or the availability month. Cumulative integer-cent rounding makes the final charge land exactly on residual value. No month is skipped or posted twice.

No charge is taken in the disposal month. A disposal must fall in the next unposted month. Its approval records proceeds less the carrying value at the previous posted month. Active summaries exclude disposed assets. The full register retains a disposed asset's carrying value at disposal for history. There is no tax, impairment, revaluation, lease or foreign-exchange engine. Confirm the book convention with your accountant.

A review records unchanged estimates only. Changes need a prospective schedule migration with tests. This keeps an apparently simple edit from changing past charges. Asset values support two decimal places. Company totals never combine currencies.

Runs, depreciation, disposals, imports and events reject normal updates and deletes. A database owner can bypass controls. Reviewer names are attribution, not authenticated signatures. Use trusted operators locally. Shared use needs authenticated identities, database roles, backups and a tested restore. No journal is sent to a general ledger.

## Ten questions this register answers

These are working analyses, not unsupported claims about FMIS's custom reporting.

1. Which assets have book value but no acquisition evidence? Run `attention`.
2. Which estimate reviews are already due? Run `review-due`.
3. Who holds the most carrying value within each company? Run `custodian-load`.
4. Which assets have not been physically sighted under our annual policy? Run `verification-due`.
5. Which fully depreciated assets are still in use? Run `fully-depreciated`.
6. What will the next monthly charge be for each asset? Run `depreciation-preview`.
7. Which reviewer checked each recorded month? Run `runs`.
8. What did a disposal realise compared with its book value? Run `disposals`.
9. Which source export supplied an asset and what changed afterwards? Run `asset`.
10. How much cost and carrying value sits in each asset class? Run `summary`.

## Bring your FMIS register

FMIS supports CSV and spreadsheet exports. Its report headings vary. Supply an explicit heading map and one financial-book snapshot per company.

```bash
npm run assets -- import fmis --company="Your business" --file=fixtures/fmis-assets.csv --mapping=fixtures/fmis-mapping.json --as-of=2025-12-31 --actor="Your name" --dry-run
```

Create the company first at the same opening month end. Remove --dry-run only after comparing the counts and balances. The sample is an illustrative configured export, not a universal FMIS layout. Bad rows reject the whole batch. Identical repeats at the same opening period skip existing records. Changed records are refused. Original row data, the mapping and the source hash stay in the database. Keep attachments and the original CSV in your own archive. [The full switch guide](docs/replace-fmis.md).

## Paperwork and read-only views

Edit brand.json for your name, logo and colours. npm run docs renders asset evidence sheets, depreciation journal proposals and disposal approvals for the records present. The untouched demo has asset evidence sheets. Journal and disposal documents appear once those transactions exist. npm run view renders the weekly review, custody and disposal views. /draft-asset and /draft-disposal write individual documents to drafts/.

/compliance flags review dates against [cited accounting principles and local policies](docs/compliance.md). A clean report is not an accounting opinion. [What a screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our business name and logo on the documents.
2. Show the assets with no invoice reference.
3. List overdue estimate reviews.
4. Show which custodians need to sight their assets.
5. Map the headings in our FMIS export.
6. Run the import without saving it.
7. Compare opening balances by category and company.
8. Explain the next monthly charge for one asset.
9. Draft a disposal approval sheet.
10. Add our own review field through a tested migration.

/customise changes fields and rules. /new-view adds a read-only report.

## Commands

| Command | Job |
|---|---|
| `companies` | Read company currencies and last posted months. |
| `register` | Read the current asset register. |
| `asset` | Read an asset with its full history. |
| `summary` | Read cost and book value by company and category. |
| `attention` | Read overdue reviews and missing evidence. |
| `review-due` | Read assets whose estimates need review. |
| `verification-due` | Read assets not sighted within the annual policy. |
| `fully-depreciated` | Read active assets at residual value. |
| `custodian-load` | Read book value and asset count by custodian. |
| `depreciation-preview` | Preview the next whole-month straight-line charge. |
| `post-depreciation` | Record a reviewed monthly charge. |
| `runs` | Read posted month history. |
| `disposals` | Read disposal proceeds and gain or loss. |
| `imports` | Read imported source hashes. |
| `month-end` | Read the register totals, proposed charge and outstanding reviews. |
| `weekly-review` | Read the Monday asset exceptions. |
| `compliance` | Check cited review requirements and local evidence policies. |
| `add-company` | Create a company at a month-end opening date. |
| `add` | Add an asset with an opening balance. |
| `transfer` | Record a location and custodian change. |
| `verify` | Record a physical sighting. |
| `review` | Record an unchanged-estimate review. |
| `dispose` | Record a reviewed disposal without changing the ledger. |
| `log` | Append an asset note. |
| `import` | Import a mapped FMIS CSV export atomically. |
| `export` | Write a complete JSON export and current register CSV. |
| `draft-asset` | Draft an asset evidence sheet. |
| `draft-disposal` | Draft a disposal approval record. |
| `help` | Read commands and input requirements. |

## Verification and price context

npm test exercises all 29 CLI commands on a disposable database. It checks penny rounding, month continuity, same-person review rejection, disposal history, dry runs, malformed imports, batch rollback, repeat imports, escaped documents, exports and process exit codes. The manual workflow tests Node 20/22 on Linux/Windows and PostgreSQL 17. Consult the workflow results before claiming a platform passed.

FMIS currently quotes privately. A historical vendor procurement schedule supports a five-figure annual scenario, but no current NZ/AU customer invoice was verified. [Research and six scores](docs/research.md).

Enterprise DNA maps your agreed exports and builds your fields, review process and reports through Omni by Enterprise DNA, for one setup fee then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_medium=readme&utm_campaign=fmis).

MIT. Not affiliated with FMIS or Anthropic. Hosting, storage and coding-agent usage have their own costs.
