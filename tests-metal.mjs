import assert from 'node:assert/strict';
import {metalState,depletionTime} from './dist/metal.mjs';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);let cases=0;
for(const capacity of [.1,1,3])for(const flux of [.1,1,3])for(const eta of [0,.7,1])for(const K of [0,.15,1])for(const alpha of [0,2/3]){
const p={capacity,flux,eta,K,alpha},end=depletionTime(p);let previous=-1;
for(const f of [0,.1,.5,.9,1,1.1]){const s=metalState(p,end*f);near(s.remaining+s.product+s.waste,capacity);near(s.S+s.product,1);assert.ok(s.product>=previous-1e-12);previous=s.product;assert.ok(s.product>=-1e-12&&s.product<=1&&s.waste>=0);if(K>0&&s.S>0)near(s.S+K*Math.log(s.S),1-eta*s.consumed);if(eta===0)near(s.product,0);if(K===0)near(s.product,Math.min(1,eta*s.consumed));cases++;}
near(metalState(p,end).remaining,0);
}
const p={capacity:1,flux:1,eta:.7,K:.15,alpha:0};near(depletionTime({...p,alpha:2/3}),3);near(metalState(p,.5).remaining,.5);near(metalState({...p,alpha:2/3},1.5).remaining,.125);
assert.throws(()=>metalState({...p,eta:1.1},1));assert.throws(()=>metalState(p,-1));
near(metalState({...p,K:1e-300},1).S,.3);
console.log(JSON.stringify({status:'passed',cases,checks:'capacity balance, substrate balance, implicit solution, limiting cases, depletion geometry',illustrativeEndpoint:metalState(p,depletionTime(p))}));
