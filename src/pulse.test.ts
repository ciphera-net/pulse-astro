import { describe, it, expect } from "vitest"
import {
  SCRIPT_URL,
  COMPANION_URL,
  normalizeDomain,
  isValidDomain,
  hostnameFromSite,
  resolveDomain,
  buildBootstrap,
} from "./pulse.js"

describe("normalizeDomain", () => {
  it("strips scheme, path, query, fragment, port and a trailing dot", () => {
    expect(normalizeDomain("https://Example.com/blog?x=1#y")).toBe("example.com")
    expect(normalizeDomain("  HTTP://example.com:8080/  ")).toBe("example.com")
    expect(normalizeDomain("example.com.")).toBe("example.com")
  })

  it("keeps www, because a Pulse site may be registered either way", () => {
    expect(normalizeDomain("https://www.example.com")).toBe("www.example.com")
  })

  it("agrees with pulse-framer's cuts on the cases that differ by order", () => {
    // `a.com:8080/p?q#f` must lose everything after the host however you slice it.
    expect(normalizeDomain("a.com:8080/p?q#f")).toBe("a.com")
    expect(normalizeDomain("a.com/p:8080")).toBe("a.com")
  })
})

describe("isValidDomain", () => {
  it("accepts real hostnames", () => {
    for (const d of ["example.com", "www.example.com", "a.co", "sub.do-main.example.museum"]) {
      expect(isValidDomain(d), d).toBe(true)
    }
  })

  it("rejects anything that could break out of a JS string literal", () => {
    for (const d of [
      'a.com"',
      "a.com'",
      "a.com\\",
      "a.com\n",
      "a.com</script>",
      "a.com ",
      "a com.com",
      "localhost",
      "127.0.0.1",
      "",
      "-a.com",
      "a.com-",
    ]) {
      expect(isValidDomain(d), JSON.stringify(d)).toBe(false)
    }
  })
})

describe("hostnameFromSite", () => {
  it("reads the hostname out of Astro's site config", () => {
    expect(hostnameFromSite("https://example.com/base/")).toBe("example.com")
    expect(hostnameFromSite(new URL("https://www.example.com"))).toBe("www.example.com")
  })

  it("returns null rather than guessing", () => {
    expect(hostnameFromSite(undefined)).toBeNull()
    expect(hostnameFromSite("")).toBeNull()
    expect(hostnameFromSite("not a url")).toBeNull()
    expect(hostnameFromSite("http://localhost:4321")).toBeNull()
  })
})

describe("resolveDomain", () => {
  it("prefers the explicit option over site", () => {
    expect(resolveDomain({ domain: "a.com" }, "https://b.com")).toEqual({
      domain: "a.com",
      source: "option",
    })
  })

  it("falls back to site", () => {
    expect(resolveDomain({}, "https://b.com")).toEqual({ domain: "b.com", source: "site" })
  })

  it("falls back to browser auto-detect, which is a working install", () => {
    expect(resolveDomain({}, undefined)).toEqual({ domain: null, source: "browser" })
    // A localhost `site` is not a registrable domain, so it auto-detects too.
    expect(resolveDomain({}, "http://localhost:4321")).toEqual({ domain: null, source: "browser" })
  })

  it("THROWS on a bad explicit domain instead of silently auto-detecting", () => {
    // A typo here would otherwise be a no-data install that looks fine.
    expect(() => resolveDomain({ domain: "not a domain" }, "https://b.com")).toThrow(/not a valid domain/)
  })
})

describe("buildBootstrap", () => {
  it("refuses to interpolate an invalid domain even if one reaches it", () => {
    expect(() => buildBootstrap('a.com"+alert(1)+"')).toThrow(/refusing to inject/)
  })

  it("emits only the core script by default", () => {
    const js = buildBootstrap("example.com")
    expect(js).toContain(SCRIPT_URL)
    expect(js).not.toContain(COMPANION_URL)
  })

  it("adds the companion as a SECOND request, never folded into the core", () => {
    const js = buildBootstrap("example.com", { companion: true })
    expect(js).toContain(SCRIPT_URL)
    expect(js).toContain(COMPANION_URL)
  })

  it("sets pulseConfig.api before any script is appended", () => {
    const js = buildBootstrap("example.com", { api: "https://proxy.example.com/" })
    expect(js.indexOf("pulseConfig")).toBeLessThan(js.indexOf("appendChild"))
    expect(js).toContain('"https://proxy.example.com"') // trailing slash trimmed
  })
})

// The injected string IS the product. Running it proves the tag it builds,
// which reading the source cannot: escaping, attribute order and the
// set-before-append rule the tracker's `document.currentScript` read depends on.
describe("the bootstrap, executed", () => {
  function run(js: string): HTMLScriptElement[] {
    document.head.innerHTML = ""
    // eslint-disable-next-line no-new-func
    new Function(js)()
    return Array.from(document.head.querySelectorAll("script"))
  }

  it("appends one deferred, ordered script carrying data-domain", () => {
    const [s, ...rest] = run(buildBootstrap("example.com"))
    expect(rest).toHaveLength(0)
    expect(s!.src).toBe(SCRIPT_URL)
    expect(s!.getAttribute("data-domain")).toBe("example.com")
    expect(s!.async).toBe(false) // insertion order preserved
    expect(s!.defer).toBe(true)
  })

  it("omits data-domain entirely when auto-detecting — never an empty attribute", () => {
    const [s] = run(buildBootstrap(null))
    expect(s!.hasAttribute("data-domain")).toBe(false)
  })

  it("puts the core first and gives the companion no data-domain", () => {
    const [core, companion] = run(buildBootstrap("example.com", { companion: true }))
    expect(core!.src).toBe(SCRIPT_URL)
    expect(companion!.src).toBe(COMPANION_URL)
    expect(companion!.hasAttribute("data-domain")).toBe(false)
  })

  it("assigns window.pulseConfig without clobbering an existing one", () => {
    ;(globalThis as unknown as { pulseConfig?: Record<string, unknown> }).pulseConfig = { domain: "kept.com" }
    run(buildBootstrap("example.com", { api: "https://proxy.example.com" }))
    const cfg = (globalThis as unknown as { pulseConfig: Record<string, unknown> }).pulseConfig
    expect(cfg.api).toBe("https://proxy.example.com")
    expect(cfg.domain).toBe("kept.com")
  })
})
