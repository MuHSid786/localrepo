export const DEFAULT_CATEGORIES = [
  "Software",
  "Cloud Hosting",
  "Income",
  "Meals",
  "Travel",
  "Transportation",
  "Groceries",
  "Office Supplies",
  "Subscriptions",
  "Transfer",
  "Personal",
  "Utilities",
  "Healthcare",
  "Taxes",
  "Needs Review"
];

export const DEFAULT_RULES = [
  {
    id: "rule-aws",
    matchType: "contains",
    matchValue: "AWS",
    category: "Cloud Hosting",
    subcategory: "Infrastructure",
    spendingContext: "Business",
    deductibility: "100%",
    confidenceBoost: 0.28,
    approvedByUser: true,
    source: "starter"
  },
  {
    id: "rule-openai",
    matchType: "contains",
    matchValue: "OPENAI",
    category: "Software",
    subcategory: "AI Tools",
    spendingContext: "Business",
    deductibility: "100%",
    confidenceBoost: 0.25,
    approvedByUser: true,
    source: "starter"
  },
  {
    id: "rule-vercel",
    matchType: "contains",
    matchValue: "VERCEL",
    category: "Cloud Hosting",
    subcategory: "Application Hosting",
    spendingContext: "Business",
    deductibility: "100%",
    confidenceBoost: 0.25,
    approvedByUser: true,
    source: "starter"
  }
];

const HEURISTICS = [
  {
    tokens: ["PAYROLL", "STRIPE PAYOUT", "SHOPIFY PAYOUT", "DEPOSIT"],
    category: "Income",
    subcategory: "Deposits",
    spendingContext: "Business",
    deductibility: "0%",
    transactionType: "Income",
    confidence: 0.82
  },
  {
    tokens: ["UBER", "LYFT", "TAXI"],
    category: "Transportation",
    subcategory: "Rideshare",
    spendingContext: "Needs Review",
    deductibility: "Unknown",
    transactionType: "Expense",
    confidence: 0.58
  },
  {
    tokens: ["STARBUCKS", "RESTAURANT", "CAFE", "MCDONALD", "DOORDASH"],
    category: "Meals",
    subcategory: "Food & Drink",
    spendingContext: "Needs Review",
    deductibility: "Unknown",
    transactionType: "Expense",
    confidence: 0.55
  },
  {
    tokens: ["AMAZON", "STAPLES", "OFFICE DEPOT"],
    category: "Office Supplies",
    subcategory: "Supplies",
    spendingContext: "Needs Review",
    deductibility: "Unknown",
    transactionType: "Expense",
    confidence: 0.62
  },
  {
    tokens: ["NETFLIX", "HULU", "SPOTIFY", "DISNEY"],
    category: "Subscriptions",
    subcategory: "Entertainment",
    spendingContext: "Personal",
    deductibility: "0%",
    transactionType: "Expense",
    confidence: 0.86
  },
  {
    tokens: ["WHOLE FOODS", "SAFEWAY", "KROGER", "GROCERY", "TRADER JOE"],
    category: "Groceries",
    subcategory: "Household",
    spendingContext: "Personal",
    deductibility: "0%",
    transactionType: "Expense",
    confidence: 0.88
  },
  {
    tokens: ["ELECTRIC", "WATER", "COMCAST", "INTERNET", "VERIZON", "AT&T"],
    category: "Utilities",
    subcategory: "Utilities",
    spendingContext: "Mixed",
    deductibility: "Partial",
    transactionType: "Expense",
    confidence: 0.68
  },
  {
    tokens: ["TRANSFER", "PAYMENT THANK YOU", "AUTOPAY"],
    category: "Transfer",
    subcategory: "Internal Movement",
    spendingContext: "Personal",
    deductibility: "0%",
    transactionType: "Transfer",
    confidence: 0.74
  }
];

export function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normaliseText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normaliseMerchant(description) {
  const cleaned = normaliseText(description)
    .replace(/\b(POS|DEBIT|CARD|PURCHASE|ONLINE|RECURRING|PAYMENT)\b/gi, "")
    .replace(/[*#][A-Z0-9-]+/gi, "")
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || normaliseText(description) || "Unknown Merchant";
}

export function parseAmount(value) {
  if (typeof value === "number") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const normalised = raw.replace(/−/g, "-");
  const isNegative =
    normalised.includes("(") ||
    normalised.startsWith("-") ||
    normalised.endsWith("-") ||
    /\b(DR|DEBIT|WITHDRAWAL)\b/i.test(normalised);

  let numericText = normalised
    .replace(/\b(USD|EUR|GBP|CAD|AUD|NZD|JPY|CHF|CR|CREDIT|DR|DEBIT|WITHDRAWAL)\b/gi, "")
    .replace(/[^0-9.,-]/g, "")
    .replace(/-/g, "");

  const lastComma = numericText.lastIndexOf(",");
  const lastDot = numericText.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1 && lastComma > lastDot) {
    numericText = numericText.replace(/\./g, "").replace(",", ".");
  } else if (lastComma > -1 && lastDot === -1) {
    const decimalComma = /,\d{1,2}$/.test(numericText);
    numericText = decimalComma ? numericText.replace(",", ".") : numericText.replace(/,/g, "");
  } else {
    numericText = numericText.replace(/,/g, "");
  }

  const numeric = Number(numericText);
  if (Number.isNaN(numeric)) return 0;
  return isNegative ? -Math.abs(numeric) : numeric;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function formatDateParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toIsoDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return todayIsoDate();

  const isoParts = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoParts) {
    const [, yearText, monthText, dayText] = isoParts;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    return isValidDateParts(year, month, day) ? formatDateParts(year, month, day) : todayIsoDate();
  }

  const numericParts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericParts) {
    const [, firstText, secondText, yearText] = numericParts;
    const first = Number(firstText);
    const second = Number(secondText);
    const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
    const month = first > 12 && second <= 12 ? second : first;
    const day = first > 12 && second <= 12 ? first : second;
    return isValidDateParts(year, month, day) ? formatDateParts(year, month, day) : todayIsoDate();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? todayIsoDate() : parsed.toISOString().slice(0, 10);
}

export function duplicateKey(transaction) {
  return [
    transaction.accountName || "Unknown Account",
    transaction.transactionDate,
    Number(transaction.amount || 0).toFixed(2),
    normaliseText(transaction.description).toUpperCase()
  ].join("|");
}

export function ruleMatches(rule, transaction) {
  if (!rule?.approvedByUser) return false;
  const fields = [transaction.description, transaction.cleanMerchant]
    .map((field) => normaliseText(field).toUpperCase())
    .filter(Boolean);
  const haystack = fields.join(" ");
  const needle = normaliseText(rule.matchValue).toUpperCase();
  if (!needle) return false;

  if (rule.matchType === "equals") return fields.some((field) => field === needle);
  if (rule.matchType === "regex") {
    try {
      return new RegExp(rule.matchValue, "i").test(haystack);
    } catch {
      return false;
    }
  }
  return haystack.includes(needle);
}

export function categoriseTransaction(rawTransaction, rules = DEFAULT_RULES) {
  const transaction = {
    ...rawTransaction,
    transactionDate: toIsoDate(rawTransaction.transactionDate || rawTransaction.date),
    description: normaliseText(rawTransaction.description),
    cleanMerchant: rawTransaction.cleanMerchant || normaliseMerchant(rawTransaction.description),
    amount: parseAmount(rawTransaction.amount)
  };

  const matchingRule = rules.find((rule) => ruleMatches(rule, transaction));
  if (matchingRule) {
    return {
      ...transaction,
      transactionType: transaction.amount > 0 ? "Income" : "Expense",
      category: matchingRule.category,
      subcategory: matchingRule.subcategory || "Rule Match",
      spendingContext: matchingRule.spendingContext,
      deductibility: matchingRule.deductibility,
      confidence: Math.min(0.99, 0.72 + Number(matchingRule.confidenceBoost || 0.2)),
      justification: `Matched approved rule for “${matchingRule.matchValue}”.`,
      ruleApplied: matchingRule.matchValue,
      status: "Categorised"
    };
  }

  const upperDescription = transaction.description.toUpperCase();
  const heuristic = HEURISTICS.find((candidate) =>
    candidate.tokens.some((token) => upperDescription.includes(token))
  );

  if (heuristic) {
    return {
      ...transaction,
      transactionType: transaction.amount > 0 ? "Income" : heuristic.transactionType,
      category: heuristic.category,
      subcategory: heuristic.subcategory,
      spendingContext: heuristic.spendingContext,
      deductibility: heuristic.deductibility,
      confidence: heuristic.confidence,
      justification: `Classified from merchant pattern: ${heuristic.tokens.find((token) => upperDescription.includes(token))}.`,
      ruleApplied: "Heuristic inference",
      status: heuristic.confidence < 0.72 || heuristic.spendingContext === "Needs Review" ? "Needs Review" : "Categorised"
    };
  }

  return {
    ...transaction,
    transactionType: transaction.amount > 0 ? "Income" : "Expense",
    category: transaction.amount > 0 ? "Income" : "Needs Review",
    subcategory: "Unclassified",
    spendingContext: transaction.amount > 0 ? "Business" : "Needs Review",
    deductibility: transaction.amount > 0 ? "0%" : "Unknown",
    confidence: 0.35,
    justification: "No approved rule or known pattern matched this merchant.",
    ruleApplied: "None",
    status: "Needs Review"
  };
}

export function parseCsvRows(csvText, fallbackAccountName = "Uploaded Account") {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const splitCsvLine = (line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const knownHeaders = [
    "date",
    "transactiondate",
    "posteddate",
    "description",
    "details",
    "memo",
    "merchant",
    "amount",
    "debit",
    "credit",
    "withdrawal",
    "deposit",
    "outflow",
    "inflow",
    "account",
    "accountname"
  ];
  const hasHeader = headers.some((header) => knownHeaders.includes(header));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = splitCsvLine(line);
    const get = (...names) => {
      if (!hasHeader) return "";
      const index = headers.findIndex((header) => names.includes(header));
      return index >= 0 ? cells[index] : "";
    };

    const debit = parseAmount(get("debit", "withdrawal", "outflow"));
    const credit = parseAmount(get("credit", "deposit", "inflow"));
    const amount = get("amount") || (credit ? credit : debit ? -Math.abs(debit) : cells[2]);

    return {
      transactionDate: hasHeader ? get("date", "transactiondate", "posteddate") : cells[0],
      description: hasHeader ? get("description", "memo", "merchant", "details") : cells[1],
      amount,
      accountName: hasHeader ? get("account", "accountname") || fallbackAccountName : fallbackAccountName,
      currency: hasHeader ? get("currency") || "USD" : "USD"
    };
  });
}

export function summariseTransactions(transactions) {
  const totals = transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (amount < 0) summary.expenses += Math.abs(amount);
      if (amount > 0) summary.income += amount;
      if (transaction.spendingContext === "Business" && amount < 0) summary.business += Math.abs(amount);
      if (transaction.spendingContext === "Personal" && amount < 0) summary.personal += Math.abs(amount);
      if (transaction.status === "Needs Review") summary.needsReview += 1;
      summary.byCategory[transaction.category] = (summary.byCategory[transaction.category] || 0) + Math.abs(amount);
      return summary;
    },
    { income: 0, expenses: 0, business: 0, personal: 0, needsReview: 0, byCategory: {} }
  );

  return {
    ...totals,
    netCashflow: totals.income - totals.expenses,
    topCategories: Object.entries(totals.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  };
}

export function proposeRuleFromCorrection(transaction) {
  return {
    id: createId("rule"),
    matchType: "contains",
    matchValue: normaliseMerchant(transaction.cleanMerchant || transaction.description).split(" ").slice(0, 3).join(" ").toUpperCase(),
    category: transaction.category,
    subcategory: transaction.subcategory || "User Corrected",
    spendingContext: transaction.spendingContext,
    deductibility: transaction.deductibility,
    confidenceBoost: 0.25,
    approvedByUser: true,
    source: `Correction from ${transaction.id || "transaction"}`
  };
}
