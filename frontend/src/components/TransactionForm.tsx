import { useState } from "react";
import {
  Plus,
  FileText,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import type { Transaction, Template, CategoryDef, AppSettings } from "../types";

interface TransactionFormProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSubmit: (data: Omit<Transaction, "id">) => void;
  templates: Template[];
  categories: CategoryDef[];
  onOpenScanModal?: () => void;
  settings: AppSettings;
}

export default function TransactionForm({
  selectedDate,
  onDateChange,
  onSubmit,
  templates,
  categories,
  onOpenScanModal,
  settings,
}: TransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [paidBy, setPaidBy] = useState<string>("user1");
  const [description, setDescription] = useState("");
  const [isSettlementTarget, setIsSettlementTarget] = useState(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeCategory = category || (categories[0]?.name ?? "");
    if (!amount || !activeCategory) return;
    onSubmit({
      date: selectedDate,
      amount: Number(amount),
      category: activeCategory,
      paidBy,
      description,
      isSettlementTarget,
    });
    setAmount("");
    setCategory("");
    setDescription("");
    setIsSettlementTarget(true);
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleApplyTemplate = (t: Template) => {
    setCategory(t.category);
    if (t.amount) setAmount(String(t.amount));
    setDescription(t.description || "");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">
            支出を追加
          </h2>
          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className="flex items-center gap-1 text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Sparkles size={10} className="text-indigo-500" />
              AIスキャン
            </button>
          )}
        </div>
        {/* 精算対象トグル */}
        <button
          type="button"
          onClick={() => setIsSettlementTarget(!isSettlementTarget)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-colors"
        >
          {isSettlementTarget ? (
            <ToggleRight
              className="text-indigo-500 dark:text-indigo-400"
              size={24}
            />
          ) : (
            <ToggleLeft
              className="text-slate-300 dark:text-slate-600"
              size={24}
            />
          )}
          精算対象
        </button>
      </div>

      {/* テンプレート表示 (横スクロール) */}
      {templates && templates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {templates.map((t) => (
            <button
              key={t.id || t.name}
              type="button"
              onClick={() => handleApplyTemplate(t)}
              className="flex items-center gap-1 whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform shrink-0"
            >
              <Sparkles size={12} />
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* 1行目: 日付 + 支払者トグル */}
      <div className="flex gap-2">
        <input
          type="date"
          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-[15px] focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-shadow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setPaidBy(paidBy === "user1" ? "user2" : "user1")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 min-h-[44px] ${
            paidBy === "user1"
              ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
              : "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50"
          }`}
        >
          {paidBy === "user1" ? settings.user1_name : settings.user2_name}
        </button>
      </div>

      {/* 2行目: 金額 + カテゴリ */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="numeric"
            placeholder="金額"
            className="w-full px-3 py-2 pr-7 border border-slate-200 dark:border-slate-600 rounded-xl text-[15px] focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-shadow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-h-[44px]"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 text-sm pointer-events-none">
            円
          </span>
        </div>
        <select
          className="w-[120px] px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-shadow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
          value={category || (categories[0]?.name ?? "")}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3行目: メモ + 送信 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <FileText
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="メモ（任意）"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-[15px] focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-shadow bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 min-h-[44px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all duration-200 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 flex items-center gap-1.5 min-h-[44px]"
        >
          <Plus size={16} />
          追加
        </button>
      </div>
    </form>
  );
}
