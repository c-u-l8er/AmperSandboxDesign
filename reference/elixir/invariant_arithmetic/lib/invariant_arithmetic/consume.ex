defmodule InvariantArithmetic.Consume do
  @moduledoc """
  The substrate's correctness check — a predicate on (Value, Requirements).

  Requirements are a keyword list. Supported keys:

  - `:beta_min` (float) — refuse if `v.topological.beta < beta_min`.
  - `:sigma_empty` (true) — refuse if σ is non-empty.
  - `:forward_only` (true) — refuse if κ is true.
  - `:phase` (Phase.t) — refuse if `v.temporal.pi` does not match.

  Returns a `Result` struct with `:ok`, `:failures`, and `:value`.
  """

  alias InvariantArithmetic.Value

  defmodule Result do
    @moduledoc false
    defstruct ok: true, failures: [], value: nil

    @type t :: %__MODULE__{
            ok: boolean(),
            failures: [String.t()],
            value: Value.t()
          }
  end

  @spec consume(Value.t(), keyword()) :: Result.t()
  def consume(%Value{} = v, req \\ []) do
    failures =
      []
      |> check_beta(v, Keyword.get(req, :beta_min))
      |> check_sigma(v, Keyword.get(req, :sigma_empty))
      |> check_forward(v, Keyword.get(req, :forward_only))
      |> check_phase(v, Keyword.get(req, :phase))
      |> Enum.reverse()

    %Result{ok: failures == [], failures: failures, value: v}
  end

  defp check_beta(acc, _v, nil), do: acc

  defp check_beta(acc, v, min) when v.topological.beta < min do
    ["β=#{Float.round(v.topological.beta * 1.0, 3)} < #{min}" | acc]
  end

  defp check_beta(acc, _v, _min), do: acc

  defp check_sigma(acc, v, true) do
    case MapSet.size(v.spatial.sigma) do
      0 ->
        acc

      _ ->
        tags = v.spatial.sigma |> Enum.sort() |> Enum.join(", ")
        ["σ has unresolved: {#{tags}}" | acc]
    end
  end

  defp check_sigma(acc, _v, _), do: acc

  defp check_forward(acc, %Value{topological: %{kappa: true}}, true),
    do: ["κ=true (feedback)" | acc]

  defp check_forward(acc, _v, _), do: acc

  defp check_phase(acc, _v, nil), do: acc

  defp check_phase(acc, %Value{temporal: %{pi: pi}}, expected) when pi != expected,
    do: ["π mismatch: #{inspect(pi)} ≠ #{inspect(expected)}" | acc]

  defp check_phase(acc, _v, _), do: acc
end
