defmodule InvariantArithmetic.Ops do
  @moduledoc """
  The four unary operations on Value.

  - `promote/2` — β-monotone endomorphism. Promotion may only raise β.
  - `reconcile/2` — σ-antitone idempotent endomorphism. Reconciliation may
    only shrink the conflict set.
  - `deliberate/1` — κ-antitone idempotent endomorphism. Deliberation is
    the operation that retires feedback.
  - `cycle/1` — sets κ to true. Used in the worked RAG example to model an
    answer being reused as context.
  """

  alias InvariantArithmetic.Value

  @doc """
  Raise β toward 1.0. Accepts `:raises_to` (explicit target) or `:by`
  (additive bump, clamped to 1.0). β never decreases.

      promote(v, raises_to: 0.95)
      promote(v, by: 0.3)
  """
  @spec promote(Value.t(), keyword()) :: Value.t()
  def promote(%Value{} = v, opts \\ []) do
    new_beta =
      cond do
        Keyword.has_key?(opts, :raises_to) ->
          Keyword.fetch!(opts, :raises_to)

        Keyword.has_key?(opts, :by) ->
          min(1.0, v.topological.beta + Keyword.fetch!(opts, :by))

        true ->
          min(1.0, v.topological.beta + 0.3)
      end

    put_in(v.topological.beta, max(v.topological.beta, new_beta))
  end

  @doc """
  Remove `tags` from σ. Idempotent: applying twice equals applying once.
  Antitone: result σ ⊆ input σ.
  """
  @spec reconcile(Value.t(), Enumerable.t()) :: Value.t()
  def reconcile(%Value{} = v, tags) do
    drop = MapSet.new(tags)
    put_in(v.spatial.sigma, MapSet.difference(v.spatial.sigma, drop))
  end

  @doc "Clear κ — the substrate's record of feedback being retired."
  @spec deliberate(Value.t()) :: Value.t()
  def deliberate(%Value{} = v), do: put_in(v.topological.kappa, false)

  @doc "Set κ to true. Used to model an output reused as input."
  @spec cycle(Value.t()) :: Value.t()
  def cycle(%Value{} = v), do: put_in(v.topological.kappa, true)
end
