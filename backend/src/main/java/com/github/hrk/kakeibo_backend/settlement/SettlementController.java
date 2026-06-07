package com.github.hrk.kakeibo_backend.settlement;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settlements")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class SettlementController {

  @Autowired
  private SettlementRepository repository;

  @GetMapping
  public List<Settlement> getAll() {
    return repository.findAllByOrderBySettledAtDesc();
  }

  @PostMapping
  public ResponseEntity<Settlement> create(@RequestBody Settlement settlement) {
    settlement.setId(null);
    settlement.setSettledAt(LocalDateTime.now());
    return ResponseEntity.ok(repository.save(settlement));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable Long id) {
    if (!repository.existsById(id)) {
      return ResponseEntity.notFound().build();
    }
    repository.deleteById(id);
    return ResponseEntity.ok().build();
  }
}
