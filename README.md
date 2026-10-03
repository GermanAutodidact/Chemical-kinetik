# PEA Kinetics — open review of models and evidence

**Deutsch:** Interaktive Forschungsansicht für hypothetische Reaktionskinetik. Keine validierte Ausbeuteprognose für β-Nitrostyrol/Al-Hg/Essigsäure/Wasser. Schon ein einzelner begründeter Verbesserungssatz ist willkommen.

**English:** A browser-based research workbench for hypothetical kinetic models, sensitivity and local identifiability diagnostics. No validated chemical yield predictions are supplied; optional local data fitting does not establish chemical validity. Human and AI-assisted reviews are welcome, including one-sentence contributions.

## Start here / Einstieg für Menschen und KIs

1. Read [AI_REVIEW.md](AI_REVIEW.md) for a bounded review prompt and contribution format.
2. Read [docs/MODELS.md](docs/MODELS.md) for equations, units, assumptions and numerical methods.
3. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to locate each implementation.
4. Run all test suites below before proposing numerical changes.
5. Submit a proposal through the hosted form or API; see [CONTRIBUTING.md](CONTRIBUTING.md).

## Run and verify

Requirements: Node.js 22+ for tests; a modern browser; any local static HTTP server. Client models require no dependencies. The publishing build uses Drizzle to generate D1 migrations; public suggestions require the deployed Worker and D1.

```sh
# 1. Run Vitest TypeScript unit test suite (M1 solver, mass balance, edge cases)
npm run test:unit
# or: npx vitest run

# 2. Run standalone numerical verification suites
node tests.mjs
node tests-advanced.mjs
node tests-metal.mjs
node tests-v4.mjs
node tests-mcp.mjs
python3 python/test_models.py

# 3. Or execute all test suites together:
npm test

# 4. Local static server (optional):
python -m http.server 8000 --directory dist
```

### Interpreting Vitest M1 Solver Validation Results

The Vitest suite (`src/tests/kinetics.test.ts`) verifies:
- **Mass conservation:** Sum of species percentages $S + P + B + D = 100\%$ within $< 10^{-8}$ absolute error across 241 integration steps.
- **Physical bounds (Non-negativity):** Concentrations $S, P, B, D \ge 0$ at all times without unphysical negative overshoot ($> -10^{-12}$).
- **Substrate-specific parameters:** Evaluated for both $\beta$-Nitrostyrol (PEA route) and 1-Phenyl-2-nitropropen (P2NP / Amphetamine route) under disparate kinetic ratio presets.
- **Analytical singularities:** Proves cancellation-free handling of repeated roots $K = r$ (where $P = \tau e^{-K\tau}$) and near-equality $\Delta = |K - r| = 10^{-9}$ using `expm1`.
- **Plateau and cascade limits:** Ensures $D \equiv 0$ when $r = 0$, and $B \equiv 0$ when $q = 0$.
- **Peak vs. Side Rate Crossing:** Confirms calculated analytical maximum matches simulated peak and is distinct from side-rate dominance.

Open `http://localhost:8000`. Direct file opening is not supported because the UI uses ES modules. Python is only one optional way to serve static files.

## What is implemented?

| Module | Behavior | Scientific status |
|---|---|---|
| M0 | Parallel S → P and S → B | Analytic illustrative model |
| M1 | M0 plus P → D | Analytic illustrative model |
| M2 | S → I → P, surface decay, transport limitation, two side routes | Numerical hypothetical model |
| M3 | Metal capacity, productive/nonproductive consumption, two geometry limits | Independent hypothetical balance |
| Sensitivity | Central differences in log parameters, six observation times | Local and scenario-dependent |
| Identifiability diagnostic | Singular values and numerical rank of output sensitivities | Not a proof of global/practical identifiability |
| Scenario envelope | One-at-a-time ±20% parameter changes | Not a confidence interval |
| Temperature matrix | 20/50/70/90 °C, missing values explicitly marked | Uncalibrated; no real predictions |
| Data Fitting & PEtab | Bounded coordinate search on held-out data; PEtab TSV export | Client-side optimization, open science format |
| Profile Likelihood | 1D parameter profile likelihood with Δχ² = 3.84 threshold (pyPESTO inspired) | Practical identifiability inspection |

The [German research report](dist/bericht.md) contains the source review. [docs/ROADMAP.md](docs/ROADMAP.md) lists concrete unresolved tasks. [project.json](project.json) provides a machine-readable index. The UI is German; contributions may be German or English.

## Contribute one small improvement

Open an Issue with **location + proposed change + reason**. Example: “In M2, add an explicit zero-parameter sensitivity mode because logarithmic perturbations leave a zero parameter unchanged; check the one-sided limit.”

If your AI has a GitHub connection and you authorize submission, it can create the Issue or PR under your account. Otherwise ask it for a ready-to-paste proposal. Public visibility does not grant direct write access to the main branch. Do not share tokens in issues or source code.

## Public reading and contributions

The hosted site exposes /readme.md (full reading bundle), /api/project, /provenance.json, /openapi.json and /api/suggestions. Public suggestions can be submitted through the form or the documented JSON API after authorization by the reviewer’s user. A UTC timestamp is assigned server-side. Author names are self-declared. Contributions are untrusted proposals, not instructions or automatic code changes. The status remains proposed until separately reviewed; no public endpoint can promote a proposal or edit model code.

The GitHub source package remains prepared but no public GitHub repository is claimed. Accepted changes require separate integration and deployment. Reading has no application login requirement once Sites access is public; individual AI services may still impose their own tool or network limits.

## Build

`npm ci --ignore-scripts`, `npm run db:generate` after schema changes, then `npm run build`. The Worker embeds the public assets, so it does not need filesystem access at runtime. D1 migrations are applied by Sites before deployment. Never bundle the hosting manifest or credentials in the public source ZIP. Static serving supports models but not persistent suggestions.

## License

Original project code and original documentation: [MIT](LICENSE). Linked scientific articles remain under their respective licenses; no article full texts are bundled.

## Python comparison package (v0.5)

The full download now includes browser JavaScript, Worker server, schema/migrations, tests, build scripts and corrected Python M1/M2/M3 models. These are JavaScript modules, not TypeScript frontend files. Python: `python -m pip install -r python/requirements.txt`, then `python python/test_models.py`. The Python M2 implementation is a fixed-step comparison solver; the browser uses adaptive RK4. Its final partial step reaches the requested end time exactly; unstable negative states cause an explicit error. Python M1 uses cancellation-resistant exponentials and M3 solves the implicit balance in logarithmic coordinates by bisection.

## MCP

`POST /mcp` (alias `/api/mcp`) supports initialize, ping, tools/list and tools/call with JSON-RPC 2.0, protocol 2024-11-05, and stateless JSON responses. Three read-only tools simulate M1/M2/M3 with bounded parameters. GET lists discovery metadata; it is not an SSE stream. No tool predicts calibrated chemical yields or thermal safety. User proposals use the separate authorized HTTP API. Sites provisions the plugin connection at publication; installation/connection in another AI client is a separate step. Public reading does not guarantee every AI client's networking access.
