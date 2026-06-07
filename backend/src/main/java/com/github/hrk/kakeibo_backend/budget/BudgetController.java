package com.github.hrk.kakeibo_backend.budget;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class BudgetController {

  @Autowired
  private BudgetRepository repository;

  // 年月の予算を取得（未設定なら0円で返す）
  @GetMapping("/{yearMonth}")
  public ResponseEntity<Budget> getBudget(@PathVariable String yearMonth) {
    return repository.findById(yearMonth)
        .map(ResponseEntity::ok)
        .orElseGet(() -> {
          Budget b = new Budget();
          b.setYearMonth(yearMonth);
          b.setAmount(0); // 0は未設定扱い
          return ResponseEntity.ok(b);
        });
  }

  // 年月の予算を更新
  @PutMapping("/{yearMonth}")
  public ResponseEntity<?> updateBudget(@PathVariable String yearMonth, @Valid @RequestBody Budget budget) {
    if (!yearMonth.equals(budget.getYearMonth())) {
      return ResponseEntity.badRequest().body("URLとBODYのyearMonthが一致しません");
    }
    Budget saved = repository.save(budget);
    return ResponseEntity.ok(saved);
  }
}
