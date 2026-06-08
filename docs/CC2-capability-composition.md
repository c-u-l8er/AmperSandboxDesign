# [&] / CC2 — Capability Composition, v2 (Coalitional)

**Status:** Draft · **Replaces:** CC1 (single-agent `&` / `|>` composition) · **Depends on:** `box-and-box` ≥ 0.8 (the eight-rung modality ladder)

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as in RFC 2119.

---

## 0. Abstract

CC1 formalized composition for a *single* agent: a capability **set** merged by an associative-commutative-idempotent `&`, data flowed through a `|>` pipeline, and a flat governance block of `hard` / `soft` / `escalate_when` constraints rode alongside. CC1 gave `&` an algebra (a bounded join-semilattice — the CRDT laws) but left `|>` **lawless** and treated compatibility, governance, and self-evolution as side-conditions checked outside the algebra.

CC2 makes two changes. First, it gives every part of composition a **semantics** drawn from the arithmetic ladder, including the previously-lawless `|>`. Second, it lifts composition from one agent to a **coalition**, so the question composition answers is no longer *"do I hold these capabilities?"* but *"can this group, by pooling typed capabilities and coordinating, **ensure** the goal — with each task owned, the shared facts common knowledge, the joint run supervised, and a safety floor none of them can weaken?"* Every clause of that sentence is a rung.

CC2 is normative at the level of *the verdict*: two conformant runtimes, in any language, MUST agree on whether a composition is feasible, permitted, and ensurable, because the verdict is the arithmetic and the arithmetic is fixed by its laws (97 of them, the conformance suite). The runtime, the syntax, and the transport are not normative; an effects-first Elixir runtime — **box-and-box** — is one conformant host, a TypeScript edge runtime another.

---

## 1. The shift, in one table

| CC1 (single agent) | CC2 (coalition) | Rung |
|---|---|---|
| `&` merges *my* capability set | `&` merges the coalition's **joint** capability set, tagged by holder | alethic (lattice) |
| `\|>` flows data (no laws) | `\|>` is a **governed sequential pipeline** spanning agents | alethic `chain` + heuristic |
| `accepts_from` / `feeds_into` checked at validation | a **feasibility gate**: incompatible hand-offs annihilate to `0̲` | alethic |
| `cost` / `confidence` as config thresholds | end-to-end quantities **compose** along the pipeline | axiological (semiring) |
| `hard` / `soft` / `escalate_when` (flat list) | **floor / gradient / contrary-to-duty**, composed and resolved | deontic + bridge |
| — (no notion) | each task has an **owner** obligated for it | deontic |
| — | safety + liveness over the **joint trajectory** | temporal (supervise) |
| `requires_approval` for mutations | a **shared entrenched floor** no agent or coalition can weaken | reflexive |
| — | coordination requires **common knowledge** of the plan | epistemic |
| — | the coalition **can ensure** the goal vs. any adversary | strategic |

CC1 is the special case of CC2 where the coalition is a singleton and the adversary is empty.

---

## 2. The two operators, lifted

### 2.1 `&` — composition (join-semilattice, with holders)

`A & B` MUST be associative, commutative, and idempotent with identity `&none` (unchanged from CC1 — these are the CRDT convergence laws and they are what let independent agents compose to the same set). CC2 adds that each capability in the joint set carries its **holder** (the agent that provides it) and its **contract** (its `accepts_from` / `feeds_into` types). The merge is the lattice join of capability sets; the holder tag is provenance, not a tiebreak, so idempotence is preserved.

> Conformance: `A & B == B & A`, `(A & B) & C == A & (B & C)`, `A & A == A`, `A & none == A`. (Arith: the `sigma` join-semilattice family; laws of the lattice.)

### 2.2 `|>` — pipeline (sequential monoid, governed)

This is the operator CC1 left undefined. In CC2, `X |> f` is **sequential composition**: order matters, it is associative, and the empty pipeline (pass-through context) is its identity. It is **not** commutative and **not** idempotent. This is exactly the invariant layer's `chain`, phase-graded, with the provenance hash-chain as its trace.

Two things ride on the pipeline:

1. **Feasibility.** At each hand-off, the producer's `feeds_into` MUST be compatible with the consumer's `accepts_from`, or the composed value is infeasible — it carries `0̲`, which annihilates through the pipeline (arith: the alethic `consume` gate). A type-incompatible pipeline does not "fail validation"; it *is* the zero of the composition.
2. **Quantities.** Cost, confidence, and latency compose end-to-end through the pipeline via a semiring (arith: heuristic). Confidence as a product, cost as a sum, worst-case latency as a max. A runtime MUST NOT treat `confidence_below` as a fixed config constant; it is the composed quantity compared against the consuming step's `requires` threshold (the epistemic β-gate).

> Conformance: `(X |> f) |> g == X |> (f |> g)`; `X |> id == X`; an infeasible stage yields `0̲` for the whole pipeline.

---

## 3. The Coalition object

A composition in CC2 is a **coalition**: a set of agents, a goal, and the governance that binds them. It is to CC2 what `ampersand.json` is to CC1, one level up. (Schema shown as a sketch; the canonical form is left to the wire annex.)

```jsonc
{
  "coalition": "ship_it",
  "agents": ["dev", "qa", "ops"],          // who is in the coalition
  "ensure": "deployed AND tests_pass",      // strategic: the goal the coalition must be ABLE to force
  "common_knowledge": ["release_plan",      // epistemic: facts that MUST be common knowledge to coordinate
                       "rollback_ready"],
  "owns": {                                  // deontic: every task has exactly one obligated owner
    "dev": "build", "qa": "verify", "ops": "release"
  },
  "shield": ["NEVER secrets_leaked"],        // temporal: safety over the JOINT trajectory
  "floor": ["entrench: no_prod_without_qa"], // reflexive: un-weakenable, even under learning
  "compose": "build |> verify |> release"    // the cross-agent pipeline (the lifted |>)
}
```

A coalition is **admissible** iff (arith, all checked):

- **(strategic)** the coalition `canEnsure` the goal against the worst case of any non-member: `⟨⟨agents⟩⟩◊ ensure`. If not, the coalition MUST NOT be enacted as-is; it escalates (recruit agents, or weaken the goal). This is *ought-implies-can*: you may not bind a coalition to a goal it cannot force.
- **(epistemic)** every fact in `common_knowledge` is common knowledge among `agents`. A joint strategy that depends on a fact some member does not commonly know is not executable (the coordinated-attack result). The runtime's broadcast mechanism is what *establishes* common knowledge; CC2 only requires that it has been established before the pipeline runs.
- **(deontic)** `owns` is a total function from tasks to a single agent. No task may be unowned (responsibility diffusion is forbidden) and conflicting obligations between agents are resolved by the deontic `resolve` (priority) before enactment.
- **(temporal)** the joint trajectory the `compose` pipeline can produce satisfies the `shield` safety formulas; a reachable violation makes the coalition inadmissible. Liveness goals (`F good`) that fail only at the horizon become coalition-level obligations with contrary-to-duty escalation.
- **(reflexive)** the `floor` constraints are entrenched; no later amendment by any agent or sub-coalition can weaken them. The coalition MAY revise everything else (and SHOULD, as it learns); it MUST NOT weaken the floor.

---

## 4. The macro layer (DSL → arith)

Composition SHOULD be written in a host DSL whose keywords compile to arith operations. The DSL is sugar; each keyword MUST have the documented expansion below, so the surface is readable but the semantics are exactly the verdict engine. (Syntax shown in an Elixir-macro style targeting an effects-first runtime; the bodies — `sequence`, `gather_evidence`, `emit_event` — are ordinary runtime effects, gated by an interpositional `govern` stage the runtime MUST run before any consequential effect.)

### 4.1 Single governed agent

```elixir
defmodule Researcher do
  use BoxAndBox.Agent, name: :researcher
  use BoxAndBox.Governed                   # adds the verdict layer over the effect engine

  agent :researcher do
    capability :search,
      requires: knows(:query_valid),        # alethic feasibility ⊗ epistemic.knows
      cost: 2, confidence: 0.9              # heuristic semiring weights
  end

  behavior :answer, triggers_on: [:query] do
    govern do
      hard      must_cite_sources()         # the floor — violate ⇒ infeasible (→ 0̲)
      prefer    low_cost()                  # the gradient — ranks only feasible options
      escalate  when: confidence_below(0.7) # contrary-to-duty → route :deliberate
    end
    sequence do                             # plain runtime effects, now gated
      gather_evidence()
      deliberate when: known_unknown(:answer)   # epistemic.knowsItDoesntKnow → :deliberate
      emit_event :result, confidence: belief(:answer)
    end
  end
end
```

### 4.2 Coalition (the reworked CC)

```elixir
coalition :ship_it, agents: [:dev, :qa, :ops] do
  ensure deployed() and tests_pass()              # strategic.canEnsure (⟨⟨agents⟩⟩◊)
  common_knowledge [:release_plan, :rollback_ready] # epistemic.common
  owns :dev, &build/1                             # deontic OBLIGATORY, owner = :dev
  owns :qa,  &verify/1
  owns :ops, &release/1
  shield never(secrets_leaked())                  # temporal.supervise safety over the joint run
  floor  entrench(no_prod_without_qa())           # reflexive.entrench (un-weakenable)
  compose build() |> verify() |> release()        # the lifted, governed |>
end
```

### 4.3 Expansion table (normative)

| DSL keyword | Arith operation | Rung |
|---|---|---|
| `requires: φ` | `value.consume` gate ⊗ `epistemic.knows(φ)` | alethic + epistemic |
| `cost: / confidence: / latency:` | `score` weights in the chosen semiring, composed along `\|>` | axiological |
| `hard φ` | `norm` `FORBIDDEN(¬φ)` placed on the floor; violation ⇒ `0̲` | deontic + alethic |
| `prefer φ` / `soft φ` | `score` gradient term (semiring) | axiological |
| `escalate when: C` | `govern` contrary-to-duty → `route :deliberate` | deontic (bridge) |
| `deliberate when: known_unknown(x)` | `epistemic.knowsItDoesntKnow(x)` → `route :deliberate` | epistemic |
| `belief(x)` / `knows(x)` | `epistemic.believesAt(x,θ)` / `epistemic.knows(x)` | epistemic |
| `ensure φ` | `strategic.canEnsure(agents, φ)` | strategic |
| `common_knowledge [...]` | `strategic.executable` ← `epistemic.common(agents, ...)` | epistemic |
| `owns :a, task` | `norm` `OBLIGATORY(task)`, `owner = :a`; `deontic.resolve` on conflict | deontic |
| `shield never(bad)` | `supervise` safety `G ¬bad` over the joint trajectory | temporal |
| `shield eventually(good)` | `supervise` liveness `F good` (CTD at horizon) | temporal |
| `floor entrench(φ)` | `reflexive.entrench(φ)` — monotone, un-weakenable | reflexive |
| `&` (compose set) | `sigma` join-semilattice merge (+ holder tag) | alethic |
| `\|>` (pipeline) | `value.chain` (sequential monoid) with feasibility + semiring | alethic + axiological |

A runtime MUST reject a composition for which any keyword's arith verdict is negative; it MUST NOT silently downgrade a `hard`/`floor`/`ensure` failure to a warning.

---

## 5. Worked example (the verdict)

For `:ship_it` over the controller/environment-style game where neither `:dev` nor `:ops` can force the goal alone:

- `ensure deployed ∧ tests_pass` → `strategic.canEnsure([:dev,:qa,:ops], …)` = **true** (the full coalition can force it), but `canEnsure([:dev], …)` = **false** — so a `:dev`-only coalition is **inadmissible** and escalates to recruit `:qa`/`:ops`. (`oblige` → `:escalate`.)
- `common_knowledge [:release_plan]` must hold or the joint pipeline is not executable, regardless of ability.
- `owns` total → no task unowned; if `:qa` and `:ops` both claimed `release`, `deontic.resolve` picks by priority before enactment.
- `shield never(secrets_leaked)` → `supervise` over the `build |> verify |> release` joint trajectory; a reachable leak makes it inadmissible.
- `floor entrench(no_prod_without_qa)` → even if the coalition later *learns* a faster path that skips QA, `reflexive` refuses the weakening (`R4`).

---

## 6. Migration from CC1

A CC1 `ampersand.json` is a conformant CC2 coalition with `agents: [self]`, an empty adversary, no `owns` (single owner = self), and `ensure` defaulting to the agent's own goal. CC1 compositions therefore keep their meaning; CC2 only *adds* the coalition, ownership, common-knowledge, joint-trajectory, and ability layers. Runtimes SHOULD accept CC1 documents unchanged and treat them as singleton coalitions.

---

## 7. Conformance

A conformant CC2 implementation MUST:

1. compute the `&` and `|>` verdicts via an arithmetic that passes the 103 laws (the suite is the contract; pass it in your language);
2. treat `hard`, `floor`, and `ensure` failures as hard rejections, not advisories;
3. run governance **interpositionally** — no consequential effect may execute without first clearing the `govern` verdict;
4. preserve entrenchment across all self-revision (`R4`);
5. agree, verdict-for-verdict, with any other conformant implementation on the same composition (the cross-language guarantee).

It SHOULD emit a decision certificate (which gate failed, which norm vetoed, which obligation forced, which ability was missing) as a CloudEvents payload, so verdicts travel the existing cross-loop bus.

---

## 8. Open questions

- Imperfect information / partial observability in the strategic rung (ATL\* with incomplete information is harder than the perfect-information model here). The current `executable` flag is a placeholder for a proper epistemic-strategic product.
- Quantitative ability (cost-bounded strategies) — combining the strategic rung with the semiring (resource-bounded coalition logic).
- Dynamic coalitions (agents joining/leaving mid-run) and how entrenchment composes across coalition membership changes.

---

*Companion to the living-paper rung specs at opensentience.org. The verdict engine is `box-and-box`; this document specifies how capability composition is expressed on top of it and lifted to coalitions.*
