defmodule InvariantArithmetic do
  @moduledoc """
  Invariant Arithmetic — the algebraic substrate for [&] Protocol agent values.

  This is the Elixir reference implementation of the substrate stated in
  `STACK_PROOF.html` v0.3 (see ProjectAmp2 root). The 15 laws of the
  substrate are verified as ExUnitProperties tests in `test/laws_test.exs`.

  Top-level API (delegations only — see the named modules for docs):

      iex> alias InvariantArithmetic, as: IA
      iex> r = IA.retrieval(100, beta: 0.95, sigma: ["src-A"])
      iex> a = IA.action(50, beta: 0.9)
      iex> {:ok, chained} = IA.chain(r, a)
      iex> IA.consume(chained, beta_min: 0.9, sigma_empty: false).ok
      true

  ## The four families

  - **Topological** — κ (cyclicity, OR-monoid) and β (persistence, min-monoid).
  - **Spatial** — σ (conflict set, ∪-monoid).
  - **Temporal** — π / ι / ψ (phase, idempotency key, cadence; first-non-nil).
  - **Governance** — authority_path, deny_default, audit (free monoids + ∧).

  ## The six operations

  - `combine/2` — componentwise product of monoids. Associative, has identity.
  - `chain/2` — phase-ordered composition. Refuses backward phases.
  - `promote/2` — β-monotone endomorphism. May only raise β.
  - `reconcile/2` — σ-antitone idempotent endomorphism. May only shrink σ.
  - `deliberate/1` — κ-antitone idempotent endomorphism. Clears κ to false.
  - `consume/2` — predicate on (Value, Requirements). Returns a `Result`.
  """

  alias InvariantArithmetic.{Chain, Combine, Consume, Ops, Value}

  defdelegate new(n, opts \\ []), to: Value
  defdelegate zero(), to: Value
  defdelegate retrieval(n, opts \\ []), to: Value
  defdelegate decision(n, opts \\ []), to: Value
  defdelegate action(n, opts \\ []), to: Value
  defdelegate learning(n, opts \\ []), to: Value
  defdelegate consolidation(n, opts \\ []), to: Value

  defdelegate combine(a, b), to: Combine

  defdelegate chain(a, b), to: Chain
  defdelegate chain!(a, b), to: Chain

  defdelegate promote(v, opts \\ []), to: Ops
  defdelegate reconcile(v, tags), to: Ops
  defdelegate deliberate(v), to: Ops
  defdelegate cycle(v), to: Ops

  defdelegate consume(v, req \\ []), to: Consume
end
