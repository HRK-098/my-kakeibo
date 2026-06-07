import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { format, subMonths } from "date-fns";
import type { Transaction } from "../types";

interface MonthlyTrendProps {
  transactions: Transaction[];
  currentMonth: Date;
}

export default function MonthlyTrend({ transactions, currentMonth }: MonthlyTrendProps) {
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(currentMonth, i);
      const m = month.getMonth();
      const y = month.getFullYear();

      const total = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        label: format(month, "M月"),
        total,
        isCurrent: i === 0,
      });
    }
    return months;
  }, [transactions, currentMonth]);

  const hasData = chartData.some((d) => d.total > 0);
  if (!hasData) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">月別推移</h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="25%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              hide
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`¥${Number(value || 0).toLocaleString()}`, "支出"]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "13px",
                backgroundColor: "#1e293b", // slate-800
              }}
              labelStyle={{ color: "#94a3b8" }} // slate-400
              itemStyle={{ color: "#f1f5f9" }} // slate-100
              cursor={{ fill: "transparent" }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCurrent ? "#6366f1" : "var(--tw-colors-indigo-200)"}
                  // Tailwindの色に合わせてdarkでの視認性を確保するなら
                  className={entry.isCurrent ? "fill-indigo-500" : "fill-indigo-100 dark:fill-indigo-900/50"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
