import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { scanReceipt } from "../api";
import type { ReceiptScanResult, ReceiptScanItem, CategoryDef, AppSettings } from "../types";

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryDef[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onAddTransactions: (
    items: {
      date: string;
      amount: number;
      category: string;
      description: string;
      paidBy: string;
      isSettlementTarget: boolean;
    }[],
  ) => Promise<void>;
  defaultDate: string;
  settings: AppSettings;
}

export default function ReceiptScanModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  onError,
  onAddTransactions,
  defaultDate,
  settings,
}: ReceiptScanModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);

  // 送信用フォームステート
  const [scanDate, setScanDate] = useState("");
  const [formItems, setFormItems] = useState<ReceiptScanItem[]>([]);
  const [paidBy, setPaidBy] = useState<string>("user1");
  const [isSettlementTarget, setIsSettlementTarget] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      return;
    }
    setIsScanning(true);
    try {
      const result = await scanReceipt(selectedFile);
      setScanResult(result);
      setScanDate(result.date || defaultDate);
      setFormItems(result.items);
      onSuccess("レシートを解析しました！");
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "レシートの解析に失敗しました";
      onError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptScanItem,
    value: string | number,
  ) => {
    setFormItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setFormItems((prev) => [
      ...prev,
      { category: categories[0]?.name || "", amount: 0, description: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRegister = async () => {
    if (formItems.length === 0) {
      return;
    }
    setIsSaving(true);
    try {
      // カテゴリごとに集計する
      const grouped: { [category: string]: { amount: number; descList: string[] } } = {};
      
      for (const item of formItems) {
        const cat = item.category || "未分類";
        if (!grouped[cat]) {
          grouped[cat] = { amount: 0, descList: [] };
        }
        grouped[cat].amount += Number(item.amount || 0);
        if (item.description && item.description.trim()) {
          grouped[cat].descList.push(item.description.trim());
        }
      }

      const newTxList = Object.keys(grouped).map((cat) => {
        const group = grouped[cat];
        // 商品名の重複を排除してカンマ区切りで結合
        const uniqueDescs = Array.from(new Set(group.descList));
        const combinedDesc = uniqueDescs.join(", ");
        
        return {
          date: scanDate || defaultDate,
          amount: group.amount,
          category: cat,
          description: combinedDesc || "レシート一括登録",
          paidBy,
          isSettlementTarget,
        };
      });

      await onAddTransactions(newTxList);
      onSuccess(`${newTxList.length}件の支出をカテゴリ毎にまとめて登録しました！`);
      onClose();
      // クリーンアップ
      setSelectedFile(null);
      setPreviewUrl(null);
      setScanResult(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "家計簿への登録に失敗しました";
      onError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCalculated = formItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              AI レシートスキャン
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* スクロール本体 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 画像アップローダー */}
          {!scanResult && !isScanning && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-all duration-200 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {previewUrl ? (
                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-60 mx-auto rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
                  />
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      画像を変更する
                    </button>
                    <button
                      onClick={handleScan}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-100 dark:shadow-none"
                    >
                      <Sparkles size={16} />
                      レシートを解析する
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <Upload size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      画像をドラッグ＆ドロップ
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      または、クリックしてファイルを選択
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 解析中のローディングアニメーション */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <Loader2
                className="animate-spin text-indigo-600 dark:text-indigo-400"
                size={40}
              />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  画像を解析中...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  日付や品名、金額を読み取っています
                </p>
              </div>
            </div>
          )}

          {/* 解析結果の編集・確認フォーム */}
          {scanResult && !isScanning && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex gap-4 items-start">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Receipt Thumbnail"
                    className="w-24 h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-700 shadow shrink-0"
                  />
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                      日付
                    </label>
                    <input
                      type="date"
                      value={scanDate}
                      onChange={(e) => setScanDate(e.target.value)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm w-full bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1">
                        支払者
                      </label>
                      <div className="flex gap-1">
                        {["user1", "user2"].map((user) => (
                          <button
                            key={user}
                            type="button"
                            onClick={() => setPaidBy(user)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              paidBy === user
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {user === "user1" ? settings.user1_name : settings.user2_name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setIsSettlementTarget(!isSettlementTarget)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                          isSettlementTarget
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                            : "bg-slate-50 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        <Check size={14} />
                        精算対象
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 明細項目リスト */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    抽出された項目
                  </h3>
                  <button
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} />
                    項目を追加
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-center bg-slate-50 dark:bg-slate-700/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700/40"
                    >
                      {/* メモ */}
                      <input
                        type="text"
                        value={item.description}
                        placeholder="商品名など"
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      />

                      {/* カテゴリ */}
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(index, "category", e.target.value)
                        }
                        className="w-[100px] px-1 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>

                      {/* 金額 */}
                      <div className="w-[100px] relative">
                        <input
                          type="number"
                          value={item.amount || ""}
                          placeholder="金額"
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "amount",
                              Number(e.target.value),
                            )
                          }
                          className="w-full pl-2 pr-5 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none text-right"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          円
                        </span>
                      </div>

                      {/* 削除 */}
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 合計確認 */}
              <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  合計入力金額
                </span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {totalCalculated.toLocaleString()} 円
                </span>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setScanResult(null);
              onClose();
            }}
            disabled={isSaving}
            className="px-4 py-2 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>

          {scanResult && (
            <button
              onClick={handleRegister}
              disabled={isSaving || formItems.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-100 dark:shadow-none disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  登録中...
                </>
              ) : (
                <>
                  <Check size={16} />
                  家計簿に登録
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
