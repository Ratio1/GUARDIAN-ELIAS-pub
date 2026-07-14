# Deployment (Ratio1 Worker App Runner)

This site is deployed on the Ratio1 network via Deeploy, using a
**Worker App Runner (WAR)** job. A WAR job git-clones this repository into
a container, runs a build command sequence, and serves the result behind a
tunnel, redeploying on new commits to the tracked branch.

## Job configuration

- **Repository:** `https://github.com/Ratio1/GUARDIAN-ELIAS-pub`
- **Branch:** `release` — never point deployment at `main`. `main` is the
  working branch; `release` only receives reviewed merges.
- **Image:** `node:22`
- **Commands:**
  1. `npm ci`
  2. `npm run build`
  3. `npm run serve`

  The third command **must** be `npm run serve`, not the default `npm
  start`: `npm start` runs the Docusaurus dev server, which binds
  `localhost` and will not be reachable through the tunnel. `npm run
  serve` in this repository is configured to bind `0.0.0.0:3000`
  explicitly.
- **Port:** `3000`

## Health check

Configure an HTTP endpoint health check against `/` on port `3000` before
exposing the tunnel, so a failed or still-building deployment is not
served to visitors as if it were healthy. Prefer a check that polls until
success rather than a short fixed timeout, since the first build of a
Docusaurus site can take longer than a typical readiness window.

## Repository hygiene

- Keep `release` protected against direct pushes; it should only advance
  via reviewed merges from `main`.
- No credentials or secrets are needed to build or serve this site; do
  not add any to the deployment configuration.
