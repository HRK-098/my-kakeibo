import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X, Pencil, Loader2, CalendarClock } from "lucide-react";
import type { FixedExpense, CategoryDef, Template, AppSettings } from "../types";
import { fetchFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense, syncFixedExpenses } from "../api";

interface FixedExpenseManagerProps {
  categories: CategoryDef[];
  templates: Template[];
  onRefreshData: () => void;
  addToast: (message: string, type: "success" | "error") => void;
  settings: AppSettings;
}

export default function FixedExpenseManager({
  categories,
  templates,
  onRefreshData,
  addToast,
  settings,
}: FixedExpenseManagerProps) {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPaidBy, setFormPaidBy] = useState("user1");
  const [formDayOfMonth, setFormDayOfMonth] = useState("1");
  const [formIsSettlementTarget, setFormIsSettlementTarget] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !formCategory) {
      setFormCategory(categories[0].name);
    }
  }, [categories, formCategory]);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await fetchFixedExpenses();
      setExpenses(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "固定費の取得に失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const startCreate = () => {
    setFormName("");
    setFormAmount("");
    setFormCategory(categories.length > 0 ? categories[0].name : "");
    setFormPaidBy("user1");
    setFormDayOfMonth("1");
    setFormIsSettlementTarget(true);
    setIsCreating(true);
    setEditingId(null);
  };

  const startEdit = (exp: FixedExpense) => {
    setFormName(exp.name);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    setFormPaidBy(exp.paidBy);
    setFormDayOfMonth(String(exp.dayOfMonth));
    setFormIsSettlementTarget(exp.isSettlementTarget);
    setEditingId(exp.id || null);
    setIsCreating(false);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAmount || isNaN(parseInt(formAmount)) || isNaN(parseInt(formDayOfMonth))) return;
    setIsSubmitting(true);
    try {
      const data: Omit<FixedExpense, "id"> = {
        name: formName,
        amount: parseInt(formAmount, 10),
        category: formCategory,
        paidBy: formPaidBy,
        dayOfMonth: parseInt(formDayOfMonth, 10),
        isSettlementTarget: formIsSettlementTarget,
      };

      if (isCreating) {
        await createFixedExpense(data);
        addToast("固定費を追加しました", "success");
      } else if (editingId) {
        await updateFixedExpense(editingId, data);
        addToast("固定費を更新しました", "success");
      }
      
      cancelForm();
      await syncAndRefresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "保存に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("本当にこの固定費を削除しますか？")) return;
    try {
      await deleteFixedExpense(id);
      addToast("固定費を削除しました", "success");
      await syncAndRefresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "削除に失敗しました", "error");
    }
  };

  const syncAndRefresh = async () => {
    try {
      await syncFixedExpenses();
    } catch (err) {
      console.error("Sync failed:", err);
    }
    await loadExpenses();
    onRefreshData(); // App.tsxのデータをリロード
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <CalendarClock size={20} className="text-indigo-500" />
          固定費の自動登録
        </h2>
        {!isCreating && !editingId && (
          <button
            onClick={startCreate}
            className="text-xs flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-bold active:scale-95 transition-transform"
          >
            <Plus size={14} />
            追加
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
        毎月の指定した日付に、自動で明細が登録されます。
      </p>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {(isCreating || editingId) && (
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-4 animate-fade-in">
              {templates.length > 0 && isCreating && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">テンプレートから入力</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
                    onChange={(e) => {
                      const t = templates.find(x => x.id === Number(e.target.value));
                      if (t) {
                        setFormName(t.name);
                        setFormAmount(t.amount ? String(t.amount) : "");
                        if (categories.some(c => c.name === t.category)) {
                          setFormCategory(t.category);
                        }
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>テンプレートを選択してください</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (¥{t.amount?.toLocaleString() || "未設定"})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">名称</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 家賃、Netflix"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">金額</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">円</span>
                  </div>
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-slate-500 mb-1">引き落とし日</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      value={formDayOfMonth}
                      onChange={(e) => setFormDayOfMonth(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">日</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリー</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">支払者</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    value={formPaidBy}
                    onChange={(e) => setFormPaidBy(e.target.value)}
                  >
                    <option value="user1">{settings.user1_name}</option>
                    <option value="user2">{settings.user2_name}</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formIsSettlementTarget}
                  onChange={(e) => setFormIsSettlementTarget(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">精算対象に含める</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !formName || !formAmount}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-sm flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  保存
                </button>
                <button
                  onClick={cancelForm}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-xl text-sm flex justify-center items-center gap-2 active:scale-95 transition-all"
                >
                  <X size={16} />
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {!isCreating && !editingId && expenses.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{exp.name}</span>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                        毎月{exp.dayOfMonth}日
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex gap-2">
                      <span>¥{exp.amount.toLocaleString()}</span>
                      <span>・</span>
                      <span>{exp.category}</span>
                      <span>・</span>
                      <span className={exp.paidBy === "user1" ? "text-blue-500" : "text-pink-500"}>
                        {exp.paidBy === "user1" ? settings.user1_name : (exp.paidBy === "user2" ? settings.user2_name : exp.paidBy)}
                      </span>
                      {!exp.isSettlementTarget && <span className="text-amber-500 ml-auto">精算対象外</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(exp)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => exp.id && handleDelete(exp.id)}
                      className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
