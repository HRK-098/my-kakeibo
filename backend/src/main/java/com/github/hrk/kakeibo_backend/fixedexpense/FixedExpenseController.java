package com.github.hrk.kakeibo_backend.fixedexpense;

import com.github.hrk.kakeibo_backend.transaction.Transaction;
import com.github.hrk.kakeibo_backend.transaction.TransactionRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fixed-expenses")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class FixedExpenseController {

  @Autowired
  private FixedExpenseRepository repository;

  @Autowired
  private TransactionRepository transactionRepository;

  @GetMapping
  public List<FixedExpense> getFixedExpenses() {
    return repository.findAll();
  }

  @PostMapping
  public ResponseEntity<FixedExpense> createFixedExpense(@Valid @RequestBody FixedExpense expense) {
    expense.setId(null);
    return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(expense));
  }

  @PutMapping("/{id}")
  public ResponseEntity<FixedExpense> updateFixedExpense(@PathVariable Long id, @Valid @RequestBody FixedExpense expense) {
    if (!repository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    expense.setId(id);
    return ResponseEntity.ok(repository.save(expense));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteFixedExpense(@PathVariable Long id) {
    if (!repository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    repository.deleteById(id);
    return ResponseEntity.ok().build();
  }

  /**
   * 起動時や定期実行される「追いつき生成処理」
   * 未生成の月があれば、自動的に取引明細(Transaction)を追加する。
   */
  @PostMapping("/sync")
  public ResponseEntity<?> syncFixedExpenses() {
    List<FixedExpense> expenses = repository.findAll();
    LocalDate today = LocalDate.now();
    YearMonth currentMonth = YearMonth.from(today);
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

    int generatedCount = 0;

    for (FixedExpense expense : expenses) {
      // どこまで生成済みか（nullなら先月まで生成済みとして今月から生成開始）
      String lastGenMonthStr = expense.getLastGeneratedMonth();
      YearMonth startMonth;
      if (lastGenMonthStr == null || lastGenMonthStr.isEmpty()) {
        startMonth = currentMonth;
      } else {
        startMonth = YearMonth.parse(lastGenMonthStr, formatter).plusMonths(1);
      }

      // 未生成の月（startMonth）から現在の月（currentMonth）までループ
      while (!startMonth.isAfter(currentMonth)) {
        // もし生成対象の月の「指定日」がまだ来ていなければ生成しない（今月分で指定日が未来の場合）
        LocalDate targetDate;
        try {
          targetDate = startMonth.atDay(expense.getDayOfMonth());
        } catch (java.time.DateTimeException e) {
          // 2月31日のような不正日付は月末日とする
          targetDate = startMonth.atEndOfMonth();
        }

        if (targetDate.isAfter(today)) {
          break; // まだその日が来ていないので以降の月もスキップ
        }

        // 取引を生成
        Transaction t = new Transaction();
        t.setAmount(expense.getAmount());
        t.setCategory(expense.getCategory());
        t.setDate(targetDate.format(DateTimeFormatter.ISO_LOCAL_DATE));
        t.setPaidBy(expense.getPaidBy());
        t.setDescription((expense.getDescription() == null || expense.getDescription().isEmpty()) ? expense.getName() : expense.getDescription());
        t.setIsSettlementTarget(expense.getIsSettlementTarget() != null ? expense.getIsSettlementTarget() : true);
        
        transactionRepository.save(t);
        generatedCount++;

        expense.setLastGeneratedMonth(startMonth.format(formatter));
        repository.save(expense);

        startMonth = startMonth.plusMonths(1);
      }
    }

    return ResponseEntity.ok("同期完了: " + generatedCount + "件の固定費が自動登録されました");
  }
}
