import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction, CategoryDef, AppSettings } from "../types";

interface CategoryChartProps {
  transactions: Transaction[];
  categories: CategoryDef[];
  selectedCategory?: string | null;
  onSelectCategory?: (cat: string | null) => void;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export default function CategoryChart({ transactions, categories, selectedCategory, onSelectCategory }: CategoryChartProps) {
  const chartData: ChartDataItem[] = categories.map((cat) => {
    const total = transactions
      .filter((t) => t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter((data) => data.value > 0);

  if (chartData.length === 0) return null;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">カテゴリ別</h2>
      <div className="flex items-center gap-4">
        {/* チャート */}
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => {
                  const isSelected = selectedCategory === entry.name;
                  const isFaded = selectedCategory && !isSelected;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      onClick={() => onSelectCategory?.(isSelected ? null : entry.name)}
                      className="cursor-pointer transition-opacity duration-300 outline-none"
                      style={{ opacity: isFaded ? 0.3 : 1 }}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => `¥${Number(value || 0).toLocaleString()}`}
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 凡例 */}
        <div className="flex-1 space-y-2">
          {chartData.map((item) => {
            const percentage = Math.round((item.value / total) * 100);
            const isSelected = selectedCategory === item.name;
            const isFaded = selectedCategory && !isSelected;
            return (
              <div 
                key={item.name} 
                className={`flex items-center justify-between text-sm cursor-pointer p-1.5 rounded-lg transition-all ${
                  isSelected ? "bg-slate-100 dark:bg-slate-700/50 ring-1 ring-slate-200 dark:ring-slate-600" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                }`}
                style={{ opacity: isFaded ? 0.4 : 1 }}
                onClick={() => onSelectCategory?.(isSelected ? null : item.name)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={`transition-colors ${isSelected ? "font-bold text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 dark:text-slate-500 text-xs">{percentage}%</span>
                  <span className={`tabular-nums ${isSelected ? "font-bold text-slate-800 dark:text-slate-100" : "font-semibold text-slate-700 dark:text-slate-200"}`}>
                    ¥{item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- 支払者フィルタ ---
export type PayerFilter = "all" | "user1" | "user2";

interface PayerFilterBarProps {
  value: PayerFilter;
  onChange: (v: PayerFilter) => void;
  settings: AppSettings;
}

export function PayerFilterBar({ value, onChange, settings }: PayerFilterBarProps) {
  const options: { label: string; key: PayerFilter }[] = [
    { label: "全体", key: "all" },
    { label: settings.user1_name, key: "user1" },
    { label: settings.user2_name, key: "user2" },
  ];

  return (
    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
            value === opt.key
              ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
