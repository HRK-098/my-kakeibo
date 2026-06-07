import { useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Trash2, Pencil, Check, X, Search } from "lucide-react";
import type { Transaction, CategoryDef, AppSettings } from "../types";

interface TransactionListProps {
  transactions: Transaction[];
  categories: CategoryDef[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: Omit<Transaction, "id">) => void;
  showSearch?: boolean;
  emptyMessage?: string;
  settings: AppSettings;
}

export default function TransactionList({
  transactions,
  categories,
  onDelete,
  onUpdate,
  showSearch = false,
  emptyMessage = "この月の明細はありません",
  settings,
}: TransactionListProps) {
  const getPayerName = (p: string) => {
    if (p === "user1") return settings.user1_name;
    if (p === "user2") return settings.user2_name;
    return p;
  };
  const [parent] = useAutoAnimate();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPayer, setFilterPayer] = useState("");

  const startEdit = (t: Transaction) => {
    if (!t.id) return;
    setEditingId(t.id);
    setExpandedId(null);
    setEditAmount(String(t.amount));
    setEditCategory(t.category);
    setEditDescription(t.description || "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (t: Transaction) => {
    if (!t.id || !editAmount) return;
    onUpdate(t.id, {
      date: t.date,
      amount: Number(editAmount),
      category: editCategory,
      paidBy: t.paidBy,
      description: editDescription,
    });
    setEditingId(null);
  };

  const toggleExpand = (id: number | undefined) => {
    if (!id) return;
    setExpandedId(expandedId === id ? null : id);
  };

  // 検索・チップフィルタ
  const filtered = transactions.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterPayer && t.paidBy !== filterPayer) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (t.category || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.paidBy || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // カテゴリーの選択肢（実際に使われているもの）
  const usedCategories = Array.from(new Set(transactions.map((t) => t.category))).sort();

  return (
    <div className="space-y-2" ref={parent}>
      {/* 検索バー */}
      {showSearch && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="カテゴリ・メモで検索..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-300 outline-none transition-shadow min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* カテゴリーチップ */}
          <div className="flex gap-1.5 flex-wrap">
            {usedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
            {["user1", "user2"].map((user) => (
              <button
                key={user}
                onClick={() => setFilterPayer(filterPayer === user ? "" : user)}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                  filterPayer === user
                    ? (user === "user1" ? "bg-rose-500 text-white" : "bg-sky-500 text-white")
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {getPayerName(user)}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">{searchQuery ? "🔍" : "📭"}</p>
          <p className="text-sm">{searchQuery ? "一致する明細はありません" : emptyMessage}</p>
        </div>
      ) : (
        filtered.map((t) => {
          const isEditing = editingId === t.id;
          const isExpanded = expandedId === t.id;

          return (
            <div
              key={t.id}
              className={`px-4 py-3.5 bg-white dark:bg-slate-800 border rounded-2xl shadow-sm transition-all duration-200 ${
                isEditing
                  ? "border-indigo-300 dark:border-indigo-500 shadow-md"
                  : "border-slate-100 dark:border-slate-700"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{t.date}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        t.paidBy === "user1"
                          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500 border border-rose-100 dark:border-rose-800"
                          : "bg-sky-50 dark:bg-sky-900/30 text-sky-500 border border-sky-100 dark:border-sky-800"
                      }`}
                    >
                      {getPayerName(t.paidBy || "")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-base focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                    <select
                      className="w-24 px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-base focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="メモ"
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-base focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                    <button
                      onClick={() => saveEdit(t)}
                      className="text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all min-h-[44px]"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-all min-h-[44px]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="flex justify-between items-center cursor-pointer active:opacity-70 transition-opacity"
                    onClick={() => toggleExpand(t.id)}
                  >
                    <div className="min-w-0">
                      <span className="text-xs text-slate-400 dark:text-slate-500 block">{t.date}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.category}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            t.paidBy === "user1"
                              ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500 border border-rose-100 dark:border-rose-800"
                              : "bg-sky-50 dark:bg-sky-900/30 text-sky-500 border border-sky-100 dark:border-sky-800"
                          }`}
                        >
                          {getPayerName(t.paidBy || "")}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{t.description}</p>
                      )}
                    </div>
                    <div className="text-base font-bold text-slate-700 dark:text-slate-200 tabular-nums shrink-0 ml-3">
                      ¥{t.amount.toLocaleString()}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => startEdit(t)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-95 transition-all min-h-[44px]"
                      >
                        <Pencil size={14} />
                        編集
                      </button>
                      <button
                        onClick={() => { t.id && onDelete(t.id); setExpandedId(null); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all min-h-[44px]"
                      >
                        <Trash2 size={14} />
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
