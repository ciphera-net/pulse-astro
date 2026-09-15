# Releasing @ciphera-net/astro-pulse

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

## ⛔ Known blocker (15-09-2026)

`NPMJS_TOKEN` in the workspace `.env` is a **granular** token. `npm whoami`
returns `uz1mani` and `npm token list` types it "Publish", but it is scoped to
specific existing packages: every account-level call 403s
(`npm org ls`, `npm access list packages`) and publishing a **new** package name
returns `404 Not Found - PUT .../@ciphera-net%2fastro-pulse`. A 404 on PUT with a
working `whoami` is the signature of a package-scoped token, not a wrong password.

`uz1mani` **is** the maintainer of `@ciphera-net/tessera` on npmjs, so the
account can publish into the scope — only this token cannot create a new package
in it.

**To unblock:** issue an npm granular access token with write access to the whole
`@ciphera-net` scope (or "All packages"), and replace `NPMJS_TOKEN` in `.env`.

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
6. Confirm: `npm view @ciphera-net/astro-pulse version` against **each** registry
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
Woodpecker, not a step-level one, and zero steps run. Add the secret first, then
the pipeline. Woodpecker repo id is **68**.
