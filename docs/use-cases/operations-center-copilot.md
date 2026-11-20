---
sidebar_position: 2
description: GUARDIAN's operations-center co-pilot demonstrator with Hyperfy (GOC) — efficient small-language-model (SLM) deployment on CPU-first edge and VPS infrastructure, to be demonstrated in one bounded physical-security scenario.
---

# Operations-Center Co-Pilot

**Validation partner:** [Hyperfy](https://hyperfy.tech/) (GOC) ·
**Status:** in progress · **Report:** D4, planned for November 2026

This use case is designed to demonstrate transfer of the GUARDIAN toolkit
and benchmark to a structurally different context: an operations-center
co-pilot that surfaces relevant information from operational feeds to a
human operator in a physical-security setting. It is one bounded demonstrator, built on
the same toolkit and benchmark as the energy-sector validation.

## Efficient SLM deployment

With Hyperfy (GOC), GUARDIAN is working on **efficient deployment of
small language models (SLMs)**: running small models on CPU-first edge
and VPS infrastructure, to be demonstrated in one bounded co-pilot
scenario for a physical-security operations center; the benchmark is designed to
measure the resources this takes. This is a demonstrator, not a
deployment in a partner's live operations center. Candidate tasks
include alarm clustering, false-alarm review, event summarization,
incident-note drafting and response-queue explanation.

## Data

The demonstrator uses metadata, derived events, anonymized examples or
synthetic scenarios. Raw security media is used only with written
approval.

One set of examples from this pilot is public: 19 camera frames of
alerts that were tagged as false alarms, cropped to remove the text
strips and published with written permission under the CC BY-NC 4.0
licence as the
[GUARDIAN Second Opinion Dataset 1, public subset](https://huggingface.co/datasets/ratio1/guardian_second_opinion_ds_1_public).
The 19 frames were selected to show no person and no readable number
plate, name or logo. No other security media, dispatch logs or incident
records are published.

## Boundaries

This use case is **advisory-only**. It does not perform biometric
identification of any kind, does not take automated enforcement actions,
does not dispatch interventions, and does not control live assets. Its
output is information for a human operator to review and act on, not an
autonomous control signal.

Measured results for this use case will be published on
[Results & Downloads](../results/index.md) once approved for release.
