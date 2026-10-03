# Reviewable next tasks

Each item can be addressed independently with a focused issue or PR.

| Task | Acceptance evidence |
|---|---|
| Further validation of implemented direct SVD | Comparison against known full-rank and rank-deficient matrices; stable small singular values |
| Further validation of implemented adaptive solver | Convergence study across UI bounds and envelope excursions; mass conservation and positivity checks |
| Better event localization | Analytic benchmark with known crossing, tangent root and two nearby crossings |
| Zero-parameter sensitivity | Explicit additive/scaled derivative policy; UI explanation; zero-limit tests |
| Observation model | Defined measurement units, error assumptions and species mapping before any fitting |
| Extend implemented local fitting with profile likelihood | Sourced or clearly synthetic validation dataset; identifiability assessment; held-out check |
| Browser accessibility tests | Keyboard, number-field errors, downloads and 360px layout verified |
| M2 WebMCP exposure | Same validated state as UI; valid/invalid input tested in a supported browser |
| Remove duplicated section source | One maintainable authoring source without breaking the no-install workflow |

No fabricated data should be introduced to make an incomplete task appear finished. Changes in chemistry assumptions need primary-source evidence or explicit hypothetical labeling.
