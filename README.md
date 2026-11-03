# GUARDIAN — Public Wiki

This repository is the public dissemination site for GUARDIAN: a project
by Naeural SRL (Ratio1) delivering a reusable toolkit and benchmark for
resource-aware operational AI on commodity edge and low-end VPS
infrastructure. It is a [Docusaurus](https://docusaurus.io/) v3 site
(wiki + news blog), deployed on the Ratio1 network.

Everything in this repository is public once pushed.

## Publication boundaries

- The current project-status line lives in `src/components/FundingStatus.tsx`.
  Render that component wherever the current status is shown instead of
  restating it, and update the wording there only.
- Use the standard funding acknowledgement from
  `src/components/FundingAcknowledgement.tsx` (news posts carry the same
  wording inline). Grant agreement No. 101120237 belongs to ELIAS, the parent
  Horizon Europe project; always attribute it to ELIAS.
- Describe GUARDIAN's link to ELIAS as reuse and handover of results, never as
  integration into, certification against, or deployment inside ELIAS
  systems.
- Do not publish budget, payment or other contract details beyond the funding
  acknowledgement and the project period (1 July to 31 December 2026).
- The validation partners MONSSON and Hyperfy (GOC) may be named when
  describing their validation scenarios. Partner logos, quotes, interface
  captures, client imagery and operational data need explicit approval for
  each use.
- Do not publish names, photos or quotes of individuals without their
  written approval.
- The site footer shows, on every page, the European Union emblem with the
  statement "Funded by the European Union" and the funding disclaimer, as
  the funding rules require. Use the official emblem file
  (`static/img/eu-emblem-funded-by-the-eu.png`) unmodified: keep it
  distinct and separate, do not combine it with other marks, text or
  links, use no other logo to highlight EU support, and show it at least
  as prominently as any other logo displayed with it. Keep the disclaimer
  wording unchanged.
- Do not add any other third-party logo or mark without explicit approval
  for that use.
- Describe work in progress as in progress. Do not claim measured results,
  completed validation, targets met, a reached TRL or partner deployments
  until the evidence is released. TRL wording: baseline TRL 4, targeting
  TRL 5.
- Report environmental aspects as measured resource indicators only; no
  carbon-reduction or similar environmental claims without a defensible
  method.
- Publish only synthetic, anonymized, aggregated or partner-approved derived
  data. Link or embed only artifacts approved for public release.
- Keep use cases advisory-only: no live asset control, automated enforcement,
  live dispatch or biometric identification.

## Local development

Node.js 22 is expected (see `.nvmrc`; `engines.node` in `package.json`
allows `>=22 <25`).

```bash
npm ci
npm run dev        # development server with live reload (localhost:3000)
npm run build      # production build into build/
npm start          # production server for build/ on 0.0.0.0:3000
npm run typecheck
```

`npm start` and `npm run serve` are the same command: the production server
used on the live site, with its security headers, caching rules and automatic
restart. Set `PORT` to use a different port.

## Branch model

- `main` is the working branch **and** the deployed branch. The Ratio1
  Deeploy Worker App Runner job tracks `main`, so every push to `main` is
  published, usually within a few minutes.
- Make changes on a separate branch and open a pull request against `main`;
  the CI workflow builds every pull request. Merge only reviewed changes.
- To undo a published change, revert the commit on `main` (see `DEPLOY.md`).

See `DEPLOY.md` for the deployment, server and monitoring details.
