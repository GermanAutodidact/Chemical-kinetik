import {state,events} from './model.mjs';
const $=id=>document.getElementById(id),fmt=(n,d=2)=>n.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
let q=.25,r=.15;
const ns='http://www.w3.org/2000/svg';
function element(name,attrs,text){const el=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function draw(){
 const svg=$('plot'),w=Math.max(260,svg.clientWidth),h=310,L=54,R=16,top=22,bottom=50,x=t=>L+t/6*(w-L-R),y=v=>h-bottom-v*(h-top-bottom);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.replaceChildren();
 const add=(n,a,t)=>svg.appendChild(element(n,a,t));
 for(const v of [0,.25,.5,.75,1]){add('line',{x1:L,y1:y(v),x2:w-R,y2:y(v),stroke:'#2a3b54'});add('text',{x:L-9,y:y(v)+4,'text-anchor':'end',fill:'#b3c1d5','font-size':12},String(v*100));}
 for(const t of [0,2,4,6])add('text',{x:x(t),y:h-bottom+22,'text-anchor':'middle',fill:'#b3c1d5','font-size':12},String(t));
 add('text',{x:L,y:14,fill:'#b3c1d5','font-size':12},'Anteil (%)');add('text',{x:(L+w-R)/2,y:h-6,'text-anchor':'middle',fill:'#b3c1d5','font-size':12},'Dimensionslose Zeit τ = k₁t');
 for(const [key,color,dash] of [['S','#b3c1d5','5 4'],['P','#79bdff',''],['side','#ffc478','']]){
 const points=Array.from({length:241},(_,i)=>{const t=i/40,s=state(q,r,t),v=key==='side'?s.B+s.D:s[key];return `${i?'L':'M'}${x(t).toFixed(2)},${y(v).toFixed(2)}`;}).join(' ');
 add('path',{d:points,fill:'none',stroke:color,'stroke-width':key==='P'?3:2,'stroke-dasharray':dash});}
 const e=events(q,r);if(e.peak!==null&&e.peak<=6){const p=state(q,r,e.peak).P;add('circle',{cx:x(e.peak),cy:y(p),r:5,fill:'#79bdff',stroke:'#111d30','stroke-width':2});}
 svg.setAttribute('aria-label',`Hypothetisches Modell q=${q}, r=${r}. Produktmaximum ${fmt(100*e.peakP)} Prozent ${e.peak===null?'als Grenzwert':`bei dimensionsloser Zeit ${fmt(e.peak)}`}. Keine reale PEA-Prognose.`);
}
function update(){q=Number($('q').value);r=Number($('r').value);$('qval').textContent=fmt(q);$('rval').textContent=fmt(r);const e=events(q,r);$('peak').textContent=e.peak===null?`${fmt(100*e.peakP)} % · Plateau für τ → ∞`:`${fmt(100*e.peakP)} % bei τ = ${fmt(e.peak)}`;$('cross').textContent=e.crossing===null?e.crossingStatus:e.crossing===0?e.crossingStatus:`τ = ${fmt(e.crossing)}`;
 $('modelrows').replaceChildren(...[0,.5,1,2,4,6].map(t=>{const s=state(q,r,t),tr=document.createElement('tr');for(const v of [t,s.S*100,s.P*100,(s.B+s.D)*100]){const td=document.createElement('td');td.textContent=fmt(v);tr.appendChild(td);}return tr;}));draw();}
for(const id of ['q','r'])$(id).addEventListener('input',update);
new ResizeObserver(draw).observe($('plot'));
$('export').addEventListener('click',()=>{const rows=['status,q,r,tau,S_percent,P_percent,side_percent',...Array.from({length:121},(_,i)=>{const t=i/20,s=state(q,r,t);return ['hypothetisch_keine_PEA_Prognose',q,r,t,s.S*100,s.P*100,(s.B+s.D)*100].join(',');})];const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='hypothetischer-modellvergleich.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
update();
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'configure_hypothetical_model',title:'Hypothetisches Modell einstellen',description:'Ändert die sichtbaren dimensionslosen Raten. Keine reale PEA-Ausbeuteprognose.',inputSchema:{type:'object',properties:{q:{type:'number',minimum:0,maximum:2},r:{type:'number',minimum:0,maximum:3}},required:['q','r'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object'||!Number.isFinite(input.q)||!Number.isFinite(input.r)||input.q<0||input.q>2||input.r<0||input.r>3||Object.keys(input).some(k=>!['q','r'].includes(k)))throw new Error('q: 0–2, r: 0–3 erforderlich.');$('q').value=String(input.q);$('r').value=String(input.r);update();return {status:'hypothetical_not_PEA_prediction',q,r,...events(q,r)};}})).catch(()=>{});}catch{}}
