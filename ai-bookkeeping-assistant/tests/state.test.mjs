import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyState, normaliseSettings, normaliseState } from "../src/state.js";

test("creates a complete fresh state for first install", () => {
  const state = createEmptyState();

  assert.deepEqual(state.statements, []);
  assert.deepEqual(state.transactions, []);
  assert.ok(state.rules.length > 0);
  assert.equal(state.settings.parserProvider, "Parseur");
  assert.equal(state.settings.llmProvider, "OpenAI via automation");
});

test("migrates legacy settings from previous app versions", () => {
  const settings = normaliseSettings({ webhookUrl: "https://hook.example", llmProvider: "OpenAI" });

  assert.equal(settings.webhookUrl, "https://hook.example");
  assert.equal(settings.llmProvider, "OpenAI via automation");
  assert.equal(settings.parserProvider, "Parseur");
  assert.equal(settings.installedHintSeen, false);
});

test("normalises corrupt or partial localStorage state safely", () => {
  const state = normaliseState({
    statements: "not an array",
    transactions: [{ id: "existing" }],
    rules: [],
    settings: { googleAccountEmail: "user@example.com", installedHintSeen: 1 }
  });

  assert.deepEqual(state.statements, []);
  assert.deepEqual(state.transactions, [{ id: "existing" }]);
  assert.ok(state.rules.length > 0);
  assert.equal(state.settings.googleAccountEmail, "user@example.com");
  assert.equal(state.settings.installedHintSeen, true);
});
