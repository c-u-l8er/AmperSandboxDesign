defmodule InvariantArithmetic.Combine do
  @moduledoc """
  Componentwise monoid composition of values.

  `combine/2` is associative with `Value.zero/0` as both left and right identity.
  It is **not** commutative — temporal first-non-nil and governance list-concat
  components observe order — but its `n × κ × β × σ × deny_default` projection
  is commutative (see L4).
  """

  alias InvariantArithmetic.Value

  @spec combine(Value.t(), Value.t()) :: Value.t()
  def combine(%Value{} = a, %Value{} = b) do
    %Value{
      n: a.n + b.n,
      topological: %{
        kappa: a.topological.kappa or b.topological.kappa,
        beta: min(a.topological.beta, b.topological.beta)
      },
      spatial: %{
        sigma: MapSet.union(a.spatial.sigma, b.spatial.sigma)
      },
      temporal: %{
        pi: first_non_nil(a.temporal.pi, b.temporal.pi),
        iota: first_non_nil(a.temporal.iota, b.temporal.iota),
        psi: first_non_nil(a.temporal.psi, b.temporal.psi)
      },
      governance: %{
        authority_path: a.governance.authority_path ++ b.governance.authority_path,
        deny_default: a.governance.deny_default and b.governance.deny_default,
        audit: a.governance.audit ++ b.governance.audit
      }
    }
  end

  defp first_non_nil(nil, b), do: b
  defp first_non_nil(a, _), do: a
end
