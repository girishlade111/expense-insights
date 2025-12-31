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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR" });

const Index = () => {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const totalIncome = rows
      .filter((r) => r.credit.trim() !== "")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = rows
      .filter((r) => r.debit.trim() !== "")
      .reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpense;

    const byCategory = new Map<string, number>();
    rows
      .filter((r) => r.debit.trim() !== "")
      .forEach((r) => {
        const key = r.category || "Uncategorized";
        byCategory.set(key, (byCategory.get(key) ?? 0) + r.amount);
      });

    const categoryData = Array.from(byCategory.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    return { totalIncome, totalExpense, balance, categoryData };
  }, [rows]);

  const CATEGORY_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(40 98% 60%)",
    "hsl(280 80% 65%)",
    "hsl(330 75% 60%)",
    "hsl(120 70% 55%)",
  ];

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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="table">Full history</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total income</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight text-destructive">
                    {formatCurrency(stats.totalExpense)}
                  </p>
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
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Expenses by category
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
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
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Full expense history
                </CardTitle>
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
                      {rows.map((row, idx) => (
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

                      {rows.length === 0 && !loading && !error && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-6 text-center text-xs text-muted-foreground"
                          >
                            No rows available yet.
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
