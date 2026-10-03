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

# Independent unequal-rate chain (u=2): S=e^-0.5t, I=e^-0.5t - e^-t, P=1 - 2e^-0.5t + e^-t
rows_u2=np.array(simulate_m2(lam=0,q=0,r=0,u=2,tau_end=2.0,dt=.005))
t2=rows_u2[:,0]; S2=np.exp(-.5*t2); I2=np.exp(-.5*t2)-np.exp(-t2); P2=1.0-2.0*np.exp(-.5*t2)+np.exp(-t2)
assert np.max(np.abs(rows_u2[:,1]-S2)) < 1e-10
assert np.max(np.abs(rows_u2[:,2]-I2)) < 1e-10
assert np.max(np.abs(rows_u2[:,3]-P2)) < 1e-10
assert np.allclose(rows_u2[:,1:].sum(axis=1),1,atol=1e-12)

# Exact algebraic degeneracy at lambda=0: (a0=1, m=1) vs (a0=2, m=2/3) both have h=0.5
deg1=np.array(simulate_m2(a0=1.0,m=1.0,lam=0,u=1.3,q=0.25,r=0.15,tau_end=3.0,dt=.01))
deg2=np.array(simulate_m2(a0=2.0,m=2.0/3.0,lam=0,u=1.3,q=0.25,r=0.15,tau_end=3.0,dt=.01))
assert np.max(np.abs(deg1[:,1:]-deg2[:,1:])) < 1e-10

# Test non-zero side rates and deactivation
gen_rows=np.array(simulate_m2(a0=2.0,lam=0.3,m=1.5,u=1.2,q=0.3,r=0.2,tau_end=5.0,dt=.005))
assert np.allclose(gen_rows[:,1:].sum(axis=1),1,atol=1e-11)
assert gen_rows[:,1:].min() >= -1e-12

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
