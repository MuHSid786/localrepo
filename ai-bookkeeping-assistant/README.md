# AI Bookkeeping Assistant

A working mobile-first PWA MVP for turning uploaded statement PDFs and parser output into categorised bookkeeping insights. The app is local-first, installable on mobile, and designed to connect to Google Drive + Make.com/Zapier + Parseur/Nanonets when you add live automation credentials.

## What Is Implemented

- **PDF statement inbox:** upload one or more PDFs from any bank, card, or payment account and immediately log filename, size, timestamp, status, and parser forwarding result.
- **Parser handoff:** save a Make.com/Zapier webhook URL and the app will `POST` uploaded PDFs to it as `multipart/form-data` for extraction.
- **CSV transaction import:** paste extracted rows from Parseur, Nanonets, Make.com, Zapier, or a bank CSV export.
- **Automatic categorisation:** transactions are normalised, duplicate-checked, matched against approved merchant rules, and then classified with deterministic bookkeeping heuristics.
- **Review queue:** ambiguous, low-confidence, or tax-sensitive transactions appear in a mobile-friendly review flow.
- **Learning from input:** user corrections can create approved merchant rules, and future matching transactions use those rules before inference.
- **Spending dashboard:** view total spend, business spend, personal spend, review count, and top category bars.
- **Portable mobile front end:** responsive PWA shell with a manifest, service worker, large tap targets, bottom navigation, and local persistence.


## Beginner Manual

If you are new to the app, start with the step-by-step beginner guide:

- [Beginner Manual](docs/BEGINNER_MANUAL.md)

The manual explains how to run the app, load sample data, upload PDFs, connect a parser webhook, import CSV rows, review transactions, create learned rules, and troubleshoot common issues.

## Run Locally

```bash
npm start
```

Then open <http://localhost:4173>.

No build step is required because the MVP is plain HTML, CSS, and JavaScript modules.

## Test

```bash
npm test
```

The tests cover categorisation, CSV parsing, quoted merchant fields, parser header aliases, multiple currency and debit/credit amount formats, US and day-first dates, duplicate detection, exact/contains/regex rules, spending summaries, rule creation, and PWA static asset wiring.

## Product Flow

```text
Upload statement PDF
  -> Log file in mobile inbox
  -> Optional parser webhook POST
  -> Paste/import extracted CSV rows
  -> Normalise transactions
  -> Apply approved merchant rules
  -> Categorise remaining rows
  -> Review uncertain items
  -> Save corrections as reusable rules
  -> Refresh spending dashboard
```

## CSV Format

The importer accepts common headers and aliases such as:

```csv
date,description,amount,account
2026-05-01,AWS AMAZON WEB SERVICES,-42.19,Business Card
2026-05-03,UBER TRIP HELP.UBER.COM,-24.72,Checking
```

It also recognises `posted_date`, `merchant`, `memo`, `debit`, `credit`, `withdrawal`, `deposit`, and `account_name` style headers.

## Live Automation Setup

1. Create a Google Drive folder for statement PDFs.
2. In Make.com or Zapier, watch that folder for new files.
3. Send each PDF to Parseur, Nanonets, or another document parser.
4. Return extracted rows as CSV matching the import format, or paste them into the app during the MVP stage.
5. Optionally set the app's parser webhook URL so mobile uploads can forward PDFs directly to your automation scenario.
6. Review uncertain transactions and approve merchant rules to improve future imports.

## Data and Privacy Notes

- This MVP stores data in browser `localStorage`; use a hosted database before production multi-device sync.
- Original PDFs are not permanently stored by the app; uploaded file metadata is logged locally.
- AI/tax classifications are organisational aids and should be reviewed before tax filing.
- For production, add authentication, encrypted storage, server-side parser callbacks, and provider-specific LLM calls.
