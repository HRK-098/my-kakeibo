package com.github.hrk.kakeibo_backend.budget;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Entity
@Data
public class Budget {

  @Id
  @NotBlank(message = "対象月は必須です")
  private String yearMonth; // format: "yyyy-MM"

  @NotNull(message = "予算金額は必須です")
  @Min(value = 0, message = "予算金額は0以上で入力してください")
  private Integer amount;

}
