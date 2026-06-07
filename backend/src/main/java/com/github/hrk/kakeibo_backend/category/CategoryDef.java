package com.github.hrk.kakeibo_backend.category;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDef {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "カテゴリー名は必須です")
  private String name;

  @NotBlank(message = "色は必須です")
  private String color; // 例: "#f43f5e"

  @NotBlank(message = "アイコンは必須です")
  private String icon; // 例: "Utensils"

  private Boolean isDefault = false; // trueなら削除不可などのシステム連携用
}
