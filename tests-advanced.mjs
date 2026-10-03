import assert from 'node:assert/strict';
import {defaults,simulate,diagnose,eigenvalues,envelope} from './dist/advanced.mjs';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
let maxConvergenceError=0,maxBalanceError=0;
for(const p of [defaults,{...defaults,a0:5,m:5,u:5,q:2,r:2,lambda:2},{...defaults,a0:.05,m:.05,u:.05,q:0,r:0,lambda:0},{...defaults,a0:5,m:.05,u:5,lambda:0},{...defaults,a0:5,m:5,u:5,lambda:0,q:0,r:0}]){
 const a=simulate(p),b=simulate(p,.0025);for(let i=0;i<a.length;i++){for(const k of ['S','I','P','B','D']){assert.ok(a[i][k]>=-1e-12&&a[i][k]<=1+1e-12);maxConvergenceError=Math.max(maxConvergenceError,Math.abs(a[i][k]-b[i][k]));}maxBalanceError=Math.max(maxBalanceError,Math.abs(a[i].balance-1));}
}
assert.ok(maxConvergenceError<1e-7);assert.ok(maxBalanceError<1e-12);
for(const s of simulate({...defaults,a0:1,m:1,lambda:0,u:1,q:0,r:0})){close(s.S,Math.exp(-.5*s.t));close(s.I,.5*s.t*Math.exp(-.5*s.t));close(s.P,1-(1+.5*s.t)*Math.exp(-.5*s.t));}
const a=simulate({...defaults,a0:1,m:1,lambda:0}),b=simulate({...defaults,a0:2,m:2/3,lambda:0});for(let i=0;i<a.length;i++)for(const key of ['S','I','P'])close(a[i][key],b[i][key],1e-12);
close(eigenvalues([[1,1],[1,1]])[0],2);close(eigenvalues([[1,1],[1,1]])[1],0);
const d=diagnose({...defaults,lambda:0},['S','I','P']);assert.ok(d.rank<=4);
const base=simulate(defaults),band=envelope(defaults);for(let i=0;i<base.length;i++)assert.ok(band[i].low<=base[i].P&&band[i].high>=base[i].P);
assert.throws(()=>simulate({...defaults,m:0}));assert.throws(()=>simulate({...defaults,r:NaN}));
console.log(JSON.stringify({status:'passed',maxConvergenceError,maxBalanceError,analyticChain:'passed',exactDegeneracy:'passed',defaultProduct:diagnose(defaults),defaultAll:diagnose(defaults,['S','I','P'])}));
