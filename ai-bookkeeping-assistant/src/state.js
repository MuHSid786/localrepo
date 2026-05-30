import { DEFAULT_RULES } from "./bookkeeping.js";

export const DEFAULT_SETTINGS = {
  googleAccountEmail: "",
  driveFolderUrl: "",
  parserProvider: "Parseur",
  webhookUrl: "",
  llmProvider: "OpenAI via automation",
  llmRouteNote: "",
  installedHintSeen: false
};

export function createEmptyState() {
  return {
    statements: [],
    transactions: [],
    rules: DEFAULT_RULES,
    settings: { ...DEFAULT_SETTINGS }
  };
}

export function normaliseSettings(settings = {}) {
  const next = { ...DEFAULT_SETTINGS, ...settings };

  if (next.llmProvider === "OpenAI") next.llmProvider = "OpenAI via automation";
  if (next.llmProvider === "Claude") next.llmProvider = "Claude via automation";
  if (next.llmProvider === "Gemini") next.llmProvider = "Gemini via automation";

  next.installedHintSeen = Boolean(next.installedHintSeen);
  return next;
}

export function normaliseState(candidate) {
  const empty = createEmptyState();
  if (!candidate || typeof candidate !== "object") return empty;

  return {
    statements: Array.isArray(candidate.statements) ? candidate.statements : empty.statements,
    transactions: Array.isArray(candidate.transactions) ? candidate.transactions : empty.transactions,
    rules: Array.isArray(candidate.rules) && candidate.rules.length ? candidate.rules : empty.rules,
    settings: normaliseSettings(candidate.settings)
  };
}
