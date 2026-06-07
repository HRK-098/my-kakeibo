package com.github.hrk.kakeibo_backend.fixedexpense;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FixedExpense {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "固定費の名称は必須です")
  private String name;

  @NotNull(message = "金額は必須です")
  @Min(value = 1, message = "金額は1以上である必要があります")
  private Integer amount;

  @NotBlank(message = "カテゴリーは必須です")
  private String category;

  private String description;

  @NotBlank(message = "支払者は必須です")
  private String paidBy;

  private Boolean isSettlementTarget = true;

  @NotNull(message = "引き落とし日は必須です")
  @Min(value = 1, message = "1日以降を指定してください")
  @Max(value = 31, message = "31日以前を指定してください")
  private Integer dayOfMonth;

  // e.g. "2024-03". If the job runs, it checks if current yearMonth > lastGeneratedMonth
  private String lastGeneratedMonth; 
}
