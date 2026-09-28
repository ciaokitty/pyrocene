# Disposable Stage 4 experiments

The real game remains **Expedition → Cooperation → Negligence** on port 8024.
Its two-team proposal, room review and shared commitment are not replaced by
these experiments. Do not change its balance while tuning a lab.

| Surface | Location | Purpose |
|---|---|---|
| Accepted game | `../expedition.html`, `../round.html` | Survey, negotiate, commit, project recovery and fire |
| Earlier Ledger | `../ledger.html`, `../ledger-model.mjs` | Open commitments and recurring six-month decisions |
| Paper Prelude | `../prelude/` | Learn the earlier Ledger rules on a paper map |
| Vigilance trial | [vigilance/](vigilance/README.md) | Paid evidence and temporary protection, independent rules |

The older Ledger files retain their paths so existing links and portable
packages still work. Tonight's new mechanics live entirely in `vigilance/`.
Neither Ledger nor Prelude has been silently upgraded to these new rates.

Before transferring anything, read [the migration map](vigilance/MIGRATION.md).
It records the accepted game's real candidate identities, funding arithmetic,
private proposals, room authority, reset behavior and projection semantics.
Transfer concepts into that game after user review, not whole lab controllers.

Rollback reference: `stage4-before-vigilance` points to `769b21c`.
The real game's source remains identical to that checkpoint. A lab can be
discarded without resetting the repository or losing later accepted work.
