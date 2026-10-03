# Mathematical model reference

All parameters used in the UI are illustrative. No fitting to verified experimental data, atomistic simulation, measured uncertainty estimation or chemical validation has been performed.

## M0/M1 — analytic parallel reaction with optional product loss

S → P at k1; S → B at k2; P → D at k3. Normalize initial S to 1 and all other amounts to 0. Use τ=k1 t, q=k2/k1, r=k3/k1 and K=1+q.

S=exp(−Kτ); P=[exp(−rτ)−exp(−Kτ)]/(K−r); B=q[1−exp(−Kτ)]/K; D=1−S−P−B.

At K=r, P=τ exp(−Kτ). At r=0 the product rises to 1/K, without a finite maximum. For r>0, τ_peak=ln(K/r)/(K−r), with limit 1/K.

Production rate is S; all side rates sum to qS+rP. The UI distinguishes their crossing from product maximum. Full derivation appears in dist/bericht.md. Cancellation-resistant exponential functions are used in model.mjs.

## M2 — intermediate, surface decay and transport resistance

States in initial substrate equivalents: S (substrate), I (unspecified intermediate pool), P (product), B (direct side pool), D (product-loss pool). No identity is assigned to I.

```
a(τ) = a0 exp(−lambda τ)
h(τ) = a(τ) m / (a(τ)+m)
S' = −hS − qS
I' = hS − u h I
P' = u h I − rP
B' = qS
D' = rP
```

All states sum to 1. Initial state is [1,0,0,0,0]. All parameters and time are dimensionless. h is a deliberately simplified two-resistance hypothesis, not an experimentally established model. Both productive steps share h; q is a hypothetical bulk side route. lambda describes deactivation only.

| Parameter | Meaning | UI range | Default |
|---|---|---:|---:|
| a0 | Initial effective surface activity | 0.05–5 | 1 |
| lambda | Surface deactivation rate | 0–2 | 0.15 |
| m | Effective transport capacity | 0.05–5 | 1 |
| u | Relative intermediate conversion factor | 0.05–5 | 1 |
| q | Direct side rate | 0–2 | 0.2 |
| r | Product loss rate | 0–2 | 0.1 |

Ranges are interface bounds, not chemical priors or experimentally supported ranges. The one-at-a-time ±20% scenarios can extend beyond these UI bounds. The exported solver validates finite nonnegative parameters but is not a general stiff ODE solver; arbitrary large programmatic inputs are not guaranteed accurate.

### Numerical integration

Adaptive RK4 step doubling, relative tolerance 1e-8 and absolute tolerance 1e-10, with Richardson correction. Output every 0.05 on [0,6]. Default maximum step remains 0.005 for M2. Steps exceeding the error budget or producing negative states beyond tolerance are rejected. This is not an implicit stiff solver. Detected sign changes and positive-to-negative product-slope changes are refined with bisection and re-integration to time tolerance 1e-8. Tangential or multiple roots inside an output interval can still be missed.

### Scenario envelope

Baseline plus twelve one-at-a-time trajectories at 0.8× and 1.2× each of six parameters. Pointwise min/max of product P. This is not simultaneous uncertainty propagation, a probability distribution or a confidence band. A zero parameter stays zero under relative changes.

### Local sensitivities and numerical rank

Central derivative ∂output/∂ln θ via θ×exp(±0.001). Outputs are either P alone or S,I,P, sampled at τ=0.5,1,2,3,4,6. Sensitivity score is 100×RMS of a column of J. Multiplication by 100 converts fractions to percentage points.

Singular values are obtained by one-sided Jacobi SVD on J itself (at most 100 sweeps, relative column-orthogonality threshold 1e-14), without forming JᵀJ. Numerical rank counts values above 1e-5 of the largest. This remains a floating-point local diagnostic, not a global proof.

The most similar parameter pair is selected by maximum absolute cosine similarity of nonzero sensitivity columns. This is not a parameter-correlation estimate. A full numerical rank neither proves global structural identifiability nor establishes practical identifiability from noisy observations. No observation-noise weighting, Fisher-based confidence intervals or profile-likelihood calculation is implemented.

### Exact ambiguity

At lambda=0, a0=1,m=1 and a0=2,m=2/3 both yield h=0.5. All state trajectories coincide when other parameters match. Even perfect S,I,P observation cannot separate a0 and m in this special case. The tests verify this equality numerically; the equality follows algebraically.

## Not implemented

Temperature dependence in M2, evolving speciation, activation of the metal, autocatalysis, calibrated transport, heat balance integration, reaction calorimetry, atomistic free energy calculations, chemical validation of fitted parameters, probabilistic uncertainty or isolated-yield modeling. These cannot be inferred from the current illustrative sliders.


## M3 — independent metal-capacity and product balance

New on 2026-10-03. M3 is separate from M2; it does not silently add unverified electron bookkeeping to the intermediate model. Capacities are normalized by the ideal electron demand of all initially present substrate. They are not grams or specified electron stoichiometries for an actual preparation.

C is remaining metal capacity; C0 the initial capacity; U=C0−C the consumed capacity. J0 is a freely chosen initial consumption rate per dimensionless time. alpha is 0 (uniform thinning, constant major-face area) or 2/3 (self-similar shrinking solid). The flat-sheet approximation ignores edge area, perforation, folding and roughness.

C′=−J0(C/C0)^alpha until exhaustion. Thus C=C0[1−(1−alpha)J0*t/C0]^(1/(1−alpha)) before the depletion time C0/[(1−alpha)J0], and C=0 thereafter.

Product formation per consumed capacity is dP/dU=eta*S/(K+S), S=1−P. eta is the maximum productive fraction; K is a hypothetical dimensionless saturation parameter. For K>0, integration gives S+K ln S=1−eta*U. The code solves for ln(S) with 100 bisection iterations. K=0 uses P=min(1,eta*U), assigning subsequent capacity consumption to waste after S reaches zero.

W=U−P is all nonproductive consumption, not specifically hydrogen. Both balances hold: C+P+W=C0 and S+P=1. Displayed metal percent is C/C0, while product/substrate percent use initial substrate. These percentages must not be added as a common balance.

UI bounds: C0 and J0 0.1–3; eta and K 0–1. They are illustrative bounds, not experimentally established ranges. M3 ignores intermediate accumulation, product destruction, passivation, metal activation, thermal effects, species equilibria and concentration-dependent metal corrosion. It cannot infer mercury loading, stirring speed, activation energy, a safe boiling limit or an actual reaction duration.

Changing J0 or the selected geometry changes the depletion time but not the final product fraction in this model, because productive allocation is a function of consumed capacity only. This is an assumption-driven result, not a physical generalization.

Tests: `node tests-metal.mjs` checks both balances, the implicit solution, zero productivity, K=0, exact geometric limits, valid endpoint handling and rejected invalid inputs. No chemical validation is implied.


## Data fitting (v0.4) & Identifiability (v0.5)

CSV input t,S,P, 8–200 strictly increasing nonnegative times; S is optional, P required. Values are fractions [0,1]. The first floor(0.8*n) rows (minimum 5) train the M0 or M1 model; later rows are held out. Six starts and bounded coordinate search minimize unweighted squared residuals on available S and P observations. Optimizer uses log rates relative to the final time; bounds exp(-12)/tmax to exp(8)/tmax. M0 fixes k3=0. No global optimum guarantee. Search stops below log step 1e-5 or at 350 iterations per start. Similar-loss solutions satisfy loss <= best*1.02+1e-8; their range is an illustrative heuristic, not a confidence interval. Time units, declared data type and source are retained in the exported result. Inputs stay in the browser. Provenance is user-declared and unverified.

### Profile Likelihood & Open Science Integration (v0.5)

Inspired by open-source systems biology tools (pyPESTO / Raue et al., 2009; PEtab; ChemPy):
1. **Interactive 1D Profile Likelihood:** The browser client now implements an interactive profile likelihood calculation for target parameters (k1, k2, k3). By stepping theta_i on a log grid while re-optimizing the remaining parameters, Delta chi^2 = N * (loss - minLoss)/minLoss is computed against the 95% threshold of 3.84 (Wilks' theorem, 1-DOF). Profiles crossing 3.84 on both sides demonstrate practical identifiability for the dataset; flat profiles reveal practical or structural non-identifiabilities.
2. **PEtab Standard Export (TSV):** Experimental data can be exported in standardized PEtab format (`measurements.tsv`, `parameters.tsv`, `observables.tsv`) for direct external validation in tools like pyPESTO, PEtab.jl, or AMICI.
3. **Automated Stoichiometric Invariance (`python/models/reaction_system.py`):** Inspired by ChemPy, a formal stoichiometric network representation calculates the kernel of the stoichiometric matrix (c^T * N = 0) and formally proves that total molar mass closure (S + P + B + D = 1.0 for M1; S + I + P + B + D = 1.0 for M2) is preserved algebraically across all trajectories.

### Explicitly Excluded Components (and Rationale)
- **Heavy C++ runtime binaries (Cantera, SUNDIALS) in the client:** Excluded to preserve the zero-third-party-runtime-dependency rule in the browser and prevent multi-megabyte bundle penalties.
- **Automated quantum-chemical DFT transition state searches:** Excluded as they require HPC cluster environments and atomic basis sets beyond browser/microservice capability.
- **Substrate-specific dosing, synthesis recipes, or process optimizations:** Excluded for safety reasons and to maintain the platform's nature as an uncalibrated mathematical research workbench.

Python comparison implementations in python/ preserve the same equations. M2 uses fixed RK4 with an exact shortened final step and explicit failure for nonfinite or negative states; compare using step refinement. Tests include an independent equal-rate sequential chain solution. All Python outputs remain hypothetical and dimensionless.

## Testing guide: Vitest unit test suite for M1 solver validation

The project includes an automated Vitest test suite (`src/tests/kinetics.test.ts`) that verifies the analytical M1 solver against mathematical invariances, edge cases, and substrate-specific parameters.

### How to run the test suite

```sh
# Run the Vitest unit tests once
npm run test:unit
# or: npx vitest run

# Run Vitest in interactive watch mode
npx vitest

# Run all test suites (Vitest + Node verification + Python models)
npm test
```

### Interpreting validation results

| Test Group | Physical & Mathematical Property | Acceptance Criterion | Failure Interpretation |
|---|---|---|---|
| **Mass Balance Conservation** | Stoichiometric closure: $S(\tau) + P(\tau) + B(\tau) + D(\tau) = 100\%$ | Deviation from 100.0% is $< 10^{-8}$ at all 241 sample points $\tau \in [0, 6.0]$ | If the sum diverges from 100%, intermediate pools are leaked or closed-form integral coefficients are inconsistent. |
| **Non-Negativity Constraints** | Physical reality of concentrations: $S, P, B, D, BD \ge 0$ | No state falls below $-10^{-12}$ | Negative concentrations indicate catastrophic cancellation, improper exponentiation, or unbounded subtraction. |
| **Initial Conditions & Monotonicity** | Boundary state at $\tau = 0$ and irreversible substrate consumption | $S(0) = 100\%$, $P(0) = B(0) = D(0) = 0\%$; $S(\tau_{i}) \le S(\tau_{i-1})$ | Non-monotonic substrate points indicate numerical drift or broken step propagation. |
| **Degenerate Pole $K = r$** | Repeated eigenvalue in the linear ODE cascade | Finite output, no `NaN` or `Infinity`, $P(\tau) = \tau \exp(-K\tau)$ | Standard closed-form $(e^{-r\tau} - e^{-K\tau})/(K-r)$ divides by zero when $K=r$. Code must smoothly evaluate the continuous limit. |
| **Near-Degeneracy Cancellation** | Numerical stability when $\|K - r\| = 10^{-9}$ | Closed-form $P(\tau)$ maintains $\ge 8$ significant digits | Naive subtraction of nearly equal floating-point numbers causes catastrophic loss of significance. The solver must use `expm1`. |
| **Zero Product Degradation ($r = 0$)** | Asymptotic plateau behavior | $D(\tau) \equiv 0$ identically; $P(\tau) \to 100/K$ as $\tau \to \infty$ | Any non-zero $D$ indicates leaking into an inactive degradation channel. |
| **Zero Side Reaction ($q = 0$)** | Pure sequential cascade $S \to P \to D$ | $B(\tau) \equiv 0$ identically | Any non-zero $B$ indicates leaking into an unconfigured branch. |
| **Substrate Parameter Sets** | Robustness across distinct chemical regimes | Preserved across $\beta$-Nitrostyrol (fast reduction, low ketoxime accumulation) and P2NP (steric hindrance, ketoxime stability, hydrolysis losses) | Proves that the solver is robust under disparate kinetic ratios without crashing or losing precision. |
| **Peak vs. Side Rate Crossing** | Distinction between optimum yield and side-reaction takeover | $\tau_{\text{peak}} = \frac{\ln(K/r)}{K-r}$; $\tau_{\text{cross}}$ solves $(1-q)S = rP$; $\tau_{\text{cross}} \neq \tau_{\text{peak}}$ | Confusing product maximum with side-rate crossing leads to false process interpretations. |

