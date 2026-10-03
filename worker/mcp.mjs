import {state,events} from '../dist/model.mjs';
import {simulate,defaults,parameters,refinedPeak} from '../dist/advanced.mjs';
import {metalState,depletionTime} from '../dist/metal.mjs';
const mcpTools=[
 {name:'pea_simulate_m1',description:'Dimensionless hypothetical analytic model; no calibrated chemical prediction.',inputSchema:{type:'object',properties:{q:{type:'number',minimum:0,maximum:2,default:.25},r:{type:'number',minimum:0,maximum:3,default:.15}},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'pea_simulate_m2',description:'Dimensionless adaptive intermediate/surface/transport model on tau=0..6.',inputSchema:{type:'object',properties:Object.fromEntries(Object.entries(parameters).map(([k,v])=>[k,{type:'number',minimum:v.min,maximum:v.max,default:v.value}])),additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'pea_simulate_m3',description:'Independent hypothetical metal-capacity balance; exhaustion does not establish complete conversion.',inputSchema:{type:'object',properties:{capacity:{type:'number',minimum:.1,maximum:3,default:1},flux:{type:'number',minimum:.1,maximum:3,default:1},eta:{type:'number',minimum:0,maximum:1,default:.7},K:{type:'number',minimum:0,maximum:1,default:.15},geometry:{type:'string',enum:['foil','solid'],default:'foil'}},additionalProperties:false},annotations:{readOnlyHint:true}},
 {name:'pea_arrhenius',description:'Hypothetical Arrhenius rate acceleration k(T)/k(20°C); uncalibrated, no thermal stability or runaway prediction.',inputSchema:{type:'object',properties:{Ea_kJ:{type:'number',minimum:10,maximum:200,default:55}},additionalProperties:false},annotations:{readOnlyHint:true}}
];
export async function mcp(request){
 if(request.method==='GET')return new Response(JSON.stringify({endpoint:'/mcp',transport:'stateless Streamable HTTP',protocolVersion:'2024-11-05',serverInfo:{name:'pea-kinetics-mcp-server',version:'0.6.0'},tools:mcpTools}),{headers:{'Content-Type':'application/json'}});
 if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
 const content=await request.text();if(content.length>12000)return new Response(null,{status:413});
 let x;try{x=JSON.parse(content);}catch{return mcpReply(null,null,{code:-32700,message:'Parse error'});}
 if(!x||x.jsonrpc!=='2.0'||typeof x.method!=='string')return mcpReply(x?.id??null,null,{code:-32600,message:'Invalid request'});
 if(x.method.startsWith('notifications/'))return new Response(null,{status:202});
 if(x.method==='initialize')return mcpReply(x.id,{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'pea-kinetics-mcp-server',version:'0.6.0'}});
 if(x.method==='ping')return mcpReply(x.id,{});
 if(x.method==='tools/list')return mcpReply(x.id,{tools:mcpTools});
 if(x.method!=='tools/call')return mcpReply(x.id,null,{code:-32601,message:'Method not found'});
 const tool=mcpTools.find(t=>t.name===x.params?.name);if(!tool)return mcpReply(x.id,null,{code:-32602,message:'Unknown tool'});
 try{
 const args=x.params.arguments??{};if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Object arguments required');
 const p={};for(const k of Object.keys(args))if(!(k in tool.inputSchema.properties))throw Error('Unknown parameter '+k);
 for(const[k,v]of Object.entries(tool.inputSchema.properties)){const n=args[k]??v.default;if(v.type==='number'&&(!Number.isFinite(n)||n<v.minimum||n>v.maximum)||v.enum&&!v.enum.includes(n))throw Error('Invalid parameter '+k);p[k]=n;}
 let result;if(tool.name==='pea_simulate_m1')result={parameters:p,events:events(p.q,p.r),trajectory:Array.from({length:121},(_,i)=>({tau:i*.05,...state(p.q,p.r,i*.05)}))};
 else if(tool.name==='pea_simulate_m2'){const rows=simulate({...defaults,...p});result={parameters:p,peak:refinedPeak(rows,p),trajectory:rows};}
 else if(tool.name==='pea_simulate_m3'){const model={...p,alpha:p.geometry==='foil'?0:2/3};const t=depletionTime(model);result={parameters:p,tau_metal:t,endpoint:metalState(model,t)};}
 else {const Ea_kJ=Number(p.Ea_kJ),R=8.314462618,T_ref=293.15,Ea_J=Ea_kJ*1000;result={parameters:p,factors:[293.15,323.15,343.15,363.15].map(k=>({kelvin:k,rate_factor_vs_20c:Math.exp((-Ea_J/R)*(1/k-1/T_ref))})),thermal_stability_assessed:false};}
 return mcpReply(x.id,{content:[{type:'text',text:JSON.stringify({calibrated:false,time_unit:'dimensionless',...result})}]});
 }catch(e){return mcpReply(x.id,{isError:true,content:[{type:'text',text:e.message}]});}
}
function mcpReply(id,result,error){return new Response(JSON.stringify({jsonrpc:'2.0',id:id??null,...error?{error}:{result}}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
