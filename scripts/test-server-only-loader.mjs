export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      format: "module",
      shortCircuit: true,
      url: new URL("./test-server-only-empty.mjs", import.meta.url).href,
    };
  }
  return nextResolve(specifier, context);
}
