import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/api-types";
import { VariantSelector } from "./VariantSelector";

const product: Product = {
  id: "10",
  categoryId: "2",
  name: "Dầu lạc nguyên chất",
  slug: "dau-lac-nguyen-chat",
  shortDescription: "Mẫu sản phẩm",
  description: null,
  thumbnailUrl: null,
  saleType: "FIXED_PRICE",
  status: "ACTIVE",
  sortOrder: 1,
  variants: [
    {
      id: "11",
      productId: "10",
      name: "Chai 500ml",
      sku: "DL-500",
      price: 65000,
      minQuantity: 1,
      quantityStep: 1,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "12",
      productId: "10",
      name: "Chai 1l",
      sku: "DL-1000",
      price: 115000,
      minQuantity: 1,
      quantityStep: 1,
      isActive: true,
      sortOrder: 2,
    },
  ],
};

describe("VariantSelector", () => {
  it("updates the selected variant price and SKU", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VariantSelector product={product} onChange={onChange} />);

    expect(screen.getByText(/65\.000/)).toBeInTheDocument();
    expect(screen.getByText("Mã SKU: DL-500")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Dung tích"), "12");

    expect(screen.getByText(/115\.000/)).toBeInTheDocument();
    expect(screen.getByText("Mã SKU: DL-1000")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(product.variants[1]);
  });

  it("shows contact pricing for quote products", () => {
    render(<VariantSelector product={{ ...product, saleType: "QUOTE", variants: [{ ...product.variants[0], price: null }] }} onChange={vi.fn()} />);

    expect(screen.getByText("Liên hệ báo giá")).toBeInTheDocument();
    expect(screen.queryByText(/₫/)).not.toBeInTheDocument();
  });

  it("disables the purchase action when no active variant is available", () => {
    render(<VariantSelector product={{ ...product, variants: [] }} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Chọn sản phẩm" })).toBeDisabled();
    expect(screen.getByText("Sản phẩm hiện chưa có lựa chọn khả dụng.")).toBeInTheDocument();
  });
});
