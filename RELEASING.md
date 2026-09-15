# Releasing @ciphera-net/pulse-astro

The Astro directory (`astro.build/integrations`) has **no submission form, no
review and no fee**. It is a weekly crawl of npm for packages carrying the
`astro-integration`, `astro-component` or `withastro` keyword, reading `name`,
`description`, `repository` and `homepage` straight from `package.json`. So
**publishing to npm IS the listing** — there is nothing else to submit.

A custom logo or an overridden description is the one curated part: open an
issue at `withastro/astro.build` (or PR `scripts/integrations.json`). Optional.

## 🔴 Publish to BOTH registries

`npm routes a registry per SCOPE, never per package.` Every Ciphera frontend's
`.npmrc` maps `@ciphera-net` to GitHub Packages because Facet and friends are
private and live there — and that one line also captures this package. A public
`@ciphera-net` package that exists only on npmjs is **uninstallable from any
estate machine**, and the error it produces is `No matching version found`,
which reads like a wrong version rather than a wrong registry.

This bit `@ciphera-net/tessera`: GitHub Packages froze at 0.1.3 while npmjs had
0.2.1, and two frontends pinned `"0.1.3"` — not a considered pin, the ceiling of
the registry they were pointed at.

⚠️ **The machine's `~/.npmrc` points `@ciphera-net` at GitHub Packages, so a bare
`npm publish` goes to the WRONG registry.** Always pass `--registry` and an
explicit `--userconfig`.

```bash
# 1. public npmjs — this is the one the Astro directory crawls
umask 077; NPMRC=$(mktemp)
printf '//registry.npmjs.org/:_authToken=%s\n@ciphera-net:registry=https://registry.npmjs.org/\n' "$NPMJS_TOKEN" > "$NPMRC"
npm publish --registry=https://registry.npmjs.org --access public --userconfig "$NPMRC"

# 2. GitHub Packages — so the estate can install it
printf '//npm.pkg.github.com/:_authToken=%s\n@ciphera-net:registry=https://npm.pkg.github.com/\n' "$GH_NPM_WRITE_TOKEN" > "$NPMRC"
npm publish --registry=https://npm.pkg.github.com --userconfig "$NPMRC"

rm -f "$NPMRC"
```

Never put a token on a command line; write it to a `umask 077` file and delete
it afterwards.

## Published (15-09-2026)

`@ciphera-net/pulse-astro` is live on **both** registries. Confirm a release
against each one explicitly — a single `npm view` answers from whichever registry
the scope happens to be mapped to.

### ⏳ npmjs takes about four minutes to become readable

A successful `npm publish` prints `+ @ciphera-net/pulse-astro@1.0.0` and exits 0
**before the packument is fetchable**. Measured on 15-09-2026: `GET
registry.npmjs.org/@ciphera-net%2fpulse-astro` returned **404 for 220 seconds**
and 200 at **t+240s** — and an *authenticated* read 404s just the same, so it is
not a public-CDN artefact. **Do not read an early 404 as a failed publish.** Poll
for a few minutes before concluding anything.

### 🔴 A granular token cannot unpublish

`npm unpublish` returns, verbatim:

> `403 Forbidden - DELETE … Granular access tokens that bypass two-factor
> authentication may not perform this action.`

`npm deprecate` **does** work with the same token. So a granular token can
publish and deprecate but never delete; removing a package needs 2FA, i.e. the
npm website or a classic token. Same shape on GitHub Packages, which answers
`You need at least delete:packages and read:packages scopes` — the estate's
`NODE_AUTH_TOKEN` carries only `write:packages`.

### The name was `astro-pulse` first

1.0.0 shipped briefly as `@ciphera-net/astro-pulse` before being renamed to match
the repo and the estate's `pulse-*` convention. The old name is **deprecated** on
npmjs pointing at this one, and awaits deletion by the owner on both registries.
🔑 **It matters that it is deleted, not merely deprecated**: astro.build's
directory crawls npm for the `astro-integration` keyword, and the old package
still carries it — left in place, the directory would list **two** Pulse
Analytics integrations.

## Release steps

1. Bump `version` in `package.json`.
2. Merge to `main`. `.woodpecker/test.yml` runs on the PR **and** on the push:
   typecheck, tests, a test-count floor, build, and a zero-runtime-dependency
   assertion.
3. Tag: `git tag -a vX.Y.Z -m "Release X.Y.Z" && git push origin vX.Y.Z`.
4. `npm pack --dry-run` and check the tarball is LICENSE, README, `dist/` and
   `package.json` — nothing else. `prepack` rebuilds `dist/`, which is
   gitignored, so a fresh clone cannot ship an empty package.
5. Publish to both registries (above).
6. Confirm: `npm view @ciphera-net/pulse-astro version` against **each** registry
   explicitly. A single `npm view` answers from whichever registry the scope is
   mapped to and will happily report the other one's version.
7. The astro.build listing follows within about a week, on its own.

## Compatibility is measured, not assumed

`peerDependencies` claims `^5 || ^6 || ^7`. That range was verified on
15-09-2026 by building a real fixture site against each major and checking the
emitted HTML carried the tag and the right domain:

| Astro | build | tag emitted |
|---|---|---|
| 5.18.2 | ok | yes, `data-domain` correct |
| 6.4.8 | ok | yes, `data-domain` correct |
| 7.3.2 | ok | yes, `data-domain` correct |

Widening that range means running that check again, not editing the string.

## A CI release pipeline is deliberately NOT here yet

A `publish.yml` referencing a secret that does not exist would **halt the whole
pipeline, `test` included** — a missing secret is a pipeline-level error in
Woodpecker, not a step-level one, and zero steps run. Woodpecker validates every
referenced secret **against the event**, which is also what made tessera-ts's
`when: manual` clause dead: it referenced `build_cache_key`, an org secret not
allowed on `manual`, and the whole config failed.

So: add `npmjs_token` to repo **68** first, then copy
`Tessera/tessera-ts/.woodpecker/publish.yml` — it is the worked example, with a
step per registry, `test -n "$NODE_AUTH_TOKEN"` guards that fail loudly when a
secret is not injected, and an idempotent publish that tolerates a re-tag.
Release by **tagging**, not by a manual trigger.
