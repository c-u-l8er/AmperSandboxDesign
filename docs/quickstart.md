# Five-Minute Quickstart (Elixir Reference CLI)

This quickstart gets you from clone to a working `ampersand` executable and runs every core CLI command against `infra-operator.ampersand.json`.

All JSON output below was captured from real command execution in this repository.

> **Note — the `box-and-box` name.** It now belongs to the [&] **governance
> kernel** (the eight-rung arithmetic ladder · 97 property-tested laws — see
> `opensentience.org/box-and-box/`). The previous `box-and-box` — the [&]
> Protocol validator/composer MCP server — was removed in the clean-break stack
> upgrade. Validate and compose `*.ampersand.json` specs with the local Elixir
> reference CLI this quickstart covers, or the language SDKs.

---

## Prerequisites

- Elixir `1.15+` (project currently builds on newer Elixir too)
- Node.js `18+` (required for AJV schema validation via `ajv-cli`)
- Git

---

## 1) Clone, build, test

```bash
git clone https://github.com/c-u-l8er/AmpersandBoxDesign.git
cd AmpersandBoxDesign/reference/elixir/ampersand_core
mix deps.get
mix test
```

Expected test result (current reference state):

```text
Running ExUnit with seed: 553613, max_cases: 48

...............................................................
Finished in 31.9 seconds (31.9s async, 0.00s sync)
5 properties, 58 tests, 0 failures
```

---

## 2) Build standalone CLI escript

`mix.exs` is configured with:

- `escript: [main_module: AmpersandCore.CLI, name: "ampersand"]`

Build and verify:

```bash
mix escript.build
./ampersand help
```

Build output:

```text
Generated escript ampersand with MIX_ENV=dev
```

---

## 3) Run the full CLI flow (infra-operator example)

> All commands below are run from:
> `reference/elixir/ampersand_core`

### 3.1 Validate declaration

```bash
./ampersand validate ../../../examples/infra-operator.ampersand.json
```

```json
{
  "agent": "InfraOperator",
  "capability_count": 4,
  "command": "validate",
  "file": "../../../examples/infra-operator.ampersand.json",
  "schema": "https://protocol.ampersandboxdesign.com/schema/v0.1.0/ampersand.schema.json",
  "status": "ok",
  "valid": true,
  "version": "1.0.0"
}
```

---

### 3.2 Compose capabilities

```bash
./ampersand compose ../../../examples/infra-operator.ampersand.json
```

```json
{
  "aci": {
    "associative": true,
    "commutative": true,
    "idempotent": true,
    "identity": true
  },
  "agent": "InfraOperator",
  "capabilities": [
    "&memory.graph",
    "&reason.argument",
    "&space.fleet",
    "&time.anomaly"
  ],
  "capability_count": 4,
  "command": "compose",
  "composed": {
    "&memory.graph": {
      "config": {
        "instance": "infra-ops"
      },
      "provider": "graphonomous"
    },
    "&reason.argument": {
      "config": {
        "governance": "constitutional"
      },
      "provider": "deliberatic"
    },
    "&space.fleet": {
      "config": {
        "regions": [
          "us-east"
        ]
      },
      "provider": "geofleetic"
    },
    "&time.anomaly": {
      "config": {
        "streams": [
          "cpu",
          "mem"
        ]
      },
      "provider": "ticktickclock"
    }
  },
  "contracts": {
    "contract_count": 4,
    "loaded": [
      "&memory.graph",
      "&reason.argument",
      "&space.fleet",
      "&time.anomaly"
    ],
    "missing": []
  },
  "file": "../../../examples/infra-operator.ampersand.json",
  "registry": {
    "known_capabilities": [
      "&memory.graph",
      "&reason.argument",
      "&space.fleet",
      "&time.anomaly"
    ],
    "known_providers": [
      "deliberatic",
      "geofleetic",
      "graphonomous",
      "ticktickclock"
    ],
    "provider_matches": {
      "&memory.graph": [
        "graphonomous",
        "neo4j-memory"
      ],
      "&reason.argument": [
        "deliberatic"
      ],
      "&space.fleet": [
        "geofleetic"
      ],
      "&time.anomaly": [
        "ticktickclock"
      ]
    },
    "unknown_capabilities": [],
    "unknown_providers": []
  },
  "status": "ok",
  "version": "1.0.0"
}
```

---

### 3.3 Check pipeline contracts and type flow

```bash
./ampersand check ../../../examples/infra-operator.ampersand.json "stream_data |> &time.anomaly.detect() |> &memory.graph.enrich() |> &reason.argument.evaluate()"
```

```json
{
  "agent": "InfraOperator",
  "command": "check",
  "file": "../../../examples/infra-operator.ampersand.json",
  "pipeline": [
    {
      "capability": "&time.anomaly",
      "operation": "detect"
    },
    {
      "capability": "&memory.graph",
      "operation": "enrich"
    },
    {
      "capability": "&reason.argument",
      "operation": "evaluate"
    }
  ],
  "source": {
    "ref": "stream_data",
    "type": "stream_data"
  },
  "status": "ok",
  "step_count": 3,
  "valid": true,
  "version": "1.0.0"
}
```

---

### 3.4 Build runtime plan

```bash
./ampersand plan ../../../examples/infra-operator.ampersand.json "stream_data |> &time.anomaly.detect() |> &memory.graph.enrich() |> &reason.argument.evaluate()"
```

```json
{
  "agent": "InfraOperator",
  "command": "plan",
  "file": "../../../examples/infra-operator.ampersand.json",
  "governance": {
    "escalate_when": {
      "confidence_below": 0.7,
      "cost_exceeds_usd": 1000
    },
    "hard": [
      "Never scale beyond 3x in a single action"
    ],
    "soft": [
      "Prefer gradual scaling over spikes"
    ]
  },
  "mode": "plan",
  "pipeline": "stream_data |> &time.anomaly.detect() |> &memory.graph.enrich() |> &reason.argument.evaluate()",
  "provenance": {
    "enabled": true
  },
  "registry": {
    "generated_at": "2026-03-15T00:00:00Z",
    "id": "registry.ampersandboxdesign.com",
    "version": "0.1.0"
  },
  "resolution": {
    "registry-known": 3
  },
  "source": {
    "ref": "stream_data",
    "type": "stream_data"
  },
  "status": "ok",
  "step_count": 3,
  "steps": [
    {
      "a2a_skills": [
        "temporal-anomaly-detection"
      ],
      "accepts_from": [
        "&memory.*",
        "&space.*",
        "raw_data",
        "stream_data",
        "context",
        "observation"
      ],
      "capability": "&time.anomaly",
      "config": {
        "streams": [
          "cpu",
          "mem"
        ]
      },
      "contract_ref": "/contracts/v0.1.0/time.anomaly.contract.json",
      "description": "Detect anomalous events, spikes, drops, or drift from temporal input signals.",
      "deterministic": false,
      "feeds_into": [
        "&memory.*",
        "&reason.*",
        "&space.*",
        "output"
      ],
      "index": 1,
      "input_type": "stream_data",
      "operation": "detect",
      "output_type": "anomaly_set",
      "provider": "ticktickclock",
      "provider_resolution": {
        "protocol": "mcp_v1",
        "provider": "ticktickclock",
        "published_in_registry": true,
        "status": "registry-known",
        "transport": "custom",
        "url": "https://ticktickclock.com"
      },
      "side_effects": false
    },
    {
      "a2a_skills": [
        "graph-memory-recall",
        "context-enrichment",
        "memory-consolidation"
      ],
      "accepts_from": [
        "&time.*",
        "&reason.*",
        "query_context",
        "observation",
        "memory_batch"
      ],
      "capability": "&memory.graph",
      "config": {
        "instance": "infra-ops"
      },
      "contract_ref": "/contracts/v0.1.0/memory.graph.contract.json",
      "description": "Add linked historical incidents, dependencies, or related entities to a current anomaly set.",
      "deterministic": false,
      "feeds_into": [
        "&reason.*",
        "&space.*",
        "output"
      ],
      "index": 2,
      "input_type": "anomaly_set",
      "operation": "enrich",
      "output_type": "enriched_context",
      "provider": "graphonomous",
      "provider_resolution": {
        "protocol": "mcp_v1",
        "provider": "graphonomous",
        "published_in_registry": true,
        "status": "registry-known",
        "transport": "stdio"
      },
      "side_effects": false
    },
    {
      "a2a_skills": [
        "decision-evaluation",
        "evidence-based-deliberation",
        "decision-justification"
      ],
      "accepts_from": [
        "&memory.*",
        "&time.*",
        "&space.*",
        "context",
        "candidate_set"
      ],
      "capability": "&reason.argument",
      "config": {
        "governance": "constitutional"
      },
      "contract_ref": "/contracts/v0.1.0/reason.argument.contract.json",
      "description": "Evaluate enriched evidence and return a decision artifact.",
      "deterministic": false,
      "feeds_into": [
        "&memory.*",
        "output"
      ],
      "index": 3,
      "input_type": "enriched_context",
      "operation": "evaluate",
      "output_type": "decision",
      "provider": "deliberatic",
      "provider_resolution": {
        "protocol": "mcp_v1",
        "provider": "deliberatic",
        "published_in_registry": true,
        "status": "registry-known",
        "transport": "custom",
        "url": "https://deliberatic.com"
      },
      "side_effects": false
    }
  ],
  "version": "1.0.0"
}
```

---

### 3.5 Run pipeline with input payload

```bash
./ampersand run ../../../examples/infra-operator.ampersand.json "stream_data |> &time.anomaly.detect() |> &memory.graph.enrich() |> &reason.argument.evaluate()" "{\"stream\":\"cpu\",\"samples\":[0.2,0.3,0.95],\"region\":\"us-east\"}"
```

```json
{
  "agent": "InfraOperator",
  "command": "run",
  "file": "../../../examples/infra-operator.ampersand.json",
  "governance": {
    "escalate_when": {
      "confidence_below": 0.7,
      "cost_exceeds_usd": 1000
    },
    "hard": [
      "Never scale beyond 3x in a single action"
    ],
    "soft": [
      "Prefer gradual scaling over spikes"
    ]
  },
  "mode": "simulated",
  "output": {
    "input": {
      "input": {
        "input": {
          "region": "us-east",
          "samples": [
            0.2,
            0.3,
            0.95
          ],
          "stream": "cpu",
          "type": "stream_data"
        },
        "operation": "detect",
        "provider": "ticktickclock",
        "source": "&time.anomaly",
        "summary": "Simulated &time.anomaly.detect -> anomaly_set",
        "type": "anomaly_set"
      },
      "operation": "enrich",
      "provider": "graphonomous",
      "source": "&memory.graph",
      "summary": "Simulated &memory.graph.enrich -> enriched_context",
      "type": "enriched_context"
    },
    "operation": "evaluate",
    "provider": "deliberatic",
    "source": "&reason.argument",
    "summary": "Simulated &reason.argument.evaluate -> decision",
    "type": "decision"
  },
  "pipeline": "stream_data |> &time.anomaly.detect() |> &memory.graph.enrich() |> &reason.argument.evaluate()",
  "provenance": [
    {
      "input_hash": "sha256:278c169c0f860e0329f6643cd82d3824058e55e66ed7f85233ed502b261426ff",
      "operation": "detect",
      "output_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
      "parent_hash": null,
      "provider": "ticktickclock",
      "source": "&time.anomaly",
      "timestamp": "2026-03-16T21:22:26Z"
    },
    {
      "input_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
      "operation": "enrich",
      "output_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
      "parent_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
      "provider": "graphonomous",
      "source": "&memory.graph",
      "timestamp": "2026-03-16T21:22:27Z"
    },
    {
      "input_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
      "operation": "evaluate",
      "output_hash": "sha256:ac78c34711ada8b4a6c9ea78144e3e2c7d169ed2bf5fe1f2fb5c8af3f8be385f",
      "parent_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
      "provider": "deliberatic",
      "source": "&reason.argument",
      "timestamp": "2026-03-16T21:22:28Z"
    }
  ],
  "provenance_count": 3,
  "source": {
    "ref": "stream_data",
    "type": "stream_data"
  },
  "status": "ok",
  "step_count": 3,
  "steps": [
    {
      "capability": "&time.anomaly",
      "index": 1,
      "input": {
        "region": "us-east",
        "samples": [
          0.2,
          0.3,
          0.95
        ],
        "stream": "cpu",
        "type": "stream_data"
      },
      "input_type": "stream_data",
      "operation": "detect",
      "output": {
        "input": {
          "region": "us-east",
          "samples": [
            0.2,
            0.3,
            0.95
          ],
          "stream": "cpu",
          "type": "stream_data"
        },
        "operation": "detect",
        "provider": "ticktickclock",
        "source": "&time.anomaly",
        "summary": "Simulated &time.anomaly.detect -> anomaly_set",
        "type": "anomaly_set"
      },
      "output_type": "anomaly_set",
      "provenance": {
        "input_hash": "sha256:278c169c0f860e0329f6643cd82d3824058e55e66ed7f85233ed502b261426ff",
        "operation": "detect",
        "output_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
        "parent_hash": null,
        "provider": "ticktickclock",
        "source": "&time.anomaly",
        "timestamp": "2026-03-16T21:22:26Z"
      },
      "provider": "ticktickclock",
      "timestamp": "2026-03-16T21:22:26Z"
    },
    {
      "capability": "&memory.graph",
      "index": 2,
      "input": {
        "input": {
          "region": "us-east",
          "samples": [
            0.2,
            0.3,
            0.95
          ],
          "stream": "cpu",
          "type": "stream_data"
        },
        "operation": "detect",
        "provider": "ticktickclock",
        "source": "&time.anomaly",
        "summary": "Simulated &time.anomaly.detect -> anomaly_set",
        "type": "anomaly_set"
      },
      "input_type": "anomaly_set",
      "operation": "enrich",
      "output": {
        "input": {
          "input": {
            "region": "us-east",
            "samples": [
              0.2,
              0.3,
              0.95
            ],
            "stream": "cpu",
            "type": "stream_data"
          },
          "operation": "detect",
          "provider": "ticktickclock",
          "source": "&time.anomaly",
          "summary": "Simulated &time.anomaly.detect -> anomaly_set",
          "type": "anomaly_set"
        },
        "operation": "enrich",
        "provider": "graphonomous",
        "source": "&memory.graph",
        "summary": "Simulated &memory.graph.enrich -> enriched_context",
        "type": "enriched_context"
      },
      "output_type": "enriched_context",
      "provenance": {
        "input_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
        "operation": "enrich",
        "output_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
        "parent_hash": "sha256:7a8f2604aaacde1bdc657da62f3ae5fa3290ee742dc4127508a1d2a6dc6fa220",
        "provider": "graphonomous",
        "source": "&memory.graph",
        "timestamp": "2026-03-16T21:22:27Z"
      },
      "provider": "graphonomous",
      "timestamp": "2026-03-16T21:22:27Z"
    },
    {
      "capability": "&reason.argument",
      "index": 3,
      "input": {
        "input": {
          "input": {
            "region": "us-east",
            "samples": [
              0.2,
              0.3,
              0.95
            ],
            "stream": "cpu",
            "type": "stream_data"
          },
          "operation": "detect",
          "provider": "ticktickclock",
          "source": "&time.anomaly",
          "summary": "Simulated &time.anomaly.detect -> anomaly_set",
          "type": "anomaly_set"
        },
        "operation": "enrich",
        "provider": "graphonomous",
        "source": "&memory.graph",
        "summary": "Simulated &memory.graph.enrich -> enriched_context",
        "type": "enriched_context"
      },
      "input_type": "enriched_context",
      "operation": "evaluate",
      "output": {
        "input": {
          "input": {
            "input": {
              "region": "us-east",
              "samples": [
                0.2,
                0.3,
                0.95
              ],
              "stream": "cpu",
              "type": "stream_data"
            },
            "operation": "detect",
            "provider": "ticktickclock",
            "source": "&time.anomaly",
            "summary": "Simulated &time.anomaly.detect -> anomaly_set",
            "type": "anomaly_set"
          },
          "operation": "enrich",
          "provider": "graphonomous",
          "source": "&memory.graph",
          "summary": "Simulated &memory.graph.enrich -> enriched_context",
          "type": "enriched_context"
        },
        "operation": "evaluate",
        "provider": "deliberatic",
        "source": "&reason.argument",
        "summary": "Simulated &reason.argument.evaluate -> decision",
        "type": "decision"
      },
      "output_type": "decision",
      "provenance": {
        "input_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
        "operation": "evaluate",
        "output_hash": "sha256:ac78c34711ada8b4a6c9ea78144e3e2c7d169ed2bf5fe1f2fb5c8af3f8be385f",
        "parent_hash": "sha256:7897c28b4151bebee6f677b4f2dba130a48173df3ab4357a3ffa42008a8ec6ab",
        "provider": "deliberatic",
        "source": "&reason.argument",
        "timestamp": "2026-03-16T21:22:28Z"
      },
      "provider": "deliberatic",
      "timestamp": "2026-03-16T21:22:28Z"
    }
  ],
  "version": "1.0.0"
}
```

---

### 3.6 Generate MCP client config

```bash
./ampersand generate mcp ../../../examples/infra-operator.ampersand.json
```

```json
{
  "context_servers": {
    "graphonomous": {
      "args": [
        "-y",
        "graphonomous",
        "--db",
        "~/.graphonomous/knowledge.db",
        "--embedder-backend",
        "fallback"
      ],
      "command": "npx",
      "env": {
        "GRAPHONOMOUS_EMBEDDING_MODEL": "sentence-transformers/all-MiniLM-L6-v2"
      },
      "transport": "stdio"
    },
    "ticktickclock": {
      "args": [
        "-y",
        "@ampersand-protocol/ticktickclock-mcp"
      ],
      "command": "npx",
      "env": {},
      "transport": "stdio"
    }
  }
}
```

---

### 3.7 Generate A2A agent card

```bash
./ampersand generate a2a ../../../examples/infra-operator.ampersand.json
```

```json
{
  "description": "Agent generated from ampersand protocol declaration with capabilities: &memory.graph, &reason.argument, &space.fleet, &time.anomaly.",
  "metadata": {
    "a2a_skill_map": {
      "&memory.graph": [
        "context-enrichment",
        "graph-memory-recall",
        "memory-consolidation"
      ],
      "&reason.argument": [
        "decision-evaluation",
        "decision-justification",
        "evidence-based-deliberation"
      ],
      "&space.fleet": [
        "fleet-state-enrichment",
        "regional-capacity-lookup",
        "route-feasibility-evaluation"
      ],
      "&time.anomaly": [
        "temporal-anomaly-detection"
      ]
    },
    "capabilities": [
      "&memory.graph",
      "&reason.argument",
      "&space.fleet",
      "&time.anomaly"
    ],
    "governance": {
      "escalate_when": {
        "confidence_below": 0.7,
        "cost_exceeds_usd": 1000
      },
      "hard": [
        "Never scale beyond 3x in a single action"
      ],
      "soft": [
        "Prefer gradual scaling over spikes"
      ]
    },
    "provenance": true,
    "providers": [
      "deliberatic",
      "geofleetic",
      "graphonomous",
      "ticktickclock"
    ]
  },
  "name": "InfraOperator",
  "protocol": "A2A",
  "provider_bindings": {
    "&memory.graph": "graphonomous",
    "&reason.argument": "deliberatic",
    "&space.fleet": "geofleetic",
    "&time.anomaly": "ticktickclock"
  },
  "skills": [
    {
      "accepts_from": [
        "&time.*",
        "&reason.*",
        "query_context",
        "observation",
        "memory_batch"
      ],
      "capability": "&memory.graph",
      "description": "Memory Graph provided by graphonomous.",
      "examples": [
        {
          "skill": "context-enrichment",
          "summary": "Invoke Memory Graph via context-enrichment."
        },
        {
          "skill": "graph-memory-recall",
          "summary": "Invoke Memory Graph via graph-memory-recall."
        },
        {
          "skill": "memory-consolidation",
          "summary": "Invoke Memory Graph via memory-consolidation."
        }
      ],
      "feeds_into": [
        "&reason.*",
        "&space.*",
        "output"
      ],
      "id": "context-enrichment",
      "input_modes": [
        "application/json",
        "text/plain"
      ],
      "name": "Memory Graph",
      "operations": [
        "consolidate",
        "enrich",
        "learn",
        "recall"
      ],
      "output_modes": [
        "application/json",
        "text/plain"
      ],
      "provider": "graphonomous",
      "tags": [
        "ampersand",
        "a2a",
        "memory",
        "&memory.graph",
        "graphonomous"
      ]
    },
    {
      "accepts_from": [
        "&memory.*",
        "&time.*",
        "&space.*",
        "context",
        "candidate_set"
      ],
      "capability": "&reason.argument",
      "description": "Reason Argument provided by deliberatic.",
      "examples": [
        {
          "skill": "decision-evaluation",
          "summary": "Invoke Reason Argument via decision-evaluation."
        },
        {
          "skill": "decision-justification",
          "summary": "Invoke Reason Argument via decision-justification."
        },
        {
          "skill": "evidence-based-deliberation",
          "summary": "Invoke Reason Argument via evidence-based-deliberation."
        }
      ],
      "feeds_into": [
        "&memory.*",
        "output"
      ],
      "id": "decision-evaluation",
      "input_modes": [
        "application/json",
        "text/plain"
      ],
      "name": "Reason Argument",
      "operations": [
        "deliberate",
        "evaluate",
        "justify",
        "learn"
      ],
      "output_modes": [
        "application/json",
        "text/plain"
      ],
      "provider": "deliberatic",
      "tags": [
        "ampersand",
        "a2a",
        "reason",
        "&reason.argument",
        "deliberatic"
      ]
    },
    {
      "accepts_from": [
        "&memory.*",
        "&time.*",
        "raw_data",
        "context"
      ],
      "capability": "&space.fleet",
      "description": "Space Fleet provided by geofleetic.",
      "examples": [
        {
          "skill": "fleet-state-enrichment",
          "summary": "Invoke Space Fleet via fleet-state-enrichment."
        },
        {
          "skill": "regional-capacity-lookup",
          "summary": "Invoke Space Fleet via regional-capacity-lookup."
        },
        {
          "skill": "route-feasibility-evaluation",
          "summary": "Invoke Space Fleet via route-feasibility-evaluation."
        }
      ],
      "feeds_into": [
        "&reason.*",
        "&memory.*",
        "output"
      ],
      "id": "fleet-state-enrichment",
      "input_modes": [
        "application/json",
        "text/plain"
      ],
      "name": "Space Fleet",
      "operations": [
        "capacity",
        "enrich",
        "locate",
        "route"
      ],
      "output_modes": [
        "application/json",
        "text/plain"
      ],
      "provider": "geofleetic",
      "tags": [
        "ampersand",
        "a2a",
        "space",
        "&space.fleet",
        "geofleetic"
      ]
    },
    {
      "accepts_from": [
        "&memory.*",
        "&space.*",
        "raw_data",
        "stream_data",
        "context",
        "observation"
      ],
      "capability": "&time.anomaly",
      "description": "Time Anomaly provided by ticktickclock.",
      "examples": [
        {
          "skill": "temporal-anomaly-detection",
          "summary": "Invoke Time Anomaly via temporal-anomaly-detection."
        }
      ],
      "feeds_into": [
        "&memory.*",
        "&reason.*",
        "&space.*",
        "output"
      ],
      "id": "temporal-anomaly-detection",
      "input_modes": [
        "application/json",
        "text/plain"
      ],
      "name": "Time Anomaly",
      "operations": [
        "detect",
        "enrich",
        "learn"
      ],
      "output_modes": [
        "application/json",
        "text/plain"
      ],
      "provider": "ticktickclock",
      "tags": [
        "ampersand",
        "a2a",
        "time",
        "&time.anomaly",
        "ticktickclock"
      ]
    }
  ],
  "version": "1.0.0"
}
```

---

### 3.8 List registry coverage

```bash
./ampersand registry list
```

```json
{
  "capabilities": [
    "&memory.episodic",
    "&memory.graph",
    "&memory.vector",
    "&reason.argument",
    "&reason.plan",
    "&reason.vote",
    "&space.fleet",
    "&space.geofence",
    "&space.route",
    "&time.anomaly",
    "&time.forecast",
    "&time.pattern"
  ],
  "capability_count": 12,
  "command": "registry",
  "contract_backed_capabilities": [
    "&memory.episodic",
    "&memory.graph",
    "&memory.vector",
    "&reason.argument",
    "&reason.plan",
    "&reason.vote",
    "&space.fleet",
    "&space.geofence",
    "&space.route",
    "&time.anomaly",
    "&time.forecast",
    "&time.pattern"
  ],
  "primitive_count": 4,
  "primitives": [
    "&memory",
    "&reason",
    "&space",
    "&time"
  ],
  "provider_count": 7,
  "providers": [
    "deliberatic",
    "geofleetic",
    "graphonomous",
    "neo4j-memory",
    "pgvector",
    "ticktickclock",
    "weaviate"
  ],
  "registry": {
    "generated_at": "2026-03-15T00:00:00Z",
    "id": "registry.ampersandboxdesign.com",
    "version": "0.1.0"
  },
  "status": "ok",
  "subcommand": "list"
}
```

---

### 3.9 Find providers for a capability

```bash
./ampersand registry providers "&memory.graph"
```

```json
{
  "a2a_skills": [
    "context-enrichment",
    "graph-memory-recall",
    "memory-consolidation"
  ],
  "capability": "&memory.graph",
  "command": "registry",
  "contract_ref": "/contracts/v0.1.0/memory.graph.contract.json",
  "operations": [
    "consolidate",
    "enrich",
    "learn",
    "recall"
  ],
  "provider_count": 2,
  "providers": [
    {
      "args": [
        "-y",
        "graphonomous",
        "--db",
        "~/.graphonomous/knowledge.db",
        "--embedder-backend",
        "fallback"
      ],
      "command": "npx",
      "contract_ref": "/contracts/v0.1.0/memory.graph.contract.json",
      "description": "Graph and episodic memory provider with MCP-compatible runtime surfaces.",
      "id": "graphonomous",
      "name": "Graphonomous",
      "protocol": "mcp_v1",
      "status": "stable",
      "subtypes": [
        "graph",
        "episodic"
      ],
      "transport": "stdio"
    },
    {
      "contract_ref": "/contracts/v0.1.0/memory.graph.contract.json",
      "description": "Representative graph-memory provider backed by graph database primitives.",
      "id": "neo4j-memory",
      "name": "Neo4j Memory",
      "protocol": "mcp_v1",
      "status": "experimental",
      "subtypes": [
        "graph"
      ],
      "transport": "custom",
      "url": "https://example.com/providers/neo4j-memory"
    }
  ],
  "status": "ok",
  "subcommand": "providers"
}
```

---

## 4) Next reading

- Runtime lifecycle deep dive: `docs/runtime-walkthrough.md`
- Architecture overview: `docs/architecture.md`

This quickstart demonstrates that the CLI output shown in the runtime story is directly reproducible from the current reference implementation.
