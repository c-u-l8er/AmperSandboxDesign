defmodule InvariantArithmetic.LawsTest do
  @moduledoc """
  The fifteen laws of Invariant Arithmetic v0.3, ported from `STACK_PROOF.html`
  §II and verified as ExUnitProperties (StreamData) properties.

  The JS in-page harness defaults to 1000 trials per law. We use the
  StreamData default (100 examples per property) for fast CI, with
  `@moduletag :exhaustive` available to bump it up.
  """

  use ExUnit.Case, async: true
  use ExUnitProperties

  alias InvariantArithmetic, as: IA
  alias InvariantArithmetic.Combine
  alias InvariantArithmetic.Generators, as: G
  alias InvariantArithmetic.Value

  # Helpers -------------------------------------------------------------------

  # Full structural equality on Value.
  defp value_eq?(%Value{} = a, %Value{} = b) do
    a.n == b.n and
      a.topological == b.topological and
      MapSet.equal?(a.spatial.sigma, b.spatial.sigma) and
      a.temporal == b.temporal and
      a.governance == b.governance
  end

  # Equality on the commutative subspace (n × κ × β × σ).
  defp commutative_eq?(%Value{} = a, %Value{} = b) do
    a.n == b.n and
      a.topological == b.topological and
      MapSet.equal?(a.spatial.sigma, b.spatial.sigma)
  end

  # L1 — Left identity for combine ------------------------------------------

  property "L1 — combine(zero, v) ≡ v" do
    check all v <- G.value() do
      assert value_eq?(Combine.combine(IA.zero(), v), v)
    end
  end

  # L2 — Right identity for combine -----------------------------------------

  property "L2 — combine(v, zero) ≡ v" do
    check all v <- G.value() do
      assert value_eq?(Combine.combine(v, IA.zero()), v)
    end
  end

  # L3 — Associativity of combine -------------------------------------------

  property "L3 — combine(combine(a, b), c) ≡ combine(a, combine(b, c))" do
    check all a <- G.value(), b <- G.value(), c <- G.value() do
      left = Combine.combine(Combine.combine(a, b), c)
      right = Combine.combine(a, Combine.combine(b, c))
      assert value_eq?(left, right)
    end
  end

  # L4 — Commutativity on the commutative subspace --------------------------

  property "L4 — commutative on n × κ × β × σ" do
    check all a <- G.commutative_value(), b <- G.commutative_value() do
      assert commutative_eq?(Combine.combine(a, b), Combine.combine(b, a))
    end
  end

  # L5 — κ idempotent under combine -----------------------------------------

  property "L5 — combine(a, a).κ ≡ a.κ" do
    check all a <- G.value() do
      assert Combine.combine(a, a).topological.kappa == a.topological.kappa
    end
  end

  # L6 — β idempotent under combine -----------------------------------------

  property "L6 — combine(a, a).β ≡ a.β" do
    check all a <- G.value() do
      # min(x, x) = x is exact in IEEE 754, so == is safe.
      assert Combine.combine(a, a).topological.beta == a.topological.beta
    end
  end

  # L7 — σ idempotent under combine -----------------------------------------

  property "L7 — combine(a, a).σ ≡ a.σ" do
    check all a <- G.value() do
      assert MapSet.equal?(Combine.combine(a, a).spatial.sigma, a.spatial.sigma)
    end
  end

  # L8 — chain refuses backward phase ---------------------------------------

  property "L8 — phase(a) > phase(b) ⇒ chain refuses with π-violation" do
    check all {pa, pb} <- G.backward_pair() do
      a = IA.new(1, pi: pa)
      b = IA.new(1, pi: pb)

      assert {:error, %IA.Chain.PhaseViolation{invariant: :pi}} = IA.chain(a, b)
    end
  end

  # L9 — chain accepts forward phase ----------------------------------------

  property "L9 — phase(a) ≤ phase(b) ⇒ chain succeeds" do
    check all {pa, pb} <- G.forward_pair() do
      a = IA.new(1, pi: pa)
      b = IA.new(1, pi: pb)

      assert {:ok, %Value{}} = IA.chain(a, b)
    end
  end

  # L10 — promote is β-monotone ---------------------------------------------

  property "L10 — promote(v).β ≥ v.β" do
    check all v <- G.value(),
              raises_to <- StreamData.float(min: 0.0, max: 1.0) do
      assert IA.promote(v, raises_to: raises_to).topological.beta >=
               v.topological.beta
    end
  end

  # L11 — reconcile is σ-antitone -------------------------------------------

  property "L11 — reconcile(v, T).σ ⊆ v.σ" do
    check all v <- G.value() do
      drop =
        case MapSet.to_list(v.spatial.sigma) do
          [] -> []
          [h | _] -> [h]
        end

      assert MapSet.subset?(IA.reconcile(v, drop).spatial.sigma, v.spatial.sigma)
    end
  end

  # L12 — deliberate clears κ -----------------------------------------------

  property "L12 — deliberate(v).κ ≡ false" do
    check all v <- G.value() do
      assert IA.deliberate(v).topological.kappa == false
    end
  end

  # L13 — reconcile is idempotent -------------------------------------------

  property "L13 — reconcile(reconcile(v, T), T) ≡ reconcile(v, T)" do
    check all v <- G.value() do
      drop = v.spatial.sigma |> MapSet.to_list() |> Enum.take(2)
      once = IA.reconcile(v, drop)
      twice = IA.reconcile(once, drop)
      assert value_eq?(once, twice)
    end
  end

  # L14 — consume soundness -------------------------------------------------

  property "L14 — consume(v, req).ok = true ⇒ v really satisfies req" do
    check all v <- G.value(),
              req <- random_requirements() do
      result = IA.consume(v, req)

      if result.ok do
        if min = req[:beta_min], do: assert v.topological.beta >= min
        if req[:sigma_empty], do: assert MapSet.size(v.spatial.sigma) == 0
        if req[:forward_only], do: refute v.topological.kappa
      end
    end
  end

  # L15 — unary ops can recover from refusal --------------------------------

  test "L15 — consume refusal on σ-conflict is fixable by reconcile" do
    v = IA.new(1, sigma: ["t1", "t2"])
    assert IA.consume(v, sigma_empty: true).ok == false
    cleaned = IA.reconcile(v, v.spatial.sigma)
    assert IA.consume(cleaned, sigma_empty: true).ok == true
  end

  # ---------------------------------------------------------------------------

  defp random_requirements do
    gen all use_beta <- StreamData.boolean(),
            beta <- StreamData.float(min: 0.0, max: 1.0),
            use_sigma <- StreamData.boolean(),
            use_forward <- StreamData.boolean() do
      []
      |> then(fn r -> if use_beta, do: Keyword.put(r, :beta_min, beta), else: r end)
      |> then(fn r -> if use_sigma, do: Keyword.put(r, :sigma_empty, true), else: r end)
      |> then(fn r -> if use_forward, do: Keyword.put(r, :forward_only, true), else: r end)
    end
  end
end
