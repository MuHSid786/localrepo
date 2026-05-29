import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_RULES,
  categoriseTransaction,
  duplicateKey,
  parseAmount,
  parseCsvRows,
  proposeRuleFromCorrection,
  ruleMatches,
  summariseTransactions,
  toIsoDate
} from "../src/bookkeeping.js";

test("categorises transactions with approved merchant rules", () => {
  const transaction = categoriseTransaction(
    { transactionDate: "2026-05-01", description: "AWS AMAZON WEB SERVICES", amount: "-42.19" },
    DEFAULT_RULES
  );

  assert.equal(transaction.category, "Cloud Hosting");
  assert.equal(transaction.spendingContext, "Business");
  assert.equal(transaction.status, "Categorised");
  assert.ok(transaction.confidence > 0.9);
});

test("routes ambiguous rideshare transactions to review", () => {
  const transaction = categoriseTransaction(
    { transactionDate: "2026-05-03", description: "UBER TRIP HELP.UBER.COM", amount: "-24.72" },
    DEFAULT_RULES
  );

  assert.equal(transaction.category, "Transportation");
  assert.equal(transaction.spendingContext, "Needs Review");
  assert.equal(transaction.status, "Needs Review");
});

test("parses CSV parser output with header aliases", () => {
  const rows = parseCsvRows(`posted_date,merchant,debit,account\n05/03/2026,Uber Trip,24.72,Checking`);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].transactionDate, "05/03/2026");
  assert.equal(rows[0].description, "Uber Trip");
  assert.equal(Number(rows[0].amount), -24.72);
  assert.equal(rows[0].accountName, "Checking");
});

test("parses quoted CSV fields that contain commas", () => {
  const rows = parseCsvRows('date,description,amount,account\n2026-05-12,"Amazon Marketplace, Seattle",-63.20,"Business Card"');

  assert.equal(rows.length, 1);
  assert.equal(rows[0].description, "Amazon Marketplace, Seattle");
  assert.equal(rows[0].amount, "-63.20");
  assert.equal(rows[0].accountName, "Business Card");
});

test("detects header-only parser exports with merchant and posted-date aliases", () => {
  const rows = parseCsvRows(`Posted Date,Merchant,Amount\n13/05/2026,OpenAI API,USD 18.80 DR`, "Fallback Account");

  assert.equal(rows.length, 1);
  assert.equal(rows[0].transactionDate, "13/05/2026");
  assert.equal(rows[0].description, "OpenAI API");
  assert.equal(rows[0].amount, "USD 18.80 DR");
  assert.equal(rows[0].accountName, "Fallback Account");
});

test("parses multiple real-world amount formats", () => {
  assert.equal(parseAmount("($1,234.56)"), -1234.56);
  assert.equal(parseAmount("USD 42.19 DR"), -42.19);
  assert.equal(parseAmount("−17.50"), -17.5);
  assert.equal(parseAmount("42.19-"), -42.19);
  assert.equal(parseAmount("€1.234,56"), 1234.56);
  assert.equal(parseAmount("GBP 99.00 CR"), 99);
});

test("normalises ISO, US, and day-first international dates", () => {
  assert.equal(toIsoDate("2026-05-09"), "2026-05-09");
  assert.equal(toIsoDate("05/09/2026"), "2026-05-09");
  assert.equal(toIsoDate("13/05/2026"), "2026-05-13");
  assert.equal(toIsoDate("5-9-26"), "2026-05-09");
});

test("creates stable duplicate keys", () => {
  const first = categoriseTransaction({ transactionDate: "2026-05-04", description: "Whole Foods", amount: -88.13, accountName: "Checking" });
  const second = categoriseTransaction({ transactionDate: "2026-05-04", description: "Whole   Foods", amount: "($88.13)", accountName: "Checking" });

  assert.equal(duplicateKey(first), duplicateKey(second));
});

test("supports exact, contains, regex, unapproved, and invalid-regex rules", () => {
  const transaction = { description: "Netflix", cleanMerchant: "Netflix" };

  assert.equal(ruleMatches({ approvedByUser: true, matchType: "equals", matchValue: "Netflix" }, transaction), true);
  assert.equal(ruleMatches({ approvedByUser: true, matchType: "contains", matchValue: "flix" }, transaction), true);
  assert.equal(ruleMatches({ approvedByUser: true, matchType: "regex", matchValue: "net.*x" }, transaction), true);
  assert.equal(ruleMatches({ approvedByUser: false, matchType: "contains", matchValue: "Netflix" }, transaction), false);
  assert.equal(ruleMatches({ approvedByUser: true, matchType: "regex", matchValue: "[" }, transaction), false);
});

test("uses an exact approved user rule before heuristic inference", () => {
  const transaction = categoriseTransaction(
    { transactionDate: "2026-05-07", description: "Netflix", amount: -15.49 },
    [
      {
        id: "rule-netflix-business",
        matchType: "equals",
        matchValue: "Netflix",
        category: "Software",
        subcategory: "Training",
        spendingContext: "Business",
        deductibility: "100%",
        confidenceBoost: 0.25,
        approvedByUser: true
      },
      ...DEFAULT_RULES
    ]
  );

  assert.equal(transaction.category, "Software");
  assert.equal(transaction.spendingContext, "Business");
  assert.equal(transaction.ruleApplied, "Netflix");
});

test("summarises spend and review counts", () => {
  const transactions = [
    categoriseTransaction({ transactionDate: "2026-05-01", description: "AWS", amount: -42 }, DEFAULT_RULES),
    categoriseTransaction({ transactionDate: "2026-05-03", description: "Uber Trip", amount: -24 }, DEFAULT_RULES),
    categoriseTransaction({ transactionDate: "2026-05-06", description: "Stripe Payout", amount: 1000 }, DEFAULT_RULES)
  ];
  const summary = summariseTransactions(transactions);

  assert.equal(summary.expenses, 66);
  assert.equal(summary.income, 1000);
  assert.equal(summary.needsReview, 1);
  assert.ok(summary.topCategories.length > 0);
});

test("proposes approved reusable rules from corrections", () => {
  const rule = proposeRuleFromCorrection({
    id: "transaction-1",
    cleanMerchant: "Figma Design",
    category: "Software",
    subcategory: "Design Tools",
    spendingContext: "Business",
    deductibility: "100%"
  });

  assert.equal(rule.matchType, "contains");
  assert.equal(rule.matchValue, "FIGMA DESIGN");
  assert.equal(rule.approvedByUser, true);
});
