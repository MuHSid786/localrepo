import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("HTML references the PWA manifest, stylesheet, and module entry point", async () => {
  const html = await read("index.html");

  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css"/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
});

test("mobile UI contains the required beginner workflow panels", async () => {
  const html = await read("index.html");

  for (const panel of ["dashboard", "inbox", "import", "review", "rules", "settings"]) {
    assert.match(html, new RegExp(`data-panel="${panel}"`));
  }
});

test("manifest is installable and points at the SVG icon", async () => {
  const manifest = JSON.parse(await read("manifest.webmanifest"));

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, ".");
  assert.equal(manifest.icons[0].src, "icons/icon.svg");
});

test("service worker caches every static app shell file", async () => {
  const worker = await read("service-worker.js");

  for (const asset of ["./", "./index.html", "./styles.css", "./app.js", "./src/bookkeeping.js", "./manifest.webmanifest", "./icons/icon.svg"]) {
    assert.match(worker, new RegExp(asset.replace(/[./]/g, "\\$&")));
  }
});
