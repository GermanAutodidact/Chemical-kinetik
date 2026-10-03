import {integrate,singularValues,bisectEvent} from './numerics.mjs';
// Dimensionsloses Hypothesenmodell. Keine Kalibrierung auf ein chemisches System.
export const parameters={a0:{label:'Oberflächenaktivität a₀',min:.05,max:5,value:1},lambda:{label:'Deaktivierung λ',min:0,max:2,value:.15},m:{label:'Transportkapazität m',min:.05,max:5,value:1},u:{label:'Zwischenprodukt-Umsatz u',min:.05,max:5,value:1},q:{label:'Nebenroute q',min:0,max:2,value:.2},r:{label:'Produktverlust r',min:0,max:2,value:.1}};
export const defaults=Object.fromEntries(Object.entries(parameters).map(([k,v])=>[k,v.value]));
export function activity(t,p){const a=p.a0*Math.exp(-p.lambda*t);return a*p.m/(a+p.m);}
export function rhs(t,y,p){const h=activity(t,p),v1=h*y[0],v2=p.u*h*y[1],vB=p.q*y[0],vD=p.r*y[2];return [-v1-vB,v1-v2,v2-vD,vB,vD];}
export function simulate(p,step=.005){
 for(const k of Object.keys(parameters))if(!Number.isFinite(p[k])||p[k]<0)throw new Error('Ungültiger Parameter '+k);
 if(p.a0===0||p.m===0||!Number.isFinite(step)||step<=0||step>.05)throw new Error('Ungültige Integrationseinstellung');
 const sub=Math.ceil(.05/step),dt=.05/sub,rows=[];let y=[1,0,0,0,0],t=0;
 const pack=()=>{const dy=rhs(t,y,p);return {t,S:y[0],I:y[1],P:y[2],B:y[3],D:y[4],h:activity(t,p),formation:p.u*activity(t,p)*y[1],side:p.q*y[0]+p.r*y[2],balance:y.reduce((a,b)=>a+b,0),slope:dy[2]};};rows.push(pack());
 for(let i=1;i<=120;i++){
  y=integrate((time,state)=>rhs(time,state,p),t,y,i*.05,{maxStep:step});
  t=i*.05;rows.push(pack());
 }return rows;
}
export function crossings(rows,p){const result=[];for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i],fa=a.side-a.formation,fb=b.side-b.formation;if(fa*fb<0)result.push({t:p?bisectEvent(t=>{const y=integrate((time,state)=>rhs(time,state,p),a.t,[a.S,a.I,a.P,a.B,a.D],t);return p.q*y[0]+p.r*y[2]-p.u*activity(t,p)*y[1];},a.t,b.t):a.t+(b.t-a.t)*(-fa)/(fb-fa),direction:fb>0?'Nebenraten übernehmen':'Bildung übernimmt'});}return result;}
export function envelope(p){const base=simulate(p),scenarios=[base];for(const k of Object.keys(parameters))for(const factor of [.8,1.2])scenarios.push(simulate({...p,[k]:p[k]*factor}));return base.map((v,i)=>({t:v.t,low:Math.min(...scenarios.map(s=>s[i].P)),high:Math.max(...scenarios.map(s=>s[i].P))}));}
export function jacobian(p,outputs=['P']){
 const times=[10,20,40,60,80,120],keys=Object.keys(parameters),eps=.001;
 const columns=keys.map(k=>{const hi=simulate({...p,[k]:p[k]*Math.exp(eps)}),lo=simulate({...p,[k]:p[k]*Math.exp(-eps)});return times.flatMap(i=>outputs.map(o=>(hi[i][o]-lo[i][o])/(2*eps)));});
 return {keys,columns,times:times.map(i=>i*.05)};
}
export function eigenvalues(matrix){
 const a=matrix.map(row=>row.slice()),n=a.length;
 for(let iter=0;iter<100*n*n;iter++){let p=0,q=1,max=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>max){max=Math.abs(a[i][j]);p=i;q=j;}if(max<1e-14)break;
 const theta=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(theta),s=Math.sin(theta),ap=a[p][p],aq=a[q][q],apq=a[p][q];
 for(let k=0;k<n;k++)if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}
 a[p][p]=c*c*ap-2*s*c*apq+s*s*aq;a[q][q]=s*s*ap+2*s*c*apq+c*c*aq;a[p][q]=a[q][p]=0;
 }return a.map((row,i)=>Math.max(0,row[i])).sort((a,b)=>b-a);
}
export function diagnose(p,outputs=['P']){
 const {keys,columns}=jacobian(p,outputs),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),norm=columns.map(c=>Math.sqrt(dot(c,c))),gram=columns.map(a=>columns.map(b=>dot(a,b))),sv=singularValues(columns),rank=sv.filter(x=>sv[0]>0&&x/sv[0]>1e-5).length;
 let pair={keys:[],similarity:0};for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const sim=norm[i]*norm[j]>0?Math.abs(dot(columns[i],columns[j])/(norm[i]*norm[j])):0;if(sim>pair.similarity)pair={keys:[keys[i],keys[j]],similarity:sim};}
 return {rank,singularValues:sv,pair,sensitivity:keys.map((key,i)=>({key,rms:100*norm[i]/Math.sqrt(columns[i].length)})).sort((a,b)=>b.rms-a.rms)};
}

export function refinedPeak(rows,p){const candidates=[rows[0],rows.at(-1)];for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if(a.slope>0&&b.slope<0){const evalAt=t=>{const y=integrate((time,state)=>rhs(time,state,p),a.t,[a.S,a.I,a.P,a.B,a.D],t);return {t,P:y[2],slope:rhs(t,y,p)[2]};};candidates.push(evalAt(bisectEvent(t=>evalAt(t).slope,a.t,b.t)));}}return candidates.reduce((a,b)=>a.P>b.P?a:b);}
