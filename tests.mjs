import assert from 'node:assert/strict';
import {state,events} from './dist/model.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);
let checks=0;
for(const q of [0,.25,.99,1,2]) for(const r of [0,.15,1,1+q,8]) for(const t of [0,.001,.1,1,6,100]){
  const s=state(q,r,t);near(s.S+s.P+s.B+s.D,1);
  for(const v of [s.S,s.P,s.B,s.D])assert.ok(v>=-1e-12&&v<=1+1e-12);
  if(t>.001&&t<6){const h=1e-5;near((state(q,r,t+h).P-state(q,r,t-h).P)/(2*h),s.formation-s.loss,1e-7);}
  checks++;
}
near(state(0,0,1).P,1-Math.exp(-1));
near(state(0,1,1).P,Math.exp(-1));
for(const q of [0,.25,.99,1,2])for(const r of [.15,1,1+q,8]){
  const e=events(q,r),s=state(q,r,e.peak);near(s.formation,s.loss);
  if(e.crossing!==null){const c=state(q,r,e.crossing);near(c.formation,c.side);}
}
assert.equal(events(.25,0).peak,null);assert.equal(events(.25,0).crossing,null);
assert.throws(()=>state(-1,0,1));assert.throws(()=>state(0,NaN,1));
console.log(JSON.stringify({status:'passed',gridCases:checks,checks:'Stoffbilanz, Nichtnegativität, Differentialgleichung, Maximum, Ratenkreuzung, Grenzfälle'}));
