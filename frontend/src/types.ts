export interface CategoryDef {
  id: number;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export const USER_IDS = ["user1", "user2"] as const;
export type UserId = (typeof USER_IDS)[number];
export type User = string;

export interface AppSettings {
  user1_name: string;
  user2_name: string;
}

export interface Transaction {
  id?: number;
  date: string;
  amount: number;
  category: string;
  paidBy: User | string;
  description?: string;
  isSettlementTarget?: boolean;
}

export interface Template {
  id?: number;
  name: string;
  category: string;
  amount?: number;
  description?: string;
}

export interface FixedExpense {
  id?: number;
  name: string;
  amount: number;
  category: string;
  description?: string;
  paidBy: string;
  isSettlementTarget: boolean;
  dayOfMonth: number;
  lastGeneratedMonth?: string;
}

export interface Settlement {
  id?: number;
  yearMonth: string;
  settledAt?: string;
  amountUser1: number;
  amountUser2: number;
  transferAmount: number;
  transferFrom: string;
  transferTo: string;
  note?: string;
}

export interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "undo";
  onUndo?: () => void;
}

export interface Budget {
  yearMonth: string;
  amount: number;
}

export interface ReceiptScanItem {
  category: string;
  amount: number;
  description: string;
}

export interface ReceiptScanResult {
  date: string | null;
  items: ReceiptScanItem[];
  totalAmount: number;
}
