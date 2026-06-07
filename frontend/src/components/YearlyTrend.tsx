import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { Transaction } from "../types";

interface YearlyTrendProps {
  transactions: Transaction[];
  currentYear: number;
}

export default function YearlyTrend({ transactions, currentYear }: YearlyTrendProps) {
  const chartData = useMemo(() => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const total = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        label: `${m + 1}月`,
        total,
      });
    }
    return months;
  }, [transactions, currentYear]);

  const hasData = chartData.some((d) => d.total > 0);
  if (!hasData) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 animate-fade-in">
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">{currentYear}年の年間推移</h2>
      <div className="h-48 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-colors-slate-200)" opacity={0.3} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickFormatter={(val) => `¥${(val / 10000)}w`} // 10,000 = 1w (万)
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`¥${Number(value || 0).toLocaleString()}`, "合計"]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "13px",
                backgroundColor: "#1e293b", // slate-800
              }}
              labelStyle={{ color: "#94a3b8" }} // slate-400
              itemStyle={{ color: "#f1f5f9" }} // slate-100
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={4}
              dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
