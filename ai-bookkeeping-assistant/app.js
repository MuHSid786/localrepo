import {
  DEFAULT_CATEGORIES,
  createId,
  proposeRuleFromCorrection,
  summariseTransactions
} from "./src/bookkeeping.js";
import { createEmptyState, normaliseState } from "./src/state.js";
import { importTransactionsFromCsv } from "./src/workflow.js";

const STORAGE_KEY = "ai-bookkeeping-assistant-state-v1";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const sampleCsv = `date,description,amount,account
2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card
2026-05-02,OPENAI API PLATFORM,-18.80,Business Card
2026-05-03,UBER TRIP HELP.UBER.COM,-24.72,Checking
2026-05-04,WHOLE FOODS MARKET,-88.13,Checking
2026-05-06,STRIPE PAYOUT,1250.00,Business Checking
2026-05-07,NETFLIX.COM,-15.49,Checking
2026-05-08,AMAZON MKTPLACE PMTS,-63.20,Business Card
2026-05-09,COMCAST INTERNET,-91.00,Checking`;

let state = loadState();
let deferredInstallPrompt = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normaliseState(parsed);
  } catch {
    return createEmptyState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showPanel(name) {
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === name));
  $$(".bottom-nav button").forEach((button) => button.classList.toggle("active", button.dataset.target === name));
}

function isStandaloneMode() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function connectionSteps() {
  return [
    {
      key: "install",
      title: "Standalone app",
      ready: isStandaloneMode() || state.settings.installedHintSeen,
      detail: isStandaloneMode()
        ? "Running from the installed app shell."
        : "Install from Android Chrome or iOS Safari, then open from the home screen."
    },
    {
      key: "google",
      title: "Google Drive folder",
      ready: Boolean(state.settings.googleAccountEmail && state.settings.driveFolderUrl),
      detail: state.settings.driveFolderUrl || "Add the Google account email and Drive folder URL used for statement PDFs."
    },
    {
      key: "parser",
      title: "Parser webhook",
      ready: Boolean(state.settings.webhookUrl),
      detail: state.settings.webhookUrl || "Paste the Make/Zapier webhook that forwards PDFs to Parseur, Nanonets, or OCR."
    },
    {
      key: "llm",
      title: "AI categorisation route",
      ready: Boolean(state.settings.llmProvider),
      detail: state.settings.llmProvider || "Choose the LLM route your automation will use."
    }
  ];
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderCategoryOptions(select, selected) {
  select.innerHTML = DEFAULT_CATEGORIES.map(
    (category) => `<option ${category === selected ? "selected" : ""}>${category}</option>`
  ).join("");
}

function renderDashboard() {
  const summary = summariseTransactions(state.transactions);
  $("#expenseMetric").textContent = currency.format(summary.expenses);
  $("#businessMetric").textContent = currency.format(summary.business);
  $("#personalMetric").textContent = currency.format(summary.personal);
  $("#reviewMetric").textContent = String(summary.needsReview);
  $("#transactionCount").textContent = `${state.transactions.length} transaction${state.transactions.length === 1 ? "" : "s"}`;

  const maxCategory = Math.max(...summary.topCategories.map(([, amount]) => amount), 1);
  $("#categoryBars").innerHTML = summary.topCategories.length
    ? summary.topCategories
        .map(([category, amount]) => {
          const width = Math.max(5, Math.round((amount / maxCategory) * 100));
          return `<div class="bar-row">
            <strong>${category}</strong>
            <span class="bar-track"><span class="bar-fill" style="width:${width}%"></span></span>
            <span>${currency.format(amount)}</span>
          </div>`;
        })
        .join("")
    : `<p class="empty-state">Import extracted transactions to see category insights.</p>`;
}

function renderStatements() {
  $("#statementCount").textContent = `${state.statements.length} PDF${state.statements.length === 1 ? "" : "s"}`;
  $("#statementList").innerHTML = state.statements.length
    ? state.statements
        .map(
          (statement) => `<article class="card">
            <div class="card-header">
              <div>
                <strong>${statement.name}</strong>
                <p class="helper-text">${formatDateTime(statement.uploadedAt)} · ${(statement.size / 1024).toFixed(1)} KB</p>
              </div>
              <span class="pill">${statement.status}</span>
            </div>
            <p class="helper-text">${statement.webhookStatus || "Logged locally. Add a parser webhook in Settings to forward PDFs for extraction."}</p>
          </article>`
        )
        .join("")
    : `<p class="empty-state">No PDFs logged yet. Upload a bank, card, or payment account statement.</p>`;
}

function chip(label, tone = "") {
  return `<span class="chip ${tone}">${label}</span>`;
}

function renderReview() {
  const template = $("#transactionTemplate");
  const list = $("#reviewList");
  const reviewTransactions = state.transactions
    .filter((transaction) => transaction.status === "Needs Review" || transaction.confidence < 0.72)
    .sort((a, b) => a.confidence - b.confidence);

  list.innerHTML = "";
  if (!reviewTransactions.length) {
    list.innerHTML = `<p class="empty-state">No transactions need review. Low-confidence imports will appear here.</p>`;
    return;
  }

  reviewTransactions.forEach((transaction) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = transaction.id;
    node.classList.toggle("needs-review", transaction.status === "Needs Review");
    $(".merchant", node).textContent = transaction.cleanMerchant;
    $(".description", node).textContent = `${transaction.transactionDate} · ${transaction.description}`;
    $(".amount", node).textContent = currency.format(transaction.amount);
    $(".amount", node).classList.toggle("negative", transaction.amount < 0);
    $(".amount", node).classList.toggle("positive", transaction.amount > 0);
    $(".chips", node).innerHTML = [
      chip(transaction.category, "good"),
      chip(transaction.spendingContext, transaction.spendingContext === "Needs Review" ? "warn" : ""),
      chip(`${Math.round(transaction.confidence * 100)}% confidence`, transaction.confidence < 0.72 ? "warn" : "good"),
      chip(transaction.ruleApplied)
    ].join("");
    $(".justification", node).textContent = transaction.justification;
    renderCategoryOptions($(".category-select", node), transaction.category);
    $(".context-select", node).value = transaction.spendingContext;
    $(".deductibility-select", node).value = transaction.deductibility;
    list.append(node);
  });
}

function renderRules() {
  renderCategoryOptions($("#ruleCategory"), "Software");
  $("#ruleList").innerHTML = state.rules.length
    ? state.rules
        .map(
          (rule) => `<article class="card">
            <div class="card-header">
              <div>
                <strong>${rule.matchValue}</strong>
                <p class="helper-text">${rule.matchType} · ${rule.source || "user"}</p>
              </div>
              <span class="pill">${rule.category}</span>
            </div>
            <div class="chips">
              ${chip(rule.spendingContext, rule.spendingContext === "Business" ? "good" : "")}
              ${chip(`${rule.deductibility} deductible`)}
            </div>
            <button class="secondary-button delete-rule" data-rule-id="${rule.id}" type="button">Delete rule</button>
          </article>`
        )
        .join("")
    : `<p class="empty-state">No rules yet. Correct transactions to teach the assistant.</p>`;
}

function renderSetup() {
  $("#googleAccountEmail").value = state.settings.googleAccountEmail || "";
  $("#driveFolderUrl").value = state.settings.driveFolderUrl || "";
  $("#parserProvider").value = state.settings.parserProvider || "Parseur";
  $("#webhookUrl").value = state.settings.webhookUrl || "";
  $("#llmProvider").value = state.settings.llmProvider || "OpenAI via automation";
  $("#llmRouteNote").value = state.settings.llmRouteNote || "";

  const online = navigator.onLine;
  $("#networkStatus").textContent = online ? "Online: services available" : "Offline: app shell only";
  $("#networkStatus").classList.toggle("warn", !online);
  $("#installAppButton").textContent = isStandaloneMode() ? "Installed" : "Install app";

  const steps = connectionSteps();
  const readyCount = steps.filter((step) => step.ready).length;
  $("#setupProgress").textContent = `${readyCount}/${steps.length} ready`;
  $("#connectionChecklist").innerHTML = steps
    .map(
      (step) => `<div class="check-item">
        <div>
          <strong>${step.title}</strong>
          <span>${step.detail}</span>
        </div>
        <i class="status-dot ${step.ready ? "ready" : "blocked"}" aria-label="${step.ready ? "Ready" : "Needs setup"}"></i>
      </div>`
    )
    .join("");
}

function renderSettings() {
  const steps = connectionSteps();
  const readyCount = steps.filter((step) => step.ready).length;
  $("#syncStatus").textContent = state.settings.webhookUrl ? "Webhook ready" : "Local-first MVP";
  $("#connectionSummary").innerHTML = steps
    .map(
      (step) => `<div class="connection-row">
        <div>
          <strong>${step.title}</strong>
          <span>${step.detail}</span>
        </div>
        <i class="status-dot ${step.ready ? "ready" : "blocked"}" aria-label="${step.ready ? "Ready" : "Needs setup"}"></i>
      </div>`
    )
    .join("");
  $("#syncStatus").textContent = `${readyCount}/${steps.length} connected`;
}

function saveConnectionSettings() {
  state.settings.googleAccountEmail = $("#googleAccountEmail").value.trim();
  state.settings.driveFolderUrl = $("#driveFolderUrl").value.trim();
  state.settings.parserProvider = $("#parserProvider").value;
  state.settings.webhookUrl = $("#webhookUrl").value.trim();
  state.settings.llmProvider = $("#llmProvider").value;
  state.settings.llmRouteNote = $("#llmRouteNote").value.trim();
  saveState();
  renderAll();
}

async function installApp() {
  state.settings.installedHintSeen = true;
  saveState();

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => undefined);
    deferredInstallPrompt = null;
  } else {
    $("#installInstructions").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  renderAll();
  showPanel("setup");
}

function renderAll() {
  renderSetup();
  renderDashboard();
  renderStatements();
  renderReview();
  renderRules();
  renderSettings();
}

async function forwardPdfToWebhook(statement, file) {
  if (!state.settings.webhookUrl) return "No webhook configured.";
  const body = new FormData();
  body.append("statement", file);
  body.append("statementId", statement.id);
  body.append("uploadedAt", statement.uploadedAt);
  body.append("googleAccountEmail", state.settings.googleAccountEmail || "");
  body.append("driveFolderUrl", state.settings.driveFolderUrl || "");
  body.append("parserProvider", state.settings.parserProvider || "");
  body.append("llmProvider", state.settings.llmProvider || "");

  const response = await fetch(state.settings.webhookUrl, { method: "POST", body });
  if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
  return "Forwarded to parser webhook.";
}

async function handlePdfUpload(event) {
  const files = [...event.target.files].filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  for (const file of files) {
    const statement = {
      id: createId("statement"),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: "Logged"
    };
    state.statements.unshift(statement);
    saveState();
    renderStatements();

    try {
      statement.webhookStatus = await forwardPdfToWebhook(statement, file);
      statement.status = state.settings.webhookUrl ? "Sent to parser" : "Awaiting parser";
    } catch (error) {
      statement.status = "Parser error";
      statement.webhookStatus = error.message;
    }
    saveState();
  }
  event.target.value = "";
  renderAll();
}

function importRows() {
  const result = importTransactionsFromCsv({
    csvText: $("#csvInput").value,
    accountName: $("#accountName").value || "Uploaded Account",
    existingTransactions: state.transactions,
    rules: state.rules,
    sourcePdfName: state.statements[0]?.name || "Manual import"
  });

  state.transactions = result.transactions;
  saveState();
  renderAll();
  showPanel(result.importedCount ? "review" : "dashboard");
}

function updateTransactionFromCard(card, markReviewed = false) {
  const transaction = state.transactions.find((item) => item.id === card.dataset.id);
  if (!transaction) return;

  transaction.category = $(".category-select", card).value;
  transaction.spendingContext = $(".context-select", card).value;
  transaction.deductibility = $(".deductibility-select", card).value;
  transaction.status = markReviewed ? "Reviewed" : transaction.spendingContext === "Needs Review" ? "Needs Review" : "Reviewed";
  transaction.confidence = Math.max(transaction.confidence, 0.92);
  transaction.justification = "User reviewed and corrected this transaction.";

  if ($(".learn-rule", card).checked) {
    const proposedRule = proposeRuleFromCorrection(transaction);
    const exists = state.rules.some((rule) => rule.matchValue === proposedRule.matchValue);
    if (!exists) state.rules.unshift(proposedRule);
  }

  saveState();
  renderAll();
}

function addManualRule() {
  const matchValue = $("#ruleMatch").value.trim();
  if (!matchValue) return;
  state.rules.unshift({
    id: createId("rule"),
    matchType: "contains",
    matchValue: matchValue.toUpperCase(),
    category: $("#ruleCategory").value,
    subcategory: "Manual Rule",
    spendingContext: $("#ruleContext").value,
    deductibility: $("#ruleContext").value === "Business" ? "100%" : $("#ruleContext").value === "Mixed" ? "Partial" : "0%",
    confidenceBoost: 0.25,
    approvedByUser: true,
    source: "Manual"
  });
  $("#ruleMatch").value = "";
  saveState();
  renderAll();
}

function approveHighConfidence() {
  state.transactions = state.transactions.map((transaction) =>
    transaction.confidence >= 0.86 && transaction.status !== "Reviewed"
      ? { ...transaction, status: "Reviewed" }
      : transaction
  );
  saveState();
  renderAll();
}

function attachEvents() {
  $$(".bottom-nav button").forEach((button) => button.addEventListener("click", () => showPanel(button.dataset.target)));
  $("#statementUpload").addEventListener("change", handlePdfUpload);
  $("#loadSampleButton").addEventListener("click", () => {
    $("#csvInput").value = sampleCsv;
  });
  $("#importRowsButton").addEventListener("click", importRows);
  $("#approveAllButton").addEventListener("click", approveHighConfidence);
  $("#addRuleButton").addEventListener("click", addManualRule);
  $("#installAppButton").addEventListener("click", installApp);
  $("#installGuideButton").addEventListener("click", installApp);
  $("#saveSetupButton").addEventListener("click", saveConnectionSettings);
  $("#saveSettingsButton").addEventListener("click", saveConnectionSettings);
  $("#openSetupButton").addEventListener("click", () => showPanel("setup"));
  $("#goToUploadButton").addEventListener("click", () => {
    saveConnectionSettings();
    showPanel("inbox");
  });
  window.addEventListener("online", renderAll);
  window.addEventListener("offline", renderAll);
  $("#resetDemoButton").addEventListener("click", () => {
    state = createEmptyState();
    saveState();
    renderAll();
    showPanel("dashboard");
  });

  document.addEventListener("click", (event) => {
    const deleteRule = event.target.closest(".delete-rule");
    if (deleteRule) {
      state.rules = state.rules.filter((rule) => rule.id !== deleteRule.dataset.ruleId);
      saveState();
      renderAll();
      return;
    }

    const saveButton = event.target.closest(".save-transaction");
    if (saveButton) updateTransactionFromCard(saveButton.closest(".transaction-card"));

    const reviewedButton = event.target.closest(".mark-reviewed");
    if (reviewedButton) updateTransactionFromCard(reviewedButton.closest(".transaction-card"), true);
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderAll();
});

window.addEventListener("appinstalled", () => {
  state.settings.installedHintSeen = true;
  deferredInstallPrompt = null;
  saveState();
  renderAll();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => undefined);
  });
}

attachEvents();
renderAll();
