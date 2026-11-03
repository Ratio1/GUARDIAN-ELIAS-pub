---
sidebar_position: 1
description: GUARDIAN's primary validation route — SLM-based second-opinion agents for renewable-storage and virtual-power-plant advisory monitoring, with MONSSON.
---

# Energy-Sector Advisory Monitoring

**Validation partner:** [MONSSON](https://www.monsson.eu/) ·
**Status:** in progress · **Report:** D3, planned for November 2026

This is GUARDIAN's primary validation route. It applies the GUARDIAN
toolkit and benchmark to advisory monitoring in the renewable-storage and
virtual-power-plant (VPP) space: watching operational data from storage
and generation assets and surfacing what a human operator should look at.

## Second-opinion agents

With MONSSON, GUARDIAN is working on **SLM-based second-opinion agents**
for energy-sector operations centers. A second-opinion agent uses a small
language model (SLM) running on modest, CPU-first infrastructure. It is
designed to review monitoring alerts — for example from anomaly detection
or forecast-error monitoring — and to give the operator an explanation
and an uncertainty signal alongside its view. The operator decides what,
if anything, to do.

## What is measured

The validation is planned to cover at least two renewable-storage or VPP
scenario-workload pairs, using approved partner, derived or synthetic
data. For each, the benchmark protocol is designed to record latency,
data locality, resource-footprint proxies, uncertainty and audit
indicators, together with the advisory-use boundaries and limitations
observed.

## Boundaries

This use case is **advisory-only**. It does not control live energy
assets, does not take automated enforcement actions, and does not perform
biometric identification of any kind. Its output is information for a
human operator to review and act on, not an autonomous control signal.
Raw operational data is not published.

Measured results for this use case will be published on
[Results & Downloads](../results/index.md) once approved for release.
