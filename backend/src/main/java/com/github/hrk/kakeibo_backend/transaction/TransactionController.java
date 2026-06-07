package com.github.hrk.kakeibo_backend.transaction;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class TransactionController {

  @Autowired
  private TransactionRepository repository;

  // 全件 or 日付範囲で取得
  @GetMapping
  public List<Transaction> getTransactions(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    if (from != null && to != null) {
      return repository.findByDateBetweenOrderByDateDesc(from, to);
    }
    return repository.findAllByOrderByDateDesc();
  }

  // 新規作成
  @PostMapping
  public ResponseEntity<?> createTransaction(@Valid @RequestBody Transaction transaction) {
    Transaction saved = repository.save(transaction);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  // 更新
  @PutMapping("/{id}")
  public ResponseEntity<?> updateTransaction(@PathVariable Long id,
      @Valid @RequestBody Transaction transaction) {
    transaction.setId(id);
    Transaction saved = repository.save(transaction);
    return ResponseEntity.ok(saved);
  }

  // 削除
  @DeleteMapping("/{id}")
  public void deleteTransaction(@PathVariable Long id) {
    repository.deleteById(id);
  }
}
