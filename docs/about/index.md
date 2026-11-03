---
sidebar_position: 1
description: GUARDIAN is a six-month Naeural SRL (Ratio1) project, running from July to December 2026, that builds a toolkit and benchmark for resource-aware operational AI on commodity edge and VPS infrastructure.
---

# What is GUARDIAN?

GUARDIAN — Green, User-guided, Auditable Resource-aware Deployment for
Industrial AI Networks — is a six-month project run by Naeural SRL
(Ratio1). It started on 1 July 2026 and runs to 31 December 2026, with
financial support from the ELIAS 2nd FSTP Open Call.

The project is building a reusable toolkit and benchmark for
**resource-aware operational AI** on commodity edge nodes and low-end
virtual private servers (VPS). It tests CPU-first, smaller-model
inference — including small language models (SLMs) — for operational
monitoring workloads: the continuous, always-on inference that watches a
process or a site and flags what a human should look at.

The question is practical: can a selected operational workload run
usefully on modest CPU infrastructure close to the data, instead of
defaulting to centralized, GPU-heavy infrastructure? GUARDIAN answers it
by measurement rather than assumption. Its common benchmark protocol
compares latency, data transfer and locality, and resource-footprint
proxies across low-power edge, low-end VPS, local-server and central/cloud
profiles. Environmental benefits are measured, not assumed: the project
does not claim carbon reductions without a defensible emissions method.

## Validation partners

GUARDIAN applies the same toolkit and benchmark in two operational
contexts:

- **Energy sector, with MONSSON** — the primary validation route:
  SLM-based second-opinion agents for renewable-storage and
  virtual-power-plant monitoring. See
  [Energy-Sector Advisory Monitoring](../use-cases/energy-monitoring.md).
- **Physical security, with Hyperfy (GOC)** — a bounded operations-center
  co-pilot demonstrator focused on efficient SLM deployment. See
  [Operations-Center Co-Pilot](../use-cases/operations-center-copilot.md).

Both scenarios are advisory-only: operators stay in control, with no live
asset control, automated enforcement, live dispatch or biometric
identification.

## Technology readiness

GUARDIAN starts at technology readiness level (TRL) 4: the underlying
Ratio1 components have been validated at component level, while the
integrated toolkit and benchmark are still to be validated as a complete
system in an industrially relevant environment. The project targets
TRL 5 through validation in the MONSSON and Hyperfy scenarios. TRL 5 is a
target, not a result.

See [Objectives](./objectives.md) for the five goals GUARDIAN is working
toward, and [Expected Outputs](./outputs.md) for what the project will
publish.
