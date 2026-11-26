# Deployment

The site at <https://edge-guardian.eu> runs on the Ratio1 network as a
**Worker App Runner (WAR)** job created with Deeploy. The job clones this
repository into a container, installs the server's package, checks the
committed build and serves the site on port 3000. A Cloudflare tunnel
publishes that port at the public hostname.

## How the site is built and started

The site is built ahead of time. The folder `build/` is produced by
`npm run build:site` and committed with the sources; the node never builds
the site. The job's three commands do this:

| Command | What it does on the node |
| --- | --- |
| `npm install` | Installs only the run-time package of the server (`serve-handler`) and its own dependencies. The project's `.npmrc` sets `omit=dev`, so none of the Docusaurus, React, TypeScript or search packages are installed, as long as the environment does not set `include=dev` (for example `npm_config_include=dev`). |
| `npm run build` | Runs `scripts/prebuilt.mjs`, which checks that `build/` is whole: `build/build-manifest.txt` lists every built file with its size and SHA-256, and the check fails if a listed file is missing or changed, or if `build/` holds a file the manifest does not list. `build/` must be a real directory and every file in it a regular file: a symbolic link anywhere under it fails the check before anything is read through it. It reads nothing else (not the sources, `package.json` or `package-lock.json`), prints one line and ends in a fraction of a second. It never builds. |
| `npm start` | Starts the supervisor and the server (see below). |

What a failed check does is decided by the job runner, not by this
repository. A failed `npm run build` must be assumed to keep the site down,
so the check is made to fail only when the committed files themselves are not
whole. The two ways a build can be wrong are caught in different places:

- The sources were changed without a rebuild of `build/`. The node cannot
  see this and serves the old build. CI catches it, and so does
  `npm run verify` before a push (see below).
- A built file was altered, lost or added after the build. The manifest check
  on the node fails.

The one-CPU Docker test (512 MB, started from a fresh clone) reached HTTP 200
in about 7 seconds (6.2 to 7.4 seconds over the runs made), compared with about 100 seconds for the previous flow
of full install and full build. Of those seconds, about 5 are `npm install`
(a download of a dozen small packages), under half a second is the
`npm run build` check, and about one second is the clone and the server. These
are measurements in Docker, not the node's own times. On the Edge Node, use
the first successful `GET /` to establish readiness. Before this change the
site was unavailable for four to six minutes after each restart of the node.

To change the site, edit the sources and commit them, run `npm run clear` and
`npm run build:site` (after `npm ci --include=dev`), and commit the sources and
`build/` together. `build:site` refuses to run unless the inputs in the working
folder are exactly the committed ones, because untracked, ignored or modified
files would enter the build but not the
clean checkout. It writes `build/source-stamp.txt` (a checksum of the inputs
computed from the committed blob ids, so line endings and local files cannot
change it; the inputs are `docs/`, `blog/`, `src/`, `static/`, the Docusaurus
configuration, `sidebars.ts`, `tsconfig.json`, `package.json` and
`package-lock.json`) and then the manifest. The stamp is not read on the node.

Docusaurus can write one internal setting in a different order when it reuses
its working folder, which changes the names of a few generated files; the
site configuration now lists those defaults itself in a fixed order, and
`npm run clear` before a build removes the remaining cause.

**Before every push.** A push to `main` is published at once, so run the
checks first, on the commit you are about to push. On a host with Docker and
no npm, run `bash scripts/verify-in-docker.sh` (the same as
`npm run verify:docker`). It makes a fresh checkout of the exact commit inside
a clean Node.js 22 container, so files that are only in your working folder
take no part, and runs `npm run verify` there: install with the development
packages, type check, tests, a rebuild from the commit that must reproduce
the committed `build/` exactly, the checks of the stamp (computed from the
committed blob ids of the inputs) and the manifest, and then the node's own
commands in a clean clone (plain `npm install` whose result must be exactly the
production tree of the committed lock file, `npm run build`, `npm start` and
the smoke checks of CI). The same checks run in CI on every pull request and
every push.

## What gets deployed

- **Branch `main` is the deployed branch.** The job checks the branch for new
  commits about once a minute. When it sees one, it replaces the running
  container: fresh clone, `npm install`, `npm run build`, `npm start`.
- **Every push to `main` is published.** The new commit is picked up within
  a minute or two (longer if GitHub rate-limits the runner). On the Edge Node, the first
  `GET /` that returns HTTP 200 confirms the replacement is ready.
- Propose changes through pull requests against `main`. The CI workflow runs
  on every pull request, so a change can be checked and seen to start before
  it is merged and published. CI on a push to `main` runs only after the
  push has been published.

## Edge Node line in the footer

The footer of every page can show one more line, below the licence line:
"Running on Ratio1 low-resource edge-node" followed by a node id. The built
pages hold only an empty, hidden paragraph for it. The server reads the id
when it starts, from the `R1EN_HOST_ID` environment variable that the node's
runner sets in the job container, and answers `GET /node-line.json` with
`{"running_on": "Running on Ratio1 low-resource edge-node <id>"}`, or with
`{"running_on": null}` when there is no valid id. A small script of the site
(`src/clientModules/nodeLine.mjs`) requests that file from the same origin and
puts the sentence into the paragraph as plain text. It asks again on every
page change, drops an answer that arrives after the visitor has moved on, and
clears and hides the paragraph when there is no line or the request fails.
Without JavaScript, or when there is no id, no line is shown. `EE_HOST_ID`, the older name for the
same value, is read if the first is not valid. The first of the two that is
valid is used. Valid means 1 to 64 characters of the ASCII letters A-Z and
a-z, the digits 0-9, `.`, `_` and `-`. A local or CI run sets neither
variable and shows no line. The server reads the node id once, when it starts, so the line always names
the node on which the site is currently running. The committed build contains
no node id and does not depend on any node.

The words "low-resource" are the project's term for the nodes the site is
meant to run on: Ratio1 Edge Nodes of the low-power class named in the
project proposal (2 to 8 cores, 8 to 16 GB of memory). The server does not
check the node's size. Whoever moves the job to another node checks that the
node is of that class.

## Recommended job settings

Apply these in the job's settings in the Deeploy console.

| Setting | Value |
| --- | --- |
| Repository | `https://github.com/Ratio1/GUARDIAN-ELIAS-pub` |
| Branch | `main` |
| Target node | One named node, with auto-assignment off |
| Image | `node:22` |
| Commands | `npm install`, `npm run build`, `npm start` (the WAR defaults; see above for what each does) |
| Container port | `3000` |
| CPU | 1 |
| Memory | 512 MB works; 1 GB recommended for headroom |
| Health check | HTTP `GET /` on port `3000` |

- **Commands.** The WAR default commands work as they are. If the job is ever
  edited, prefer `npm ci` over `npm install`: it installs exactly what
  `package-lock.json` records and fails instead of silently resolving
  different versions. The `.npmrc` keeps the development packages out of both.
- **Memory.** The running site (npm, supervisor and server together) uses
  about 40 MB, and installing the server's single package needs little
  memory, so 512 MB is ample. Building the site, on a development machine or
  in CI, peaks at about 400-420 MB in a 512 MB container with one CPU and no
  swap, and grows with the amount of content.
- **Health check.** Configure an HTTP endpoint check on path `/` and port
  `3000`. The site answers a few seconds after the container has started in
  Docker tests; let the probe run until it succeeds (timeout `0`, or at least a few
  minutes) rather than using a short fixed timeout, so the tunnel is not
  opened in front of a container that is still starting. Health probes from
  the runner are plain local HTTP requests, so they are never redirected and
  get a direct `200` once the server is up (see the redirect rule below).

## What the production server does

`npm start` (and `npm run serve`) runs `scripts/supervise.mjs`, which starts
`scripts/server.mjs` and keeps it running.

- **Node line.** Answers `GET /node-line.json` (see above) with a short JSON
  body, `Cache-Control: no-store`, and the same security headers as every
  other response. The content security policy needs no change for it: it
  already allows requests to the site's own origin (`connect-src 'self'`) and
  to nothing else.
- **Static serving.** Serves `build/` with the same URL behaviour as
  `docusaurus serve`: clean URLs, no directory listings, and the site's own
  404 page with status `404` for unknown paths. It listens on `0.0.0.0:3000`;
  set `PORT` (and optionally `HOST`) to change that. Only `GET` and `HEAD`
  are accepted.
- **Request paths.** A request whose path contains a `..` segment, also when
  it is percent-encoded (for example `%2e%2e`), is answered with
  `400 Bad Request` before any file is looked up.
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
- **Caching.** The content-hashed files that Docusaurus writes under
  `/assets/` are sent with `Cache-Control: public, max-age=31536000,
  immutable`. The server lists those files in `build/assets/` at startup and
  matches the decoded, normalised request path against that list, so no
  other file is ever cached as immutable. Everything else that the file
  handler serves (HTML pages, images in `/img/`, the search index, feeds, the
  sitemap and the 404 page) is sent with `Cache-Control: no-cache` and a
  `Last-Modified` date, so browsers check with the server before reusing a
  copy and always see the current version.
  The server's own `400` (rejected path), `405` (method not allowed) and `301`
  (HTTPS redirect) answers are sent with `Cache-Control: no-store` and no
  `Last-Modified`. As with `docusaurus serve`, no `ETag` is sent and every
  request gets the full file rather than `304 Not Modified`.
- **HTTP to HTTPS.** When the Cloudflare `CF-Visitor` request header reports
  that the visitor used plain HTTP and the request's `Host` is one of the
  site's own hostnames, the server answers `301 Moved Permanently` with
  `Location: https://<same host><path>`. The hostnames come from the
  `CANONICAL_HOSTS` environment variable (comma-separated, default
  `edge-guardian.eu,www.edge-guardian.eu`); requests for any other host are
  served without a redirect. An invalid value makes the server refuse to
  start, with an error in the job log. The redirect is triggered only by
  that header: requests without it (local requests, the runner's health
  check) are served directly, so there is no redirect loop behind the
  tunnel. `X-Forwarded-Proto` is not trusted on its own.
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
and on every pull request. It installs every package
(`npm ci --include=dev`), runs `npm run typecheck` and `npm test` (the node id
rules and the footer script, tested with a fake page and a fake request), and
then rebuilds the site from the clean checkout. The rebuild must reproduce the
committed `build/` exactly: no file changed, missing, added or dropped by
`.gitignore`. Then it checks the source stamp and the manifest, that the built
pages hold no node line, and that the footer paragraph and the script that
fills it use the same name.

Next it simulates the node: a clean clone of the commit, a plain
`npm install` whose result must be exactly the production tree of the lock
file (`scripts/check-installed.mjs`), `npm run build` (which must report that
there is nothing to build) and `npm start`. Against that process it
smoke-tests the headers, the 404 page, rejected `..` paths, caching, the HTTPS
redirect and `/node-line.json`. The node line is then checked for four
environments (no id, an invalid id, `EE_HOST_ID` alone, and both variables set),
each in a fresh server with both variables unset beforehand. Last,
`scripts/check-fd-leak.mjs` sends repeated conditional requests and aborted
downloads to the server and fails if its count of open file descriptors grows.
The workflow uses the Node.js version in `.nvmrc`, and its third-party actions
are pinned to full commit SHAs.

To make CI a gate for `main`, require it as a status check on pull requests
in the repository's branch settings; the checks cannot stop a push that
bypasses them.

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
- Building the site, committing `build/` and serving the site need no
  credentials. The only secret in the job is the Cloudflare tunnel token in its
  tunnel settings; never commit it, and do not add a GitHub token or other
  credentials to the job.
