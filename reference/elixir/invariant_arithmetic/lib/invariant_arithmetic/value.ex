defmodule InvariantArithmetic.Value do
  @moduledoc """
  The substrate's value — a product of monoids over four families.

  | Family       | Field            | Monoid          | Identity        |
  |--------------|------------------|------------------|-----------------|
  | numeric      | `n`              | `+`              | `0`             |
  | topological  | `topological.kappa` | `or`          | `false`         |
  | topological  | `topological.beta`  | `min`         | `1.0`           |
  | spatial      | `spatial.sigma`     | `MapSet.union`| `MapSet.new()`  |
  | temporal     | `temporal.{pi,iota,psi}` | first-non-nil | `nil`     |
  | governance   | `governance.authority_path` | `++`   | `[]`            |
  | governance   | `governance.deny_default`   | `and`  | `true`          |
  | governance   | `governance.audit`          | `++`   | `[]`            |

  The product of monoids is itself a monoid. Components in the `temporal`
  and `governance` families are non-commutative, so full `combine` is a
  monoid but **not** a commutative one.
  """

  alias InvariantArithmetic.Phase

  defstruct n: 0,
            topological: %{kappa: false, beta: 1.0},
            spatial: %{sigma: MapSet.new()},
            temporal: %{pi: nil, iota: nil, psi: nil},
            governance: %{authority_path: [], deny_default: true, audit: []}

  @type t :: %__MODULE__{
          n: number(),
          topological: %{kappa: boolean(), beta: float()},
          spatial: %{sigma: MapSet.t(String.t())},
          temporal: %{
            pi: Phase.t() | nil,
            iota: String.t() | nil,
            psi: String.t() | nil
          },
          governance: %{
            authority_path: [String.t()],
            deny_default: boolean(),
            audit: [map()]
          }
        }

  @doc """
  Build a value. All keyword opts are optional; missing fields take their
  monoid identity.

      iex> InvariantArithmetic.Value.new(100, beta: 0.95, pi: :retrieve)
      #=> %Value{n: 100, topological: %{kappa: false, beta: 0.95}, ...}
  """
  @spec new(number(), keyword()) :: t()
  def new(n \\ 0, opts \\ []) do
    %__MODULE__{
      n: n,
      topological: %{
        kappa: Keyword.get(opts, :kappa, false),
        beta: Keyword.get(opts, :beta, 1.0)
      },
      spatial: %{
        sigma: opts |> Keyword.get(:sigma, []) |> to_set()
      },
      temporal: %{
        pi: Keyword.get(opts, :pi, nil),
        iota: Keyword.get(opts, :iota, nil),
        psi: Keyword.get(opts, :psi, nil)
      },
      governance: %{
        authority_path: Keyword.get(opts, :authority_path, []),
        deny_default: Keyword.get(opts, :deny_default, true),
        audit: Keyword.get(opts, :audit, [])
      }
    }
  end

  @doc "The monoid identity. Equivalent to `new(0)`."
  @spec zero() :: t()
  def zero, do: %__MODULE__{}

  @doc "A value entering its phase as `:retrieve`."
  @spec retrieval(number(), keyword()) :: t()
  def retrieval(n \\ 0, opts \\ []), do: new(n, Keyword.put_new(opts, :pi, :retrieve))

  @doc "A value entering its phase as `:route`."
  @spec decision(number(), keyword()) :: t()
  def decision(n \\ 0, opts \\ []), do: new(n, Keyword.put_new(opts, :pi, :route))

  @doc "A value entering its phase as `:act`."
  @spec action(number(), keyword()) :: t()
  def action(n \\ 0, opts \\ []), do: new(n, Keyword.put_new(opts, :pi, :act))

  @doc "A value entering its phase as `:learn`."
  @spec learning(number(), keyword()) :: t()
  def learning(n \\ 0, opts \\ []), do: new(n, Keyword.put_new(opts, :pi, :learn))

  @doc "A value entering its phase as `:consolidate`."
  @spec consolidation(number(), keyword()) :: t()
  def consolidation(n \\ 0, opts \\ []),
    do: new(n, Keyword.put_new(opts, :pi, :consolidate))

  defp to_set(%MapSet{} = ms), do: ms
  defp to_set(list) when is_list(list), do: MapSet.new(list)
end
