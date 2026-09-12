import type { Plugin } from "vite";
import { createHash } from "node:crypto";
/** Cache only the compiled student application shell. Never cache authenticated API responses. */
export function cbtOffline(): Plugin {
  return {
    name: "cbt-offline-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      // Follow static imports only; staff screens remain lazy dependencies.
      const shell = new Set<string>();
      const visit = (name: string) => {
        if (shell.has(name)) return;
        shell.add(name);
        const chunk = bundle[name];
        if (chunk?.type === "chunk") chunk.imports.forEach(visit);
      };
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === "chunk" && chunk.isEntry) visit(chunk.fileName);
        if (chunk.type === "asset" && chunk.fileName.endsWith(".css"))
          shell.add(chunk.fileName);
      }
      const assets = [...shell].map((name) => "/" + name);
      const version = createHash("sha256")
        .update(assets.join("|"))
        .digest("hex")
        .slice(0, 12);
      this.emitFile({
        type: "asset",
        fileName: "cbt-sw.js",
        source: `
const CACHE = 'classfun-cbt-${version}';
const ASSETS = ${JSON.stringify(["/index.html", ...assets])};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
// Updates wait for existing exam tabs to close; never force a reload mid-exam.
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('classfun-cbt-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate' && url.pathname.startsWith('/cbt/')) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')).then(cached => cached || fetch(event.request)));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url.pathname)).then(cached => cached || fetch(event.request)));
  }
});
`,
      });
    },
  };
}
