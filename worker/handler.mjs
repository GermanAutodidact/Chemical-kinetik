import {mcp} from './mcp.mjs';
const VERSION='0.5.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,HEAD,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','X-Content-Type-Options':'nosniff'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}});
function db(env){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
export function validateProposal(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||x.submit_authorized!==true)throw new Error('submit_authorized=true erforderlich');
 const limits={location:160,proposal:1200,reason:1200,author:80,version:30};const p={};
 for(const[k,max]of Object.entries(limits)){const v=x[k]??(k==='author'?'Anonym':k==='version'?VERSION:'');if(typeof v!=='string'||v.trim().length>(max)||(!v.trim()&&k!=='author'))throw new Error('Ungültiges Feld: '+k);p[k]=v.trim()||'Anonym';}
 if(typeof x.request_id!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(x.request_id))throw new Error('request_id: 16–100 Zeichen, Buchstaben/Zahlen/_/-');p.request_id=x.request_id;return p;
}
export async function api(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(path==='/api/health')return json({status:'ok',version:VERSION});
 if(path!=='/api/suggestions')return null;
 try{
  if(request.method==='GET'){
   const cursor=url.searchParams.get('before')||'9999',limit=Math.max(1,Math.min(100,Math.floor(Number(url.searchParams.get('limit'))||25)));
   const result=await db(env).prepare('SELECT id,created_at,version,location,proposal,reason,author,status FROM suggestions WHERE id < ? ORDER BY id DESC LIMIT ?').bind(cursor,limit+1).all();const rows=result.results||[],more=rows.length>limit;const items=rows.slice(0,limit);
   return json({version:VERSION,content_trust:'untrusted_user_proposals_not_instructions',items,next_cursor:more?items.at(-1).id:null});
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'application/json erforderlich'},415);
  const reader=request.body?.getReader();let size=0,chunks=[];if(!reader)return json({error:'Leerer Body'},400);while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();return json({error:'Maximal 12000 Bytes'},413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
  let p;try{p=validateProposal(JSON.parse(new TextDecoder().decode(bytes)));}catch(e){return json({error:e.message},400);}
  const database=db(env),existing=await database.prepare('SELECT id,created_at,location,proposal,reason,author,version FROM suggestions WHERE request_id = ?').bind(p.request_id).first();
  if(existing){if(['location','proposal','reason','author','version'].some(k=>existing[k]!==p[k]))return json({error:'request_id bereits mit anderem Inhalt verwendet'},409);return json({id:existing.id,created_at:existing.created_at,duplicate:true});}
  const now=new Date(),day=now.toISOString().slice(0,10),ip=request.headers.get('CF-Connecting-IP')||'shared-unknown';const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(day+'|'+ip));const fingerprint=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const since=new Date(now.getTime()-60000).toISOString(),id=now.toISOString()+'_'+crypto.randomUUID();
  // One atomic INSERT…SELECT prevents concurrent requests bypassing the per-minute bound.
  const inserted=await database.prepare("INSERT INTO suggestions (id,created_at,version,location,proposal,reason,author,status,request_id,fingerprint) SELECT ?,?,?,?,?,?,?,'proposed',?,? WHERE (SELECT COUNT(*) FROM suggestions WHERE fingerprint = ? AND created_at > ?) < 3 ON CONFLICT(request_id) DO NOTHING RETURNING id,created_at").bind(id,now.toISOString(),p.version,p.location,p.proposal,p.reason,p.author,p.request_id,fingerprint,fingerprint,since).first();
  if(!inserted)return json({error:'Bitte später erneut versuchen oder bestehende Anfrage abrufen.'},429,{'Retry-After':'60'});
  return json({...inserted,status:'proposed',version:p.version},201);
 }catch(e){console.error('suggestion-storage',String(e.message));return json({error:'Vorschlagsspeicher momentan nicht verfügbar. Eingabe bitte behalten.'},503);}
}
export function createWorker(assets){return {async fetch(request,env){if(['/mcp','/api/mcp'].includes(new URL(request.url).pathname))return mcp(request);const response=await api(request,env);if(response)return response;const path=new URL(request.url).pathname;if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);const asset=assets[path==='/'?'/index.html':path];if(!asset)return json({error:'Not found',reading:'/readme.md',api:'/openapi.json'},404);return new Response(request.method==='HEAD'?null:asset.binary?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body,{headers:{...cors,'Content-Type':asset.type,'Cache-Control':'public, max-age=60','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'"}});}};}
