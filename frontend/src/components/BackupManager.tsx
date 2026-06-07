import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { exportData, importData } from "../api";

interface BackupManagerProps {
  onRefreshData: () => void;
  addToast: (message: string, type: "success" | "error") => void;
}

export default function BackupManager({ onRefreshData, addToast }: BackupManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kakeibo_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("バックアップをダウンロードしました", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "エクスポートに失敗しました", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (confirm("【警告】現在のすべてのデータが消去され、バックアップデータで上書きされます。\n\n本当によろしいですか？")) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.categories || !data.transactions) {
        throw new Error("無効なバックアップファイルです");
      }
      
      const resMsg = await importData(data);
      addToast(resMsg, "success");
      onRefreshData();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "インポートに失敗しました", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">データ管理 (バックアップ)</h3>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400">
        アプリ内の全データ（明細、カテゴリ、固定費、テンプレート、精算履歴）を JSON 形式で保存・復元できます。
      </p>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleExport}
          disabled={isExporting || isImporting}
          className="flex-1 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          エクスポート
        </button>

        <button
          onClick={handleImportClick}
          disabled={isExporting || isImporting}
          className="flex-1 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50"
        >
          {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          復元
        </button>
      </div>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
