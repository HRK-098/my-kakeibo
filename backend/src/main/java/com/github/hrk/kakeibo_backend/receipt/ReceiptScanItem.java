package com.github.hrk.kakeibo_backend.receipt;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptScanItem {
  private String category;
  private Integer amount;
  private String description;
}
