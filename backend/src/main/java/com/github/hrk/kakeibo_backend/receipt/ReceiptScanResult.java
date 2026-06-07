package com.github.hrk.kakeibo_backend.receipt;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptScanResult {
  private String date;
  private List<ReceiptScanItem> items;
  private Integer totalAmount;
}
