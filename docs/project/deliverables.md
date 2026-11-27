---
sidebar_position: 2
description: GUARDIAN's five deliverables, D1 to D5, with their planned timing in the July–December 2026 project period, and where D1 to D4 stand on 27 November 2026.
---

# Deliverables

GUARDIAN has five deliverables. Timing follows the project's work plan,
which runs from July to December 2026.

| Deliverable | Output | Due (work plan) |
|---|---|---|
| D1 | Benchmark protocol, data-contract specification, ethics/data-boundary plan and partner validation plan | July 2026 |
| D2 | Ratio1 resource-aware edge/VPS AI toolkit prototype and reproducible configuration notes | September 2026 |
| D3 | Primary validation report for the energy sector with MONSSON, and renewable-monitoring data package | November 2026 |
| D4 | Operations-center co-pilot demonstrator report with Hyperfy (GOC), and synthetic-example package | November 2026 |
| D5 | Final report, public summary, demo video and handover package | December 2026 |

## Where the project stands

This is the position on 27 November 2026, described for D1 to D4 by what
exists today. The benchmark has not yet been run in scored form, so no
benchmark result exists, and none is reported on this page. A scored run is
one whose answers are compared with a trusted record and counted.

**How the evaluation is designed.** The project adapts the evaluation design
set out in section 6.5.2 of ELIAS deliverable D3.3 (a document of the ELIAS
project, not of GUARDIAN). ELIAS is the Horizon Europe project through whose
open call GUARDIAN is supported. The design asks one narrow question at a
time, keeps the wording and the settings of every question fixed, repeats
each question, keeps a trusted record of the correct answer that the model
never sees, and counts non-answers.

**D1, benchmark protocol and plans (planned for July 2026, the first project
month).** The four documents that make up this deliverable are written: the
benchmark protocol, the template for a data contract, the ethics and
data-boundary plan, and the validation plan for the project's partners. They
are in final revision and have not yet been released. D1 was planned for July
2026 and is therefore behind its planned date.

**D2, the prototype (planned for September 2026, the third project month).**
The prototype runs small open models on a CPU, the main processor of a
computer, through llama.cpp, an open-source program for running such models
on modest hardware. A small, fixed test set was run completely on a
workstation as a trial of the prototype itself. The trial showed that the
whole chain works from the first question to the scored data package. On
26 November 2026 the same trial also ran to the end on a Ratio1 Edge Node,
where the job was limited to three processor cores and 12 GiB of memory, so
the prototype has now been run on two machines. The data package of that run has been checked and read by the project's scoring program on the workstation, without any problem reported. Both runs are trials of the
prototype, not benchmark results. The report on the prototype is written and
has not yet been released. D2 was planned for September 2026 and is also
behind its planned date.

**An online test app.** Since 26 November 2026 a small test app is online at
[app.edge-guardian.eu/app](https://app.edge-guardian.eu/app), served by the
prototype on the Ratio1 Edge Node. A visitor can put a question to one of two
small open models: whether an alert from a perimeter camera is genuine, or
whether an energy forecast is plausible. The app asks the model for a verdict and a one-sentence reason. If it cannot read the verdict, it marks the reply as unreadable and counts it. The reply is the model's own opinion, shown as it comes, and is not checked. The app uses public material only: the 19 published alert frames of
[the public dataset](https://huggingface.co/datasets/ratio1/guardian_second_opinion_ds_1_public),
in their annotated view, and invented forecast cases. It has three tabs: alert review (the kind of question planned for D4), forecast review (the kind of question planned for D3) and the state of the prototype on that machine (the subject of D2). The app handles one question at a time. Up to three more can wait, and the app accepts up to 30 questions an hour across all visitors.
An answer on the app is a test of the prototype. It is not a benchmark result and is kept apart from the benchmark's records. A single answer measures nothing about a model: every published alert was recorded as a false alarm, the forecast cases are invented, and one answer is one observation, not a count compared with a trusted record. The project does not run a benchmark campaign on this machine while the test app is enabled; for a campaign the app is taken offline, so it can be unavailable for some hours.

**D3, review of renewable-energy forecasts (planned for November 2026, the
fifth project month).** A set of 80 synthetic cases is ready. A synthetic
case is an invented example that contains no real data. The cases cover two
scenarios: forecasts of how much electricity a plant will generate, and
forecasts of a battery's state of charge, which describes how full the
battery is. No data from a partner has been received so far, so the first
results will rest on synthetic cases and will say so. The scored runs for D3
have not started.

**D4, review of alerts in an operations center (planned for November 2026,
the fifth project month).** The test material is a set of real alert frames,
that is, single camera images that raised an alert, recorded as false
alarms. Nineteen cropped frames from this set are published in
[the public dataset](https://huggingface.co/datasets/ratio1/guardian_second_opinion_ds_1_public).
The planned test will assess whether small models recognize and explain
alerts recorded as false alarms. It cannot show how they treat a genuine
alarm, because the set contains none. The scored runs for D4 have not
started.

Data packages contain only synthetic, anonymized, aggregated or
partner-approved derived examples. Some deliverable content, such as
partner data boundaries and operational details, is not intended for
public release. Deliverables and summaries approved for publication are
linked from [Results & Downloads](../results/index.md) when released.

See the [Work Plan](./work-plan.md) for the work packages behind each
deliverable.
