#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';
import {page,table,record,writeOut} from './lib/render.mjs';

export const commands={
 companies:'Read company currencies and last posted months',register:'Read the current asset register',asset:'Read an asset with its full history',
 summary:'Read cost and book value by company and category',attention:'Read overdue reviews and missing evidence',
 'review-due':'Read assets whose estimates need review','verification-due':'Read assets not sighted within the annual policy',
 'fully-depreciated':'Read active assets at residual value','custodian-load':'Read book value and asset count by custodian',
 'depreciation-preview':'Preview the next whole-month straight-line charge','post-depreciation':'Record a reviewed monthly charge',
 runs:'Read posted month history',disposals:'Read disposal proceeds and gain or loss',imports:'Read imported source hashes',
 'month-end':'Read the register totals, proposed charge and outstanding reviews','weekly-review':'Read the Monday asset exceptions',
 compliance:'Check cited review requirements and local evidence policies','add-company':'Create a company at a month-end opening date',
 add:'Add an asset with an opening balance',transfer:'Record a location and custodian change',verify:'Record a physical sighting',
 review:'Record an unchanged-estimate review',dispose:'Record a reviewed disposal without changing the ledger',log:'Append an asset note',
 import:'Import a mapped FMIS CSV export atomically',export:'Write a complete JSON export and current register CSV',
 'draft-asset':'Draft an asset evidence sheet','draft-disposal':'Draft a disposal approval record',help:'Read commands and input requirements'
};
const today=()=>new Date().toISOString().slice(0,10);
export function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s))||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a valid YYYY-MM-DD date');return s;}
export function monthEnd(s){date(s);const d=new Date(s);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).toISOString().slice(0,10);}
export function nextEnd(s){const d=new Date(s);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+2,0)).toISOString().slice(0,10);}
const monthIndex=s=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
export function cents(s){if(!/^\d+(\.\d{1,2})?$/.test(String(s)))throw Error('Money must be nonnegative decimal text with at most two decimal places, without currency symbols');const [a,b='']=String(s).split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>1e12)throw Error('Amount exceeds supported range');return n;}
const required=(o,k)=>{if(o[k]===undefined||o[k]===true||!String(o[k]).trim())throw Error(`Required --${k}=value`);return String(o[k]).trim();};
const integer=(s)=>{if(!/^\d+$/.test(String(s))||Number(s)<1||Number(s)>1200)throw Error('Remaining months must be 1 to 1200');return Number(s);};
const digest=s=>createHash('sha256').update(s).digest('hex');
async function txn(db,fn){await db.exec('BEGIN');try{const x=await fn();await db.exec('COMMIT');return x;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function resolve(db,kind,ref){
 if(!ref)throw Error(`Specify --${kind==='companies'?'company':'asset'}`);
 const rows=await db.query(`select * from ${kind==='companies'?'companies':'asset_balances'} order by name`);
 const q=String(ref).toLowerCase();let hits=rows.filter(r=>r.id===ref||r.name.toLowerCase()===q||r.code?.toLowerCase()===q);
 if(!hits.length)hits=rows.filter(r=>r.id.toLowerCase().startsWith(q)||r.name.toLowerCase().includes(q));
 if(hits.length!==1)throw Error(`${hits.length?'Ambiguous':'No matching'} ${kind}: ${ref}\n${(hits.length?hits:rows).map(r=>`${r.id} | ${r.code||''} | ${r.name} | ${r.company||r.currency}`).join('\n')}`);
 return hits[0];
}
async function event(db,a,kind,actor,detail){await db.query('insert into events(asset_id,kind,actor,detail) values($1,$2,$3,$4)',[a.id,kind,actor,JSON.stringify(detail)]);}
const active=a=>{if(a.status!=='active')throw Error('Asset is disposed');};
async function lockCompany(db,id){return (await db.query('select * from companies where id=$1 for update',[id]))[0];}
const independent=(o)=>{const actor=required(o,'actor'),reviewer=required(o,'reviewer');if(actor.toLowerCase()===reviewer.toLowerCase())throw Error('A different reviewer is required');return {actor,reviewer,reason:required(o,'reason')};};
function normalise(o,baseline){
 const a={code:required(o,'code'),name:required(o,'name'),category:required(o,'category'),location:required(o,'location'),custodian:String(o.custodian||'').trim(),
 cost_cents:cents(required(o,'cost')),residual_cents:cents(required(o,'residual')),opening_depreciation_cents:cents(required(o,'opening-depreciation')),
 remaining_months:integer(required(o,'remaining-months')),baseline_date:baseline,available_date:date(required(o,'available-date')),
 evidence_ref:String(o['evidence-ref']||'').trim(),review_due:date(required(o,'review-due')),verified_on:o['verified-on']?date(o['verified-on']):null};
 if(a.cost_cents===0||a.residual_cents+a.opening_depreciation_cents>a.cost_cents)throw Error('Cost must be positive; residual plus opening depreciation cannot exceed cost');
 if(a.verified_on&&(a.verified_on>today()||a.verified_on<a.available_date))throw Error('Verification must be between availability and today');
 if(a.available_date>nextEnd(baseline))throw Error('Availability must be no later than the next unposted month');
 if(a.available_date>baseline&&a.opening_depreciation_cents>0)throw Error('New assets cannot already have depreciation');
 return a;
}
async function insertAsset(db,company,a,extra={}){
 const fields={company_id:company.id,...a,...extra};const keys=Object.keys(fields);
 return (await db.query(`insert into assets(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(fields)))[0];
}
export async function preview(db,c,period){
 if(date(period)!==nextEnd(c.last_period))throw Error(`Next period must be ${nextEnd(c.last_period)}; months cannot be skipped or repeated`);
 const rows=await db.query("select * from asset_balances where company_id=$1 and status='active' order by code",[c.id]);
 return rows.filter(a=>a.available_date<=period).map(a=>{
  const start=Math.max(monthIndex(a.baseline_date)+1,monthIndex(a.available_date));
  const elapsed=Math.min(a.remaining_months,Math.max(0,monthIndex(period)-start+1));
  const basis=BigInt(a.cost_cents-a.opening_depreciation_cents-a.residual_cents);
  // Integer rational rounding; cumulative target makes the final month exact.
  const target=Number((basis*BigInt(elapsed)*2n+BigInt(a.remaining_months))/(2n*BigInt(a.remaining_months)));
  const previous=Number(a.accumulated_cents)-Number(a.opening_depreciation_cents);
  const amount=target-previous;
  if(amount<0||amount>a.carrying_cents-a.residual_cents)throw Error(`Invalid schedule for ${a.code}; inspect opening balances and period history`);
  return {id:a.id,code:a.code,name:a.name,currency:a.currency,period,opening_cents:Number(a.carrying_cents),charge_cents:amount,closing_cents:Number(a.carrying_cents)-amount,category:a.category,location:a.location};
 });
}
const displayCols='code,name,company,currency,category,location,custodian,cost_cents,accumulated_cents,carrying_cents,residual_cents,status';
const exportTables=['companies','assets','imports','runs','depreciation','disposals','events'];
export async function run(db,cmd,o={}){
 if(!Object.hasOwn(commands,cmd))throw Error(`Unknown command ${cmd}; use help`);
 if(cmd==='help')return Object.entries(commands).map(([command,job])=>({command,job}));
 if(cmd==='companies')return db.query('select id,name,currency,last_period from companies order by name');
 if(cmd==='register')return db.query(`select ${displayCols} from asset_balances order by company,code`);
 if(cmd==='summary')return db.query('select * from asset_summary order by company,category');
 if(cmd==='attention')return db.query('select * from asset_attention order by company,code,issue');
 if(cmd==='review-due')return db.query("select code,name,company,review_due,evidence_ref from asset_balances where status='active' and review_due<=current_date order by review_due");
 if(cmd==='verification-due')return db.query("select code,name,company,location,custodian,verified_on from asset_balances where status='active' and (verified_on is null or verified_on<current_date-365) order by company,code");
 if(cmd==='fully-depreciated')return db.query("select code,name,company,currency,cost_cents,carrying_cents,residual_cents from asset_balances where status='active' and carrying_cents=residual_cents order by company,code");
 if(cmd==='custodian-load')return db.query("select company,currency,custodian,count(*) assets,sum(carrying_cents)::bigint carrying_cents from asset_balances where status='active' group by company,currency,custodian order by company,custodian");
 if(cmd==='runs')return db.query('select r.id,c.name company,c.currency,r.period,r.actor,r.reviewer,r.reason,coalesce(sum(d.amount_cents),0)::bigint charge_cents from runs r join companies c on c.id=r.company_id left join depreciation d on d.run_id=r.id group by r.id,c.name,c.currency order by period,company');
 if(cmd==='disposals')return db.query('select * from disposal_results order by disposed_on,code');
 if(cmd==='imports')return db.query('select i.id,c.name company,i.filename,i.sha256,i.row_count,i.actor,i.created_at from imports i join companies c on c.id=i.company_id order by i.created_at');
 if(cmd==='weekly-review')return {summary:await run(db,'summary'),attention:await run(db,'attention'),custodians:await run(db,'custodian-load')};
 if(cmd==='compliance')return (await run(db,'attention')).map(r=>({...r,rule:r.issue==='Review due'?'NZ IAS 16.51 and .61: estimate review reminder':r.issue==='Verification overdue'?'Local policy: sight every 365 days':r.issue==='No custodian'?'Local policy: assigned custodian':'Local policy: supporting acquisition evidence'}));
 if(cmd==='add-company'){
  const p=date(required(o,'as-of'));if(p!==monthEnd(p)||p>today())throw Error('Opening date must be a completed month end');
  return db.query('insert into companies(name,currency,last_period) values($1,$2,$3) returning id,name,currency,last_period',[required(o,'name'),required(o,'currency').toUpperCase(),p]);
 }
 if(cmd==='export'){
  const out=path.resolve(required(o,'out'));fs.mkdirSync(out,{recursive:true,mode:0o700});const snapshot={format:1,generated:today()};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of exportTables)snapshot[t]=await db.query(`select * from ${t} order by id`);snapshot.register=await run(db,'register');await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  fs.writeFileSync(path.join(out,'fixed-assets.json'),JSON.stringify(snapshot,null,2)+'\n',{mode:0o600});
  const cols=displayCols.split(',');const csv=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  fs.writeFileSync(path.join(out,'register.csv'),[cols.join(','),...snapshot.register.map(r=>cols.map(k=>csv(r[k])).join(','))].join('\r\n')+'\r\n',{mode:0o600});
  return {files:[path.join(out,'fixed-assets.json'),path.join(out,'register.csv')],assets:snapshot.assets.length};
 }
 if(['depreciation-preview','month-end','post-depreciation','add','import'].includes(cmd)){
  const chosen=await resolve(db,'companies',required(o,'company'));
  if(cmd==='depreciation-preview')return preview(db,chosen,required(o,'period'));
  if(cmd==='month-end')return {summary:(await run(db,'summary')).filter(r=>r.company===chosen.name),proposed:await preview(db,chosen,required(o,'period')),attention:(await run(db,'attention')).filter(r=>r.company===chosen.name)};
  if(cmd==='post-depreciation')return txn(db,async()=>{
   const c=await lockCompany(db,chosen.id),approval=independent(o),period=required(o,'period');
   if(period>today())throw Error('Cannot post an unfinished month; use depreciation-preview');
   const rows=await preview(db,c,period);
   const r=(await db.query('insert into runs(company_id,period,actor,reviewer,reason) values($1,$2,$3,$4,$5) returning *',[c.id,period,approval.actor,approval.reviewer,approval.reason]))[0];
   for(const a of rows)await db.query('insert into depreciation(run_id,asset_id,period,amount_cents,closing_cents,location,category) values($1,$2,$3,$4,$5,$6,$7)',[r.id,a.id,period,a.charge_cents,a.closing_cents,a.location,a.category]);
   await db.query('update companies set last_period=$1 where id=$2',[period,c.id]);
   return {run:r.id,company:c.name,currency:c.currency,period,assets:rows.length,charge_cents:rows.reduce((s,r)=>s+r.charge_cents,0),actor:approval.actor,reviewer:approval.reviewer};
  });
  if(cmd==='add')return txn(db,async()=>{const c=await lockCompany(db,chosen.id);const a=await insertAsset(db,c,normalise(o,c.last_period));await event(db,a,'added',required(o,'actor'),{reason:required(o,'reason')});return a;});
  if(cmd==='import'){
   if(o.vendor!=='fmis')throw Error('Supported import: import fmis');
   const file=required(o,'file'),raw=fs.readFileSync(file),mapping=JSON.parse(fs.readFileSync(required(o,'mapping'),'utf8'));
   const rows=parseCsv(raw.toString('utf8'));if(!rows.length)throw Error('CSV is empty');
   const keys=['code','name','category','location','custodian','cost','residual','opening-depreciation','remaining-months','available-date','evidence-ref','review-due'];
   for(const k of keys)if(typeof mapping[k]!=='string'||!Object.hasOwn(rows[0],mapping[k]))throw Error(`Mapping ${k} must name a CSV column`);
   return txn(db,async()=>{
    const c=await lockCompany(db,chosen.id),asof=date(required(o,'as-of')),actor=required(o,'actor');
    if(asof!==c.last_period)throw Error(`Opening snapshot must equal current company month end ${c.last_period}`);
    const seen=new Set(),prepared=[];
    for(const row of rows){const input=Object.fromEntries(Object.entries(mapping).map(([k,v])=>[k,row[v]]));const a=normalise(input,asof);const key=a.code.toLowerCase();if(seen.has(key))throw Error('Duplicate asset code in file: '+a.code);seen.add(key);
     const fingerprint=digest(JSON.stringify(a));const old=await db.query('select * from assets where company_id=$1 and lower(code)=lower($2)',[c.id,a.code]);
     if(old.length&&old[0].source_fingerprint!==fingerprint)throw Error('Existing asset differs: '+a.code+'; no history overwritten');
     prepared.push({a,row,fingerprint,skip:old.length>0});
    }
    const incoming=prepared.filter(x=>!x.skip);if(o['dry-run'])return {dry_run:true,rows:rows.length,would_add:incoming.length,unchanged:rows.length-incoming.length};
    if(!incoming.length)return {added:0,unchanged:rows.length};
    const im=(await db.query('insert into imports(company_id,filename,sha256,mapping,row_count,actor) values($1,$2,$3,$4,$5,$6) returning id',[c.id,path.basename(file),digest(raw),JSON.stringify(mapping),rows.length,actor]))[0];
    for(const p of incoming){const a=await insertAsset(db,c,p.a,{import_id:im.id,source_row:JSON.stringify(p.row),source_fingerprint:p.fingerprint});await event(db,a,'imported',actor,{import_id:im.id,as_of:asof});}
    return {import_id:im.id,added:incoming.length,unchanged:rows.length-incoming.length,sha256:digest(raw)};
   });
  }
 }
 const picked=await resolve(db,'assets',required(o,'asset'));
 if(cmd==='asset')return {asset:picked,depreciation:await db.query('select * from depreciation where asset_id=$1 order by period',[picked.id]),events:await db.query('select * from events where asset_id=$1 order by created_at,id',[picked.id]),disposal:await db.query('select * from disposals where asset_id=$1',[picked.id])};
 if(cmd==='draft-asset'||cmd==='draft-disposal'){
  const data=await run(db,'asset',{asset:picked.id});if(cmd==='draft-disposal'&&!data.disposal.length)throw Error('This asset has no disposal');
  const sections=cmd==='draft-asset'?[{title:'Asset and current book balance',html:record(data.asset)},{title:'Monthly charges',html:table(data.depreciation)},{title:'Evidence history',html:table(data.events)}]:[{title:'Asset',html:record(data.asset,['code','name','company','currency'])},{title:'Disposal for review',html:record(data.disposal[0])}];
  return {file:writeOut('drafts',`${cmd}-${picked.id}`,page({title:cmd==='draft-asset'?'Asset evidence sheet':'Disposal approval record',subtitle:'Internal review copy. No journal has been sent.',sections}))};
 }
 return txn(db,async()=>{
  const c=await lockCompany(db,picked.company_id);const a=await resolve(db,'assets',picked.id),actor=required(o,'actor');
  if(cmd==='log'){await event(db,a,'note',actor,{note:required(o,'note')});return {code:a.code,logged:true};}
  active(a);
  if(cmd==='transfer'){const location=required(o,'location'),custodian=required(o,'custodian'),reason=required(o,'reason');await db.query('update assets set location=$1,custodian=$2 where id=$3',[location,custodian,a.id]);await event(db,a,'transferred',actor,{from_location:a.location,from_custodian:a.custodian,location,custodian,reason});return {code:a.code,location,custodian};}
  if(cmd==='verify'){const on=date(required(o,'on'));if(on>today()||on<a.available_date||(a.verified_on&&on<a.verified_on))throw Error('Sighting date must be on or after the last sighting and availability, and not in the future');await db.query('update assets set verified_on=$1 where id=$2',[on,a.id]);await event(db,a,'verified',actor,{on,evidence:required(o,'evidence')});return {code:a.code,verified_on:on};}
  if(cmd==='review'){const on=date(required(o,'on')),due=date(required(o,'next-due'));if(on>today()||on<a.available_date||due<=on||due>new Date(Date.parse(on)+366*86400000).toISOString().slice(0,10))throw Error('Review date must not be future; next review is within 366 days');if(o['estimates-unchanged']!==true)throw Error('Use --estimates-unchanged only after reviewing residual, remaining life and method; changed estimates require a prospective schedule migration');const previous=await db.query("select detail->>'on' reviewed_on from events where asset_id=$1 and kind='reviewed' order by detail->>'on' desc limit 1",[a.id]);if(previous.length&&on<previous[0].reviewed_on)throw Error('Review cannot predate the last recorded review');await db.query('update assets set review_due=$1 where id=$2',[due,a.id]);await event(db,a,'reviewed',actor,{on,next_due:due,estimates_unchanged:true,evidence:required(o,'evidence')});return {code:a.code,review_due:due};}
  if(cmd==='dispose'){
   const approval=independent(o),on=date(required(o,'on'));if(on<=c.last_period||on>nextEnd(c.last_period)||on>today()||on<a.available_date)throw Error('Disposal must be in the next unposted month, after availability and no later than today');
   const proceeds=cents(required(o,'proceeds')),evidence=required(o,'evidence');
   await db.query('insert into disposals(asset_id,disposed_on,proceeds_cents,carrying_cents,actor,reviewer,evidence_ref,reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[a.id,on,proceeds,a.carrying_cents,approval.actor,approval.reviewer,evidence,approval.reason]);
   await db.query("update assets set status='disposed' where id=$1",[a.id]);await event(db,a,'disposed',actor,{on,evidence,reason:approval.reason});
   return {code:a.code,currency:a.currency,proceeds_cents:proceeds,carrying_cents:a.carrying_cents,gain_loss_cents:proceeds-a.carrying_cents};
  }
  throw Error('Unhandled command '+cmd);
 });
}
export function format(value){
 if(Array.isArray(value)){if(!value.length)return '  (none)';const keys=Object.keys(value[0]);return textTable(value,keys.map(k=>({key:k,label:k.replace(/_cents$/, ' amount').replaceAll('_',' '),width:64,format:v=>typeof v==='object'?JSON.stringify(v):k.endsWith('_cents')?(Number(v)/100).toFixed(2):v})));}
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>Array.isArray(v)||typeof v==='object'?`${k}\n${format(v)}`:`${k}: ${v}`).join('\n');return String(value);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const args=process.argv.slice(2),cmd=args.shift()||'help',o={};if(cmd==='import')o.vendor=args.shift();for(const arg of args){if(!arg.startsWith('--'))throw Error('Use --name=value flags');const i=arg.indexOf('=');if(i<0)o[arg.slice(2)]=true;else o[arg.slice(2,i)]=arg.slice(i+1);}db=await getDb();const out=await run(db,cmd,o);console.log(o.json?JSON.stringify(out,null,2):format(out));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
