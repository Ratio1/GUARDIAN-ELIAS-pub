# Deployment

The site at <https://edge-guardian.eu> runs on the Ratio1 network as a
**Worker App Runner (WAR)** job created with Deeploy. The job clones this
repository into a container, installs dependencies, builds the site, and
serves it on port 3000. A Cloudflare tunnel publishes that port at the public
hostname.

## What gets deployed

- **Branch `main` is the deployed branch.** The job checks the branch for new
  commits about once a minute. When it sees one, it replaces the running
  container: fresh clone, `npm install`, `npm run build`, `npm start`.
- **Every push to `main` is published.** The new commit is picked up within
  about a minute and is live once the rebuild finishes (typically 2–4 minutes
  on one CPU). The site is unavailable while the replacement container
  installs and builds.
- Propose changes through pull requests against `main`. The CI workflow runs
  on every pull request, so a change can be reviewed and seen to build before
  it is merged and published.

## Job settings

| Setting | Value |
| --- | --- |
| Repository | `https://github.com/Ratio1/GUARDIAN-ELIAS-pub` |
| Branch | `main` |
| Image | `node:22` |
| Commands | `npm install`, `npm run build`, `npm start` (the WAR defaults) |
| Container port | `3000` |
| CPU | 1 |
| Memory | 512 MB works; 1 GB recommended for headroom |
| Health check | HTTP `GET /` on port `3000` |

- **Commands.** The WAR default commands work as they are. If the job is ever
  edited, prefer `npm ci` over `npm install`: it installs exactly what
  `package-lock.json` records and fails instead of silently resolving
  different versions.
- **Memory.** In a 512 MB container with no swap and one CPU, both
  `npm install` and `npm run build` peak at about 400–420 MB of process
  memory, and the running site (npm, supervisor and server together) uses
  about 40 MB, so 512 MB is enough for the current site. Build memory grows
  with the amount of content; if a build is ever killed for lack of memory
  (the job log shows `Killed` and the site stays down), raise the job to
  1 GB.
- **Health check.** Configure an HTTP endpoint check on path `/` and port
  `3000`. Because the first build can take several minutes, let the probe run
  until it succeeds (timeout `0`, or at least 10 minutes) rather than using a
  short fixed timeout, so the tunnel is not opened in front of a
  still-building container. Health probes from the runner are plain local
  HTTP requests, so they are never redirected and get a direct `200` once
  the server is up (see the redirect rule below).

## What the production server does

`npm start` (and `npm run serve`) runs `scripts/supervise.mjs`, which starts
`scripts/server.mjs` and keeps it running.

- **Static serving.** Serves `build/` with the same URL behaviour as
  `docusaurus serve`: clean URLs, no directory listings, and the site's own
  404 page with status `404` for unknown paths. It listens on `0.0.0.0:3000`;
  set `PORT` (and optionally `HOST`) to change that. Only `GET` and `HEAD`
  are accepted.
- **Security headers** on every response, including redirects and 404s:
  - `Strict-Transport-Security: max-age=86400` (one day, see below);
  - `Content-Security-Policy`: only same-origin scripts, styles, images,
    fonts, connections and workers, plus `data:` images and fonts and inline
    styles. The few inline scripts that Docusaurus generates are allowed by
    their SHA-256 hashes, which the server computes from `build/` at startup,
    so the policy follows content and theme changes automatically.
    `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
    `form-action 'self'`;
  - `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`,
    `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, and a
    `Permissions-Policy` that disables camera, microphone, geolocation,
    payment and USB access.
- **External resources.** Because of the Content-Security-Policy, pages
  cannot load scripts, styles, images, fonts, iframes or other resources
  from other origins. Commit images and other files to the repository
  instead. Embedding third-party content requires a reviewed change to the
  policy in `scripts/server.mjs`.
- **Caching.** Files under `/assets/` have content-hashed names and are sent
  with `Cache-Control: public, max-age=31536000, immutable`. Everything else
  (HTML pages, images in `/img/`, the search index, feeds, the sitemap, 404
  and error responses) is sent with `Cache-Control: no-cache` and an `ETag`,
  so browsers revalidate and always see the current version.
- **HTTP to HTTPS.** When the Cloudflare `CF-Visitor` request header reports
  that the visitor used plain HTTP, the server answers
  `301 Moved Permanently` with `Location: https://<host><path>`. The
  redirect is triggered only by that header: requests without it (local
  requests, the runner's health check) are served directly, so there is no
  redirect loop behind the tunnel. `X-Forwarded-Proto` is not trusted on its
  own.
- **Supervision.** If the server process exits for any reason (crash, port
  already in use, missing build output, killed by the system), the
  supervisor logs the exit and starts it again after a short backoff (1 s,
  doubling up to 10 s; reset after a minute of healthy running). The
  supervisor exits only when it is sent `SIGTERM` or `SIGINT`. The job
  runner checks the server only when the container starts, so this restart
  loop is what keeps the site up afterwards.

### Raising the HSTS lifetime

HSTS starts at one day so that a problem with HTTPS can be corrected
quickly. Once HTTPS has been reliable for a few weeks, raise it in steps by
changing the default `HSTS_MAX_AGE` in `scripts/server.mjs` (for example to
`2592000`, 30 days, then `31536000`, one year) through a pull request. The
same value can be overridden temporarily with the `HSTS_MAX_AGE` environment
variable in the job. Add `includeSubDomains` only after every subdomain of
`edge-guardian.eu` is served over HTTPS, and add `preload` only when
deliberately submitting the domain to browser preload lists, which is hard to
undo.

## Uptime monitoring

The `Uptime` workflow (`.github/workflows/uptime.yml`) runs every 15 minutes
and can also be started by hand from the repository's Actions tab. It
checks that:

- `https://edge-guardian.eu/` and `https://edge-guardian.eu/docs/about/`
  return `200` with a rendered Docusaurus page and an HSTS header;
- `http://edge-guardian.eu/docs/about/` returns `301` to the HTTPS URL.

Each run retries for about five minutes before failing, so a routine
redeploy does not raise an alarm. A failed run produces GitHub's standard
failed-workflow notification; for scheduled workflows GitHub sends it to the
person who last changed the schedule in the workflow file. GitHub pauses
scheduled workflows in public repositories after 60 days without repository
activity; re-enable the workflow from the Actions tab if that happens.

## Continuous integration

The `CI` workflow (`.github/workflows/ci.yml`) runs on every push to `main`
and on every pull request: `npm ci`, `npm run typecheck`, `npm run build`,
and a smoke test of the production server (headers, 404 and the HTTPS
redirect). It uses the Node.js version in `.nvmrc`.

## Rolling back

To undo a bad change, revert it on `main`:

```bash
git revert <commit>        # or a range: git revert <oldest>^..<newest>
git push origin main
```

The job picks up the revert like any other commit and redeploys the previous
content. Do not rewrite or force-push `main` to roll back; a revert keeps
the history intact and is published the same way.

## Repository hygiene

- Everything pushed to `main` is public and goes live; review changes in a
  pull request first.
- No credentials or secrets are needed to build or serve this site; do not
  add any to the repository or to the job configuration.
