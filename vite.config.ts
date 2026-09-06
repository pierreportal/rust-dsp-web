import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

// The wasm-pack output lives at ./pkg inside this project (downloaded by
// scripts/fetch-dsp.sh from a rust-dsp GitHub release, or produced locally by
// web/scripts/build-dsp.sh). The AudioWorklet (`public/graph-processor.js`)
// imports `./pkg/web.js` and the main thread fetches `./pkg/web_bg.wasm`, and
// `nodeSpec.ts` imports `./pkg/module-registry.json`, so `/pkg` must be served.
// In dev we serve it with a middleware; on build we copy it into `dist/pkg`.
const pkgDir = path.resolve(__dirname, "pkg");

const CONTENT_TYPES: Record<string, string> = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".wasm": "application/wasm",
  ".json": "application/json",
};

function servePkg(): Plugin {
  const handle = (req, res, next) => {
    // Drop any query string (?v=...) so cache-busting fetch URLs still resolve
    // to the real file on disk.
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const ext = path.extname(pathname);
    // JSON is imported as an ES module by src/audio/nodeSpec.ts; Vite must
    // transform it into a JS module, so leave those requests to Vite (serving
    // the raw .json would fail strict MIME checking for module scripts).
    if (ext === ".json") {
      next();
      return;
    }
    const file = path.join(pkgDir, pathname);
    fs.readFile(file, (err, data) => {
      if (err) {
        next();
        return;
      }
      const ct = CONTENT_TYPES[ext];
      if (ct) res.setHeader("Content-Type", ct);
      // Revalidate so a stale (pre-limiter) web_bg.wasm doesn't get served
      // from the browser cache after a rebuild.
      res.setHeader("Cache-Control", "no-cache");
      res.end(data);
    });
  };
  return {
    name: "serve-rust-dsp-pkg",
    configureServer(server) {
      server.middlewares.use("/pkg", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/pkg", handle);
    },
    closeBundle() {
      const dest = path.resolve(__dirname, "dist", "pkg");
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(pkgDir)) {
        fs.copyFileSync(path.join(pkgDir, name), path.join(dest, name));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), servePkg()],
  server: { host: "localhost", port: 5173 },
});
