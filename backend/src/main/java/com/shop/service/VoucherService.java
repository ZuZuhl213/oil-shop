package com.shop.service;

import com.shop.dto.VoucherDtos.VoucherDto;
import com.shop.dto.VoucherDtos.VoucherWrite;
import com.shop.entity.Voucher;
import com.shop.exception.BusinessException;
import com.shop.repository.VoucherRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoucherService {
    private static final long MONEY_LIMIT = 9_000_000_000_000L;
    private final VoucherRepository vouchers;

    public VoucherService(VoucherRepository vouchers) {
        this.vouchers = vouchers;
    }

    @Transactional(readOnly = true)
    public com.shop.dto.CatalogDtos.PageDto<VoucherDto> list(int page, int size) {
        Page<Voucher> values = vouchers.findAll(PageRequest.of(page, size, Sort.by(Sort.Order.asc("id"))));
        Page<VoucherDto> mapped = values.map(this::dto);
        return new com.shop.dto.CatalogDtos.PageDto<>(mapped.getContent(), mapped.getNumber(), mapped.getSize(),
                mapped.getTotalElements(), mapped.getTotalPages());
    }

    @Transactional(readOnly = true)
    public VoucherDto get(long id) {
        return dto(find(id));
    }

    @Transactional
    public VoucherDto create(VoucherWrite body) {
        String code = normalizeCode(body.code());
        validate(body, 0);
        if (vouchers.findByCode(code).isPresent()) {
            throw conflict();
        }
        Voucher value = new Voucher(code, body.discountType(), body.discountValue(), body.maxDiscount(),
                body.minOrderValue(), body.quantity(), 0, body.startAt(), body.endAt(), active(body.isActive()));
        return dto(vouchers.save(value));
    }

    @Transactional
    public VoucherDto update(long id, VoucherWrite body) {
        Voucher value = vouchers.findByIdForUpdate(id).orElseThrow(() -> notFound());
        String code = normalizeCode(body.code());
        validate(body, value.getUsedCount());
        vouchers.findByCode(code).filter(existing -> !existing.getId().equals(id)).ifPresent(existing -> {
            throw conflict();
        });
        value.setCode(code);
        value.setDiscountType(body.discountType());
        value.setDiscountValue(body.discountValue());
        value.setMaxDiscount(body.maxDiscount());
        value.setMinOrderValue(body.minOrderValue());
        value.setQuantity(body.quantity());
        value.setStartAt(body.startAt());
        value.setEndAt(body.endAt());
        value.setActive(active(body.isActive(), value.isActive()));
        return dto(vouchers.save(value));
    }

    @Transactional
    public VoucherDto status(long id, boolean active) {
        Voucher value = vouchers.findByIdForUpdate(id).orElseThrow(() -> notFound());
        value.setActive(active);
        return dto(vouchers.save(value));
    }

    private void validate(VoucherWrite body, int usedCount) {
        if (body.discountValue() == null || body.discountValue() <= 0 || body.discountValue() > MONEY_LIMIT
                || body.minOrderValue() == null || body.minOrderValue() < 0 || body.minOrderValue() > MONEY_LIMIT
                || body.quantity() == null || body.quantity() < 0
                || body.discountType() == null
                || body.maxDiscount() != null && (body.maxDiscount() < 0 || body.maxDiscount() > MONEY_LIMIT)
                || body.quantity() < usedCount
                || body.startAt() != null && body.endAt() != null && !body.startAt().isBefore(body.endAt())) {
            throw validation();
        }
        if (body.discountType() == com.shop.entity.DiscountType.PERCENT
                && body.discountValue() > 100) {
            throw validation();
        }
        if (body.discountType() == com.shop.entity.DiscountType.FIXED && body.maxDiscount() != null) {
            throw validation();
        }
    }

    private String normalizeCode(String value) {
        String normalized = value == null ? null : value.trim().toUpperCase(Locale.ROOT);
        if (normalized == null || normalized.isEmpty() || normalized.length() > 50) {
            throw validation();
        }
        return normalized;
    }

    private Voucher find(long id) {
        return vouchers.findById(id).orElseThrow(() -> notFound());
    }

    private VoucherDto dto(Voucher value) {
        return new VoucherDto(value.getId().toString(), value.getCode(), value.getDiscountType(), value.getDiscountValue(),
                value.getMaxDiscount(), value.getMinOrderValue(), value.getQuantity(), value.getUsedCount(),
                value.getStartAt(), value.getEndAt(), value.isActive());
    }

    private boolean active(Boolean value) { return value == null || value; }
    private boolean active(Boolean value, boolean fallback) { return value == null ? fallback : value; }
    private BusinessException validation() { return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Voucher is invalid"); }
    private BusinessException conflict() { return new BusinessException(HttpStatus.CONFLICT, "CONFLICT", "Voucher code already exists"); }
    private BusinessException notFound() { return new BusinessException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Voucher not found"); }
}
