import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // The bootstrap is executed against a real DOM in pulse.test.ts — reading
    // the generated string cannot prove the element it builds.
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
})
