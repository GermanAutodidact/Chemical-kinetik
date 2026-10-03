import numpy as np

def simulate_m1(q=0.25, r=0.15, tau_end=6.0, steps=240):
    """
    S -> P -> D (rate k3 = r*k1)
    S -> B (rate k2 = q*k1)
    """
    if not all(np.isfinite(v) for v in (q, r, tau_end)) or min(q, r, tau_end) < 0:
        raise ValueError("Rates and end time must be finite and nonnegative")
    if isinstance(steps, bool) or not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    K = 1.0 + q
    taus = np.linspace(0, tau_end, steps + 1)
    S = np.exp(-K * taus)
    delta = abs(K - r)
    if delta == 0:
        P = taus * np.exp(-K * taus)
    else:
        P = np.exp(-min(K, r) * taus) * (-np.expm1(-delta * taus)) / delta
    B = (q / K) * (1.0 - np.exp(-K * taus))
    D = 1.0 - S - P - B
    return taus, S, P, B + D
