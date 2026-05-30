import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES } from "../src/bookkeeping.js";
import { importTransactionsFromCsv } from "../src/workflow.js";

const fixedNow = "2026-05-29T00:00:00.000Z";
let idCounter = 0;
const idFactory = () => `transaction-${++idCounter}`;

test("imports parser CSV rows into categorised transactions with source metadata", () => {
  idCounter = 0;
  const result = importTransactionsFromCsv({
    csvText: `date,description,amount,account\n2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card\n2026-05-06,STRIPE PAYOUT,1250.00,Business Checking`,
    existingTransactions: [],
    rules: DEFAULT_RULES,
    sourcePdfName: "may-statement.pdf",
    now: fixedNow,
    idFactory
  });

  assert.equal(result.parsedCount, 2);
  assert.equal(result.importedCount, 2);
  assert.equal(result.duplicateCount, 0);
  assert.equal(result.transactions[0].sourcePdfUrl, "may-statement.pdf");
  assert.equal(result.transactions[0].importedAt, fixedNow);
  assert.ok(result.transactions.some((transaction) => transaction.category === "Cloud Hosting"));
  assert.ok(result.transactions.some((transaction) => transaction.transactionType === "Income"));
});

test("skips duplicates within the same upload and against existing transactions", () => {
  idCounter = 0;
  const first = importTransactionsFromCsv({
    csvText: `date,description,amount,account\n2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card`,
    existingTransactions: [],
    rules: DEFAULT_RULES,
    now: fixedNow,
    idFactory
  });

  const second = importTransactionsFromCsv({
    csvText: `date,description,amount,account\n2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card\n2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card`,
    existingTransactions: first.transactions,
    rules: DEFAULT_RULES,
    now: fixedNow,
    idFactory
  });

  assert.equal(second.parsedCount, 2);
  assert.equal(second.importedCount, 0);
  assert.equal(second.duplicateCount, 2);
  assert.equal(second.transactions.length, 1);
});

test("supports no-header bank exports as a compatibility version", () => {
  idCounter = 0;
  const result = importTransactionsFromCsv({
    csvText: `05/07/2026,Netflix.com,-15.49`,
    accountName: "Personal Checking",
    existingTransactions: [],
    rules: DEFAULT_RULES,
    now: fixedNow,
    idFactory
  });

  assert.equal(result.importedCount, 1);
  assert.equal(result.transactions[0].accountName, "Personal Checking");
  assert.equal(result.transactions[0].category, "Subscriptions");
  assert.equal(result.transactions[0].spendingContext, "Personal");
});
