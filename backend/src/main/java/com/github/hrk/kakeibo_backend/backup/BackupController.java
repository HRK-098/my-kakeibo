package com.github.hrk.kakeibo_backend.backup;

import com.github.hrk.kakeibo_backend.category.CategoryDefRepository;
import com.github.hrk.kakeibo_backend.fixedexpense.FixedExpenseRepository;
import com.github.hrk.kakeibo_backend.template.TemplateRepository;
import com.github.hrk.kakeibo_backend.transaction.TransactionRepository;
import com.github.hrk.kakeibo_backend.settlement.SettlementRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class BackupController {

  @Autowired
  private CategoryDefRepository categoryRepository;
  @Autowired
  private FixedExpenseRepository fixedExpenseRepository;
  @Autowired
  private TemplateRepository templateRepository;
  @Autowired
  private TransactionRepository transactionRepository;
  @Autowired
  private SettlementRepository settlementRepository;

  @GetMapping("/export")
  public ResponseEntity<BackupData> exportData() {
    BackupData data = new BackupData(
      categoryRepository.findAll(),
      fixedExpenseRepository.findAll(),
      templateRepository.findAll(),
      transactionRepository.findAll(),
      settlementRepository.findAll()
    );
    return ResponseEntity.ok(data);
  }

  @PostMapping("/import")
  @Transactional
  public ResponseEntity<String> importData(@RequestBody BackupData data) {
    if (data == null) {
      return ResponseEntity.badRequest().body("データが不正です");
    }

    // 古いデータをすべて削除 (依存関係を考慮して削除)
    transactionRepository.deleteAll();
    settlementRepository.deleteAll();
    fixedExpenseRepository.deleteAll();
    templateRepository.deleteAll();
    categoryRepository.deleteAll();

    // 新しいデータを挿入
    if (data.getCategories() != null) categoryRepository.saveAll(data.getCategories());
    if (data.getFixedExpenses() != null) fixedExpenseRepository.saveAll(data.getFixedExpenses());
    if (data.getTemplates() != null) templateRepository.saveAll(data.getTemplates());
    if (data.getTransactions() != null) transactionRepository.saveAll(data.getTransactions());
    if (data.getSettlements() != null) settlementRepository.saveAll(data.getSettlements());

    return ResponseEntity.ok("データの復元が完了しました");
  }
}
