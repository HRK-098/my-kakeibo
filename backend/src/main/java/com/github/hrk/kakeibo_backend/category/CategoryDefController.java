package com.github.hrk.kakeibo_backend.category;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class CategoryDefController {

  @Autowired
  private CategoryDefRepository repository;

  @GetMapping
  public List<CategoryDef> getCategories() {
    return repository.findAll();
  }

  @PostMapping
  public ResponseEntity<CategoryDef> createCategory(@Valid @RequestBody CategoryDef category) {
    category.setId(null); // Ensure creation
    return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(category));
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryDef category) {
    CategoryDef existing = repository.findById(id).orElse(null);
    if (existing == null) {
      return ResponseEntity.notFound().build();
    }
    category.setId(id);
    // isDefault flag is usually preserved or immutable from clients, but simple save is fine.
    return ResponseEntity.ok(repository.save(category));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
    CategoryDef existing = repository.findById(id).orElse(null);
    if (existing != null && Boolean.TRUE.equals(existing.getIsDefault())) {
      return ResponseEntity.badRequest().body("デフォルトカテゴリーは削除できません");
    }
    repository.deleteById(id);
    return ResponseEntity.ok().build();
  }
}
