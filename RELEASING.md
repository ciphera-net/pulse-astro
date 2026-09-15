# Releasing @ciphera-net/pulse-astro

The Astro directory (`astro.build/integrations`) has **no submission form, no
review and no fee**. It is a weekly crawl of npm for packages carrying the
`astro-integration`, `astro-component` or `withastro` keyword, reading `name`,
`description`, `repository` and `homepage` straight from `package.json`. So
**publishing to npm IS the listing** — there is nothing else to submit.

### How the directory actually decides — read from its own config, 15-09-2026

`raw.githubusercontent.com/withastro/astro.build/main/scripts/integrations.json`
is the whole mechanism, and it is worth knowing rather than guessing:

| Key | What it does | Us |
|---|---|---|
| `keywords` | `astro-component`, `withastro`, `astro-integration` — a package needs one to be crawled at all | we carry **all three** ✅ |
| `categories` | `analytics` is keyed on the `analytics` keyword | we carry it → **Analytics** category ✅ |
| `blocklist` | 56 packages excluded by hand | we are **not** on it ✅ |
| `overrides` | 118 entries, per-package `image` / `description` / `homepageUrl` / `repoUrl` | none needed |
| `featured` | 18 hand-picked packages | not ours to ask for |

**So there is nothing to submit.** Publishing with the right keywords is the
entire listing, and `name`, `description`, `repository` and `homepage` are read
straight from `package.json` — which is why those fields are worth getting right
at publish time rather than after.

### When it actually appears — two jobs, and only one of them can add you

Read from `.github/workflows/` and `scripts/update-integrations.mjs`:

| Job | Schedule | Flag | What it does |
|---|---|---|---|
| `nightly.yaml` | `0 10 * * *` — **daily 10:00 UTC** | none | `safeUpdateExistingIntegrations()` — refreshes entries **already in the catalogue**. Commits straight to `main`. **It cannot add you.** |
| `weekly.yaml` | `0 12 * * Mon` — **Mondays 12:00 UTC** | `--unsafe` | `unsafeUpdateAllIntegrations()` — searches npm by keyword, filters the blocklist, **adds new integrations**. Opens a **Pull Request**. |

The script says so in its own comment: *"only fetch unsafe changes like new and
deprecated integrations … if the `--unsafe` CLI flag was provided"*.

🔴 **So a new package appears only via the Monday job, and only after a withastro
maintainer merges the bot's PR.** The daily job is not a faster path; it is a
different one. Expect roughly a week, plus a human.

⚠️ **npm's SEARCH index lags the registry**: a package is installable before it
is findable by keyword, and the crawl reads the search index.

🔑 **Ranking does not matter.** Measured 15-09-2026: `@ciphera-net/pulse-astro`
sat at position **991 of 998** in `keywords:astro-integration` — last, because it
is new and has no downloads. `unsafeUpdateAllIntegrations()` pages the **whole**
result set, so a bottom rank is not a problem. Do not read "not in the first page
of npm search" as "not indexed": query the index for the package by name and read
back its `keywords` instead.

**A logo is the one optional extra**, and it is a real PR, not a link: all 118
overrides use a **repo-local** path (`/assets/integrations/<name>.svg`) and
**zero** point at an external URL, so it means contributing the SVG file itself
to `withastro/astro.build`. Blocked on Pulse having a vector mark — there is
none yet, only the 64 px PNG on the CDN.

## 📍 Follow-up tracker — where this integration is listed

State captured **15-09-2026 22:0x UTC**. Check the listing PR with:

```bash
gh pr view 136 --repo one-aalam/awesome-astro --json state,mergeable,mergeStateStatus
```

| # | Where | State | Done looks like | If it stalls |
|---|---|---|---|---|
| 1 | **npmjs** | ✅ `1.0.1` | n/a | n/a |
| 2 | **GitHub Packages** | ✅ `1.0.1` | n/a | n/a |
| 3 | **npm keyword index** | ✅ present under `astro-integration` (page 750 of 998) and `withastro` (750 of 840) | n/a | ⚠️ `astro-component` returns **1016** results and only 1000 are reachable by paging, so absence there is **inconclusive, not negative**. It does not matter: the crawl matches ANY of the three |
| 4 | **astro.build/integrations** | ⏳ 0 occurrences in the catalogue | our entry appears after the Monday job's PR is merged | 🔴 **Only `weekly.yaml` (Mon 12:00 UTC, `--unsafe`) can add a NEW package**, and a withastro maintainer must merge its PR. `nightly.yaml` only refreshes existing entries. **Earliest 21-09-2026.** If Monday's PR does not include us, *that* is the signal something is wrong |
| 5 | [`one-aalam/awesome-astro#136`](https://github.com/one-aalam/awesome-astro/pull/136) | OPEN, MERGEABLE/**CLEAN**, +1/-0 | merged into `## Astro Integrations` | Nothing blocks it — 941 stars, 7 merged PRs in the last six months, no CONTRIBUTING.md and no stated rules. Purely maintainer attention |

### Surfaces checked and deliberately NOT used

Recorded so the search is not repeated:

- **`withastro/astro` and `withastro/docs` host no community list.** The docs
  defer outward: *"You can find many integrations developed by the community in
  the Astro Integrations Directory."* Nothing to submit there.
- **`astro.build/showcase` is sites-only** — built-with-Astro websites, not
  libraries. Wrong content type.
- **AstroThemes.dev / ThemeForest** are theme marketplaces. Wrong content type.
- **`RichLewis007/awesome-astro-integrations`** — has a real `CONTRIBUTING.md`
  and an `SEO & Analytics` section, but **8 stars and one merged PR in six
  months**. Judged not worth the submission; revisit if it grows.
- **`rajasegar/awesome-astro`** (5 stars, last pushed 2021) and
  **`BryceRussell/my-awesome-astro`** (32 stars, last pushed 2023) are stale.
- **`trueberryless-org/awesome-starlight`** is scoped to Starlight plugins, not
  general Astro integrations. Not applicable.

📍 **One owner action, optional:** Astro's community announces new integrations
in the **`#showcase`** channel of the official Discord (`astro.build/chat` →
`discord.gg/grF4GTXXYm`). Informal, no review. Astro's monthly "What's new" blog
roundups have picked integrations up from there editorially, so it is the one
remaining surface with real upside — and it needs a human with a Discord account.

🔑 **How the extra surfaces were found, since this generalises:** read what the
*official* listing page links OUT to. That is how `awesome-docusaurus` surfaced
for the Docusaurus plugin, and it is the cheap move to repeat for GTM, Framer,
Drupal, Joomla, TYPO3 and Odoo after each is published.

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
