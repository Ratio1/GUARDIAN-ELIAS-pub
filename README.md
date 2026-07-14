# GUARDIAN — Public Wiki

This repository is the public dissemination site for GUARDIAN: a project
by Naeural SRL (Ratio1) delivering a reusable toolkit and benchmark for
resource-aware operational AI on commodity edge and low-end VPS
infrastructure. It is a [Docusaurus](https://docusaurus.io/) v3 site
(wiki + news blog), deployed on the Ratio1 network.

Everything in this repository is public once pushed.

## Local development

Node.js 22 is expected (see `.nvmrc`; `engines.node` in `package.json`
allows `>=22 <25`).

```bash
npm ci
npm start        # local dev server with live reload
npm run build    # production build into build/
npm run serve    # serve the production build (binds 0.0.0.0:3000)
npm run typecheck
```

## Branch model

- `main` — the working branch. All content and configuration changes land
  here first.
- `release` — the deployed branch. The Ratio1 Deeploy Worker App Runner
  tracks `release`, not `main`, so a push to `main` does not publish by
  itself; content reaches `release` only via a reviewed merge.

See `DEPLOY.md` for deployment notes.
