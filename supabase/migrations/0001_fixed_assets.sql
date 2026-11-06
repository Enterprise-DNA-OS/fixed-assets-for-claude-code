create function touch_updated() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end$$;
create function immutable_record() returns trigger language plpgsql as $$begin raise exception 'Evidence is append-only'; end$$;
create table companies (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name))>0),
 currency text not null check(currency in ('NZD','AUD','USD','GBP','EUR')),
 last_period date not null check(last_period=(date_trunc('month',last_period)+interval '1 month - 1 day')::date),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 filename text not null, sha256 text not null, mapping jsonb not null, row_count integer not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table assets (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 code text not null, name text not null, category text not null, location text not null, custodian text not null,
 cost_cents bigint not null check(cost_cents between 1 and 1000000000000),
 residual_cents bigint not null check(residual_cents>=0), opening_depreciation_cents bigint not null check(opening_depreciation_cents>=0),
 remaining_months integer not null check(remaining_months between 1 and 1200),
 baseline_date date not null, available_date date not null, evidence_ref text not null default '',
 review_due date not null, verified_on date, status text not null default 'active' check(status in ('active','disposed')),
 import_id uuid references imports(id), source_row jsonb, source_fingerprint text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(company_id,code), check(residual_cents+opening_depreciation_cents<=cost_cents),
 check(baseline_date=(date_trunc('month',baseline_date)+interval '1 month - 1 day')::date)
);
create unique index assets_code_casefold on assets(company_id,lower(code));
create table runs (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id), period date not null,
 actor text not null, reviewer text not null, reason text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(company_id,period), check(lower(trim(actor))<>lower(trim(reviewer)))
);
create table depreciation (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references runs(id), asset_id uuid not null references assets(id),
 period date not null, amount_cents bigint not null check(amount_cents>=0), closing_cents bigint not null check(closing_cents>=0),
 location text not null, category text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(asset_id,period)
);
create table disposals (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null unique references assets(id), disposed_on date not null,
 proceeds_cents bigint not null check(proceeds_cents>=0), carrying_cents bigint not null check(carrying_cents>=0),
 actor text not null, reviewer text not null, evidence_ref text not null, reason text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(lower(trim(actor))<>lower(trim(reviewer)))
);
create table events (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), kind text not null, actor text not null,
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger companies_touch before update on companies for each row execute function touch_updated();
create trigger assets_touch before update on assets for each row execute function touch_updated();
do $$declare t text; begin
 foreach t in array array['imports','runs','depreciation','disposals','events'] loop
  execute format('create trigger %I before update or delete on %I for each row execute function immutable_record()',t||'_immutable',t);
 end loop;
 foreach t in array array['companies','assets','imports','runs','depreciation','disposals','events'] loop
  execute format('alter table %I enable row level security',t);
  execute format('revoke all on %I from public',t);
 end loop;
end$$;
create view asset_balances as
 select a.*,c.name company,c.currency,c.last_period,
 a.opening_depreciation_cents+coalesce(d.amount,0)::bigint accumulated_cents,
 a.cost_cents-a.opening_depreciation_cents-coalesce(d.amount,0)::bigint carrying_cents
 from assets a join companies c on c.id=a.company_id
 left join (select asset_id,sum(amount_cents) amount from depreciation group by asset_id) d on d.asset_id=a.id;
create view asset_attention as
 select code,name,company,currency,carrying_cents,'Review due' issue,review_due due_on from asset_balances where status='active' and review_due<=current_date
 union all select code,name,company,currency,carrying_cents,'Missing source evidence',null::date from asset_balances where status='active' and trim(evidence_ref)=''
 union all select code,name,company,currency,carrying_cents,'Verification overdue',verified_on from asset_balances where status='active' and (verified_on is null or verified_on<current_date-365)
 union all select code,name,company,currency,carrying_cents,'No custodian',null::date from asset_balances where status='active' and trim(custodian)='';
create view asset_summary as
 select company,currency,category,count(*) assets,sum(cost_cents)::bigint cost_cents,
 sum(accumulated_cents)::bigint accumulated_cents,sum(carrying_cents)::bigint carrying_cents
 from asset_balances where status='active' group by company,currency,category;
create view disposal_results as
 select a.code,a.name,c.name company,c.currency,d.disposed_on,d.proceeds_cents,d.carrying_cents,
 d.proceeds_cents-d.carrying_cents gain_loss_cents,d.actor,d.reviewer,d.evidence_ref,d.reason
 from disposals d join assets a on a.id=d.asset_id join companies c on c.id=a.company_id;
revoke all on asset_balances,asset_attention,asset_summary,disposal_results from public;
