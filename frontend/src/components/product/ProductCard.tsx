'use client';

import React from 'react';
import Link from 'next/link';
import { ExtendedProductDto, mockCategories } from '@/lib/mock-data';
import { ProductBottleImage } from '@/components/product/ProductBottleImage';
import { formatCurrencyVnd } from '@/lib/format/currency';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: ExtendedProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const isQuote = product.saleType === 'QUOTE';
  const defaultVariant = product.variants[0];
  const displayPrice = defaultVariant?.price ? formatCurrencyVnd(defaultVariant.price) : 'Liên hệ';
  const category = mockCategories.find((c) => c.id === product.categoryId);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant || isQuote || !defaultVariant.price) return;

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: defaultVariant.id,
      variantName: defaultVariant.name,
      price: defaultVariant.price,
      quantity: 1,
      thumbnailType: product.visualType,
    });
  };

  return (
    <Link href={`/products/${product.slug}`} className="grid-product-card group no-underline">
      {/* 1:1 Thumb with Bottle Image & Tag */}
      <div className="grid-card-thumb">
        <ProductBottleImage type={product.visualType} alt={product.name} />
        <span className="photo-illustrate-tag">Ảnh minh họa</span>
        {product.tag ? (
          <span className="grid-card-badge">{product.tag}</span>
        ) : (
          !isQuote && defaultVariant && (
            <span
              className="grid-card-badge"
              style={{ background: '#FAF6EE', color: '#26402F', border: '1px solid #D9CDBF' }}
            >
              {defaultVariant.name}
            </span>
          )
        )}
      </div>

      {/* Card Body */}
      <div className="grid-card-body">
        <div>
          <span className="g-cat-text">{category?.name || 'Nông Sản Bản Địa'}</span>
          <h4 className="g-title-text group-hover:text-peanut-bark transition-colors">
            {product.name}
          </h4>
          <span className="g-size-note">
            {isQuote ? 'Hàng báo giá sỉ đại lý' : 'Sẵn sàng giao tận bếp'}
          </span>
        </div>

        <div className="g-bottom-row">
          <div>
            {isQuote ? (
              <span className="g-quote-text">Yêu cầu báo giá</span>
            ) : (
              <span className="g-price-text">{displayPrice}</span>
            )}
          </div>

          {isQuote ? (
            <span className="btn-card-action quote">
              <span>Chi tiết →</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="btn-card-action fixed"
              aria-label={`Chọn mua ${product.name}`}
            >
              <span>+ Chọn mua</span>
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
