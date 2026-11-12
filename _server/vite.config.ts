import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "rage-node-builtin-compat",
      enforce: "pre",
      resolveId(source) {
        if (source.startsWith("node:")) return { id: source.slice("node:".length), external: true };
        return null;
      },
    },
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["cjs"],
      fileName: () => "index.js",
    },
    outDir: path.resolve(__dirname, "../packages/server"),
    emptyOutDir: false,
    sourcemap: true,
    minify: process.env.NODE_ENV === "production" ? "esbuild" : false,
    target: "es2015",

    rollupOptions: {
      external: (id) => {
        const nodeBuiltins = [
          "path",
          "fs",
          "util",
          "os",
          "events",
          "http",
          "https",
          "zlib",
          "stream",
          "crypto",
          "url",
          "net",
          "tls",
          "dns",
          "child_process",
          "cluster",
          "worker_threads",
          "v8",
          "vm",
          "readline",
          "repl",
          "assert",
          "buffer",
          "querystring",
          "string_decoder",
          "timers",
          "punycode",
          "domain",
          "constants",
          "module",
          "process",
          "sys",
        ];

        if (nodeBuiltins.includes(id)) return true;
        return false;
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
