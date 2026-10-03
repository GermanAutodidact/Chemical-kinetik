import numpy as np
from models.model_m1 import simulate_m1
from models.model_m2 import simulate_m2
from models.model_m3 import simulate_m3

for q in (0,.25,2):
    for r in (0,.15,1+q,1+q+1e-9,3):
        t,S,P,side=simulate_m1(q,r)
        assert np.allclose(S+P+side,1,atol=1e-12)
        assert min(S.min(),P.min(),side.min()) >= -1e-12
# Independent equal-rate sequential chain: S=e^-ht, I=ht e^-ht.
rows=np.array(simulate_m2(lam=0,q=0,r=0,u=1,tau_end=1.013,dt=.007))
t=rows[:,0];S=np.exp(-.5*t);I=.5*t*S
assert rows[-1,0] == 1.013
assert np.max(np.abs(rows[:,1]-S)) < 1e-10
assert np.max(np.abs(rows[:,2]-I)) < 1e-10
assert np.allclose(rows[:,1:].sum(axis=1),1,atol=1e-12)
assert rows[:,1:].min() >= -1e-12
coarse=np.array(simulate_m2(dt=.1))[-1,1:]
fine=np.array(simulate_m2(dt=.05))[-1,1:]
reference=np.array(simulate_m2(dt=.002))[-1,1:]
assert np.max(abs(fine-reference)) < np.max(abs(coarse-reference))/10
for C in (.1,1,3):
 for eta in (0,.7,1):
  for K in (0,.15,1):
   for geom in ('foil','solid'):
    x=simulate_m3(C0=C,eta=eta,K=K,geometry=geom)
    assert abs(x['tau_metal']-(C if geom=='foil' else 3*C))<1e-12
    assert abs(x['product_at_end']+x['substrate_at_end']-1)<1e-12
    assert abs(x['product_at_end']+x['side_consumption']-C)<1e-12
    assert x['side_consumption']>=-1e-12
    if K and x['substrate_at_end']>0:
     s=x['substrate_at_end'];assert abs(s+K*np.log(s)-(1-eta*C))<1e-10
for f,args in [(simulate_m1,{'q':-1}),(simulate_m2,{'dt':0}),(simulate_m3,{'geometry':'typo'}),(simulate_m3,{'J0':0})]:
 try:f(**args)
 except ValueError:pass
 else:raise AssertionError('Invalid input accepted')
print('Python M1/M2/M3 passed: analytic chain, conservation, nonnegativity, convergence, exact end time, invalid inputs.')
