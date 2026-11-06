# Review controls and their sources

Checked 6 November 2026. These checks prepare evidence for the responsible accountant. They do not certify compliance or calculate tax.

| Check | Source | What this build does |
|---|---|---|
| Review residual value and useful life at least at each financial year-end | [NZ IAS 16, paragraph 51](https://standards.xrb.govt.nz/standards-navigator/nz-ias-16/) | Keeps a review due date and flags due or overdue active assets. The accountant must set the date to the company's financial year-end. |
| Review the depreciation method at least at each financial year-end | [NZ IAS 16, paragraph 61](https://standards.xrb.govt.nz/standards-navigator/nz-ias-16/) | The review recipe requires examination of method, remaining life and residual value. It records only unchanged estimates. Changes require a prospective schedule migration and new tests. |
| Depreciation begins when available for use | [NZ IAS 16, paragraph 55](https://standards.xrb.govt.nz/standards-navigator/nz-ias-16/) | Stores availability separately from the opening snapshot and excludes future assets. The base uses whole months, not daily allocation. An accountant must confirm whether that convention is appropriate. |
| Disposal gain or loss uses proceeds less carrying amount | [NZ IAS 16, paragraphs 67 to 71](https://standards.xrb.govt.nz/standards-navigator/nz-ias-16/) | Records the carrying amount, proceeds, reviewer and gain or loss. Derecognition is recorded in the register only. No general ledger journal is sent. |

The cited NZ standard applies to entities reporting under that framework, not every NZ business. Australian and other entities must choose their applicable framework and have its rules reviewed before use. This register does not claim Australian tax or statutory compliance.

The following are local operating policies, not laws: a physical sighting every 365 days, an assigned custodian, a supporting acquisition evidence reference, independent names on depreciation and disposal reviews, and no skipped posting months. `/compliance` labels the source of each finding. A missing invoice reference is a prompt to inspect the evidence, not proof of illegal accounting.

The software cannot determine whether an asset qualifies for recognition, a residual value is reasonable, a useful life is appropriate or impairment is required. There is no tax depreciation, lease accounting, revaluation, impairment or component-allocation engine. Components can be separate assets only after an accountant supplies their opening values and lives. Changes in estimates must be prospective. Do not overwrite posted history.

Actor and reviewer names are attribution supplied by a trusted operator. They are not authenticated signatures. The append-only history rejects normal updates and deletes, but a privileged database owner can bypass it. Shared production use needs authenticated identities, scoped database roles, secure access, backups and a tested restore. No delete command is provided.
