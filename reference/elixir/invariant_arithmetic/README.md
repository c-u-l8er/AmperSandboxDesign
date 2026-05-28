# invariant_arithmetic

Elixir reference implementation of **Invariant Arithmetic v0.3** — the algebraic
substrate for [&] Protocol agent values, ported from `STACK_PROOF.html` v0.3.

The substrate is a product-of-monoids over four families (topological,
spatial, temporal, governance) with six operations (`combine`, `chain`,
`promote`, `reconcile`, `deliberate`, `consume`). It is a runtime check
today and the basis for a future typed implementation.

## The 15 laws

This library proves the substrate's contract by property test. Each law in
`test/laws_test.exs` is verified against **1000 randomly generated values**
on every test run, mirroring the JS in-page QuickCheck harness:

| Law | Statement | Module |
|-----|-----------|--------|
| L1  | `combine(zero, v) ≡ v` | `Combine` |
| L2  | `combine(v, zero) ≡ v` | `Combine` |
| L3  | `combine(combine(a, b), c) ≡ combine(a, combine(b, c))` | `Combine` |
| L4  | commutative on `n × κ × β × σ` subspace | `Combine` |
| L5  | `combine(a, a).κ ≡ a.κ` (OR idempotent) | `Combine` |
| L6  | `combine(a, a).β ≡ a.β` (min idempotent) | `Combine` |
| L7  | `combine(a, a).σ ≡ a.σ` (∪ idempotent) | `Combine` |
| L8  | `phase(a) > phase(b) ⇒ chain` refuses with π-violation | `Chain` |
| L9  | `phase(a) ≤ phase(b) ⇒ chain` succeeds | `Chain` |
| L10 | `promote(v).β ≥ v.β` (β-monotone) | `Ops` |
| L11 | `reconcile(v, T).σ ⊆ v.σ` (σ-antitone) | `Ops` |
| L12 | `deliberate(v).κ ≡ false` | `Ops` |
| L13 | `reconcile(reconcile(v, T), T) ≡ reconcile(v, T)` (idempotent) | `Ops` |
| L14 | `consume(v, req).ok ⇒ v` really satisfies `req` (soundness) | `Consume` |
| L15 | `consume` σ-refusal is fixable by `reconcile` | recovery |

```
mix test
# 14 properties, 11 tests, 0 failures
# (~14,000 random cases per run)
```

## Quickstart

```elixir
alias InvariantArithmetic, as: IA

# Build values
r = IA.retrieval(100, beta: 0.95, sigma: ["src-A"])
a = IA.action(50, beta: 0.9)

# Compose
{:ok, chained} = IA.chain(r, a)        # forward — OK
{:error, _} = IA.chain(a, r)           # backward — refused

# Check
%{ok: true} = IA.consume(chained, beta_min: 0.9)
```

## The worked RAG example (§V from STACK_PROOF)

`test/invariant_arithmetic_test.exs` reproduces the §V worked example:
two contradictory sources, an LLM that confidently emits an answer based on
their average, the answer reused as context — and four families combining
to catch what no single invariant would catch alone.

## Layout

```
lib/
  invariant_arithmetic.ex            top-level API
  invariant_arithmetic/
    value.ex                         the Value struct + constructors
    phase.ex                         PULSE phase order
    combine.ex                       product-of-monoids composition
    chain.ex                         phase-graded composition + PhaseViolation
    ops.ex                           promote, reconcile, deliberate, cycle
    consume.ex                       requirement predicate + Result
test/
  laws_test.exs                      L1-L15 as properties
  invariant_arithmetic_test.exs      §V worked example + sanity
  support/generators.ex              StreamData generators
```

## What's deliberately out of scope (v0.1)

- **Macros.** Future work: a `Phase.chain/2` macro that refuses at compile
  time when both phases are literal atoms; a `definvariant` macro for
  extensibility; a `with_invariants` block macro for ambient context.
  Plain modules cover ~90% of the substrate.
- **OTP middleware.** Telemetry events, ETS-backed actor context, Broadway/
  Oban/GenStage hookups belong in a separate `invariant_arithmetic_otp`
  package that consumes this one.
- **Categorical statement.** STACK_PROOF §I gestures at a monoidal category
  with the invariants as natural transformations. Not yet formalized.
- **Cross-language port.** A Python port would let portfolio Python code
  (Mirage adapters, FleetPrompt clients) share the same 15-law contract.
  Open question — `bendscript`/`runefort` integration first.

## Relationship to the portfolio

This library is the algebraic spec the rest of the [&] portfolio composes
against:

- [&] primitives (`&memory`, `&reason`, `&time`, `&space`, `&body`,
  `&govern`) map onto the four families.
- PULSE's five canonical phases `{retrieve, route, act, learn, consolidate}`
  are the objects of the phase-graded category `chain` lives in.
- Graphonomous's κ-routing (OS-002) is **L12** stated as an operation.
- PRISM (OS-009) is positioned to benchmark *measurable* refusal behavior
  produced by this substrate against ordinary RAG/agent pipelines.

See `STACK_PROOF.html` at the repo root for the full statement of the
substrate, the live in-browser QuickCheck harness, and the worked example.
