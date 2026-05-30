import { categoriseTransaction, createId, duplicateKey, parseCsvRows } from "./bookkeeping.js";

export function importTransactionsFromCsv({
  csvText,
  accountName = "Uploaded Account",
  existingTransactions = [],
  rules,
  sourcePdfName = "Manual import",
  now = new Date().toISOString(),
  idFactory = () => createId("transaction")
}) {
  const rows = parseCsvRows(csvText, accountName);
  const existingKeys = new Set(existingTransactions.map(duplicateKey));
  const importedTransactions = [];
  let duplicateCount = 0;

  rows.forEach((row) => {
    const categorised = categoriseTransaction(row, rules);
    const transaction = {
      ...categorised,
      id: idFactory(),
      sourcePdfUrl: sourcePdfName,
      importedAt: now
    };
    const key = duplicateKey(transaction);

    if (existingKeys.has(key)) {
      duplicateCount += 1;
      return;
    }

    existingKeys.add(key);
    importedTransactions.unshift(transaction);
  });

  return {
    transactions: [...importedTransactions, ...existingTransactions],
    importedCount: importedTransactions.length,
    duplicateCount,
    parsedCount: rows.length
  };
}
