package com.github.hrk.kakeibo_backend.transaction;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

  List<Transaction> findAllByOrderByDateDesc();

  List<Transaction> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);
}
