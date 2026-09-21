package com.shop.service;

import com.shop.dto.CatalogDtos.CategoryDto;
import com.shop.dto.CatalogDtos.CategoryWrite;
import com.shop.entity.Category;
import com.shop.exception.BusinessException;
import com.shop.mapper.CatalogMapper;
import com.shop.repository.CategoryRepository;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categories;
    private final CatalogMapper mapper;
    public CategoryService(CategoryRepository categories, CatalogMapper mapper) { this.categories = categories; this.mapper = mapper; }
    @Transactional(readOnly = true) public java.util.List<CategoryDto> list() { return categories.findAllByOrderBySortOrderAscIdAsc().stream().map(mapper::category).toList(); }
    @Transactional public CategoryDto create(CategoryWrite body) { String slug = slug(body.slug()); ensureSlugFree(slug, null); return mapper.category(categories.save(new Category(body.name().trim(), slug, trim(body.description()), value(body.sortOrder()), value(body.isActive(), true)))); }
    @Transactional public CategoryDto update(long id, CategoryWrite body) { Category c = get(id); String slug = slug(body.slug()); ensureSlugFree(slug, id); c.setSlug(slug); c.setDescription(trim(body.description())); c.setSortOrder(value(body.sortOrder())); c.setActive(value(body.isActive(), c.isActive())); c.setName(body.name().trim()); return mapper.category(categories.save(c)); }
    @Transactional public CategoryDto status(long id, boolean active) { Category c = get(id); c.setActive(active); return mapper.category(categories.save(c)); }
    private Category get(long id) { return categories.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found")); }
    private void ensureSlugFree(String slug, Long id) { categories.findBySlug(slug).filter(c -> id == null || !c.getId().equals(id)).ifPresent(c -> { throw new BusinessException(HttpStatus.CONFLICT, "CONFLICT", "Category slug already exists"); }); }
    static String slug(String v) { return v.trim().toLowerCase(Locale.ROOT); }
    static String trim(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
    static int value(Integer v) { return v == null ? 0 : v; }
    static boolean value(Boolean v, boolean fallback) { return v == null ? fallback : v; }
}
