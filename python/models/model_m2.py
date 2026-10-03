import numpy as np

def simulate_m2(a0=1.0, lam=0.15, m=1.0, u=1.0, q=0.25, r=0.15, tau_end=6.0, dt=0.005):
    """
    Erweitertes Modell mit RK4: S -> I -> P, S -> B, P -> D
    """
    values = (a0, lam, m, u, q, r, tau_end, dt)
    if not all(np.isfinite(v) for v in values) or min(values) < 0 or dt <= 0:
        raise ValueError("Finite nonnegative parameters and positive dt required")
    steps = int(np.ceil(tau_end / dt))
    if steps > 1000000:
        raise ValueError("Too many integration steps")
    S, I, P, B, D = 1.0, 0.0, 0.0, 0.0, 0.0
    history = [(0.0, S, I, P, B + D)]
    
    for step in range(steps):
        t = step * dt
        hstep = min(dt, tau_end - t)
        def deriv(tau, s, i, p):
            a = a0 * np.exp(-lam * tau)
            h = (a * m) / (a + m) if a + m > 0 else 0.0
            return (-h*s - q*s, h*s - u*h*i, u*h*i - r*p, q*s, r*p)
            
        k1 = deriv(t, S, I, P)
        k2 = deriv(t + 0.5*hstep, S + 0.5*hstep*k1[0], I + 0.5*hstep*k1[1], P + 0.5*hstep*k1[2])
        k3 = deriv(t + 0.5*hstep, S + 0.5*hstep*k2[0], I + 0.5*hstep*k2[1], P + 0.5*hstep*k2[2])
        k4 = deriv(t + hstep, S + hstep*k3[0], I + hstep*k3[1], P + hstep*k3[2])
        
        S += (hstep/6.0)*(k1[0] + 2*k2[0] + 2*k3[0] + k4[0])
        I += (hstep/6.0)*(k1[1] + 2*k2[1] + 2*k3[1] + k4[1])
        P += (hstep/6.0)*(k1[2] + 2*k2[2] + 2*k3[2] + k4[2])
        B += (hstep/6.0)*(k1[3] + 2*k2[3] + 2*k3[3] + k4[3])
        D += (hstep/6.0)*(k1[4] + 2*k2[4] + 2*k3[4] + k4[4])
        
        if min(S, I, P, B, D) < -1e-10 or not np.isfinite([S, I, P, B, D]).all():
            raise ValueError("Unstable step: reduce dt")
        history.append((min((step + 1)*dt, tau_end), S, I, P, B + D))
    return history
