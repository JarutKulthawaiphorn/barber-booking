import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Vitest config.
//
// `server-only` is a runtime guard from Next.js that throws on import outside
// a server module graph. Vitest is neither client nor server in Next's sense,
// so importing real `server-only` aborts every test that touches a server
// module (e.g. `lib/shop-settings.ts`). Aliasing it to an empty module lets
// the same files run in unit tests; the production build still wires through
// the real package and enforces the boundary at compile time.
export default defineConfig({
  // Unit tests only. Playwright E2E specs (tests/*.spec.ts) run via
  // `playwright test`; scope vitest to *.test.ts so it doesn't collect them.
  test: {
    include: ['**/*.test.ts'],
  },
  resolve: {
    alias: {
      'server-only': path.resolve(__dirname, 'test/stubs/server-only.ts'),
      '@': path.resolve(__dirname),
    },
  },
});
