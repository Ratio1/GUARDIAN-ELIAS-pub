---
sidebar_position: 2
description: How the GUARDIAN toolkit and benchmark are organized — scenario-workload pairs, execution profiles, resource-footprint measurement and audit fields.
---

# GUARDIAN Toolkit & Benchmark

## Scenario-workload pairs

The toolkit and benchmark are organized around **scenario-workload pairs**:
a monitoring scenario (what is being watched, and what a human operator
needs to know) paired with a concrete inference workload (the model and
task that produces that information). Scenarios are operationally
motivated; their inputs are approved partner data, derived data or
synthetic data.

GUARDIAN's workloads are designed around smaller models running
CPU-first, including small language models (SLMs) — for example, second-opinion agents in the
energy-sector validation and an operations-center co-pilot in the
physical-security demonstrator. See the [use cases](../use-cases/energy-monitoring.md)
for both scenarios.

## Execution profiles

Each scenario-workload pair is to be measured across multiple
**execution profiles**, so the same workload's resource/quality trade-off is comparable
across hardware tiers:

- Low-power edge
- Low-end virtual private server (VPS)
- Local server
- Central/cloud

## Resource-footprint measurement

The benchmark protocol is designed to record, per execution profile,
latency, data transfer or locality, and resource-footprint proxies — such
as model size, inference time, CPU and memory use, or an available energy
proxy — alongside the workload's output. These proxies are reported as
measured; they are not converted into carbon-reduction claims without a
defensible emissions method.

## Audit and trust fields

Each benchmark run is designed to log audit fields alongside its output,
including the reported confidence or uncertainty signal, an explanation
field and human-review status, so that a reviewer can see what the model
reported, how uncertain it said it was, and whether a human has reviewed
the result.

## Architecture

```mermaid
flowchart LR
    accTitle: GUARDIAN benchmark flow
    accDescr: A monitoring workload runs on a Ratio1 edge node, its output is captured by benchmark logging, and logged runs accumulate into an audit trail.
    A[Monitoring workload] --> B[Ratio1 edge node]
    B --> C[Benchmark logging]
    C --> D[Audit trail]
```

A monitoring workload runs on a Ratio1 edge node; the node's output is
captured by benchmark logging (resource footprint and audit fields);
logged runs accumulate into an audit trail that supports later review.
