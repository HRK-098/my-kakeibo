package com.github.hrk.kakeibo_backend.settlement;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
  List<Settlement> findAllByOrderBySettledAtDesc();
  Optional<Settlement> findByYearMonth(String yearMonth);
}
