import assert from 'node:assert/strict';
import { mcp } from './worker/mcp.mjs';

// 1. Test GET discovery endpoint
const getRes = await mcp(new Request('https://local/mcp', { method: 'GET' }));
assert.equal(getRes.status, 200);
assert.equal(getRes.headers.get('Content-Type'), 'application/json');
const getBody = await getRes.json();
assert.equal(getBody.protocolVersion, '2024-11-05');
assert.equal(getBody.endpoint, '/mcp');
assert.equal(getBody.transport, 'stateless Streamable HTTP');
assert.equal(getBody.tools.length, 4);

// 2. Test unsupported HTTP methods -> 405 Method Not Allowed
const deleteRes = await mcp(new Request('https://local/mcp', { method: 'DELETE' }));
assert.equal(deleteRes.status, 405);
assert.equal(deleteRes.headers.get('Allow'), 'POST');

// Helper for standard JSON-RPC 2.0 calls
async function call(method, params, id = 1) {
  const req = new Request('https://local/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const res = await mcp(req);
  assert.equal(res.headers.get('Content-Type'), 'application/json');
  return res.json();
}

// 3. Test initialize
const init = await call('initialize', {});
assert.equal(init.jsonrpc, '2.0');
assert.equal(init.id, 1);
assert.equal(init.result.protocolVersion, '2024-11-05');
assert.deepEqual(init.result.capabilities, { tools: {} });
assert.equal(init.result.serverInfo.name, 'pea-kinetics-mcp-server');

// 4. Test notifications/initialized -> 202 Accepted
const notifyRes = await mcp(
  new Request('https://local/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  })
);
assert.equal(notifyRes.status, 202);

// 5. Test ping
const ping = await call('ping', {}, 42);
assert.equal(ping.jsonrpc, '2.0');
assert.equal(ping.id, 42);
assert.deepEqual(ping.result, {});

// 6. Test tools/list
const list = await call('tools/list', {});
assert.equal(list.result.tools.length, 4);
const toolNames = list.result.tools.map((t) => t.name);
assert.deepEqual(toolNames.sort(), ['pea_arrhenius', 'pea_simulate_m1', 'pea_simulate_m2', 'pea_simulate_m3']);

// 7. Test tools/call for all 4 documented models
// 7a. pea_simulate_m1
const r1 = await call('tools/call', { name: 'pea_simulate_m1', arguments: { q: 0.25, r: 0.15 } });
assert.equal(r1.result.isError, undefined);
const x1 = JSON.parse(r1.result.content[0].text);
assert.equal(x1.calibrated, false);
assert.equal(x1.time_unit, 'dimensionless');
assert.equal(x1.trajectory.length, 121);
for (const row of x1.trajectory) {
  assert(Math.abs(row.S + row.P + row.B + row.D - 1) < 1e-12, 'M1 mass balance failure');
  assert(row.S >= -1e-12 && row.P >= -1e-12 && row.B >= -1e-12 && row.D >= -1e-12, 'M1 nonnegativity failure');
}
assert(x1.events.peak > 0, 'M1 peak tau must be positive');

// 7b. pea_simulate_m2
const r2 = await call('tools/call', { name: 'pea_simulate_m2', arguments: { a0: 1.0, m: 1.0, lambda: 0.15 } });
assert.equal(r2.result.isError, undefined);
const x2 = JSON.parse(r2.result.content[0].text);
assert.equal(x2.calibrated, false);
assert.equal(x2.trajectory.length, 121);
for (const row of x2.trajectory) {
  assert(Math.abs(row.balance - 1) < 1e-10, 'M2 mass balance failure');
  assert(row.S >= -1e-12 && row.I >= -1e-12 && row.P >= -1e-12 && row.B >= -1e-12 && row.D >= -1e-12);
}

// 7c. pea_simulate_m3
const r3 = await call('tools/call', { name: 'pea_simulate_m3', arguments: { capacity: 1.0, flux: 1.0, eta: 0.7, K: 0.15, geometry: 'foil' } });
assert.equal(r3.result.isError, undefined);
const x3 = JSON.parse(r3.result.content[0].text);
assert.equal(x3.calibrated, false);
assert.equal(x3.tau_metal, 1.0);
assert(Math.abs(x3.endpoint.product + x3.endpoint.waste - 1) < 1e-12, 'M3 endpoint capacity balance failure');

// 7d. pea_arrhenius
const r4 = await call('tools/call', { name: 'pea_arrhenius', arguments: { Ea_kJ: 55 } });
assert.equal(r4.result.isError, undefined);
const x4 = JSON.parse(r4.result.content[0].text);
assert.equal(x4.calibrated, false);
assert.equal(x4.thermal_stability_assessed, false);
assert.equal(x4.factors.length, 4);
assert.equal(x4.factors[0].rate_factor_vs_20c, 1.0);
assert(x4.factors[1].rate_factor_vs_20c > 1.0);
assert(x4.factors[2].rate_factor_vs_20c > x4.factors[1].rate_factor_vs_20c);
assert(x4.factors[3].rate_factor_vs_20c > x4.factors[2].rate_factor_vs_20c);

// 8. Test malformed JSON -> code -32700 Parse error
const malformedRes = await mcp(
  new Request('https://local/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"jsonrpc": "2.0", "broken_json": ',
  })
);
const malformedBody = await malformedRes.json();
assert.equal(malformedBody.error.code, -32700);
assert.equal(malformedBody.id, null);

// 9. Test unknown method -> code -32601 Method not found
const unknownMethod = await call('unknown_method', {});
assert.equal(unknownMethod.error.code, -32601);

// 10. Test unknown tool -> code -32602 Unknown tool
const unknownTool = await call('tools/call', { name: 'non_existent_tool' });
assert.equal(unknownTool.error.code, -32602);

// 11. Test missing, wrongly typed, and out-of-bounds arguments
const badM1 = await call('tools/call', { name: 'pea_simulate_m1', arguments: { q: -1 } });
assert.equal(badM1.result.isError, true);

const badM1Type = await call('tools/call', { name: 'pea_simulate_m1', arguments: { q: 'not_a_number' } });
assert.equal(badM1Type.result.isError, true);

const badM2Param = await call('tools/call', { name: 'pea_simulate_m2', arguments: { unknown_param: 123 } });
assert.equal(badM2Param.result.isError, true);

const badM3Geom = await call('tools/call', { name: 'pea_simulate_m3', arguments: { geometry: 'invalid_shape' } });
assert.equal(badM3Geom.result.isError, true);

const badArrhenius = await call('tools/call', { name: 'pea_arrhenius', arguments: { Ea_kJ: 5 } });
assert.equal(badArrhenius.result.isError, true);

console.log('MCP passed: initialize, notifications, tools/list, 4 models, independent conservation, malformed JSON (-32700), unknown method (-32601), unknown tool (-32602), and bounded invalid arguments.');
