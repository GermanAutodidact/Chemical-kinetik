// M3: dimensionless capacity accounting, independent of the uncalibrated M2 model.
export function validateMetal(p){
 if(!p||![p.capacity,p.flux,p.eta,p.K,p.alpha].every(Number.isFinite)||p.capacity<=0||p.flux<=0||p.eta<0||p.eta>1||p.K<0||![0,2/3].includes(p.alpha))throw new Error('Invalid M3 parameters');
}
export function depletionTime(p){validateMetal(p);return p.capacity/((1-p.alpha)*p.flux);}
export function metalState(p,t){
 validateMetal(p);if(!Number.isFinite(t)||t<0)throw new Error('Invalid time');
 const end=depletionTime(p),remaining=t>=end?0:p.capacity*Math.pow(1-t/end,1/(1-p.alpha)),consumed=p.capacity-remaining;
 let S;
 if(p.K===0)S=Math.max(0,1-p.eta*consumed);
 else{
  // Solve in log(S) to avoid loss of significance for small substrate fractions.
  const target=1-p.eta*consumed;let lo=-745,hi=0;
  if(Math.exp(lo)+p.K*lo>target)S=0; // Smaller than representable substrate fraction.
  else {for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(Math.exp(mid)+p.K*mid>target)hi=mid;else lo=mid;}S=Math.exp((lo+hi)/2);}
 }
 const product=1-S,waste=consumed-product;
 return {t,remaining,consumed,S,product,waste:Math.max(0,waste),metalFraction:remaining/p.capacity};
}
export function metalCurve(p){const end=depletionTime(p);return Array.from({length:221},(_,i)=>metalState(p,end*1.1*i/220));}
