import type {
  Transaction,
  Budget,
  Template,
  CategoryDef,
  FixedExpense,
  Settlement,
  ReceiptScanResult,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL || "";

export async function fetchTransactions(
  from?: string,
  to?: string,
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const query = params.toString();
  const url = `${API_URL}/api/transactions${query ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("データの取得に失敗しました");
  return res.json();
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "データの保存に失敗しました");
  }
  return res.json();
}

export async function updateTransaction(
  id: number,
  transaction: Omit<Transaction, "id">,
): Promise<Transaction> {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "データの更新に失敗しました");
  }
  return res.json();
}

export async function deleteTransaction(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("データの削除に失敗しました");
}

export async function migratePaidBy(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/transactions/migrate-paidby`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("マイグレーションに失敗しました");
  return res.json();
}

// 予算 (Budget)
export async function fetchBudget(yearMonth: string): Promise<Budget> {
  const res = await fetch(`${API_URL}/api/budgets/${yearMonth}`);
  if (!res.ok) throw new Error("予算の取得に失敗しました");
  return res.json();
}

export async function updateBudget(
  yearMonth: string,
  amount: number,
): Promise<Budget> {
  const res = await fetch(`${API_URL}/api/budgets/${yearMonth}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ yearMonth, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "予算の更新に失敗しました");
  }
  return res.json();
}

// テンプレート (Template)
export async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_URL}/api/templates`);
  if (!res.ok) throw new Error("テンプレートの取得に失敗しました");
  return res.json();
}

export async function createTemplate(
  template: Omit<Template, "id">,
): Promise<Template> {
  const res = await fetch(`${API_URL}/api/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "テンプレートの保存に失敗しました");
  }
  return res.json();
}

export async function deleteTemplate(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("テンプレートの削除に失敗しました");
}

// Categories
export async function fetchCategories(): Promise<CategoryDef[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createCategory(
  category: Omit<CategoryDef, "id">,
): Promise<CategoryDef> {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Failed to create category");
  return res.json();
}

export async function updateCategory(
  id: number,
  category: Omit<CategoryDef, "id">,
): Promise<CategoryDef> {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete category");
}

// Fixed Expenses
export async function fetchFixedExpenses(): Promise<FixedExpense[]> {
  const res = await fetch(`${API_URL}/api/fixed-expenses`);
  if (!res.ok) throw new Error("Failed to fetch fixed expenses");
  return res.json();
}

export async function createFixedExpense(
  expense: Omit<FixedExpense, "id">,
): Promise<FixedExpense> {
  const res = await fetch(`${API_URL}/api/fixed-expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error("Failed to create fixed expense");
  return res.json();
}

export async function updateFixedExpense(
  id: number,
  expense: Omit<FixedExpense, "id">,
): Promise<FixedExpense> {
  const res = await fetch(`${API_URL}/api/fixed-expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error("Failed to update fixed expense");
  return res.json();
}

export async function deleteFixedExpense(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/fixed-expenses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete fixed expense");
}

export async function syncFixedExpenses(): Promise<string> {
  const res = await fetch(`${API_URL}/api/fixed-expenses/sync`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync fixed expenses");
  return res.text();
}

// Settlements
export async function fetchSettlements(): Promise<Settlement[]> {
  const res = await fetch(`${API_URL}/api/settlements`);
  if (!res.ok) throw new Error("Failed to fetch settlements");
  return res.json();
}

export async function createSettlement(
  data: Omit<Settlement, "id" | "settledAt">,
): Promise<Settlement> {
  const res = await fetch(`${API_URL}/api/settlements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create settlement");
  return res.json();
}

export async function deleteSettlement(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/settlements/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete settlement");
}

// Backup & Restore
export async function exportData(): Promise<any> {
  const res = await fetch(`${API_URL}/api/backup/export`);
  if (!res.ok) throw new Error("データの書き出しに失敗しました");
  return res.json();
}

export async function importData(data: any): Promise<string> {
  const res = await fetch(`${API_URL}/api/backup/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => null);
    throw new Error(err || "データの復元に失敗しました");
  }
  return res.text();
}

export async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  const formDate = new FormData();
  formDate.append("file", file);

  const res = await fetch(`${API_URL}/api/receipt/scan`, {
    method: "POST",
    body: formDate,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "レシートの解析に失敗しました");
  }
  return res.json();
}

// Settings
export async function fetchAppSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/settings`);
  if (!res.ok) throw new Error("設定の取得に失敗しました");
  return res.json();
}

export async function updateAppSettings(
  settings: Record<string, string>,
): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("設定の更新に失敗しました");
  return res.json();
}
