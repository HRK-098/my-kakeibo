package com.github.hrk.kakeibo_backend;

import com.github.hrk.kakeibo_backend.category.CategoryDef;
import com.github.hrk.kakeibo_backend.category.CategoryDefRepository;
import com.github.hrk.kakeibo_backend.setting.AppSetting;
import com.github.hrk.kakeibo_backend.setting.AppSettingRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

  @Autowired
  private CategoryDefRepository categoryDefRepository;

  @Autowired
  private AppSettingRepository appSettingRepository;

  @Override
  public void run(String... args) throws Exception {
    // 1. デフォルトカテゴリのシード
    if (categoryDefRepository.count() == 0) {
      List<CategoryDef> defaults = List.of(
          new CategoryDef(null, "食費", "#f43f5e", "Utensils", true),
          new CategoryDef(null, "日用品", "#10b981", "ShoppingBag", true),
          new CategoryDef(null, "交通費", "#3b82f6", "Train", true),
          new CategoryDef(null, "交際費", "#f59e0b", "GlassWater", true),
          new CategoryDef(null, "趣味・娯楽", "#8b5cf6", "Gamepad2", true),
          new CategoryDef(null, "医療費", "#06b6d4", "Pill", true),
          new CategoryDef(null, "衣服・美容", "#ec4899", "Shirt", true),
          new CategoryDef(null, "住居", "#64748b", "Home", true),
          new CategoryDef(null, "水道・光熱費", "#f97316", "Zap", true),
          new CategoryDef(null, "通信費", "#84cc16", "Wifi", true),
          new CategoryDef(null, "その他", "#94a3b8", "MoreHorizontal", true)
      );
      categoryDefRepository.saveAll(defaults);
      System.out.println("Default categories seeded.");
    }

    // 2. デフォルトのユーザー名設定をシード
    if (appSettingRepository.count() == 0) {
      List<AppSetting> defaultSettings = List.of(
          new AppSetting("user1_name", "ユーザー1"),
          new AppSetting("user2_name", "ユーザー2")
      );
      appSettingRepository.saveAll(defaultSettings);
      System.out.println("Default app settings seeded.");
    }
  }
}
