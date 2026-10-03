import assert from 'node:assert/strict';
import {mcp} from './worker/mcp.mjs';
async function call(method,params){return (await mcp(new Request('https://local/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}))).json();}
assert.equal((await call('initialize',{})).result.protocolVersion,'2024-11-05');
assert.equal((await call('tools/list',{})).result.tools.length,3);
for(const name of ['pea_simulate_m1','pea_simulate_m2','pea_simulate_m3']){
 const r=await call('tools/call',{name,arguments:{}});assert.equal(r.result.isError,undefined);const x=JSON.parse(r.result.content[0].text);assert.equal(x.calibrated,false);
 if(name==='pea_simulate_m1')for(const row of x.trajectory)assert(Math.abs(row.S+row.P+row.B+row.D-1)<1e-12);
 if(name==='pea_simulate_m2')for(const row of x.trajectory)assert(Math.abs(row.balance-1)<1e-10);
 if(name==='pea_simulate_m3')assert(Math.abs(x.endpoint.product+x.endpoint.waste-1)<1e-12);
}
assert((await call('tools/call',{name:'pea_simulate_m1',arguments:{q:-1}})).result.isError);
assert((await call('tools/call',{name:'pea_simulate_m3',arguments:{geometry:'bad'}})).result.isError);
assert.equal((await call('unknown',{})).error.code,-32601);
console.log('MCP passed: initialization, discovery, three model calls, independent conservation checks, bounded invalid inputs.');
