---
sidebar_position: 1
---

# What is GUARDIAN?

GUARDIAN is a 6-month project run by Naeural SRL (Ratio1) to deliver a
reusable toolkit and benchmark for **resource-aware operational AI** on
commodity edge nodes and low-end VPS infrastructure. The project tests
CPU-first, smaller-model serving as an alternative to large centralized
models for operational monitoring workloads — the kind of continuous,
always-on inference that watches a process or a site and flags what a human
should look at.

The premise is simple: most operational monitoring does not need a
data-center GPU. It needs a model that is small enough to run close to the
data, on hardware that is already there, at a cost and energy footprint that
make continuous use practical. GUARDIAN builds the toolkit and the common
benchmark protocol needed to measure whether a given model/workload pairing
actually works at that scale — and to compare execution profiles across
edge, VPS, local server, and central/cloud consistently.

See [Objectives](./objectives.md) for the five goals GUARDIAN is working
toward, and [Expected Outputs](./outputs.md) for what the project intends to
publish.
