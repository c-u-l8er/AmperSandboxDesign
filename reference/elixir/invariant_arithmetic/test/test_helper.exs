ExUnit.start()

# Default property-test trials. Override per-property with `check max_runs: N`.
# Matches `STACK_PROOF.html`'s 1000-trial default for parity with the JS harness.
ExUnit.configure(exclude: [:exhaustive])

Application.put_env(:stream_data, :max_runs, 1000)

