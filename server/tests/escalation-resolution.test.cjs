const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../routes/feedback.js'), 'utf8');
let records = [];
let teamStatus = {};
let routes = {};
const pool = {
  connect: async () => ({ query, release() {} }),
  query
};
async function query(sql, params = []) {
  const q = sql.replace(/\s+/g,' ').trim();
  if (['BEGIN','COMMIT','ROLLBACK'].includes(q)) return { rows:[], rowCount:0 };
  if (q.includes('SELECT * FROM escalations') && q.includes('FOR UPDATE')) {
    const [escalationId, teamId] = params;
    return {rows:records.filter(x=>String(x.escalation_id)===String(escalationId)&&String(x.team_id)===String(teamId)),rowCount:1};
  }
  if(q.includes('UPDATE escalations e')) {
    const [userId,teamId,targets] = params;
    const validScopes = new Set(records.filter(x=>String(x.team_id)===String(teamId)&&x.status!=='resolved'&&targets.includes(x.target)).map(x=>String(x.feedback_id)));
    const affected = records.filter(x=>String(x.team_id)===String(teamId)&&x.status!=='resolved'&&validScopes.has(String(x.feedback_id)));
    affected.forEach(x=>Object.assign(x,{status:'resolved',resolved_by:userId,resolved_at:'now'}));
    return {rows:affected.map(x=>({escalation_id:x.escalation_id})),rowCount:affected.length};
  }
  if(q.includes('UPDATE escalations') && q.includes('IS NOT DISTINCT FROM $3::integer')) {
    const [userId,teamId,feedbackId] = params;
    const affected=records.filter(x=>String(x.team_id)===String(teamId)&&x.status!=='resolved'&&x.feedback_id===feedbackId);
    affected.forEach(x=>Object.assign(x,{status:'resolved',resolved_by:userId,resolved_at:'now'}));
    return {rows:affected,rowCount:affected.length};
  }
  if(q.startsWith('SELECT target, note, created_by, created_at FROM escalations')) {
    return {rows:records.filter(x=>String(x.team_id)===String(params[0])&&x.status!=='resolved'),rowCount:0};
  }
  if(q.startsWith('UPDATE teams SET escalated')) {
    const [escalated, escalation_level,,,,teamId] = params;
    teamStatus[teamId] = {escalated,escalation_level};
    return {rows:[],rowCount:1};
  }
  throw Error('Unsupported query: '+q);
}
const router = { patch:(path,...args)=>{routes[path]=args.at(-1);},get(){},post(){},put(){},delete(){} };
const required = (name) => {
  if(name==='express') return { Router:()=>router };
  if(name==='../db') return pool;
  if(name==='../middleware/authMiddleware') return (_req,_res,next)=>next();
  if(name==='../utils/roleUtils') return { normalizeRole:(role)=> role };
  if(name==='../utils/mailer') return { sendEscalationEmail:()=>{} };
  throw Error(name);
};
vm.runInNewContext(source, {require:required,module:{exports:{}},console});
const single = routes['/:teamId/escalations/:escalationId/resolve'];
const bulk = routes['/:teamId/escalations/resolve-active'];
const mk = (id,target,feedbackId=null,teamId=1)=>({escalation_id:id,target,feedback_id:feedbackId,team_id:teamId,status:'open'});
async function run(route,role,id=1, teamId=1) {
  let status=200, body=null;
  const res={status:(v)=>{status=v; return res;},json:(v)=>{body=v;return res;}};
  await route({params:{teamId, escalationId:id},user:{id:100, role}},res);
  return {status,body};
}
async function main() {
  records=[mk(1,'coordinator')];
  assert.equal((await run(single,'liaison')).status,403);
  assert.equal((await run(single,'coordinator')).status,200);
  assert.equal(records[0].status,'resolved'); assert.deepEqual(teamStatus[1],{escalated:false, escalation_level:0});
  records=[mk(1,'both')];
  assert.equal((await run(single,'liaison')).status,200);
  assert.equal(records[0].status,'resolved');
  records=[mk(1,'coordinator'),mk(2,'liaison'),mk(3,'liaison',9)];
  assert.equal((await run(single,'coordinator',1)).status,200);
  assert.deepEqual(records.map(x=>x.status),['resolved','resolved','open']);
  assert.deepEqual(teamStatus[1],{escalated:true, escalation_level:2});
  records=[mk(1,'coordinator',5),mk(2,'liaison',5),mk(3,'coordinator',7)];
  assert.equal((await run(single,'liaison',2)).status,200);
  assert.deepEqual(records.map(x=>x.status),['resolved','resolved','open']);
  assert.deepEqual(teamStatus[1],{escalated:true, escalation_level:1});
  records=[mk(1,'coordinator'),mk(2,'liaison'),mk(3,'liaison',6)];
  assert.equal((await run(bulk,'coordinator')).status,200);
  assert.deepEqual(records.map(x=>x.status),['resolved','resolved','open']);
  assert.equal((await run(single,'liaison',1)).status,403);
  assert.equal((await run(single,'coordinator',1)).status,409);
  assert.equal((await run(bulk,'student')).status,403);
  records=[mk(1,'liaison')];
  assert.equal((await run(bulk,'coordinator')).status,409);
  assert.equal((await run(single,'liaison',1)).status,200);
  // New escalation after resolution should remain open for the next cycle.
  records.push(mk(2,'coordinator'));
  assert.equal((await run(single,'coordinator',2)).status,200);
  console.log('9 escalation regression scenarios passed (role access, shared resolution, feedback isolation, re-escalation).');
}
main().catch(e=>{console.error(e); process.exitCode=1;});
