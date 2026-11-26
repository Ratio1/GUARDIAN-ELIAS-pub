# GUARDIAN — Public Wiki

This repository is the public dissemination site for GUARDIAN: a project
by Naeural SRL (Ratio1) delivering a reusable toolkit and benchmark for
resource-aware operational AI on commodity edge and low-end VPS
infrastructure. It is a [Docusaurus](https://docusaurus.io/) v3 site
(wiki + news blog), deployed on the Ratio1 network.

Everything in this repository is public once pushed.

## Publication boundaries

- `src/components/FundingStatus.tsx` holds the canonical project-status
  wording (support through the ELIAS 2nd FSTP Open Call, the call ranking
  and the project period). The landing page, the Evaluation Result page and
  the open-call news post render it. The support statement and the project
  period are also restated on the About, Objectives, Expected Outputs,
  What is ELIAS?, The 2nd Open Call & FSTP, Work Plan and Deliverables
  pages and in the news posts; when the status changes, update the
  component and all of these together.
- Use the standard funding acknowledgement from
  `src/components/FundingAcknowledgement.tsx` (news posts carry the same
  wording inline). Grant agreement No. 101120237 belongs to ELIAS, the parent
  Horizon Europe project; always attribute it to ELIAS.
- Describe GUARDIAN's link to ELIAS as reuse and handover of results, never as
  integration into, certification against, or deployment inside ELIAS
  systems.
- Do not publish budget, payment or other contract details beyond the funding
  acknowledgement, the project period (1 July to 31 December 2026) and the
  effort figure already published in the August 2026 article.
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
  wording unchanged. When the node's environment gives a valid node id, the
  footer also shows a text line with that id below the licence line, never
  next to the emblem (see `DEPLOY.md`). The node's id is published on purpose.
  No other detail of the node is published: not its address, not its
  resources, not the tunnel's settings.
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
allows `>=22 <25`). Install every package, the development packages
included, with `npm ci --include=dev`. The project's `.npmrc` leaves them out
of a plain `npm install`, which is what the job on the node runs.

```bash
npm ci --include=dev
npm run dev          # development server with live reload (localhost:3000)
npm run build:site   # the real build: writes build/ with its stamp and manifest
npm run build        # only checks that the committed build/ is whole
npm start            # production server for build/ on 0.0.0.0:3000
npm run typecheck
npm test
npm run verify:docker  # every check below, on the commit, in a clean container
```

`npm start` and `npm run serve` are the same command: the production server
used on the live site, with its security headers, caching rules and automatic
restart. Set `PORT` to use a different port.

## Changing content: the built site is committed

The site is built ahead of time, and the result, the folder `build/`, is
committed to this repository. The node that runs the site installs only the
server's own package and does not build anything, which lets it start in
seconds. To change anything that appears on the site (pages, news posts,
components, styles, static files, configuration, package versions):

1. edit the sources and commit them;
2. run `npm run clear` and then `npm run build:site` (after
   `npm ci --include=dev`);
3. commit the updated `build/` with the sources, in the same pull request.

`npm run clear` removes Docusaurus's working folder. Docusaurus can write one
internal setting in a different order when it reuses that folder, which
changes the names of a few generated files without changing the site; a build
made after `npm run clear` is identical to one made from a fresh clone.
`npm run build` only checks the committed build; it does not rebuild the site.
The files in `build/` are generated: never edit them by hand.

`npm run build:site` also writes two files into `build/`:
`source-stamp.txt`, a checksum of the sources as committed, and
`build-manifest.txt`, which lists every built file with its size and SHA-256.
The node uses only the manifest, to check that `build/` is whole.
The stamp and a full rebuild are checked in CI. Before a push, run
`bash scripts/verify-in-docker.sh` (also `npm run verify:docker`) on a host
with Docker and no npm. It checks out the exact commit inside a clean
container and runs `npm run verify` there: type check, tests, a rebuild from
the committed sources that must reproduce the committed `build/` exactly, the
stamp and the manifest, and the node's own commands (`npm install`,
`npm run build`, `npm start`) in a clean clone with the smoke checks of CI.

A push to `main` is published at once. Run `bash scripts/verify-in-docker.sh` and fix
what it reports before pushing, and use a pull request, so that CI has run
before the change is merged.

## Branch model

- `main` is the working branch **and** the deployed branch. The Ratio1
  Deeploy Worker App Runner job tracks `main`, so every push to `main` is
  published, usually within a few minutes.
- Make changes on a separate branch and open a pull request against `main`;
  the CI workflow checks and tests every pull request, including that
  a rebuild from its sources reproduces the committed `build/`. Merge only reviewed changes.
- To undo a published change, revert the commit on `main` (see `DEPLOY.md`).

See `DEPLOY.md` for the deployment, server and monitoring details.
