# Pulse Analytics for Astro

This integration adds privacy-first analytics to an Astro site. Pulse Analytics
sets no cookies and never stores IP addresses, and the script it adds to your
pages is under 3 KB.

[Pulse Analytics](https://pulse.ciphera.net) is built by [Ciphera](https://ciphera.net), a
company in Belgium, and hosted in Europe.

## Install

```bash
npx astro add @ciphera-net/pulse-astro
```

You can also set it up by hand:

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
already set it (and you should, for sitemaps and canonical URLs), there is
nothing to configure.

You need a Pulse Analytics account with a site registered for the same domain. The free
plan is enough to start.

## Options

| Option | Default | What it does |
|---|---|---|
| `domain` | from `site` | The domain your site is registered under in Pulse Analytics. Pass this when `site` is not the domain you track, for example on a preview deployment. |
| `companion` | `false` | Also record clicks, copies and form submits. This loads a second, separate script (see below). |
| `api` | unset | Route events through your own proxy origin. Enter the origin only (`https://example.com`), without a path, because the tracker adds its own. |
| `injectInDev` | `false` | Inject during `astro dev` too. This is off by default (see below). |

```js
pulse({ domain: "example.com", companion: true })
```

## Three things worth knowing

**It does not run in `astro dev`.** The tracker has no localhost guard, so a dev
server would send real pageviews at your production dashboard. The integration
prints a line saying it stayed out; in Astro 7 the dev server is daemonised, so
that line is in `astro dev logs` rather than your terminal. Set
`injectInDev: true` if you want the tracker to run in dev.

**The interaction capture is a second request on purpose.** The core script's
size is a published claim, and nothing gets folded into it to make a feature
look free. `companion: true` costs you a second, separate file.

**View-source shows a bootstrap instead of a `<script src>` tag.** Astro's
`injectScript` takes JavaScript rather than HTML, so there is no way to ask it
for a tag with `src`, `defer` and `data-domain` on it. Instead, the integration
injects a small inline script that builds the element. Astro's own
`@astrojs/vercel` does the same thing for the same reason. This has two
consequences:

- The resulting tag is identical to the one you would paste by hand, and the
  tracker reads its configuration from it exactly the same way.
- A strict Content-Security-Policy that forbids inline script will block it.
  If you run one, paste the tag into your layout instead and skip this package.
  See the [manual install](https://docs.ciphera.net/pulse/framework-guides).

## What Pulse Analytics measures

Pulse Analytics measures pageviews, referrers, countries, devices, time on page
and scroll depth, plus goals, funnels and campaigns.
It sets no cookies and never stores IP addresses. Visitors whose browser sends
Do Not Track or Global Privacy Control are not counted, so if you test in Brave
or Firefox and see nothing, the tracker is behaving correctly. Safari is the
easiest browser to verify an install in.

## Licence

Copyright 2026 Ciphera BV. Licensed under the Apache License, Version 2.0.
The `LICENSE` file is the licence text verbatim, so the copyright line lives
here rather than inside it.

This package has **zero runtime dependencies**, asserted in CI.

Astro is a trademark of its owners; this is an independent integration and is not
affiliated with or endorsed by the Astro project.
