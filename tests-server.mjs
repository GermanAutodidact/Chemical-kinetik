import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
const temp=await mkdtemp(join(tmpdir(),'pea-http-'));
let child;
async function start(extra={}){
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 child=spawn(process.execPath,['--import','tsx','server.ts'],{env:{...process.env,NODE_ENV:'production',PORT:String(port),SQLITE_PATH:join(temp,'suggestions.db'),...extra},stdio:['ignore','pipe','pipe']});
 let logs='';child.stderr.on('data',d=>logs+=d);const url='http://127.0.0.1:'+port;
 for(let i=0;i<100;i++){try{const r=await fetch(url+'/api/health');if(r.ok)return url;}catch{}if(child.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,50));}throw Error('Server startup timeout '+logs);
}
async function stop(){if(child&&child.exitCode===null){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}}
const post=(url,path,x)=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(x)});
try{
 let url=await start({K_SERVICE:''});
 for(const path of ['/api/info','/api/project','/api/openapi.json','/api/suggestions']){const r=await fetch(url+path);assert.equal(r.status,200);assert(r.headers.get('content-type').includes('application/json'));await r.json();}
 assert.equal((await fetch(url+'/api/nonexistent')).status,404);
 assert.equal((await post(url,'/api/suggestions',{})).status,400);
 const proposal={submit_authorized:true,request_id:'http-test-00000001',location:'isolated-test',proposal:'<script>untrusted()</script>',reason:'integration validation'};
 const added=await post(url,'/api/suggestions',proposal);assert.equal(added.status,201);const saved=await added.json();assert(saved.created_at.endsWith('Z'));
 assert((await (await post(url,'/api/suggestions',proposal)).json()).duplicate);
 assert.equal((await post(url,'/api/suggestions',{...proposal,proposal:'different'})).status,409);
 for(const n of [2,3])assert.equal((await post(url,'/api/suggestions',{...proposal,request_id:'http-test-0000000'+n})).status,201);
 assert.equal((await post(url,'/api/suggestions',{...proposal,request_id:'http-test-00000004'})).status,429);
 assert.equal((await post(url,'/api/suggestions',{...proposal,proposal:'x'.repeat(14000)})).status,413);
 const list=await (await fetch(url+'/api/suggestions?limit=1')).json();assert.equal(list.items.length,1);assert(list.next_cursor);assert(!('fingerprint' in list.items[0]));
 const remaining=await (await fetch(url+'/api/suggestions?before='+encodeURIComponent(list.next_cursor))).json();assert.equal(remaining.items.length,2);
 const init=await (await post(url,'/mcp',{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05'}})).json();assert(init.result.serverInfo);
 const notification=await post(url,'/mcp',{jsonrpc:'2.0',method:'notifications/initialized'});assert.equal(notification.status,202);
 const tools=(await (await post(url,'/mcp',{jsonrpc:'2.0',id:2,method:'tools/list'})).json()).result.tools;
 for(const tool of tools){const x=await (await post(url,'/mcp',{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:tool.name,arguments:{}}})).json();assert(!x.result.isError);const data=JSON.parse(x.result.content[0].text);assert.equal(data.calibrated,false);if(data.trajectory)for(const row of data.trajectory)assert(Math.abs(row.S+(row.I||0)+row.P+row.B+row.D-1)<1e-8);}
 const invalid=await (await post(url,'/mcp',{jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'pea_simulate_m1',arguments:{q:-1}}})).json();assert(invalid.result.isError);
 const malformed=await fetch(url+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal((await malformed.json()).error.code,-32700);
 await stop();url=await start({K_SERVICE:''});assert.equal((await (await fetch(url+'/api/suggestions')).json()).items.length,3);
 await stop();url=await start({K_SERVICE:'isolated-cloud-test',SQLITE_DURABLE_VOLUME:''});assert.equal((await (await fetch(url+'/api/health')).json()).storage_durable,false);assert.equal((await post(url,'/api/suggestions',proposal)).status,503);
 console.log('Express HTTP passed: JSON routes, MCP, invalid requests, SQLite inserts, idempotency, pagination, limits, restart persistence, Cloud Run durable-storage guard. No production writes.');
}finally{await stop();await rm(temp,{recursive:true,force:true});}
