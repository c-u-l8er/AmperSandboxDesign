defmodule InvariantArithmetic.Generators do
  @moduledoc """
  StreamData generators for property tests. Mirrors the `genValue` /
  `genCommutativeValue` generators in `STACK_PROOF.html`.
  """

  import StreamData
  import ExUnitProperties
  alias InvariantArithmetic.{Phase, Value}

  @tag_pool ~w(source-A source-B source-C sensor-1 sensor-2 doc-X doc-Y q3-data q4-data)

  @cadences ~w(event-driven periodic batch)

  @doc "Full Value generator — all families populated stochastically."
  def value do
    gen all kappa <- boolean(),
            beta <- beta_gen(),
            sigma <- sigma_gen(),
            pi <- maybe(member_of(Phase.phases())),
            iota <- maybe(string(:alphanumeric, min_length: 1, max_length: 8)),
            psi <- maybe(member_of(@cadences)),
            n <- integer(0..999) do
      Value.new(n,
        kappa: kappa,
        beta: beta,
        sigma: sigma,
        pi: pi,
        iota: iota,
        psi: psi
      )
    end
  end

  @doc """
  Value restricted to the commutative subspace (no temporal / governance
  components). Used by L4.
  """
  def commutative_value do
    gen all kappa <- boolean(),
            beta <- beta_gen(),
            sigma <- sigma_gen(),
            n <- integer(0..999) do
      Value.new(n, kappa: kappa, beta: beta, sigma: sigma)
    end
  end

  @doc "Generate a (phase_a, phase_b) pair with phase_a > phase_b."
  def backward_pair do
    gen all ib <- integer(0..(length(Phase.phases()) - 2)),
            ia <- integer((ib + 1)..(length(Phase.phases()) - 1)) do
      {Enum.at(Phase.phases(), ia), Enum.at(Phase.phases(), ib)}
    end
  end

  @doc "Generate a (phase_a, phase_b) pair with phase_a ≤ phase_b."
  def forward_pair do
    gen all ia <- integer(0..(length(Phase.phases()) - 1)),
            ib <- integer(ia..(length(Phase.phases()) - 1)) do
      {Enum.at(Phase.phases(), ia), Enum.at(Phase.phases(), ib)}
    end
  end

  defp beta_gen do
    gen all x <- integer(0..1000) do
      x / 1000.0
    end
  end

  defp sigma_gen do
    list_of(member_of(@tag_pool), max_length: 3)
  end

  defp maybe(gen), do: one_of([constant(nil), gen])
end
