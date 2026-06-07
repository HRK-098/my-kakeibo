import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Moon, Sun, Monitor, Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { Budget, Template, CategoryDef, AppSettings } from "../types";
import CategoryManager from "./CategoryManager";
import FixedExpenseManager from "./FixedExpenseManager";
import BackupManager from "./BackupManager";

export type ThemeType = "light" | "dark" | "system";

interface SettingsViewProps {
  currentMonth: Date;
  budget: Budget | null;
  categories: CategoryDef[];
  onUpdateBudget: (amount: number) => Promise<void>;
  isUpdatingBudget: boolean;
  templates: Template[];
  onCreateTemplate: (data: Omit<Template, "id">) => Promise<void>;
  onDeleteTemplate: (id: number) => Promise<void>;
  onCreateCategory: (data: Omit<CategoryDef, "id">) => Promise<void>;
  onUpdateCategory: (
    id: number,
    data: Omit<CategoryDef, "id">,
  ) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onRefreshData: () => void;
  addToast: (message: string, type: "success" | "error") => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
}

export default function SettingsView({
  currentMonth,
  budget,
  categories,
  onUpdateBudget,
  isUpdatingBudget,
  templates,
  onCreateTemplate,
  onDeleteTemplate,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefreshData,
  addToast,
  settings,
  onUpdateSettings,
}: SettingsViewProps) {
  const [budgetInput, setBudgetInput] = useState("");
  const [theme, setTheme] = useState<ThemeType>("system");

  // Template Form State
  const [tempName, setTempName] = useState("");
  const [tempCategory, setTempCategory] = useState<string>("");
  const [tempAmount, setTempAmount] = useState("");
  const [isCreatingTemp, setIsCreatingTemp] = useState(false);

  // Set default category when categories list changes
  useEffect(() => {
    if (categories.length > 0 && !tempCategory) {
      setTempCategory(categories[0].name);
    }
  }, [categories, tempCategory]);

  // 初期ロード・Props更新時に入力欄を同期
  useEffect(() => {
    if (budget) {
      setBudgetInput(budget.amount > 0 ? String(budget.amount) : "");
    }
  }, [budget]);

  const [user1Input, setUser1Input] = useState("");
  const [user2Input, setUser2Input] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (settings) {
      setUser1Input(settings.user1_name);
      setUser2Input(settings.user2_name);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user1Input.trim() || !user2Input.trim()) return;
    setIsSavingSettings(true);
    try {
      await onUpdateSettings({
        user1_name: user1Input.trim(),
        user2_name: user2Input.trim(),
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // テーマの初期化 (localStorageから)
  useEffect(() => {
    const saved = localStorage.getItem("app_kakeibo_theme") as ThemeType | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  const handleApplyTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    if (newTheme === "system") {
      localStorage.removeItem("app_kakeibo_theme");
      const isOSDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (isOSDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      localStorage.setItem("app_kakeibo_theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(budgetInput, 10);
    if (isNaN(amt) || amt < 0) return;
    onUpdateBudget(amt);
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName) return;
    setIsCreatingTemp(true);
    await onCreateTemplate({
      name: tempName,
      category: tempCategory,
      amount: tempAmount ? parseInt(tempAmount, 10) : undefined,
    });
    setTempName("");
    setTempAmount("");
    setTempCategory(categories.length > 0 ? categories[0].name : "");
    setIsCreatingTemp(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ユーザー名設定 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">
          ユーザー名設定
        </h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                ユーザー1
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                value={user1Input}
                onChange={(e) => setUser1Input(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                ユーザー2
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                value={user2Input}
                onChange={(e) => setUser2Input(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSavingSettings}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isSavingSettings ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            ユーザー名を保存
          </button>
        </form>
      </section>
      {/* 予算設定 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          {format(currentMonth, "yyyy年M月")}の予算設定
        </h2>
        <form onSubmit={handleSaveBudget}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                inputMode="numeric"
                placeholder="予算額（未設定なら0）"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-base focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                円
              </span>
            </div>
            <button
              type="submit"
              disabled={isUpdatingBudget}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[72px] flex items-center justify-center rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isUpdatingBudget ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 固定費の自動登録 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <FixedExpenseManager
          categories={categories}
          templates={templates}
          onRefreshData={onRefreshData}
          addToast={addToast}
          settings={settings}
        />
      </section>

      {/* カテゴリー管理 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <CategoryManager
          categories={categories}
          onCreateCategory={onCreateCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      </section>

      {/* テンプレート管理 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">
          入力を楽にするテンプレート
        </h2>
        <form
          onSubmit={handleSaveTemplate}
          className="mb-4 flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="テンプレ名 (例: いつものローソン)"
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="金額(任意)"
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value)}
            />
            <select
              className="w-24 px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-indigo-300 outline-none bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              value={tempCategory}
              onChange={(e) => setTempCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isCreatingTemp || !tempName}
              className="bg-slate-800 dark:bg-slate-600 text-white px-3 mt-auto py-2 rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
            >
              {isCreatingTemp ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
            </button>
          </div>
        </form>

        {templates.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700"
              >
                <div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex gap-2">
                    <span className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                      {t.category}
                    </span>
                    {t.amount && <span>¥{t.amount.toLocaleString()}</span>}
                  </div>
                </div>
                <button
                  onClick={() => t.id && onDeleteTemplate(t.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* テーマ設定 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4">
          外観モード
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <ThemeButton
            icon={<Sun size={20} />}
            label="ライト"
            active={theme === "light"}
            onClick={() => handleApplyTheme("light")}
          />
          <ThemeButton
            icon={<Moon size={20} />}
            label="ダーク"
            active={theme === "dark"}
            onClick={() => handleApplyTheme("dark")}
          />
          <ThemeButton
            icon={<Monitor size={20} />}
            label="OS連動"
            active={theme === "system"}
            onClick={() => handleApplyTheme("system")}
          />
        </div>
      </section>

      {/* バックアップ設定 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <BackupManager onRefreshData={onRefreshData} addToast={addToast} />
      </section>

      {/* PWA インフォ */}
      <section className="text-center mt-6">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
          Kakeibo Web App
        </p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600">
          Off-line Ready PWA
        </p>
      </section>
    </div>
  );
}

function ThemeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
        active
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          : "border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"
      }`}
    >
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}
