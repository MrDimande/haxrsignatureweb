import { createRequire, register } from "node:module";

// 1. ESM resolver hook
register("./test-server-only-loader.mjs", import.meta.url);

// 2. CommonJS require.cache mock (for tsx CommonJS compilation)
const require = createRequire(import.meta.url);
try {
  const resolved = require.resolve("server-only");
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {},
  };
} catch {}
