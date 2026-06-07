import { useRef } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import type { Transaction } from "../types";

interface CalendarProps {
  currentMonth: Date;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  transactions: Transaction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export default function Calendar({ currentMonth, selectedDate, onSelectDate, transactions, onSwipeLeft, onSwipeRight }: CalendarProps) {
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const dailyTotals = new Map<string, number>();
  transactions.forEach((t) => {
    const current = dailyTotals.get(t.date) || 0;
    dailyTotals.set(t.date, current + t.amount);
  });

  // スワイプ検知
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-3 tracking-wider">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {calendarDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = selectedDate === dateStr;
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const dayTotal = dailyTotals.get(dateStr);
          const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl cursor-pointer transition-all duration-200
                ${isSelected
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 scale-105"
                  : isToday
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                }
                ${isCurrentMonth ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}
              `}
            >
              <span className="text-[13px] leading-5">{format(day, "d")}</span>
              {dayTotal && isCurrentMonth ? (
                <span
                  className={`text-[8px] leading-3 tabular-nums font-medium
                    ${isSelected ? "text-indigo-200" : "text-indigo-400 dark:text-indigo-300"}
                  `}
                >
                  {dayTotal >= 10000
                    ? `${Math.round(dayTotal / 1000)}k`
                    : `¥${dayTotal.toLocaleString()}`
                  }
                </span>
              ) : (
                <span className="text-[8px] leading-3">&nbsp;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
