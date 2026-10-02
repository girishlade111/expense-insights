# expense-insights

A personal **expense analytics dashboard** built with React that reads your transaction data from a Google Sheet and visualizes it — category-wise spending pie chart, income-vs-expense stats, and a filterable transaction history table.

> **Built by Girish Lade** — https://ladestack.in

## Features

- **Live Google Sheets sync** — fetches rows from a Google Sheet (`Sheet1!A2:F`: dateTime, credit, debit, category, amount, notes) via the Sheets API v4, entirely client-side.
- **Category insights** — pie chart (Recharts) showing total spend per category, transaction counts, and percentages.
- **Overview stats** — total income, total expenses, net balance, transaction count, all formatted in INR.
- **Transaction history** — searchable/sortable table with All / Income / Expense filters.
- **Error & loading states** — friendly error message if the sheet ID, range, or API key is misconfigured.

## Tech stack

- Vite 5 + React 18 + TypeScript
- shadcn/ui (Radix primitives) + Tailwind CSS
- Recharts for charts
- Google Sheets API v4 (read-only, client-side API key)
- Originally generated with Lovable

## Quick start

```sh
npm install          # or npm i
npm run dev          # dev server on port 8080
```

Open the printed URL. To point the dashboard at your own sheet, edit the constants at the top of `src/pages/Index.tsx`:

```ts
const SHEET_ID = "your-sheet-id";
const API_KEY = "your-google-api-key";
const RANGE = "Sheet1!A2:F";
```

The sheet must be shared "Anyone with the link can view" for the client-side key to read it.

## Scripts

| Script      | Purpose                          |
|-------------|----------------------------------|
| `npm run dev`       | Start the dev server           |
| `npm run build`     | TypeScript + Vite production build → `dist/` |
| `npm run build:dev` | Development-mode production build |
| `npm run lint`      | ESLint                          |
| `npm run preview`   | Preview the production build    |

## Project structure

```
├── index.html            # app entry
├── public/               # static assets
├── src/
│   ├── pages/Index.tsx   # main dashboard page (Sheets fetch + charts + table)
│   ├── components/ui/    # shadcn-ui primitives
│   ├── hooks/            # use-mobile, use-toast
│   ├── lib/              # utilities
│   ├── App.tsx           # router shell
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig*.json
```

## Deploy notes

Fully static (client-side only — no server, no build-time secrets). The repo root on the default branch contains the production `dist/` build, served via **GitHub Pages**. The built app fetches data at runtime from Google Sheets; if the hard-coded demo sheet/key is unavailable, the app shows its error state. Replace the sheet constants above with your own.

## License

Free to use — built by Girish Lade (ladestack.in).
