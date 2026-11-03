# GUARDIAN — Public Wiki

This repository is the public dissemination site for GUARDIAN: a project
by Naeural SRL (Ratio1) delivering a reusable toolkit and benchmark for
resource-aware operational AI on commodity edge and low-end VPS
infrastructure. It is a [Docusaurus](https://docusaurus.io/) v3 site
(wiki + news blog), deployed on the Ratio1 network.

Everything in this repository is public once pushed.

## Publication boundaries

- Do not state or imply that project funding is in force, that an agreement is
  executed, or that a kickoff has occurred until an approved publication basis
  supports that statement.
- Use the centralized evaluation-status wording in
  `src/components/FundingStatus.tsx`. Change it only when an approved
  publication basis supports the new wording.
- Do not publish partner, mentor, or team-member names, photos, or quotes
  without written approval for that specific use.
- Do not add an EU emblem or funding-acknowledgement text until the applicable
  branding and acknowledgement obligations have been confirmed.
- Keep use-case descriptions sector-generic unless a named organization or
  product has been cleared for publication.
- Describe planned deliverable types without reproducing gated content. Link
  or embed only release-approved artifacts.
- Keep use cases advisory-only: no live asset control, automated enforcement,
  or biometric identification.

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
