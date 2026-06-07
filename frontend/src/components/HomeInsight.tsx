import { useMemo } from "react";
import { TrendingUp, CalendarClock } from "lucide-react";
import type { Transaction, CategoryDef, FixedExpense } from "../types";

interface HomeInsightProps {
  transactions: Transaction[];
  categories: CategoryDef[];
  fixedExpenses: FixedExpense[];
}

export default function HomeInsight({ transactions, categories, fixedExpenses }: HomeInsightProps) {
  // カテゴリー別トップ支出
  const topCategory = useMemo(() => {
    if (transactions.length === 0) return null;
    const byCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const [name, amount] = entries[0];
    const catDef = categories.find((c) => c.name === name);
    return { name, amount, color: catDef?.color || "#6366f1" };
  }, [transactions, categories]);

  // 次回の固定費引き落とし
  const nextFixed = useMemo(() => {
    if (fixedExpenses.length === 0) return null;
    const today = new Date();
    const todayDay = today.getDate();
    // 今月まだ来ていない固定費を日付順にソート
    const upcoming = fixedExpenses
      .filter((e) => e.dayOfMonth > todayDay)
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    if (upcoming.length > 0) return upcoming[0];
    // 今月分が全部過ぎたなら来月の最初のもの
    const nextMonth = fixedExpenses.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    return nextMonth[0] || null;
  }, [fixedExpenses]);

  if (!topCategory && !nextFixed) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* トップカテゴリー */}
      {topCategory && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">今月最多</span>
          </div>
          <div
            className="text-sm font-bold mb-0.5"
            style={{ color: topCategory.color }}
          >
            {topCategory.name}
          </div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 tabular-nums">
            ¥{topCategory.amount.toLocaleString()}
          </div>
        </div>
      )}

      {/* 次回固定費 */}
      {nextFixed && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarClock size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">次の固定費</span>
          </div>
          <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-0.5 truncate">
            {nextFixed.name}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-slate-800 dark:text-slate-200 tabular-nums">
              ¥{nextFixed.amount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">{nextFixed.dayOfMonth}日</span>
          </div>
        </div>
      )}
    </div>
  );
}
