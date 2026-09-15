# Pulse Analytics for Astro

Privacy-first analytics for an Astro site, in one integration. No cookies, no
personal data, and the script it adds to your pages is under 3 KB.

[Pulse Analytics](https://pulse.ciphera.net) is built by [Ciphera](https://ciphera.net), a
company in Belgium, and hosted in Europe.

## Install

```bash
npx astro add @ciphera-net/pulse-astro
```

Or by hand:

```bash
npm install @ciphera-net/pulse-astro
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
import pulse from "@ciphera-net/pulse-astro"

export default defineConfig({
  site: "https://example.com",
  integrations: [pulse()],
})
```

That is the whole setup. The domain comes from your `site` config, so if you
already set it — and you should, for sitemaps and canonical URLs — there is
nothing to configure.

You need a Pulse Analytics account with a site registered for the same domain. The free
plan is enough to start.

## Options

| Option | Default | What it does |
|---|---|---|
| `domain` | from `site` | The domain your site is registered under in Pulse Analytics. Pass this when `site` is not the domain you track, for example on a preview deployment. |
| `companion` | `false` | Also record clicks, copies and form submits. A second, separate script — see below. |
| `api` | — | Route events through your own proxy origin. A bare origin (`https://example.com`), not a full URL: the tracker appends its own path. |
| `injectInDev` | `false` | Inject during `astro dev` too. Off by default — see below. |

```js
pulse({ domain: "example.com", companion: true })
```

## Three things worth knowing

**It does not run in `astro dev`.** The tracker has no localhost guard, so a dev
server would send real pageviews at your production dashboard. The integration
prints a line saying it stayed out; in Astro 7 the dev server is daemonised, so
that line is in `astro dev logs` rather than your terminal. Set
`injectInDev: true` if you actually want it.

**The interaction capture is a second request on purpose.** The core script's
size is a published claim, and nothing gets folded into it to make a feature
look free. `companion: true` costs you a second, separate file.

**View-source shows a bootstrap, not a `<script src>` tag.** Astro's
`injectScript` takes JavaScript, not HTML — there is no way to ask it for a tag
with `src`, `defer` and `data-domain` on it — so the integration injects a small
inline script that builds the element. Astro's own `@astrojs/vercel` does the
same thing for the same reason. Two consequences:

- The resulting tag is identical to the one you would paste by hand, and the
  tracker reads its configuration from it exactly the same way.
- A strict Content-Security-Policy that forbids inline script will block it.
  If you run one, paste the tag into your layout instead and skip this package —
  see the [manual install](https://docs.ciphera.net/pulse/framework-guides).

## What Pulse Analytics measures

Pageviews, referrers, countries, devices, time on page and scroll depth, plus
goals, funnels and campaigns. It sets no cookies and stores no personal data.
Visitors whose browser sends Do Not Track or Global Privacy Control are not
counted at all — so if you test in Brave or Firefox and see nothing, that is the
tracker behaving correctly. Safari is the easiest browser to verify an install in.

## Licence

Copyright 2026 Ciphera BV. Licensed under the Apache License, Version 2.0 —
the `LICENSE` file is the licence text verbatim, so the copyright line lives
here rather than inside it.

This package has **zero runtime dependencies**, asserted in CI.

Astro is a trademark of its owners; this is an independent integration and is not
affiliated with or endorsed by the Astro project.
