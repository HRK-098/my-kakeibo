import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Settings,
  X,
  Undo2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchBudget,
  updateBudget,
  fetchTemplates,
  createTemplate,
  deleteTemplate,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  syncFixedExpenses,
  fetchSettlements,
  fetchAppSettings,
  updateAppSettings,
} from "./api";
import type {
  Transaction,
  Budget,
  Template,
  CategoryDef,
  Settlement,
  AppSettings,
} from "./types";
import Calendar from "./components/Calendar";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import CategoryChart, { PayerFilterBar } from "./components/CategoryChart";
import type { PayerFilter } from "./components/CategoryChart";
import SettlementCard from "./components/SettlementCard";
import MonthlyTrend from "./components/MonthlyTrend";
import YearlyTrend from "./components/YearlyTrend";
import SettingsView from "./components/SettingsView";
import "./App.css";
import ReceiptScanModal from "./components/ReceiptScanModal";

// --- トースト通知 ---
interface ToastData {
  id: number;
  message: string;
  type: "error" | "undo" | "success";
  onUndo?: () => void;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-[calc(1rem+var(--sat))] left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: () => void;
}) {
  const duration = toast.type === "undo" ? 5000 : 4000;

  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const bgColor =
    toast.type === "error"
      ? "bg-red-600"
      : toast.type === "success"
        ? "bg-emerald-600"
        : "bg-slate-800 dark:bg-slate-700";

  return (
    <div className="animate-slide-down relative overflow-hidden rounded-xl shadow-lg">
      <div
        className={`relative z-10 flex items-center gap-2 px-5 py-3 text-sm font-medium text-white ${bgColor}`}
      >
        <span className="flex-1">{toast.message}</span>
        {toast.type === "undo" && toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
          >
            <Undo2 size={12} />
            元に戻す
          </button>
        )}
        <button
          onClick={onDismiss}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      {/* ProgressBar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/30 z-20 animate-shrink"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

// --- メインアプリ ---
function App() {
  const [settings, setSettings] = useState<AppSettings>({
    user1_name: "ユーザー1",
    user2_name: "ユーザー2",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [timeframe, setTimeframe] = useState<"monthly" | "yearly">("monthly");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "stats" | "settings">(
    "home",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [payerFilter, setPayerFilter] = useState<PayerFilter>("all");
  const [statsSelectedCategory, setStatsSelectedCategory] = useState<
    string | null
  >(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const toastIdRef = useRef(0);

  // Pull-to-refresh
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback(
    (
      message: string,
      type: "error" | "undo" | "success",
      onUndo?: () => void,
    ) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, message, type, onUndo }]);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 今月のデータだけに絞り込む
  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getMonth() === currentMonth.getMonth() &&
      tDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  // 選択された日付の明細 (ホームタブ用)
  const selectedDateTransactions = filteredTransactions.filter(
    (t) => t.date === selectedDate,
  );

  // 統計タブのベースとなる取引
  const currentYearTransactions = transactions.filter(
    (t) => new Date(t.date).getFullYear() === currentMonth.getFullYear(),
  );

  const statsBaseTransactions =
    timeframe === "monthly" ? filteredTransactions : currentYearTransactions;

  // 支払者フィルタ
  const statsTransactions =
    payerFilter === "all"
      ? statsBaseTransactions
      : statsBaseTransactions.filter((t) => t.paidBy === payerFilter);

  // 今月の合計金額
  const monthlyTotal = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0,
  );

  // データ取得
  const loadData = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      try {
        // 起動時に固定費の同期（生成）を行う
        await syncFixedExpenses().catch((err) => {
          console.error("Fixed expense sync failed:", err);
        });

        const yearMonth = format(currentMonth, "yyyy-MM");
        const [txData, budgetData, tmpData, catData, settleData, settingsData] =
          await Promise.all([
            fetchTransactions(),
            fetchBudget(yearMonth).catch(() => null),
            fetchTemplates().catch(() => []),
            fetchCategories().catch(() => []),
            fetchSettlements().catch(() => []),
            fetchAppSettings().catch(() => ({})),
          ]);
        setTransactions(txData);
        setBudget(budgetData);
        setTemplates(tmpData);
        setCategories(catData);
        setSettlements(settleData);
        if (settingsData) {
          setSettings({
            user1_name: (settingsData as any).user1_name || "ユーザー1",
            user2_name: (settingsData as any).user2_name || "ユーザー2",
          });
        }
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "エラーが発生しました",
          "error",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentMonth, addToast],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 予算更新
  const handleUpdateBudget = async (amount: number) => {
    setIsUpdatingBudget(true);
    try {
      const yearMonth = format(currentMonth, "yyyy-MM");
      const newBudget = await updateBudget(yearMonth, amount);
      setBudget(newBudget);
      addToast("予算を保存しました", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "予算の保存に失敗しました";
      addToast(message, "error");
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  // 設定更新
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const updated = await updateAppSettings(newSettings as any);
      setSettings({
        user1_name: updated.user1_name || "ユーザー1",
        user2_name: updated.user2_name || "ユーザー2",
      });
      addToast("設定を更新しました", "success");
    } catch (err) {
      addToast("設定の更新に失敗しました", "error");
    }
  };

  const handleCreateTemplate = async (data: Omit<Template, "id">) => {
    try {
      await createTemplate(data);
      addToast("テンプレートを作成しました", "success");
      loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "テンプレート作成に失敗しました";
      addToast(message, "error");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await deleteTemplate(id);
      addToast("テンプレートを削除しました", "success");
      loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "テンプレート削除に失敗しました";
      addToast(message, "error");
    }
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = mainRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60 && !isRefreshing) {
      loadData(true);
    }
    pullStartY.current = null;
    setPullDistance(0);
  };

  // 保存
  const handleSubmit = async (data: Omit<Transaction, "id">) => {
    try {
      await createTransaction(data);
      loadData();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "保存に失敗しました",
        "error",
      );
    }
  };

  // 更新
  const handleUpdate = async (id: number, data: Omit<Transaction, "id">) => {
    try {
      await updateTransaction(id, data);
      loadData();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "更新に失敗しました",
        "error",
      );
    }
  };

  // 削除 (Undo付き)
  const handleDelete = async (id: number) => {
    const deletedTx = transactions.find((t) => t.id === id);
    if (!deletedTx) return;

    try {
      await deleteTransaction(id);
      loadData();

      addToast("明細を削除しました", "undo", async () => {
        try {
          const rest = { ...deletedTx };
          delete rest.id;
          await createTransaction(rest);
          loadData();
        } catch {
          addToast("復元に失敗しました", "error");
        }
      });
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "削除に失敗しました",
        "error",
      );
    }
  };

  const handleCreateCategory = async (data: Omit<CategoryDef, "id">) => {
    try {
      const saved = await createCategory(data);
      setCategories((prev) => [...prev, saved]);
      addToast("カテゴリーを追加しました", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "追加に失敗しました",
        "error",
      );
    }
  };

  const handleUpdateCategory = async (
    id: number,
    data: Omit<CategoryDef, "id">,
  ) => {
    try {
      const updated = await updateCategory(id, data);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      addToast("カテゴリーを更新しました", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "更新に失敗しました",
        "error",
      );
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      addToast("カテゴリーを削除しました", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "削除に失敗しました",
        "error",
      );
    }
  };

  const handleAddMultipleTransactions = async (
    items: {
      date: string;
      amount: number;
      category: string;
      description: string;
      paidBy: string;
      isSettlementTarget: boolean;
    }[],
  ) => {
    try {
      for (const item of items) {
        await createTransaction(item);
      }
      await loadData();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "取引の保存に失敗しました",
        "error",
      );
    }
  };

  // 予算プログレス
  const hasBudget = budget && budget.amount > 0;
  const budgetRatio = hasBudget
    ? Math.min(monthlyTotal / budget!.amount, 1)
    : 0;

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 font-sans text-slate-800 dark:text-slate-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh インジケータ */}
      {pullDistance > 0 && (
        <div
          className="flex justify-center items-center transition-all"
          style={{ height: `${pullDistance}px` }}
        >
          <RefreshCw
            size={20}
            className={`text-indigo-400 dark:text-indigo-500 transition-transform ${pullDistance > 60 ? "rotate-180" : ""}`}
          />
        </div>
      )}

      {/* リフレッシュ中 */}
      {isRefreshing && pullDistance === 0 && (
        <div className="flex justify-center py-2">
          <Loader2
            size={20}
            className="animate-spin text-indigo-400 dark:text-indigo-500"
          />
        </div>
      )}

      {/* トースト */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-md mx-auto pb-24">
        {/* ヘッダー */}
        <div
          className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 text-white px-6 pb-8 rounded-b-[2rem] shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/40 relative"
          style={{ paddingTop: "calc(2.5rem + var(--sat))" }}
        >
          <div className="flex justify-between items-center mb-6 mt-2">
            <h1 className="text-xl font-bold tracking-wide">
              {format(currentMonth, "yyyy年M月")}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div>
            <p className="text-indigo-200 text-xs font-medium mb-1">
              今月の合計支出
            </p>
            <p className="text-3xl font-black tabular-nums tracking-tight">
              ¥{monthlyTotal.toLocaleString()}
            </p>

            {/* 予算プログレスバー (ホームタブのみ表示) */}
            {hasBudget && activeTab === "home" && (
              <div className="mt-4 pt-4 border-t border-white/20 animate-fade-in">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-indigo-100">予算残高</span>
                  <span
                    className={
                      budgetRatio >= 1
                        ? "text-rose-300 font-bold"
                        : "text-white"
                    }
                  >
                    ¥
                    {Math.max(
                      budget!.amount - monthlyTotal,
                      0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      budgetRatio >= 1
                        ? "bg-rose-400"
                        : budgetRatio > 0.8
                          ? "bg-amber-400"
                          : "bg-white"
                    }`}
                    style={{ width: `${budgetRatio * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-indigo-200/80 mt-1">
                  <span>0%</span>
                  <span>
                    {Math.round(budgetRatio * 100)}% / ¥
                    {budget!.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* 統計タブの期間切り替え用トグル (ヘッダー内) */}
            {activeTab === "stats" && (
              <div className="mt-5 flex bg-black/20 p-1 rounded-xl animate-fade-in backdrop-blur-sm relative z-10 w-full max-w-[240px] mx-auto">
                <button
                  onClick={() => setTimeframe("monthly")}
                  className={`flex-1 text-sm font-bold py-1.5 rounded-lg transition-all duration-300 ${
                    timeframe === "monthly"
                      ? "bg-white text-indigo-600 shadow-sm scale-100"
                      : "text-indigo-100/70 hover:text-white scale-95"
                  }`}
                >
                  月間
                </button>
                <button
                  onClick={() => setTimeframe("yearly")}
                  className={`flex-1 text-sm font-bold py-1.5 rounded-lg transition-all duration-300 ${
                    timeframe === "yearly"
                      ? "bg-white text-indigo-600 shadow-sm scale-100"
                      : "text-indigo-100/70 hover:text-white scale-95"
                  }`}
                >
                  年間
                </button>
              </div>
            )}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div
          className={`px-4 space-y-4 ${activeTab === "stats" ? "mt-2" : "-mt-4"}`}
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-400" />
            </div>
          ) : activeTab === "home" ? (
            <>
              <Calendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                transactions={transactions}
                onSwipeLeft={() => setCurrentMonth(addMonths(currentMonth, 1))}
                onSwipeRight={() => setCurrentMonth(subMonths(currentMonth, 1))}
              />
              <TransactionForm
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onSubmit={handleSubmit}
                templates={templates}
                categories={categories}
                onOpenScanModal={() => setIsScanModalOpen(true)}
                settings={settings}
              />
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 px-1">
                  {format(new Date(selectedDate), "M月d日")}の明細
                </h3>
                <TransactionList
                  transactions={selectedDateTransactions}
                  categories={categories}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  showSearch={true}
                  emptyMessage="この日の明細はありません"
                  settings={settings}
                />
              </div>
            </>
          ) : activeTab === "stats" ? (
            <div className="space-y-4">
              <SettlementCard
                transactions={statsBaseTransactions}
                yearMonth={format(currentMonth, "yyyy-MM")}
                settlements={settlements}
                onSettled={(s) => setSettlements((prev) => [s, ...prev])}
                onDeleteSettlement={(id) =>
                  setSettlements((prev) => prev.filter((s) => s.id !== id))
                }
                settings={settings}
              />

              {/* 支払者フィルタ */}
              <PayerFilterBar
                value={payerFilter}
                onChange={setPayerFilter}
                settings={settings}
              />

              <CategoryChart
                transactions={statsTransactions}
                categories={categories}
                selectedCategory={statsSelectedCategory}
                onSelectCategory={setStatsSelectedCategory}
              />

              {timeframe === "monthly" ? (
                <MonthlyTrend
                  transactions={transactions}
                  currentMonth={currentMonth}
                />
              ) : (
                <YearlyTrend
                  transactions={transactions}
                  currentYear={currentMonth.getFullYear()}
                />
              )}

              {statsSelectedCategory ? (
                <div className="pt-2 animate-fade-in">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      「{statsSelectedCategory}」の内訳
                    </h3>
                    <button
                      onClick={() => setStatsSelectedCategory(null)}
                      className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full font-bold active:scale-95 transition-transform"
                    >
                      閉じる
                    </button>
                  </div>
                  <TransactionList
                    transactions={statsTransactions.filter(
                      (t) => t.category === statsSelectedCategory,
                    )}
                    categories={categories}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    emptyMessage={`${statsSelectedCategory}の明細はありません`}
                    showSearch={false}
                    settings={settings}
                  />
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    グラフの項目をタップすると内訳が表示されます
                  </p>
                </div>
              )}
            </div>
          ) : (
            <SettingsView
              currentMonth={currentMonth}
              budget={budget}
              categories={categories}
              onUpdateBudget={handleUpdateBudget}
              isUpdatingBudget={isUpdatingBudget}
              templates={templates}
              onCreateTemplate={handleCreateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onRefreshData={() => loadData(true)}
              addToast={(msg, type) => addToast(msg, type)}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </div>
      </div>

      {/* ボトムナビ */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-none"
        style={{ paddingBottom: "var(--sab)" }}
      >
        <div className="max-w-md mx-auto flex">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "home"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-semibold">ホーム</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "stats"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px] font-semibold">統計</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "settings"
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-semibold">設定</span>
          </button>
        </div>
      </div>
      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        categories={categories}
        onSuccess={(msg) => addToast(msg, "success")}
        onError={(msg) => addToast(msg, "error")}
        onAddTransactions={handleAddMultipleTransactions}
        defaultDate={selectedDate}
        settings={settings}
      />
    </div>
  );
}

export default App;
