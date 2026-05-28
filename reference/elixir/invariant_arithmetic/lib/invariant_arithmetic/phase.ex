defmodule InvariantArithmetic.Phase do
  @moduledoc """
  The five canonical PULSE phases that form a totally ordered poset.

  `chain/2` is a morphism in the phase-graded category PHASE: phases are
  objects, values labeled with entry/exit phase are morphisms, composition
  is `chain`. Backward composition is not a morphism — `chain` refuses it.
  """

  @phases [:retrieve, :route, :act, :learn, :consolidate]

  @type t :: :retrieve | :route | :act | :learn | :consolidate

  @doc "The phases, in order."
  @spec phases() :: [t()]
  def phases, do: @phases

  @doc "Zero-based index of a phase in canonical order. `nil` returns -1 (no phase)."
  @spec index(t() | nil) :: integer()
  def index(nil), do: -1
  def index(phase) when phase in @phases, do: Enum.find_index(@phases, &(&1 == phase))

  @doc """
  True when `a` may legally precede `b` in `chain`.

  - Either side may be `nil` (no phase commitment) — always OK.
  - Otherwise `a` must be ≤ `b` in canonical order.
  """
  @spec leq?(t() | nil, t() | nil) :: boolean()
  def leq?(nil, _), do: true
  def leq?(_, nil), do: true
  def leq?(a, b), do: index(a) <= index(b)
end
