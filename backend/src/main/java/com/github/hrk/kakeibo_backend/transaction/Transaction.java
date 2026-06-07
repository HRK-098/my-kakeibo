package com.github.hrk.kakeibo_backend.transaction;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity
@Data
public class Transaction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "日付は必須です")
  private String date; // format: "yyyy-MM-dd"

  @NotNull(message = "金額は必須です")
  @Min(value = 1, message = "金額は1円以上で入力してください")
  private Integer amount;

  @NotBlank(message = "カテゴリは必須です")
  private String category;

  private String description;

  @NotBlank(message = "支払者は必須です")
  private String paidBy; // "user1" or "user2"

  private Boolean isSettlementTarget = true; // デフォルトは精算対象
}
