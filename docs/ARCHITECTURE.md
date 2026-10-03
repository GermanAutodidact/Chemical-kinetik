# Architecture

Client-side models plus a Node.js / Express service on Google Cloud Run with durable SQLite storage for public community suggestions. No remote model inference or user-account system. Model parameters live in page memory; reloading resets them. Downloads are created locally by the browser.

| Path | Responsibility |
|---|---|
| `dist/index.html` | Semantic German UI and source review |
| `dist/style.css` | Responsive dark theme |
| `dist/model.mjs` | Analytic M0/M1 states and event formulae |
| `dist/app.mjs` | M0/M1 controls, SVG, CSV download; optional WebMCP configuration tool |
| `dist/advanced.mjs` | M2 derivative, RK4 solver, sensitivities, envelope, eigenvalues and diagnostic rank |
| `dist/advanced-ui.mjs` | M2 numeric controls, SVG, result table, diagnostics and JSON download |
| `advanced-section.html` | Authoring copy of the M2 section inserted into index.html; keep both consistent |
| `dist/bericht.md` | Downloadable research report |
| `dist/matrix.csv` | Real-system matrix with missing values, not synthetic predictions |
| `tests.mjs` | M0/M1 conservation, ODE, event and limiting-case checks |
| `tests-advanced.mjs` | M2 analytic chain, conservation, step-halving and degeneracy checks |

## Data flow

Controls → validated parameters → pure model functions → SVG/tables → optional local download. No network requests are used by the calculation. The suggestion UI uses the same-origin public API. Source links are ordinary external links.

## Editing

No build tool is needed. Serve dist over HTTP. Do not open index.html directly from the filesystem because module loading depends on browser policies. The UI uses modern ES modules, ResizeObserver and SVG.

The optional WebMCP tool is registered only when `document.modelContext.registerTool` exists. Only M0/M1 controls are currently exposed. Browser-level WebMCP validation was not available. The numerical tests are not a substitute for browser interaction testing.

## Distribution

The public source export excludes `.git`, `.openai`, hosting IDs and deployment credentials. The hosted copy may have a separate hosting manifest. The public repository is not automatically connected to production deployment. The owner must explicitly integrate and publish accepted changes.

## M3 extension
`dist/metal.mjs` implements capacity depletion and implicit productive allocation; `dist/metal-ui.mjs` owns its controls, independent SVG and JSON download. `metal-section.html` is the authoring copy of the matching section in index.html. `tests-metal.mjs` tests its balances and analytic limits. Keep both section copies consistent.


## Server and numerics

`server.ts` runs an Express service on Google Cloud Run that serves the React SPA, static reading assets, OpenAPI specification, Model Context Protocol (MCP) JSON-RPC 2.0 endpoints (`/mcp` and `/api/mcp`), and handles community proposals stored in SQLite (`data/suggestions.db`). Drizzle is used for database migrations.

`POST /api/suggestions` validates authorization flag, text sizes, request_id and declared version. Entries are persistent, public, timestamped by the server and marked proposed. Idempotency prevents duplicate entries for the same request_id. Names are unverified. A daily hash of the connecting IP is retained only in the private database for abuse control; raw IPs are not stored by this application. Three submissions per minute per hash are allowed. This is basic throttling, not a guarantee against distributed abuse. The read API paginates by server-generated sortable IDs. A storage failure returns 503 without discarding the browser draft. The UI renders user content safely.

`numerics.mjs` and `src/utils/kinetics.ts` implement adaptive step doubling, direct Jacobi SVD and bisection. `fit.mjs` and `src/utils/fit.ts` implement local, bounded multi-start fitting and held-out residuals. `tests-v4.mjs` tests numerical cases and the actual generated SQLite schema.

## Vitest test suite and M1 solver validation workflow

### Execution steps

To run the TypeScript and Vitest test suite that validates the M1 analytic solver:

1. **Install dependencies (if not already installed):**
   ```sh
   npm install
   ```

2. **Execute the Vitest suite in single-run mode:**
   ```sh
   npm run test:unit
   # or directly via Vitest CLI:
   npx vitest run src/tests/kinetics.test.ts
   ```

3. **Execute Vitest in watch mode (interactive TDD mode during model development):**
   ```sh
   npx vitest
   ```

4. **Execute the complete multi-tiered verification pipeline:**
   ```sh
   npm test
   ```
   This automatically runs Vitest first, followed by the Node.js standalone test harnesses (`tests.mjs`, `tests-advanced.mjs`, `tests-metal.mjs`, `tests-v4.mjs`, `tests-mcp.mjs`) and Python model tests (`python/test_models.py`).

### How to interpret M1 solver validation results

The test suite in `src/tests/kinetics.test.ts` executes 15 distinct assertions covering both chemical substrates and numerical edge cases:

1. **Mass Balance Conservation ($S + P + B + D = 100\%$):**
   - **Assertion:** For every sampled timestamp $\tau \in [0, 6.0]$ across 241 steps, $|(S + P + B + D) - 100.0\%| < 10^{-8}$.
   - **Meaning:** Confirms strict stoichiometric closure. Substrate $S$ is converted either to target amine $P$, direct side-product pool $B$, or product-loss pool $D$. If this test fails, mass is either being artificially created or leaked.

2. **Non-Negativity Constraints ($S, P, B, D \ge 0$):**
   - **Assertion:** No concentration percentage falls below $-10^{-12}$.
   - **Meaning:** Prevents unphysical negative concentrations that could arise from numerical oscillations or flawed algebraic rearrangements.

3. **Substrate Comparison: $\beta$-Nitrostyrol vs. 1-Phenyl-2-nitropropen (P2NP):**
   - **Assertion:** Preserved across disparate kinetic ratios:
     - $\beta$-Nitrostyrol: $q = 0.25, r = 0.15$ (standard), $q = 0.05, r = 0.05$ (ideal low-loss), $q = 0.15, r = 0.75$ (high-temperature loss).
     - P2NP: $q = 0.35, r = 0.40$ (slow intermediate hydrogenation), $q = 0.85, r = 0.10$ (steric side-route dominance), $q = 0.45, r = 0.65$ (acid-catalyzed oxime hydrolysis to P2P).
   - **Meaning:** Proves that the solver is robust under disparate kinetic regimes reflecting the physical differences between the two substrates.

4. **Degenerate Pole & Cancellation-Resistance:**
   - **Assertion ($K = r$):** Verifies that when $K = 1+q = r$ (where standard formulas divide by zero), the solver evaluates the limit $P(\tau) = \tau \exp(-K\tau)$ without producing `NaN` or `Infinity`.
   - **Assertion ($|K - r| = 10^{-9}$):** Verifies that near-identical eigenvalues do not suffer from catastrophic floating-point cancellation. The solver uses `Math.expm1` to maintain high numerical precision.

5. **Asymptotic Plateau & Pure Sequential Limits:**
   - **Assertion ($r = 0$):** Product degradation pool $D(\tau) \equiv 0$ identically, and product monotonically approaches $100/K$.
   - **Assertion ($q = 0$):** Direct side pool $B(\tau) \equiv 0$ identically.

6. **Peak Yield vs. Side-Rate Crossing:**
   - **Assertion:** The analytical peak timestamp $\tau_{\text{peak}} = \frac{\ln(K/r)}{K-r}$ matches the discretized simulated maximum, and the side-rate takeover timestamp $\tau_{\text{cross}}$ (where $(1-q)S = rP$) is strictly distinguished from $\tau_{\text{peak}}$.

