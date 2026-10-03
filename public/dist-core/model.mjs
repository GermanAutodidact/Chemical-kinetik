// Analytischer Vergleich: S -> P, S -> B, P -> D. Keine substanzspezifischen Parameter.
export function validate(q,r,tau){
  if(![q,r,tau].every(Number.isFinite)||q<0||r<0||tau<0) throw new Error('Nichtnegative, endliche Parameter erforderlich.');
}
export function state(q,r,tau){
  validate(q,r,tau);
  const K=1+q, delta=K-r, S=Math.exp(-K*tau);
  const P=Math.abs(delta)<1e-10 ? tau*S : delta>0 ? Math.exp(-r*tau)*(-Math.expm1(-delta*tau))/delta : S*Math.expm1(delta*tau)/delta;
  const B=q/K*(-Math.expm1(-K*tau));
  const D=Math.max(0,1-S-P-B);
  return {S,P,B,D,formation:S,loss:r*P,side:q*S+r*P};
}
export function events(q,r){
  validate(q,r,0);
  const K=1+q, delta=K-r;
  const peak=r===0?null:Math.abs(delta)<1e-10?1/K:Math.log(K/r)/delta;
  let crossing=null, crossingStatus='Keine endliche Kreuzung';
  if(q>1){crossingStatus='Nebenraten von Beginn an größer';}
  else if(q===1){crossing=0;crossingStatus=r===0?'Raten zu allen Zeiten gleich':'Gleichheit bei τ = 0, danach Nebenraten größer';}
  else if(r>0){
    const x=delta*(1-q)/r;
    if(x>-1){crossing=Math.abs(delta)<1e-10?(1-q)/r:Math.log1p(x)/delta;crossingStatus='Erste Ratengleichheit';}
  }
  return {peak,crossing,crossingStatus,peakP:peak===null?1/K:state(q,r,peak).P};
}
