package com.github.hrk.kakeibo_backend.template;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class TemplateController {

    @Autowired
    private TemplateRepository repository;

    @GetMapping
    public List<Template> getAllTemplates() {
        return repository.findAll();
    }

    @PostMapping
    public Template createTemplate(@Valid @RequestBody Template template) {
        return repository.save(template);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(@PathVariable Long id) {
        return repository.findById(id).map(temp -> {
            repository.delete(temp);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
