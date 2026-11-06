# Move a fixed asset register from FMIS

FMIS documents CSV and spreadsheet exports through its built-in reporting tools in its [supplier service description](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/974282591266722). Its [product page](https://www.fmis.co.uk/solutions/fixed-asset-management-software/) describes multiple books and depreciation methods. This free base imports one financial-book opening snapshot per company and then runs whole-month straight-line depreciation. It does not import every FMIS module.

## Export and agree the opening point

Ask an authorised FMIS user for the asset register at a closed month end. Export the selected financial book to CSV with a stable asset number, description, asset class, location, custodian, original cost, accumulated depreciation, residual value, remaining life in months, availability date, review date and evidence reference. Keep the full vendor exports, attachments and historical reports in your own controlled archive before ending access.

FMIS layouts are configurable. The sample in fixtures/fmis-assets.csv is an illustrative report, not a claim about universal FMIS column names. If your export lacks a required item, obtain it from the accountant's opening schedule. Never guess a remaining useful life or replace an unknown amount with zero. Translate supported currency amounts into decimal text without thousands separators or currency symbols. Use YYYY-MM-DD for dates. Do not mix books, companies or currencies in one file.

## Map and test the import

On a fresh database, apply migrations, create the company with the same opening month end, and map the actual headings in a copy of fixtures/fmis-mapping.json. The sample has a 31 December 2025 opening snapshot.

```bash
npm run migrate
npm run assets -- add-company --name="Your business" --currency=NZD --as-of=2025-12-31
npm run assets -- import fmis --company="Your business" --file=fixtures/fmis-assets.csv --mapping=fixtures/fmis-mapping.json --as-of=2025-12-31 --actor="Your name" --dry-run
```

The one import command takes the complete mapped file. Remove --dry-run after checking the counts. A dry run writes no records. An invalid row rejects the entire batch. Repeating the same snapshot while the company remains at that opening period skips identical records. A changed existing asset is refused, never silently overwritten. After posting later months, an old snapshot cannot be reimported as though it were current.

The import preserves the original row data, heading map, source filename and SHA-256 hash in the database. Keep the original CSV alongside the export and source attachments in your own archive. The import does not copy attachment files. Source hashes identify the file used; they do not prove its contents were correct.

## Check the totals and first charge

Compare record count, original cost, accumulated depreciation and carrying value for each company and category. The current register includes disposed items when they are entered here, while summary totals include active assets only. Preview the next month and compare each charge with FMIS under the agreed convention. Investigate every difference before recording a reviewed month.

The opening depreciation is a supplied balance, not recalculated historical depreciation. The remaining months allocate only the opening carrying amount less residual value. Cost, residual and opening depreciation cannot exceed the supported two-decimal range. Fully depreciated assets use a positive remaining-month placeholder and generate zero charges. Depreciation is rounded cumulatively to cents, finishing exactly at residual value.

## What needs separate migration

Historical journal batches, disposals, revaluations, impairments, leases, tax books, permissions, attachments and custom formulas are not reconstructed from an opening snapshot. Retain that evidence separately. The base has no direct accounting integration. The reviewed monthly document is a proposed debit to depreciation expense and credit to accumulated depreciation, with your own account codes still to map.

Use both systems until the first month and the opening evidence agree. A register export can be imported in a day once the mapping and balances are ready. That is not a promise that every FMIS installation can be replaced in a day.

Enterprise DNA handles agreed mappings, additional book methods, historical imports and the operating setup through Omni by Enterprise DNA, for one setup fee then a retainer.
