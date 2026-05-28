defmodule InvariantArithmeticTest do
  @moduledoc """
  Sanity tests on constructors + the worked RAG example from STACK_PROOF §V.
  """
  use ExUnit.Case, async: true

  alias InvariantArithmetic, as: IA
  alias InvariantArithmetic.Value

  describe "constructors" do
    test "zero is the identity element" do
      z = IA.zero()
      assert z.n == 0
      assert z.topological == %{kappa: false, beta: 1.0}
      assert MapSet.size(z.spatial.sigma) == 0
      assert z.temporal == %{pi: nil, iota: nil, psi: nil}
      assert z.governance.deny_default == true
    end

    test "new accepts a keyword list" do
      v = IA.new(100, beta: 0.95, pi: :retrieve, sigma: ["src-A"])
      assert v.n == 100
      assert v.topological.beta == 0.95
      assert v.temporal.pi == :retrieve
      assert MapSet.member?(v.spatial.sigma, "src-A")
    end

    test "phase-tagged constructors set π" do
      assert IA.retrieval(0).temporal.pi == :retrieve
      assert IA.decision(0).temporal.pi == :route
      assert IA.action(0).temporal.pi == :act
      assert IA.learning(0).temporal.pi == :learn
      assert IA.consolidation(0).temporal.pi == :consolidate
    end
  end

  describe "STACK_PROOF §V — worked RAG example" do
    test "the substrate refuses on multi-family conflict and recovers via reconcile + promote" do
      # Step 2 — Retrieve source A
      doc_a = IA.retrieval(2_400_000, beta: 0.95, sigma: ["source:doc-A"])
      # Step 3 — Retrieve source B (lower confidence, contradicts A)
      doc_b = IA.retrieval(2_500_000, beta: 0.75, sigma: ["source:doc-B"])

      # Step 4 — Combine
      merged = IA.combine(doc_a, doc_b)
      assert merged.topological.beta == 0.75
      assert MapSet.equal?(merged.spatial.sigma, MapSet.new(["source:doc-A", "source:doc-B"]))

      # Step 5 — High-confidence answer refused on TWO families
      result = IA.consume(merged, beta_min: 0.90, sigma_empty: true)
      assert result.ok == false
      assert length(result.failures) == 2
      assert Enum.any?(result.failures, &String.contains?(&1, "β="))
      assert Enum.any?(result.failures, &String.contains?(&1, "σ"))

      # Steps 6-7 — Naive RAG: emit answer, reuse as context, κ = true
      answer = IA.action(50, beta: 0.75, sigma: ["source:doc-A", "source:doc-B"])
      context = IA.cycle(answer)
      assert context.topological.kappa == true

      result2 = IA.consume(context, forward_only: true, sigma_empty: true, beta_min: 0.90)
      assert result2.ok == false
      assert length(result2.failures) == 3

      # Step 8 — Proper recovery: reconcile, promote, then consume
      cleaned = IA.reconcile(merged, ["source:doc-A", "source:doc-B"])
      firmed = IA.promote(cleaned, raises_to: 0.95)
      result3 = IA.consume(firmed, beta_min: 0.90, sigma_empty: true)
      assert result3.ok == true
    end
  end

  describe "chain" do
    test "forward phase composition produces the later phase" do
      r = IA.retrieval(10, beta: 0.9)
      a = IA.action(20, beta: 0.8)
      assert {:ok, %Value{} = chained} = IA.chain(r, a)
      assert chained.temporal.pi == :act
      assert chained.n == 30
      assert chained.topological.beta == 0.8
    end

    test "backward phase composition raises with chain!" do
      a = IA.action(1, beta: 1.0)
      r = IA.retrieval(1, beta: 1.0)

      assert_raise IA.Chain.PhaseViolation, fn -> IA.chain!(a, r) end
    end

    test "nil phase on either side is OK" do
      v = IA.new(1)
      a = IA.action(1)
      assert {:ok, _} = IA.chain(v, a)
      assert {:ok, _} = IA.chain(a, v)
    end
  end

  describe "promote" do
    test "raises_to never lowers β" do
      v = IA.new(0, beta: 0.9)
      assert IA.promote(v, raises_to: 0.5).topological.beta == 0.9
    end

    test "raises_to raises β when higher" do
      v = IA.new(0, beta: 0.5)
      assert IA.promote(v, raises_to: 0.9).topological.beta == 0.9
    end

    test "by clamps to 1.0" do
      v = IA.new(0, beta: 0.9)
      assert IA.promote(v, by: 0.5).topological.beta == 1.0
    end
  end
end
