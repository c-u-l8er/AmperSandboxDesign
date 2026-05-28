defmodule InvariantArithmetic.Chain do
  @moduledoc """
  Phase-graded composition. Defined only when `phase(a) ≤ phase(b)`.

  Objects of the category PHASE are the five PULSE phases. Morphisms are
  values labeled with an entry/exit phase. `chain/2` is composition.

  - `chain/2` returns `{:ok, value} | {:error, %PhaseViolation{}}`.
  - `chain!/2` raises `PhaseViolation` on backward composition.
  """

  alias InvariantArithmetic.{Combine, Phase, Value}

  defmodule PhaseViolation do
    @moduledoc "Raised when `chain` is invoked on a backward phase pair."
    defexception [:message, :from, :to, invariant: :pi]

    @impl true
    def exception(opts) do
      from = Keyword.fetch!(opts, :from)
      to = Keyword.fetch!(opts, :to)

      %__MODULE__{
        message: "π violation: #{inspect(to)} cannot follow #{inspect(from)}",
        from: from,
        to: to,
        invariant: :pi
      }
    end
  end

  @spec chain(Value.t(), Value.t()) :: {:ok, Value.t()} | {:error, PhaseViolation.t()}
  def chain(%Value{} = a, %Value{} = b) do
    if Phase.leq?(a.temporal.pi, b.temporal.pi) do
      merged = Combine.combine(a, b)
      # exit phase of the chain is b's phase if present, else a's
      exit_pi = first_non_nil(b.temporal.pi, a.temporal.pi)
      {:ok, put_in(merged.temporal.pi, exit_pi)}
    else
      {:error, PhaseViolation.exception(from: a.temporal.pi, to: b.temporal.pi)}
    end
  end

  @spec chain!(Value.t(), Value.t()) :: Value.t()
  def chain!(%Value{} = a, %Value{} = b) do
    case chain(a, b) do
      {:ok, v} -> v
      {:error, exc} -> raise exc
    end
  end

  defp first_non_nil(nil, b), do: b
  defp first_non_nil(a, _), do: a
end
