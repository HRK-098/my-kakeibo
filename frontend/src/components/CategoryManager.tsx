import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Plus, Trash2, Check, X, Pencil, Loader2 } from "lucide-react";
import type { CategoryDef } from "../types";

interface CategoryManagerProps {
  categories: CategoryDef[];
  onCreateCategory: (data: Omit<CategoryDef, "id">) => Promise<void>;
  onUpdateCategory: (id: number, data: Omit<CategoryDef, "id">) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

const AVAILABLE_COLORS = [
  "#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#ec4899", "#64748b", "#f97316", "#84cc16",
  "#94a3b8", "#ef4444", "#34d399", "#60a5fa"
];

const AVAILABLE_ICONS = [
  "Utensils", "ShoppingBag", "Train", "GlassWater", "Gamepad2",
  "Pill", "Shirt", "Home", "Zap", "Wifi", "MoreHorizontal",
  "Car", "Heart", "Briefcase", "Gift", "Coffee", "Music", "Book"
];

function RenderIcon({ name, ...props }: { name: string; size?: number; className?: string }) {
  const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <Icon {...props} />;
}

export default function CategoryManager({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(AVAILABLE_COLORS[0]);
  const [formIcon, setFormIcon] = useState(AVAILABLE_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startCreate = () => {
    setFormName("");
    setFormColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setFormIcon(AVAILABLE_ICONS[0]);
    setIsCreating(true);
    setEditingId(null);
  };

  const startEdit = (cat: CategoryDef) => {
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setEditingId(cat.id);
    setIsCreating(false);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSubmitting(true);
    try {
      if (isCreating) {
        await onCreateCategory({ name: formName, color: formColor, icon: formIcon });
      } else if (editingId) {
        await onUpdateCategory(editingId, { name: formName, color: formColor, icon: formIcon });
      }
      cancelForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">カテゴリー管理</h2>
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

      {(isCreating || editingId) && (
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリー名</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-indigo-300 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="例: サブスク"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">テーマカラー</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${formColor === color ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800 scale-110" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">アイコン</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 scrollbar-hide">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  className={`p-2 rounded-lg transition-all ${formIcon === icon ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 scale-110" : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                >
                  <RenderIcon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSubmitting || !formName.trim()}
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

      {!isCreating && !editingId && categories.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  <RenderIcon name={cat.icon} size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</div>
                  {cat.isDefault && <span className="text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">デフォルト</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => cat.id && onDeleteCategory(cat.id)}
                    className="p-2 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
