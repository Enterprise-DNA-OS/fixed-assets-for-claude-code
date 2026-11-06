import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db){
 if(db.mode==='postgres'&&process.env.ALLOW_DEMO_DATABASE!=='1')throw Error('Demo seeding PostgreSQL requires ALLOW_DEMO_DATABASE=1');
 const rows=await db.query('select id from companies');
 if(rows.some(r=>!['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'].includes(r.id)))throw Error('Refusing to seed a working register');
 await db.exec('BEGIN');try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const db=await getDb();try{await seed(db);console.log('Fictional asset register seeded');}finally{await db.close();}}
