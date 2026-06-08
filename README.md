# [&] Protocol

The **[&] Protocol** is an open, language-agnostic specification for **capability composition in AI agents**.

It defines how an agent declares:

- what it can **remember**
- how it can **reason**
- how it understands **time**
- how it understands **space**
- how it is **embodied** — perception, action, affordance
- how those capabilities **compose**
- how decisions retain **provenance**
- how constraints are expressed as **governance**
- how declarations compile into **MCP** and **A2A** configurations

The ampersand (`&`) is not branding syntax. It is the protocol’s core operator for composition.

---

## Why this exists

The current agent stack has useful protocol layers already:

- **MCP** for agent-to-tool connectivity
- **A2A** for agent-to-agent coordination
- **UI protocols** for rendering and interaction

What is still missing is a shared way to describe **how an agent’s cognitive capabilities fit together before runtime wiring begins**.

The [&] Protocol fills that gap.

It provides a source-of-truth artifact, `ampersand.json`, that can be:

- validated against a schema
- checked for composition correctness
- transformed into runtime configuration
- audited through provenance metadata
- extended across implementations and providers

In short:

> MCP defines how agents call tools.  
> A2A defines how agents call agents.  
> [&] defines how capabilities compose into a coherent agent.

---

## Core model

The protocol starts from six capability primitives:

- `&memory` — what the agent knows
- `&reason` — how the agent decides
- `&time` — when things happen
- `&space` — where things are
- `&body` — how the agent is instantiated in an environment (perception, action, affordance)
- `&govern` — who is acting, under what rules, at what cost

Each primitive can be refined with namespaced subtypes:

- `&memory.graph`
- `&memory.episodic`
- `&reason.argument`
- `&reason.vote`
- `&reason.plan`
- `&reason.chain`
- `&reason.deliberate`
- `&reason.attend`
- `&time.anomaly`
- `&time.forecast`
- `&space.fleet`
- `&space.route`
- `&body.browser`
- `&body.os`
- `&govern.telemetry`
- `&govern.escalation`
- `&govern.identity`

The protocol has exactly six primitive roots (`&memory`, `&reason`, `&time`, `&space`, `&body`, `&govern`).
Topology analysis and κ-routing are derived operations from `&memory.graph`, not a separate primitive.
`&body` is the sensorimotor primitive added in draft v0.1.0; see OS-011 (Embodiment Protocol) for the behavioral loop that consumes it.

Composition is defined with two operators:

- `&` — combine capabilities into a set
- `|>` — flow data through capability operations

---

## Example declaration

```json
{
  "$schema": "https://protocol.ampersandboxdesign.com/schema/v0.1.0/ampersand.schema.json",
  "agent": "InfraOperator",
  "version": "1.0.0",
  "capabilities": {
    "&memory.graph": {
      "provider": "graphonomous",
      "config": { "instance": "infra-ops" }
    },
    "&time.anomaly": {
      "provider": "ticktickclock",
      "config": { "streams": ["cpu", "mem"] }
    },
    "&space.fleet": {
      "provider": "geofleetic",
      "config": { "regions": ["us-east"] }
    },
    "&reason.argument": {
      "provider": "deliberatic",
      "config": { "governance": "constitutional" }
    },
    "&reason.deliberate": {
      "provider": "graphonomous",
      "config": { "budget": "kappa" }
    },
    "&reason.attend": {
      "provider": "graphonomous",
      "config": {}
    }
  },
  "governance": {
    "hard": ["Never scale beyond 3x in a single action"],
    "soft": ["Prefer gradual scaling over spikes"],
    "escalate_when": {
      "confidence_below": 0.7,
      "cost_exceeds_usd": 1000
    },
    "autonomy": {
      "level": "advise",
      "model_tier": "local_small",
      "heartbeat_seconds": 300,
      "budget": {
        "max_actions_per_hour": 5,
        "max_deliberation_calls_per_query": 1,
        "require_approval_for": ["act", "propose"]
      }
    }
  },
  "provenance": true
}
```

---

## What the repository contains

This repository is the canonical home for the protocol and its reference artifacts.

### Specification
- `site/protocol.html` — current HTML specification
- `SPEC.md` — markdown protocol specification
- `prompts/PROTOCOL_PROMPT.md` — implementation-oriented protocol prompt

### Schemas
- `protocol/schema/v0.1.0/ampersand.schema.json` — canonical schema for `ampersand.json`
- `protocol/schema/v0.1.0/capability-contract.schema.json` — schema for capability contracts
- `protocol/schema/v0.1.0/registry.schema.json` — schema for capability registry documents

### Examples
- `examples/infra-operator.ampersand.json`
- `examples/research-agent.ampersand.json`
- `examples/fleet-manager.ampersand.json`
- `examples/customer-support.ampersand.json`
- `examples/README.md` — explains the reference declarations and how to use them

### Contracts
- `contracts/v0.1.0/memory.graph.contract.json`
- `contracts/v0.1.0/memory.vector.contract.json`
- `contracts/v0.1.0/memory.episodic.contract.json`
- `contracts/v0.1.0/reason.argument.contract.json`
- `contracts/v0.1.0/reason.vote.contract.json`
- `contracts/v0.1.0/reason.plan.contract.json`
- `contracts/v0.1.0/reason.deliberate.contract.json`
- `contracts/v0.1.0/reason.attend.contract.json`
- `contracts/v0.1.0/time.anomaly.contract.json`
- `contracts/v0.1.0/time.forecast.contract.json`
- `contracts/v0.1.0/time.pattern.contract.json`
- `contracts/v0.1.0/space.fleet.contract.json`
- `contracts/v0.1.0/space.route.contract.json`
- `contracts/v0.1.0/space.geofence.contract.json`
- `contracts/v0.1.0/body.browser.contract.json`
- `contracts/v0.1.0/body.os.contract.json`

Schema-aligned contract examples for `&reason.deliberate` and `&reason.attend` are included in:
- `protocol/schema/v0.1.0/capability-contract.schema.json` (`examples` section)

### Registry
- `protocol/registry/v0.1.0/capabilities.registry.json` — capability registry artifact with subtype, provider, and contract metadata

### Capability pages (status)

Capability-specific markdown pages are not currently published in this repository.

Authoritative locations for capability details are:

- `SPEC.md` — normative protocol specification
- `prompts/PROTOCOL_PROMPT.md` — implementation-oriented prompt
- `contracts/v0.1.0/` — capability contract artifacts (including `reason.deliberate` and `reason.attend`)
- `protocol/schema/v0.1.0/capability-contract.schema.json` — contract schema and examples
- `protocol/registry/v0.1.0/capabilities.registry.json` — subtype/provider registry mappings

### Reference implementation
- `reference/elixir/ampersand_core/` — minimal Elixir implementation with:
  - schema validation
  - capability composition
  - contract checking
  - MCP generation
  - A2A generation
  - `ampersand` CLI

### Documentation
- `docs/quickstart.md`
- `docs/runtime-walkthrough.md`
- `docs/positioning.md`
- `docs/faq.md`
- `docs/comparison-table.md`

### Ecosystem SDKs and tooling
- `sdk/npm/validate/` — `@ampersand-protocol/validate` npm validator + CLI
- `sdk/python/ampersand_protocol/` — `ampersand-protocol` Python SDK + CLI
- `.github/actions/ampersand-validate/` — reusable GitHub Action for declaration validation/composition/check
- `vscode/ampersand-json/` — VS Code schema/snippet extension for `*.ampersand.json`
- `playground/` — browser playground for live validation/composition/MCP/A2A previews

### Website source
- `site/index.html`
- `site/protocol.html`
- `site/portfolio_company_complete_research.html`

---

## Quick start

> **Note — the `box-and-box` name.** It now belongs to the **governance kernel**
> of the [&] stack (the eight-rung arithmetic ladder · 103 property-tested laws —
> see `opensentience.org/box-and-box/` and `https://ampersandboxdesign.com`). The
> previous `box-and-box` — the v0.1.0 [&] Protocol validator/composer MCP server —
> was removed in the clean-break stack upgrade. Validate and compose `*.ampersand.json`
> specs via the Elixir reference CLI (below) or the language SDKs instead.

### Option A — MCP servers (three-protocol stack)

The [&] ecosystem ships three MCP servers, each installing identically with
`npx` and carrying its own embedded SQLite + sqlite-vec database:

```jsonc
// .mcp.json
{
  "mcpServers": {
    "graphonomous": { "command": "npx", "args": ["-y", "graphonomous", "--db", "~/.graphonomous/knowledge.db"] },
    "prism":        { "command": "npx", "args": ["-y", "os-prism",     "--db", "~/.os-prism/benchmarks.db"] },
    "pulse":        { "command": "npx", "args": ["-y", "os-pulse",     "--db", "~/.os-pulse/manifests.db"] }
  }
}
```

### Option B — Elixir reference CLI (for protocol development)

```bash
cd reference/elixir/ampersand_core
mix escript.build
./ampersand validate ../../../examples/infra-operator.ampersand.json
```

### 2. Check composition

```bash
./ampersand compose ../../../examples/infra-operator.ampersand.json
```

### 3. Generate MCP config

```bash
./ampersand generate mcp ../../../examples/infra-operator.ampersand.json
```

### 4. Generate an A2A agent card

```bash
./ampersand generate a2a ../../../examples/infra-operator.ampersand.json
```

---

## Current implementation status

The repository currently includes working foundations for:

- canonical protocol schema + contract + registry artifacts
- validating example declarations
- Elixir reference runtime (validation, composition algebra, contract checks, runtime planning/execution, governance, provenance)
- MCP config generation and A2A card generation
- CLI commands for validate / compose / check / plan / run / generate / registry / diff
- ecosystem scaffolds for npm, Python, CI action, VS Code, and playground workflows

This is still an early protocol implementation, but it is grounded in machine-checkable artifacts and now includes cross-ecosystem entry points for adoption.

---

## Design principles

### 1. Capabilities are interfaces, not products
`&memory.graph` is a protocol capability.  
`graphonomous` is one provider that may satisfy it.

### 2. Composition should be deterministic
Capability sets should behave like algebraic sets: order and duplication should not change the result.

### 3. Governance belongs in data
Constraints should be portable across implementations, not trapped in one runtime.

### 4. Provenance is part of the protocol
A conforming implementation should preserve where context came from and how decisions were derived.

### 5. The protocol complements the ecosystem
[&] does not replace MCP or A2A.

It compiles into them.

---

## Roadmap

Roadmap (implementation phases):

### Phase 1 — adoption unblockers
1. quickstart docs with reproducible CLI output
2. escript build verification
3. provider `auto` resolution
4. second real provider resolver
5. runtime governance enforcement

### Phase 2 — protocol story hardening
6. multi-file compose in CLI
7. pipeline-in-declaration schema + named pipeline CLI support
8. generate command output writing + MCP format flag
9. declaration diff command
10. property-based tests for composition algebra

### Phase 3 — ecosystem growth
11. npm validator package (`@ampersand-protocol/validate`)
12. Python SDK (`ampersand-protocol`)
13. GitHub Action for CI declaration validation
14. VS Code extension for `*.ampersand.json`
15. interactive web playground

---

## Intended audience

This project is for:

- protocol designers
- agent framework authors
- infrastructure engineers
- AI platform teams
- researchers working on memory, reasoning, planning, provenance, and agent safety

---

## Status

**Status:** active design + implementation  
**Scope:** open protocol + reference implementation  
**Goal:** a portable composition layer for the agent ecosystem

---
