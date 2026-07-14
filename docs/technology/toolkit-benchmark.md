---
sidebar_position: 2
---

# GUARDIAN Toolkit & Benchmark

## Scenario-workload pairs

The toolkit and benchmark are organized around **scenario-workload pairs**:
a monitoring scenario (what is being watched, and what a human operator
needs to know) paired with a concrete inference workload (the model and
task that produces that information). This keeps the benchmark grounded in
realistic operational use rather than synthetic-only tasks.

## Execution profiles

Each scenario-workload pair is measured across multiple **execution
profiles**, so the same workload's resource/quality trade-off is comparable
across hardware tiers:

- Low-power edge
- Low-end VPS
- Local server
- Central/cloud

## Resource-footprint measurement

The benchmark protocol records resource footprint per execution profile —
CPU, memory, latency, and an energy proxy — alongside output quality, so
that "good enough on commodity hardware" can be demonstrated rather than
assumed.

## Audit and trust fields

Every benchmark run logs audit/trust fields alongside its output,
including confidence/uncertainty and human-review status, so that
downstream consumers of a result can see not just what a model output but
how much to trust it and whether a human has reviewed it.

## Architecture

```mermaid
flowchart LR
    A[Monitoring workload] --> B[Ratio1 edge node]
    B --> C[Benchmark logging]
    C --> D[Audit trail]
```

A monitoring workload runs on a Ratio1 edge node; the node's output is
captured by benchmark logging (resource footprint + audit/trust fields);
logged runs accumulate into an audit trail that supports later review.
