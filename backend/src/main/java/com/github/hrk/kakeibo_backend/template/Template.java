package com.github.hrk.kakeibo_backend.template;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Entity
@Data
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "テンプレート名は必須です")
    private String name; // 例: "家賃"

    @NotBlank(message = "カテゴリは必須です")
    private String category;

    private Integer amount; // NULL可（毎回金額が違う場合があるため）

    private String description; // NULL可
}
