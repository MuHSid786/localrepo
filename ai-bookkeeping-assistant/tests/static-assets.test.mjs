import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("HTML references the PWA manifest, stylesheet, and module entry point", async () => {
  const html = await read("index.html");

  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /<link rel="stylesheet" href="styles\.css"/);
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
});

test("mobile UI contains the required beginner workflow panels", async () => {
  const html = await read("index.html");

  for (const panel of ["setup", "dashboard", "inbox", "import", "review", "rules", "settings"]) {
    assert.match(html, new RegExp(`data-panel="${panel}"`));
  }
});

test("manifest is installable and points at the SVG icon", async () => {
  const manifest = JSON.parse(await read("manifest.webmanifest"));

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "portrait-primary");
  assert.equal(manifest.start_url, ".");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.icons[0].src, "icons/icon.svg");
});

test("setup wizard guides mobile install and service connections", async () => {
  const html = await read("index.html");
  const app = await read("app.js");

  for (const id of ["installAppButton", "googleAccountEmail", "driveFolderUrl", "parserProvider", "webhookUrl", "llmProvider", "connectionChecklist"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /googleAccountEmail/);
  assert.match(app, /driveFolderUrl/);
  assert.match(app, /parserProvider/);
});

test("service worker caches every static app shell file", async () => {
  const worker = await read("service-worker.js");

  for (const asset of ["./", "./index.html", "./styles.css", "./app.js", "./src/bookkeeping.js", "./src/state.js", "./src/workflow.js", "./manifest.webmanifest", "./icons/icon.svg"]) {
    assert.match(worker, new RegExp(asset.replace(/[./]/g, "\\$&")));
  }
});

test("service worker caches every module imported by app.js", async () => {
  const app = await read("app.js");
  const worker = await read("service-worker.js");
  const importedModules = [...app.matchAll(/from "(\.\/src\/[^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(importedModules.sort(), ["./src/bookkeeping.js", "./src/state.js", "./src/workflow.js"].sort());
  for (const modulePath of importedModules) {
    assert.match(worker, new RegExp(modulePath.replace(/[./]/g, "\\$&")));
  }
});
