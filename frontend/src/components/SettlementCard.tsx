import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Transaction, Settlement, AppSettings } from "../types";
import { createSettlement, deleteSettlement } from "../api";

interface SettlementCardProps {
  transactions: Transaction[];
  yearMonth: string; // "yyyy-MM"
  settlements: Settlement[];
  onSettled: (newSettlement: Settlement) => void;
  onDeleteSettlement: (id: number) => void;
  settings: AppSettings;
}

export default function SettlementCard({
  transactions,
  yearMonth,
  settlements,
  onSettled,
  onDeleteSettlement,
  settings,
}: SettlementCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (transactions.length === 0 && settlements.length === 0) return null;

  const totalByUser = {
    user1: transactions
      .filter((t) => t.paidBy === "user1")
      .filter((t) => t.isSettlementTarget !== false)
      .reduce((sum, t) => sum + t.amount, 0),
    user2: transactions
      .filter((t) => t.paidBy === "user2")
      .filter((t) => t.isSettlementTarget !== false)
      .reduce((sum, t) => sum + t.amount, 0),
  };

  const myPaid = totalByUser.user1;
  const partnerPaid = totalByUser.user2;
  const diff = myPaid - partnerPaid;
  const settlementAmount = Math.abs(Math.round(diff / 2));
  const transferFrom = diff > 0 ? settings.user2_name : settings.user1_name;
  const transferTo = diff > 0 ? settings.user1_name : settings.user2_name;

  // 今月すでに精算済みか
  const existingSettlement = settlements.find((s) => s.yearMonth === yearMonth);

  const handleSettle = async () => {
    if (existingSettlement) return;
    setIsSaving(true);
    try {
      const newSettlement = await createSettlement({
        yearMonth,
        amountUser1: myPaid,
        amountUser2: partnerPaid,
        transferAmount: settlementAmount,
        transferFrom: settlementAmount > 0 ? transferFrom : "-",
        transferTo: settlementAmount > 0 ? transferTo : "-",
      });
      onSettled(newSettlement);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSettlement(id);
      onDeleteSettlement(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
          今月の精算
          {existingSettlement && (
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">精算済み</span>
          )}
        </h2>
        {settlements.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            履歴 ({settlements.length})
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* 支払い合計 */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-xl p-3 text-center">
          <span className="text-xs text-rose-500 dark:text-rose-400 font-semibold block">{settings.user1_name}</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            ¥{myPaid.toLocaleString()}
          </span>
        </div>
        <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-xl p-3 text-center">
          <span className="text-xs text-sky-500 dark:text-sky-400 font-semibold block">{settings.user2_name}</span>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            ¥{partnerPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 精算メッセージ + ボタン */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3">
        {settlementAmount > 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{transferFrom}</span>
            が
            <span className="font-bold text-indigo-600 dark:text-indigo-400"> {transferTo}</span>
            に
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 mx-1">
              ¥{settlementAmount.toLocaleString()}
            </span>
            を渡す
          </p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold text-center">✨ ぴったり折半です！</p>
        )}
      </div>

      {/* 精算記録ボタン */}
      {!existingSettlement && transactions.length > 0 && (
        <button
          onClick={handleSettle}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {settlementAmount > 0 ? `¥${settlementAmount.toLocaleString()} の精算を記録する` : "精算完了を記録する"}
        </button>
      )}

      {/* 履歴 */}
      {showHistory && settlements.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <div className="h-px bg-indigo-100 dark:bg-indigo-800/50" />
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">精算履歴</p>
          {settlements.map((s) => (
            <div key={s.id} className="bg-white dark:bg-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {s.yearMonth}
                  {s.transferAmount > 0
                    ? ` — ${s.transferFrom} → ${s.transferTo} ¥${s.transferAmount.toLocaleString()}`
                    : " — 折半"}
                </div>
                {s.settledAt && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {format(new Date(s.settledAt), "yyyy/MM/dd HH:mm")}に記録
                  </div>
                )}
              </div>
              <button
                onClick={() => s.id && handleDelete(s.id)}
                className="p-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
