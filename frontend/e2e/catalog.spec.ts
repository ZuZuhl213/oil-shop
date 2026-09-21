import { expect, test } from "@playwright/test";

const categories = [
  { id: "1", name: "Dầu ép", slug: "dau-ep", description: "Dầu thực vật", sortOrder: 1, isActive: true },
  { id: "2", name: "Hạt nguyên liệu", slug: "hat-nguyen-lieu", description: "Các loại hạt", sortOrder: 2, isActive: true },
];

const products = [
  {
    id: "10", categoryId: "1", name: "Dầu lạc nguyên chất", slug: "dau-lac-nguyen-chat", shortDescription: "Mùi thơm tự nhiên", description: "Sản phẩm mẫu để kiểm thử.", thumbnailUrl: null, saleType: "FIXED_PRICE", status: "ACTIVE", sortOrder: 1,
    variants: [{ id: "11", productId: "10", name: "Chai 500ml", sku: "DL-500", price: 65000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 }, { id: "12", productId: "10", name: "Chai 1l", sku: "DL-1000", price: 115000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 2 }],
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/categories", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(categories) }));
  await page.route("**/api/v1/products**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/dau-lac-nguyen-chat")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(products[0]) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: products, page: Number(url.searchParams.get("page") ?? 0), size: 12, totalElements: 13, totalPages: 2 }) });
  });
});

test("customer can filter, paginate and open a product detail", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Dầu lạc nguyên chất" })).toBeVisible();
  await page.getByLabel("Danh mục").selectOption("dau-ep");
  await page.getByRole("button", { name: "Lọc" }).click();
  await expect(page).toHaveURL(/category=dau-ep/);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page).toHaveURL(/page=1/);
  await page.getByRole("link", { name: "Xem chi tiết" }).first().click();
  await expect(page).toHaveURL(/products\/dau-lac-nguyen-chat/);
  await expect(page.getByRole("heading", { name: "Dầu lạc nguyên chất" })).toBeVisible();
  await page.getByLabel("Dung tích").selectOption("12");
  await expect(page.getByText("Mã SKU: DL-1000")).toBeVisible();
});

test("category route keeps a usable error boundary when API returns 404", async ({ page }) => {
  await page.route("**/api/v1/categories", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }));
  await page.goto("/categories/missing");
  await expect(page.getByRole("heading", { name: "Không tìm thấy danh mục" })).toBeVisible();
});
