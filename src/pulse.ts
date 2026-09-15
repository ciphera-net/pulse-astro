// Pure logic for the Pulse Astro integration: what to inject, and what domain
// to inject it with. No Astro API in this file, so all of it is unit-tested.
//
// The decisions here deliberately mirror `pulse-framer/src/pulse.ts`. Two Pulse
// install surfaces disagreeing about what the tag looks like is a drift bug
// waiting to happen, so the URLs, the domain grammar and the rule that the
// companion is a SECOND script are copied, not re-derived.

export const SCRIPT_URL = "https://js.ciphera.net/script.js"
export const COMPANION_URL = "https://js.ciphera.net/script.interactions.js"

/** A registrable hostname: labels of letters, digits and hyphens, at least one
 *  dot, a letter-only TLD. Deliberately strict — the value is interpolated into
 *  injected JavaScript, and this shape cannot carry a quote, a backslash or a
 *  line terminator. */
const DOMAIN_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}$/

/** Lower-case, drop a scheme, path, port and trailing dot. Keeps `www.` — the
 *  Pulse site may be registered either way and the user can override it. */
export function normalizeDomain(input: string): string {
  let s = input.trim().toLowerCase()
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
  // Same cuts as pulse-framer's `split("/")[0].split("?")[0].split("#")[0]`
  // then `split(":")[0]`, written without index access so the strict
  // `noUncheckedIndexedAccess` setting holds. Keep the two in step.
  s = s.replace(/[/?#].*$/, "")
  s = s.replace(/:.*$/, "")
  s = s.replace(/\.$/, "")
  return s
}

export function isValidDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain)
}

/** The hostname of Astro's `site` config value, or null when it is unset or
 *  does not parse. This is the Astro equivalent of the Framer plugin reading
 *  `getPublishInfo()` — the deployed URL the user already told us about. */
export function hostnameFromSite(site: string | URL | undefined | null): string | null {
  if (!site) return null
  try {
    const host = new URL(String(site)).hostname.toLowerCase().replace(/\.$/, "")
    return isValidDomain(host) ? host : null
  } catch {
    return null
  }
}

export interface PulseOptions {
  /** The domain the site is registered under in Pulse. Defaults to the
   *  hostname of Astro's `site` config. If neither is available the tag is
   *  injected without `data-domain` and the tracker falls back to the browser's
   *  own hostname — which is correct for a single-domain site. */
  domain?: string
  /** Also load the companion script, which records clicks, copies and form
   *  submits. A SECOND request on purpose: the core script's size is a
   *  published claim and nothing may be folded into it. */
  companion?: boolean
  /** Route events through your own proxy origin. The tracker appends its own
   *  path, so this is a bare origin (`https://example.com`), not a full URL. */
  api?: string
  /** Inject during `astro dev` as well. Off by default: the tracker has no
   *  localhost guard, so a dev server would send real pageviews at production. */
  injectInDev?: boolean
}

export type DomainSource = "option" | "site" | "browser"

export interface Resolution {
  domain: string | null
  source: DomainSource
}

/** Resolve the domain, saying WHERE it came from so the caller can log it.
 *  Never throws for a missing domain — a null domain is a working install that
 *  auto-detects — but an explicitly supplied domain that cannot be a hostname
 *  is a typo, and that does throw rather than silently auto-detect something
 *  the user did not ask for. */
export function resolveDomain(
  options: PulseOptions,
  site: string | URL | undefined | null,
): Resolution {
  if (options.domain !== undefined) {
    const d = normalizeDomain(options.domain)
    if (!isValidDomain(d)) {
      throw new Error(
        `[astro-pulse] "${options.domain}" is not a valid domain. Pass the hostname your site is registered under in Pulse, e.g. domain: "example.com".`,
      )
    }
    return { domain: d, source: "option" }
  }
  const fromSite = hostnameFromSite(site)
  if (fromSite) return { domain: fromSite, source: "site" }
  return { domain: null, source: "browser" }
}

/** `injectScript` takes JavaScript source, never HTML — there is no parameter
 *  for `src`, `defer` or `data-*`, so the literal Pulse tag is not expressible
 *  and the element has to be built in the DOM. Astro's own `@astrojs/vercel`
 *  injects its analytics exactly this way.
 *
 *  Three details are load-bearing:
 *  - `async = false` keeps the two scripts in insertion order. The companion
 *    reads `window.pulse` per event rather than at load, so this is belt and
 *    braces, not a correctness requirement.
 *  - `data-domain` is set BEFORE the element is appended, so it is already on
 *    the element when the tracker reads `document.currentScript`. A classic
 *    script inserted this way does still set `currentScript`; a module script
 *    would not, which is why this is not `type="module"`.
 *  - `window.pulseConfig` is assigned before either script is appended, because
 *    the tracker reads it during its own execution.
 */
export function buildBootstrap(domain: string | null, options: PulseOptions = {}): string {
  if (domain !== null && !isValidDomain(domain)) {
    throw new Error(`[astro-pulse] refusing to inject an invalid domain: ${domain}`)
  }
  const lines: string[] = ["(function(){", "var d=document,h=d.head||d.documentElement;if(!h)return;"]

  if (options.api) {
    const api = String(options.api).replace(/\/+$/, "")
    lines.push(`window.pulseConfig=Object.assign({},window.pulseConfig,{api:${JSON.stringify(api)}});`)
  }

  lines.push("function add(src,domain){")
  lines.push("var s=d.createElement('script');s.async=false;s.defer=true;")
  lines.push("if(domain)s.setAttribute('data-domain',domain);")
  lines.push("s.src=src;h.appendChild(s);}")

  lines.push(`add(${JSON.stringify(SCRIPT_URL)},${domain === null ? "null" : JSON.stringify(domain)});`)
  if (options.companion) lines.push(`add(${JSON.stringify(COMPANION_URL)},null);`)

  lines.push("})();")
  return lines.join("")
}
