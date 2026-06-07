package com.github.hrk.kakeibo_backend.backup;

import com.github.hrk.kakeibo_backend.category.CategoryDef;
import com.github.hrk.kakeibo_backend.fixedexpense.FixedExpense;
import com.github.hrk.kakeibo_backend.template.Template;
import com.github.hrk.kakeibo_backend.transaction.Transaction;
import com.github.hrk.kakeibo_backend.settlement.Settlement;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BackupData {
    private List<CategoryDef> categories;
    private List<FixedExpense> fixedExpenses;
    private List<Template> templates;
    private List<Transaction> transactions;
    private List<Settlement> settlements;
}
