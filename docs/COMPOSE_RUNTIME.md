# The Compose Runtime — CC2 `compose`, made authorable (design note)

**Status:** design proposal — **partly shipped.** Slice 1 items 4 and 5 have landed: `box-and-box/compose.mjs` (1,603 lines, zero deps — it was 461 when this line was written, and most of the growth is the argument for each refusal rather than the refusals themselves) and `test/compose-laws.mjs` exist and run. The surface (item 6) and the worked demo (item 7) do not. · **Reviewable against:** `CC2-capability-composition.md` (§2 operators, §3 coalition), `UMBRELLA.md` (the `compose` stage), `box-and-box` (8 rungs; the suites derive **210 enforced** laws + 3 declared-open — never hand-type this, run them) · **Surface home:** `weave/forge.html` (the lego canvas) · **Runtime home:** `AmpersandBoxDesign/box-and-box/compose.mjs`

> One line: turn the **one unfinished stage of the [&] pipeline** — `compose` (lawless `|>`, no coalition runtime) — into a small lawful runtime, and make it authorable in the Forge as bricks you snap together. Each brick carries *invariant · laws · enforcement · feedback · adaptation*; composing bricks yields another brick. The verdict is the arithmetic.

---

## 1. Why this, why now

`UMBRELLA.md` lists seven stages: `declare → validate → compose → govern → wire → run → observe`. Every stage has a shipped engine **except `compose`**, which is marked *"`&` ✅ · `|>` still lawless · cross-agent coalition compose ❌."* `CC2-capability-composition.md` already specifies the missing piece normatively (`&` lattice, `|>` governed monoid, the coalition object, rung-by-rung admissibility) — but when this note was written it was **draft, no runtime**: schema + `box-and-box lift` existed, the compose runtime and lawful `|>` did not. **That has since changed** — `compose.mjs` and `test/compose-laws.mjs` shipped, and `|>` now carries **4** enforced laws (CP1–CP4) with 4 more (CP5–CP7, CD6) declared-open and printing FALSIFIED. The `compose` stage is no longer lawless; it is lawful with four published holes. <!-- law-count:frozen --> *(This sentence read "123 enforced laws (CP1–CP4)" for part of 2026-08-22. CP1–CP4 is four laws; 123 is the whole-kernel total. The number was carried there by `scripts/check-law-counts.mjs`, which keeps published totals in sync with what the suites derive and cannot tell that a total has been dropped into a slot that wanted a subtotal. A sync gate makes counts CONSISTENT; it does not make a sentence TRUE, and the two are easy to mistake for each other.)*

So this is not a new language. It is the **runtime + authoring surface for a spec we already wrote.** The user's "compose stacks like legos (invariant + laws + enforcement + feedback + adaptation)" maps exactly onto CC2 compose.

### The five facets already have engines (nothing greenfield)

| facet | engine that provides it | symbol |
|---|---|---|
| **invariant** | Weave cost certificate (`classify`/`inferEAL`) + alethic `consume` → `0̲` | the floor |
| **laws** | `box-and-box` property-tested kernel laws — 109 as `test/laws.mjs` derives them | the algebra |
| **enforcement** | the bridge `select(...)` — `feasible ▸ permitted ▸ best` | the verdict |
| **feedback** | `observe` stage — `evolution.mjs` provenance hash-chain + PULSE bus | the trace |
| **adaptation** | `evolution.mjs` `evolve()` — measured/priced/certified change (EV1–EV6) | the rewrite |

**Crucial finding (de-risks v1):** `value.mjs` already exports the operators CC2 needs —
`combine(a,b)` (the `&` lattice merge), `chain(a,b)` (the sequential, phase-graded `|>`), and `consume(v,req)` (the alethic gate that produces `0̲`). CC2's `&`/`|>` are these *lifted from raw Values to capabilities-with-holder-and-contract.* The hard algebra is done; v1 is a thin lift + a type-compatibility check + a surface.

---

## 2. The brick (the unit of composition)

A **brick** is a capability annotated with everything needed to compose it lawfully:

```
Brick = {
  id, holder,                       // who provides it (CC2 provenance tag)
  contract: { accepts_from, feeds_into },   // the |> hand-off types
  value: V({ pi, beta, kappa, sigma }),     // alethic modal value (box-and-box)
  cost:  WeaveCostCertificate,              // the invariant — see §2.1 (the atom this whole layer rests on)
  utility,                                   // axiological score input
  laws:  [...lawIds],                        // which rung laws it claims (conformance)
  floor: [...forbidden],                     // un-weakenable deontic/reflexive constraints
}
```

A brick is exactly the [&] `CC1` capability + holder (CC2 §2.1) + its Weave cost cert. The five facets are all present: cost = invariant, laws = laws, value/floor = enforcement inputs, and the brick gains feedback/adaptation when wrapped in a loop (§3, `⟲`).

### 2.1 `WeaveCostCertificate` — the `Brick.cost` contract (build this FIRST)

The certificate is the atom; the compose runtime is the molecule. It must exist before any composition. Canonical, IR-hash-bound, **fail-closed**:

```ts
type WeaveCostCertificate = {
  subject:  { kind: "weave-ir"; hash: string };          // cert is BOUND to the IR hash;
                                                          // any IR change invalidates it
  analyzer: { name: "weave-eal" | "weave-classify" | "weave-lal"; version: string };
  verdict:  {
    certified:  boolean;       // did analysis succeed with a real bound?
    total:      boolean;       // termination guaranteed
    oracleFree: boolean;       // eal:true ⟹ reduces with no residual superposition
    costClass:  "poly" | "elementary" | "exponential" | "tower" | "unknown";
    ealDepth?:  number;        // certified elementary tower height (weave-eal)
    polynomialDegree?: number; // measured today (weave-eal-degree); PROVEN once static LAL lands
    rank?:      number;        // legacy STLC type-order proxy ONLY — not the certificate's class
  };
  policy:   { resourceDecision: "allow" | "budget_check" | "escalate" | "annihilate"; reason: string };
  evidence: { source?: string; generatedAt: string; /* space for signer/signature later */ };
};
```

**Canonical vocabulary (one set, no synonyms):** `costClass`, `ealDepth`, `polynomialDegree`, `certified`, `oracleFree`, `total`. Keep `rank` *only* for the older STLC proxy. (`classify` currently returns `{rank, rung, terr}`; the certificate maps `rung → costClass` and surfaces `eal`/`depth` from `inferEAL`.)

**Fail-closed is the default.** Uncertified / non-total / non-oracle-free / analyzer-error ⇒ `resourceDecision: "annihilate"` (`0̲`). **Uncertified is vetoed, not a low score** — utility can never resurrect it (this is the whole point of the floor). An explicit `mode: "production" | "development"` may downgrade `unknown → warn/override` in dev, but **production unknown → `0̲`**, always.

**Resource-rung mapping** (the `policy.resourceDecision`):

| static result | decision |
|---|---|
| `poly` / `ealDepth ≤ 1` with safe bounds | `allow` |
| `elementary` above the cheap rung | `budget_check` / `escalate` |
| `exponential` / `tower` | `escalate` / cheaper-plan route |
| uncertified / not total / not oracle-free / analyzer error | `annihilate` (`0̲`) |

---

## 3. The connectors (the lego studs) — and their laws

Four operators. The first two are CC2 §2; the laws are *already* the box-and-box value laws, lifted.

### `&` — combine (parallel) → `combine`
Merge the joint capability set. Lattice join, holder-tagged.
- **Laws (CC2 §2.1):** `A&B == B&A`, `(A&B)&C == A&(B&C)`, `A&A == A`, `A&none == A`.
- **Cost:** resource rung **adds** (two capabilities cost the sum); invariants **conjoin** (κ must stay acyclic — a combine that creates a cycle is flagged `deliberate`).

### `|>` — pipeline (sequence) → `chain`
Governed sequential composition. **The operator CC1 left lawless.**
- **Laws (CC2 §2.2):** `(X|>f)|>g == X|>(f|>g)`, `X|>id == X`, **not** commutative, **not** idempotent.
- **Feasibility:** at each hand-off, producer `feeds_into` must match consumer `accepts_from`, else the stage carries `0̲` and **annihilates the whole pipeline** (alethic `consume`). A type-incompatible pipeline is not "invalid" — it *is* the zero of the composition.
- **Quantities (semiring):** confidence = product, cost = sum, worst-case latency = max, composed end-to-end; compared against each step's `requires` (epistemic β-gate).

### `⟲` — loop (PULSE nest)
Wrap a brick (or a `&`/`|>` tree) in a `retrieve → route → act → learn → consolidate` cadence. This is what attaches **feedback** (the `learn` phase → `OutcomeSignal`/`ReputationUpdate` on the PULSE bus) and **adaptation** (`consolidate` → `evolution.mjs evolve()`). Output is a `*.pulse.json` manifest, generated for free.

### `0̲` — floor (implicit, on every operator)
Any sub-brick that violates an invariant or busts budget annihilates to `0̲` — it does **not** down-rank the parent; it kills that branch (the same floor pattern Weave→govern already uses).

**Closure (why it's legos):** the bridge is closed under composition — composing governed verdicts yields a governed verdict with a merged certificate. So a tree of bricks exposes the *same* Brick interface and emits the *same* six PULSE tokens. A brick of bricks is a brick.

---

## 4. The composite certificate

`compose(tree)` returns one certificate for the whole assembly:

```
{ decision: <winning plan | 0̲>,
  cost:  { rung: join(parts), ... },     // Weave: whole-tree cost class
  value: V(...),                          // alethic: conjoined feasibility + κ
  permitted: <bridge verdict>,            // box-and-box select(): feasible ▸ permitted ▸ best
  annihilated: [...0̲ branches with σ tags],
  record: <evolution.mjs hash-chain entry> }
```

This is "the verdict is the arithmetic": the composite verdict is *computed*, not heuristic — cost from Weave, permission from the bridge, both over the same structural floor.

---

## 5. v1 scope

Ordered so each slice is independently shippable and the risky/broad part comes last. **Slice 0 is the narrow resource-rung path a second review (ChatGPT, on `weave-and-the-ampersand-stack.md`) recommends doing first and alone** — it is correct, and it is also exactly `Brick.cost`, so it serves both goals.

**Slice 0 — the certificate (do this first, ships value on its own):**
1. `weave/src/weave-certificate.mjs` — given Weave IR, emit a deterministic `WeaveCostCertificate` (§2.1): IR hash, analyzer identity+version, `costClass`/`ealDepth`/`polynomialDegree`, fail-closed `resourceDecision`. Pure, no new runtime.
2. Tests (`weave/test/`): cheap/poly term → `allow`; expensive term → `escalate`; unknown/rejected term → `annihilate`; **hash changes when IR changes** (binding test).
3. Harden the `surface/weave_govern.exs` → `box-and-box` resource-rung path to consume the certificate (not re-parse strings), and assert `0̲` annihilation happens *before* utility can resurrect an option. Update `proofs/` receipts: certified-cheap wins & runs · high-utility exponential annihilated · uncertified annihilated · refused plan run manually detonates.

**Slice 1+ — the compose runtime (the lego layer, on top of Slice 0):**
4. `box-and-box/compose.mjs` — `composeAnd`, `composePipe`, `composeTree`, lifting `combine`/`chain`/`consume` from Values to Bricks, with the `feeds_into`/`accepts_from` check and semiring quantity composition.
5. `test/compose-laws.mjs` — CC2 §2 conformance (assoc/idem/identity for `&`; assoc/identity + infeasible⇒`0̲` for `|>`). Property-tested, same harness as the kernel suite. **Shipped:** 101 enforced (CA1–CA4, CP1–CP4, CX1–CX7, CD1–CD17, VX1–VX5, QX1–QX6, AD1–AD5, CERT1–CERT40, TREE1–TREE4, WIRE0–WIRE7, + 1 anchor), 3 declared-open (CP5–CP7).
6. Forge surface: brick palette + canvas; snap with `& | ⟲`; the six panels retarget to the *selected composite* (Certificate = whole-tree cost, Governance = bridge over the tree, Evolve = mutate the tree); **+ a Feedback panel** (`learn`→`OutcomeSignal`).
7. A worked demo: a 3-brick coalition (`retrieve |> certify |> govern`) composed, certified, governed, evolved — the [&] stack composing *itself*.

**Conservative composite-cost rule (CC2 §2.2; keep simple, don't overbuild):** any uncertified child ⇒ the composed plan is uncertified (`0̲`); `costClass` = the max (worst) over children; numeric budgets **sum** along `|>` (cost), **product** for confidence, **max** for latency. The certificate format must leave room for this — it does (§2.1) — but the multi-plan resolver itself is Slice 1, not Slice 0.

**Out (v1):**
- Cross-agent **strategic** ability (`⟨⟨agents⟩⟩◊ ensure`, CC2 §3) — coalition admissibility against an adversary. v2.
- Common-knowledge / coordinated-attack epistemic check (CC2 §3). v2.
- CloudEvents transport on the PULSE bus (`UMBRELLA.md` item 5). Keep the local hash-chain substrate; wire transport later.
- A real interpositional `run` host. Out — that's a separate stage.

**Connects to, must not skip:** the `govern` bridge (`box-and-box compile`/`govern`) is the dependency; compose sits *on top* of it. The first technical task is lawful `|>` (item 1) — small and self-contained.

---

## 6. Review checklist (against CC2 before any code)

- [ ] Does `Brick` faithfully carry CC2 §2.1's holder + contract, and is `&` still idempotent with the holder tag as provenance (not a tiebreak)?
- [ ] Does `|>` match CC2 §2.2 exactly: associative, `id` identity, non-commutative, infeasible⇒`0̲`, semiring quantities?
- [ ] Is the composite cost the **join** of parts' Weave rungs (not a re-measurement)?
- [x] Are the new laws a strict superset check over the existing kernel laws (no contradiction with `combine`/`chain`/`consume`)? — both suites are green together; CP5–CP7 and CD6 are the declared exceptions and fail loudly rather than silently.
- [ ] Is v1 honest about what it is *not* (no strategic/epistemic coalition admissibility yet)?

---

## 7. What this ships for the stack

It closes the `compose` stage — the last lawless stage of the umbrella — at the runtime+surface level, advancing `UMBRELLA.md` "what done looks like" items 3 (`|>` carries laws/holders/annihilation) and partway 4. It turns the Forge from a λ-term playground into the **authoring surface for CC2 coalitions**, where the demo composes the portfolio's own engines. And it does so as a *thin lift* over already-shipped, already-property-tested algebra — not a new language.
