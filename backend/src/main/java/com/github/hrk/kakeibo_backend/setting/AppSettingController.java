package com.github.hrk.kakeibo_backend.setting;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AppSettingController {

  @Autowired
  private AppSettingRepository repository;

  @GetMapping
  public ResponseEntity<Map<String, String>> getSettings() {
    Map<String, String> settings = repository.findAll().stream()
        .collect(Collectors.toMap(AppSetting::getSettingKey, AppSetting::getSettingValue));
    return ResponseEntity.ok(settings);
  }

  @PutMapping
  public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> newSettings) {
    List<AppSetting> settingsToSave = newSettings.entrySet().stream()
        .map(entry -> new AppSetting(entry.getKey(), entry.getValue()))
        .toList();
    repository.saveAll(settingsToSave);
    
    // Return all settings after update
    Map<String, String> settings = repository.findAll().stream()
        .collect(Collectors.toMap(AppSetting::getSettingKey, AppSetting::getSettingValue));
    return ResponseEntity.ok(settings);
  }
}
