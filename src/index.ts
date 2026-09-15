import type { AstroIntegration } from "astro"
import { buildBootstrap, resolveDomain, type PulseOptions } from "./pulse.js"

export type { PulseOptions }
export { SCRIPT_URL, COMPANION_URL, normalizeDomain, isValidDomain, hostnameFromSite } from "./pulse.js"

/**
 * Pulse Analytics — privacy-first web analytics for Astro.
 *
 *   import pulse from "@ciphera-net/pulse-astro"
 *   export default defineConfig({
 *     site: "https://example.com",
 *     integrations: [pulse()],
 *   })
 *
 * The domain comes from `site` unless you pass one.
 */
export default function pulse(options: PulseOptions = {}): AstroIntegration {
  return {
    name: "@ciphera-net/pulse-astro",
    hooks: {
      "astro:config:setup": ({ command, config, injectScript, logger }) => {
        // The tracker has no localhost guard, so a dev server would send real
        // pageviews at production. Opt in deliberately, and say so either way —
        // an analytics integration that is quietly absent is the worst outcome.
        if (command === "dev" && !options.injectInDev) {
          logger.info("not injected in dev (set injectInDev: true to override)")
          return
        }

        // Throws on an explicitly supplied domain that cannot be a hostname.
        // A typo there is a silent no-data install, which is worth a build error.
        const { domain, source } = resolveDomain(options, config.site)

        injectScript("head-inline", buildBootstrap(domain, options))

        if (source === "browser") {
          logger.warn(
            "no `site` in astro.config and no `domain` option — the tag will auto-detect the browser's hostname. Set one of them if this site is served on more than one domain.",
          )
        } else {
          logger.info(
            `tracking ${domain} (from ${source === "option" ? "the domain option" : "`site`"})${options.companion ? ", with interaction capture" : ""}`,
          )
        }
      },
    },
  }
}
