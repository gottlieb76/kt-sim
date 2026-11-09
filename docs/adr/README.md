# Architecture decision records

Keep architectural decisions lightweight and close to the code. Architects draft
and maintain ADRs; engineers consult accepted decisions during implementation.
Record significant boundaries, contracts, or tradeoffs, not every coding choice.

Copy [template.md](template.md) to `NNNN-short-title.md` using the next available
number. Start as Proposed. Mark Accepted only after an explicit maintainer decision
or an architectural choice already authorized by the task; ask when unclear.
Preserve superseded records and link their replacements. There are no accepted
ADRs yet; the template is not a decision.

Capture enough context for someone to understand the decision, alternatives,
consequences, and how it will be validated. Larger refactorings should describe
incremental migration so each delivered story leaves working software.
