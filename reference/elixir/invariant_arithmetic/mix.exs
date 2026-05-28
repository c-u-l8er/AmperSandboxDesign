defmodule InvariantArithmetic.MixProject do
  use Mix.Project

  @version "0.1.0"

  def project do
    [
      app: :invariant_arithmetic,
      version: @version,
      elixir: "~> 1.16",
      start_permanent: Mix.env() == :prod,
      elixirc_paths: elixirc_paths(Mix.env()),
      deps: deps(),
      description: description(),
      package: package()
    ]
  end

  def application do
    [extra_applications: [:logger]]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:stream_data, "~> 1.1", only: :test}
    ]
  end

  defp description do
    "Algebraic substrate for [&] Protocol agent values. Reference impl of " <>
      "Invariant Arithmetic v0.3 — 15 laws stated as algebraic structure and " <>
      "verified by property tests."
  end

  defp package do
    [
      maintainers: ["Travis Burandt"],
      licenses: ["Apache-2.0"],
      links: %{
        "Source" => "https://github.com/c-u-l8er/ProjectAmp2"
      }
    ]
  end
end
