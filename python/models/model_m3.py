import numpy as np

def solve_s(K, target):
    if K <= 0:
        return max(0.0, min(1.0, target))
    lo, hi = -745.0, 0.0
    if np.exp(lo) + K * lo > target:
        return 0.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if np.exp(mid) + K * mid > target:
            hi = mid
        else:
            lo = mid
    return float(np.exp((lo + hi) / 2))


def simulate_m3(C0=1.0, J0=1.0, eta=0.7, K=0.15, geometry='foil'):
    if not all(np.isfinite(v) for v in (C0, J0, eta, K)) or C0 <= 0 or J0 <= 0 or not 0 <= eta <= 1 or K < 0:
        raise ValueError("Positive capacities/rates, eta in [0,1], K >= 0 required")
    if geometry not in ("foil", "solid"):
        raise ValueError("geometry must be foil or solid")
    tau_metal = C0 / J0 if geometry == 'foil' else 3.0 * C0 / J0
    u_end = C0
    s_end = solve_s(K, 1.0 - eta * u_end)
    p_end = 1.0 - s_end
    return {
        'tau_metal': tau_metal,
        'product_at_end': p_end,
        'substrate_at_end': s_end,
        'side_consumption': C0 - p_end
    }
