package com.github.hrk.kakeibo_backend.settlement;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
public class Settlement {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "対象月は必須です") // "yyyy-MM" format
  private String yearMonth;

  private LocalDateTime settledAt;

  private Integer amountUser1;  // その月にユーザー1が支払った合計
  private Integer amountUser2;  // その月にユーザー2が支払った合計
  private Integer transferAmount; // 実際に渡した金額 (|diff|/2)
  private String transferFrom;   // 支払う側
  private String transferTo;     // 受け取る側

  private String note; // 任意メモ
}
