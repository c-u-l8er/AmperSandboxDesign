# The [&] Umbrella — one stack: declare → … → observe

**Status:** living map · **Audience:** anyone trying to see how `[&]`, `box-and-box`, CC1, and CC2 fit into a single system rather than separate folders.

`[&]` (AmpersandBoxDesign) is the umbrella. `box-and-box` is the governance **engine** that lives inside it (`box-and-box/`). They are not competing protocols and they are not redundant — they are different layers of one pipeline. This document is the single place that draws that pipeline and marks what exists vs. what is still spec-only.

> One-line mental model: **`[&]` declares and composes capabilities; `box-and-box` decides whether a composed action is `feasible ▸ permitted ▸ best`; MCP/A2A wire the result to the world.**

---

## 1. The pipeline

A capability set flows through seven stages:

```
declare → validate → compose → govern → wire → run → observe
```

| Stage | Question it answers | Owned by | Status |
|---|---|---|---|
| **declare** | what capabilities, held by whom, piped how? | `[&]` schema (`ampersand.json`); CC2 coalition object | CC1 ✅ shipped · CC2 `coalition.schema.json` ✅ shipped (no runtime yet) |
| **validate** | does the declaration conform? | `@ampersand-protocol/validate` (npm), Python SDK, Elixir `schema.ex` | ✅ — **CC1 only** (CC2 validates via the schema directly, ajv) |
| **compose** | do the `&` / `\|>` combinations hold? | Elixir `compose.ex`; CC2 lifts `\|>` to a governed pipeline | CC1 `&` ✅ · `\|>` still lawless · CC1→singleton-coalition lift ✅ (`box-and-box lift`) · cross-agent coalition compose ❌ |
| **govern** | is this action `feasible ▸ permitted ▸ best`? | **box-and-box** (8 rungs, 103 laws) | engine ✅ · CC1 governance bridge ✅ (`box-and-box compile`) · coalition wiring ❌ |
| **wire** | emit MCP + A2A configs | Elixir `mcp.ex` + `a2a.ex` | ✅ — CC1 only |
| **run** | gate every effect *before* it fires (interpositional host) | `box-and-box/aios/` reference host | illustrative only ❌ no real runtime |
| **observe** | emit an auditable decision certificate + evolve the policy on a provenance chain | box-and-box certs + `evolution.mjs` hash-chain + PULSE cross-loop bus | certs ✅ · provenance chain + measured/priced/certified `evolve()` ✅ (EV1–EV6) · CloudEvents emission (CC2 §7) ❌ |

Two supporting artifacts sit alongside: the **registry** (`protocol/registry/v0.1.0/`, ✅) and the **conformance suite** (103 laws — ✅ in JS, no second-host cross-language harness yet ❌).

---

## 2. The govern stage is split in two (the keystone gap)

Today there are **two governance implementations that do not talk to each other**:

1. `reference/elixir/ampersand_core/governance.ex` — the CC1 governance block evaluator. Parses flat compact conditions (`confidence_below:0.75`, `cost_exceeds_usd:1000`) into `pass` / `escalate` / `block`. Ad-hoc, no algebra. This is the "flat governance block" CC2 §0 explicitly sets out to replace.
2. `box-and-box/` — the real 8-rung modal arithmetic with 103 property-tested laws. Takes its **own** decision-spec JSON (`{req, norms, options}`), not an `ampersand.json`.

Nothing bridges them. Until a composed `[&]` capability set's `governance` block is evaluated *through* the box-and-box rungs, the umbrella is two products in one repo. **Closing this is the single highest-leverage step**; everything else (CC2 schema, coalition compose, interpositional host) builds on it.

The bridge is a deterministic translation (no LLM, no network) from the CC1 governance block to a box-and-box policy:

| `[&]` governance (CC1) | box-and-box | Rung |
|---|---|---|
| `escalate_when.confidence_below: θ` | `req.beta_min = θ` (feasibility floor) | alethic |
| `escalate_when.cost_exceeds_usd: C` | `OBLIGATORY` norm w/ CTD `escalate-to-human`, condition `cost > C` | deontic |
| `escalate_when.hard_boundary_approached: true` | `OBLIGATORY` escalate when truthy | deontic |
| `hard: [machine-checkable cond]` | `FORBIDDEN` norm on the floor (→ `0̲`) | deontic + alethic |
| `hard` / `soft` natural-language strings | **carried as `requiresJudgment`, not auto-evaluated** | — |
| `soft: [...]` preferences | score gradient (needs option utilities) | axiological |

Natural-language `hard`/`soft` rules cannot be mechanically evaluated and MUST NOT be silently dropped or fabricated — the bridge surfaces them as items requiring human/LLM judgement.

See `box-and-box compile <ampersand.json>` (the implemented bridge) and `docs/CC2-capability-composition.md` (the full normative expansion table) for the coalition-level version.

---

## 3. CC1 vs CC2 vs box-and-box (the three terms people conflate)

- **CC1** — `[&]` Protocol v1: single-agent capability composition. The shipped `ampersand.json` schema at `protocol.ampersandboxdesign.com/schema/v0.1.0`. Live and authoritative.
- **CC2** — `[&]` Protocol v2: lifts composition to a **coalition** (owners, common-knowledge, joint trajectory, ability). Draft RFC in `docs/CC2-capability-composition.md` + `SPEC.md §10`. CC1 is the singleton special case of CC2 (`agents:[self]`); runtimes accept CC1 docs unchanged.
- **box-and-box** — the verdict **engine** both compile down to. NOT a composition protocol and NOT the `ampersand.json` validator. The 8-rung ladder + 103 laws (incl. the evolution bridge EV1–EV6 — measured/priced/certified policy change on a provenance chain, a join across the reflexive × axiological × resource rungs, not a ninth rung).

---

## 4. What "done" looks like

The umbrella is coherent when:

1. an `ampersand.json` governance block is judged by box-and-box, not `governance.ex` (govern bridge — **partially shipped via `box-and-box compile`**);
2. `coalition.schema.json` exists and a CC1→singleton-coalition lifter passes the RFC §6 migration (**shipped: schema + `box-and-box lift`; CC1 docs lift to a valid singleton coalition**);
3. `\|>` carries laws, holders, and feasibility annihilation (CC2 compose);
4. a real interpositional host runs `govern` before any consequential effect (replacing the illustrative `aios/`);
5. certificates are emitted as CloudEvents on the PULSE bus (the local provenance hash-chain in `evolution.mjs` is the substrate; CloudEvents transport still open);
6. a second conformant host (Elixir) agrees verdict-for-verdict with the JS engine.

Item 2 is shipped at the schema+lifter level (no coalition runtime yet). Item 1 is in progress. Items 3–6 are open. **Beyond the original six:** the evolution surface (`evolution.mjs`, EV1–EV6) now answers "may this *policy* change, did it improve, is it worth paying for?" on a tamper-evident provenance chain — the self-improvement/change-manifest layer that turns the observe stage into a real evolution loop.
