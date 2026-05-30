# Beginner Manual: AI Bookkeeping Assistant

This manual explains how to use the AI Bookkeeping Assistant MVP if you are new to bookkeeping tools, parser automations, or PWAs.

## 1. What This App Does

The app helps you turn bank or card statement data into spending insights.

In plain English:

1. You upload or log statement PDFs.
2. A parser tool, such as Parseur or Nanonets, extracts transaction rows from the PDFs.
3. You paste those extracted rows into the app as CSV.
4. The app categorises each transaction using approved rules and built-in heuristics.
5. You review uncertain transactions.
6. When you correct a transaction, the app can learn a reusable merchant rule for next time.
7. The dashboard updates with spending totals and top categories.

The MVP stores data in your browser only. For production use, connect it to a backend database and authentication.

## 2. Start the App

Open a terminal in the project folder and run:

```bash
npm start
```

Then open this address in your browser:

```text
http://localhost:4173
```

If you are on a phone, open the app once from a reachable local machine or static web location. After you install it to the home screen, the app shell can open as a standalone app without keeping that original host running. Internet is still needed for Google Drive, parser webhooks, and AI/automation calls.

## 3. Install It as a Standalone Mobile App

The **Setup** tab guides you through installation.

### Android Chrome

1. Open the app URL in Chrome.
2. Tap **Install app** in the app header, or open the Chrome menu and tap **Add to Home screen**.
3. Confirm the install.
4. Open **Bookkeeping AI** from the home screen.

### iPhone Safari

1. Open the app URL in Safari.
2. Tap the Share button.
3. Tap **Add to Home Screen**.
4. Confirm the name and tap **Add**.
5. Open **Bookkeeping AI** from the home screen.

Once installed, the interface loads from the phone like an app. Uploading PDFs to automations, opening Google, and using parser/LLM services still require internet.

## 4. Learn the Main Tabs

The bottom navigation has seven tabs:

| Tab | What It Is For |
| --- | --- |
| **Setup** | Guides mobile install, Google Drive folder setup, parser webhook setup, and LLM route setup. |
| **Insights** | Shows total spend, business spend, personal spend, transactions needing review, and top categories. |
| **Inbox** | Uploads and logs statement PDFs from any account. |
| **Import** | Accepts extracted transaction rows as CSV. |
| **Review** | Lets you fix uncertain transactions and teach the assistant. |
| **Rules** | Shows approved merchant rules and lets you add or delete rules. |
| **Settings** | Saves parser webhook and LLM provider notes. |

## 5. First-Time Demo Without Any Real Bank Data

Use this path to safely test the app:

1. Open the **Import** tab.
2. Tap **Load sample**.
3. Tap **Categorise rows**.
4. Open the **Insights** tab to see spending totals.
5. Open the **Review** tab to inspect uncertain items, such as rideshare or Amazon transactions.
6. Change a category, spending context, or deductibility value.
7. Leave **Learn this correction as an approved merchant rule** checked if you want future matching merchants to be categorised the same way.
8. Tap **Save correction**.
9. Open the **Rules** tab to see the new learned rule.

## 6. Upload a Statement PDF

1. Open the **Inbox** tab.
2. Tap **Choose PDFs from any account**.
3. Select one or more PDF statements.
4. Confirm they appear in the **Statement log**.

If no webhook is configured, the app still logs the PDF metadata locally. This is useful while testing.

## 7. Connect Google Drive and Parser Automation

The MVP does not directly read the PDF itself. It is designed to hand PDFs to an automation service. Start in **Setup** and save your Google account email, Drive folder URL, parser provider, webhook URL, and LLM route.

A simple automation setup is:

```text
Google Drive folder
  -> Make.com or Zapier watches new PDFs
  -> Parseur or Nanonets extracts transaction rows
  -> You paste the extracted CSV into the Import tab
```

Optional direct-upload flow:

1. Create a Make.com or Zapier webhook that accepts `multipart/form-data`.
2. Send the uploaded file to Parseur, Nanonets, or another document parser.
3. Copy the webhook URL.
4. Open **Settings** in the app.
5. Paste the URL into **Make/Zapier parser webhook URL** in **Setup**.
6. Choose the parser and LLM route.
7. Tap **Save connections**.
8. Upload a PDF in **Inbox** and confirm the status changes to **Sent to parser** or **Parser error**.

## 8. Import Extracted CSV Rows

Open **Import** and paste rows like this:

```csv
date,description,amount,account
2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card
2026-05-03,UBER TRIP HELP.UBER.COM,-24.72,Checking
```

Supported column names include:

- `date`
- `transaction_date`
- `posted_date`
- `description`
- `merchant`
- `memo`
- `details`
- `amount`
- `debit`
- `credit`
- `withdrawal`
- `deposit`
- `account`
- `account_name`

The app ignores duplicates using account, date, amount, and description.

## 9. Review and Teach the Assistant

The **Review** tab is where accuracy improves.

For each uncertain transaction:

1. Read the merchant, amount, confidence, and justification.
2. Choose the correct category.
3. Choose whether it is **Business**, **Personal**, **Mixed**, or **Needs Review**.
4. Choose deductibility: **100%**, **Partial**, **0%**, or **Unknown**.
5. Keep the learning checkbox on if this correction should become a future rule.
6. Tap **Save correction**.

Example:

If you change `FIGMA DESIGN` to:

- Category: `Software`
- Context: `Business`
- Deductibility: `100%`

The app can create a rule so future `FIGMA DESIGN` rows are classified automatically.

## 10. Add Rules Manually

Use this when you already know a merchant should always be categorised a certain way.

1. Open **Rules**.
2. Enter a merchant phrase, such as `GITHUB`.
3. Pick a category.
4. Pick a spending context.
5. Tap **Add rule**.

Rules are applied before the built-in heuristics, so your rules take priority.

## 11. Common Troubleshooting

| Problem | What To Try |
| --- | --- |
| No dashboard data appears | Import CSV rows first. |
| PDF uploads but nothing extracts | Add a parser webhook or paste parser CSV manually. |
| A transaction is categorised wrong | Fix it in Review and save it as a rule. |
| Duplicate rows are missing | The app intentionally skips duplicates. Change date, amount, account, or description if the row is genuinely different. |
| Amount signs look wrong | Make sure expenses are negative, or use debit/credit columns. |
| Data disappeared | The MVP uses browser localStorage. Do not clear site data unless you want to reset. |

## 12. Reset the Demo

Tap **Reset demo** in the header to clear local statements, transactions, settings, and learned rules back to the starter state.

## 13. Safety Notes

- Review tax-sensitive categories before relying on them.
- Do not treat automated deductibility labels as professional tax advice.
- Use fake or sample data while testing parser automations.
- Add authentication and encrypted storage before using this as a shared production system.
