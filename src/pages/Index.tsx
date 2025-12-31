import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const SHEET_ID = "1Armz9c9Tr1mXeGWymyhgUOhhw0cA_QvyTAcc2Q6uA9w";
const API_KEY = "AIzaSyDJ9pXCdrVBLO6xK-rbr4qf2CIAxLuy8JE"; // Public API key used client-side
const RANGE = "Sheet1!A2:F"; // Update this if your sheet/tab has a different name

interface ExpenseRow {
  dateTime: string;
  credit: string;
  debit: string;
  category: string;
  amount: number;
  notes: string;
}

interface CategoryStat {
  name: string;
  value: number; // total amount
  count: number; // number of transactions
}

type HistoryFilter = "all" | "income" | "expense";

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR" });

const Index = () => {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "table">("overview");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        setLoading(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
          RANGE,
        )}?key=${API_KEY}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Sheets API error: ${res.status}`);
        }
        const data = (await res.json()) as { values?: string[][] };
        const values = data.values ?? [];

        const mapped: ExpenseRow[] = values
          .filter((row) => row.length >= 5)
          .map((row) => ({
            dateTime: row[0] ?? "",
            credit: row[1] ?? "",
            debit: row[2] ?? "",
            category: row[3] ?? "",
            amount: Number(row[4] ?? 0) || 0,
            notes: row[5] ?? "",
          }));

        setRows(mapped);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Unable to load data from Google Sheets. Please check the sheet ID, range, and API key.");
      } finally {
        setLoading(false);
      }
    };

    fetchSheet();
  }, []);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    const amountByCategory = new Map<string, number>();
    const countByCategory = new Map<string, number>();

    for (const row of rows) {
      const isIncome = row.credit.trim() !== "";
      const isExpense = row.debit.trim() !== "";

      if (isIncome) totalIncome += row.amount;
      if (isExpense) totalExpense += row.amount;

      if (isExpense) {
        const key = row.category || "Uncategorized";
        amountByCategory.set(key, (amountByCategory.get(key) ?? 0) + row.amount);
        countByCategory.set(key, (countByCategory.get(key) ?? 0) + 1);
      }
    }

    const categoryData: CategoryStat[] = Array.from(amountByCategory.entries()).map(
      ([name, value]) => ({
        name,
        value,
        count: countByCategory.get(name) ?? 0,
      }),
    );

    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance, categoryData };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (historyFilter === "income") {
      return rows.filter((r) => r.credit.trim() !== "");
    }
    if (historyFilter === "expense") {
      return rows.filter((r) => r.debit.trim() !== "");
    }
    return rows;
  }, [rows, historyFilter]);

  const CATEGORY_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(40 98% 60%)",
    "hsl(280 80% 65%)",
    "hsl(330 75% 60%)",
    "hsl(120 70% 55%)",
  ];

  const handleShowIncome = () => {
    setHistoryFilter("income");
    setActiveTab("table");
  };

  const handleShowExpenses = () => {
    setHistoryFilter("expense");
    setActiveTab("table");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Matte Ledger</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Read-only expense history and analytics, synced directly from your Google Sheet.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className="border-border bg-secondary/40">
              View-only interface
            </Badge>
            <Badge variant="outline" className="border-border bg-secondary/40">
              Synced from Google Sheets
            </Badge>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "overview" | "table")}
          className="space-y-6"
        >
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="table">Transaction history</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary cards */}
            <section className="grid gap-4 md:grid-cols-3">
              <Card
                className="cursor-pointer border-border bg-card/80 transition-colors hover:bg-secondary/60"
                onClick={handleShowIncome}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Click to view only income transactions.</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer border-border bg-card/80 transition-colors hover:bg-secondary/60"
                onClick={handleShowExpenses}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight text-destructive">
                    {formatCurrency(stats.totalExpense)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Click to view only expense transactions.</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-2xl font-semibold tracking-tight"
                    style={{ color: stats.balance >= 0 ? "hsl(var(--accent))" : "hsl(var(--destructive))" }}
                  >
                    {formatCurrency(stats.balance)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Income minus expenses.</p>
                </CardContent>
              </Card>
            </section>

            {/* Analytics */}
            <section className="grid gap-4 md:grid-cols-2">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Expenses by category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-[240px]">
                    {stats.categoryData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No expense data available yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                          >
                            {stats.categoryData.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: 8,
                            }}
                            formatter={(value: number, _name, item) => [
                              formatCurrency(value),
                              (item?.payload as CategoryStat)?.name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Category cards with transaction counts */}
                  {stats.categoryData.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {stats.categoryData.map((cat, index) => (
                        <div
                          key={cat.name}
                          className="flex items-center justify-between rounded-md border border-border/70 bg-secondary/40 px-3 py-2 text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{cat.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {cat.count} transaction{cat.count === 1 ? "" : "s"}
                            </span>
                          </div>
                          <span className="text-xs font-semibold">
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recent activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px] pr-4">
                    <ul className="space-y-3 text-sm">
                      {rows.slice(0, 8).map((row, idx) => (
                        <li
                          key={`${row.dateTime}-${idx}`}
                          className="flex items-start justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{row.debit || row.credit || "Entry"}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.category || "Uncategorized"} • {row.dateTime}
                            </p>
                            {row.notes && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{row.notes}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right text-sm font-semibold">
                            <span
                              style={{
                                color:
                                  row.credit.trim() !== "" ? "hsl(var(--accent))" : "hsl(var(--destructive))",
                              }}
                            >
                              {row.credit.trim() !== "-" && row.credit.trim() !== ""
                                ? `+${formatCurrency(row.amount)}`
                                : `-${formatCurrency(row.amount)}`}
                            </span>
                          </div>
                        </li>
                      ))}

                      {rows.length === 0 && !loading && !error && (
                        <li className="text-xs text-muted-foreground">No rows available yet.</li>
                      )}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="table">
            <Card className="border-border bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Transaction history
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {historyFilter === "all" && "Showing all transactions from your sheet."}
                      {historyFilter === "income" && "Showing only income (credit) transactions."}
                      {historyFilter === "expense" && "Showing only expense (debit) transactions."}
                    </p>
                  </div>
                  {historyFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setHistoryFilter("all")}
                      className="rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[480px]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-background/80 backdrop-blur">
                      <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Date &amp; Time</th>
                        <th className="px-3 py-2 font-medium">Credit (Income)</th>
                        <th className="px-3 py-2 font-medium">Debit (Expense)</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                        <th className="px-3 py-2 font-medium">Purpose / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={`${row.dateTime}-${idx}`}
                          className="border-b border-border/40 last:border-0 odd:bg-secondary/20"
                        >
                          <td className="px-3 py-2 align-top text-xs text-muted-foreground">{row.dateTime}</td>
                          <td className="px-3 py-2 align-top text-sm">{row.credit || ""}</td>
                          <td className="px-3 py-2 align-top text-sm">{row.debit || ""}</td>
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">
                            {row.category || "Uncategorized"}
                          </td>
                          <td className="px-3 py-2 align-top text-right text-sm">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="px-3 py-2 align-top text-sm text-muted-foreground">{row.notes}</td>
                        </tr>
                      ))}

                      {filteredRows.length === 0 && !loading && !error && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-6 text-center text-xs text-muted-foreground"
                          >
                            No transactions match this view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {(loading || error) && (
          <section className="mt-2 text-xs text-muted-foreground">
            {loading && <p>Loading latest data from Google Sheets • This is a read-only view.</p>}
            {error && <p className="mt-1 text-destructive">{error}</p>}
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
