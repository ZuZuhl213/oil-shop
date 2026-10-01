# HM Naturals — Frontend

Next.js App Router, React, TypeScript và Tailwind CSS. Giữ giao diện HM Naturals do người dùng tạo; catalog dùng API Spring Boot qua proxy cùng origin.

## Trạng thái plan 08 — 28/09/2026

Đã triển khai và kiểm chứng chức năng storefront/proxy. Phần Git delivery còn chờ người dùng commit/push; tài liệu trong docs/ giữ local.

- Trang chủ tải sản phẩm và danh mục từ API; chọn danh mục gọi API tương ứng, có loading/empty/error/retry.
- /products hỗ trợ category, q, page trong URL. Native History API đồng bộ filter với Next useSearchParams, tránh mất từ khóa khi điều hướng chậm.
- /categories/[slug] chuyển đến /products?category=<slug>&page=0. Danh mục không tồn tại có thông báo và không hiển thị sản phẩm không liên quan.
- /products/[slug] hiển thị giá, SKU, quantity min/step theo variant; QUOTE là giá nullable; giá 0 VND vẫn hợp lệ. Không có variant bán được thì khóa nút mua.
- Upstream product 404 dùng Next not-found boundary và noindex. Do dữ liệu được lấy ở client, HTTP document ban đầu có thể là 200; đây không phải triển khai SSR trả HTTP404 trước khi stream.
- Proxy Node chỉ chuyển các path/method trong allowlist, giữ Cookie/Set-Cookie/CSRF/Origin/Idempotency-Key và HTTP status; API admin/auth/mutation dùng no-store. Timeout bao gồm đọc body upstream.
- Ảnh SVG hiện tại là minh họa. Ảnh thật/Supabase chưa được cung cấp; không coi đã kiểm chứng image host production.

## Viewer 3D trong trang chi tiết — 29/09/2026

Nút **Xem 360°** mở dialog và chỉ lúc đó tải Three.js/React Three Fiber. Chai procedural là mô hình minh họa chung, không mô tả bao bì hay dung tích của variant thực tế.

- Kéo chuột/vuốt để xoay; cuộn/chụm hai ngón để zoom trong giới hạn. Thanh góc xoay và nút reset dùng được bằng bàn phím.
- Modal giữ focus, hỗ trợ Esc, nút đóng và bấm bên ngoài; trả focus về nút mở và khôi phục cuộn trang khi đóng.
- Render theo nhu cầu, DPR tối đa 1.5, không tự xoay; unmount scene khi đóng. Không tải font, texture hoặc model từ dịch vụ ngoài.
- Lỗi tải module, lỗi WebGL hoặc mất context sẽ hiển thị SVG dự phòng, giữ modal và luồng mua hàng sử dụng được.
- Component: `Product360Modal` quản lý dialog, `Bottle3DViewer` tải client-only và xử lý lỗi, `BottleScene` quản lý camera/ánh sáng/điều khiển, `BottleModel` dựng chai mẫu.

Khi có model chính thức, chuẩn bị `.glb` kèm texture nhúng, ảnh fallback, kích thước và nhãn được duyệt. Thay `BottleModel` bằng bộ tải GLB rồi chỉnh tâm model, scale, camera và vật liệu; bản hiện tại chưa có bộ tải GLB hay mapping model theo sản phẩm. Không cần thay business API cho viewer demo này.

E2E có kiểm tra render thật và thay đổi hình khi xoay/reset, kéo chuột/vuốt, mở/đóng, focus, WebGL không hỗ trợ và mất context trên desktop/mobile.

## Chạy local

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

Nếu .env.local đã có cấu hình, giữ file hiện tại thay vì ghi đè. Backend chạy bằng Gradle; xem backend/README.md.

Các biến server-only:
- BACKEND_API_ORIGIN: mặc định http://localhost:8080.
- PROXY_TIMEOUT_MS: mặc định 10000, bao phủ header và body response.
- PROXY_MAX_BODY_BYTES: mặc định 1048576.

Browser chỉ gọi /api/v1. Không đặt backend origin hoặc secret trong NEXT_PUBLIC_*.

## Kiểm chứng

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e -- --workers=2
```

Ngày 28/09/2026: 55 Vitest tests, lint, typecheck và production build đạt; 20 Playwright tests desktop/mobile đạt. E2E dùng fixture API, không ghi PostgreSQL. Playwright tự build và chạy server riêng tại port3100; PLAYWRIGHT_BASE_URL dùng server đã chạy.

Smoke read-only qua Next đến backend thật:
```bash
# Cần backend và frontend đang chạy; mặc định frontend port3100.
node scripts/proxy-smoke.mjs
# Hoặc:
SMOKE_FRONTEND_ORIGIN=http://localhost:3000 node scripts/proxy-smoke.mjs
```

Smoke kiểm tra CSRF200, JSESSIONID và reuse session, admin chưa đăng nhập401 JSON/no-store, categories/products200. Không in token/cookie và không tạo đơn. Không thay thế kiểm thử đăng nhập/quản trị của plan10.

## Cấu trúc chính

- src/app/(storefront)/: giao diện khách hàng; categories/[slug] là alias đến listing.
- src/components/product/: card và hình minh họa.
- src/lib/api/client.ts, contracts/types.ts: API client và kiểu DTO.
- src/app/api/v1/[...path]/: proxy và test.
- src/app/(storefront)/catalog.test.tsx, e2e/storefront.spec.ts: kiểm chứng catalog/UI.
- src/config/site.ts: thông tin thương hiệu/liên hệ do người dùng quản lý.

## Ngoài phạm vi nghiệm thu plan 08

Repo đã có UI/cart/checkout/receipt đang được ghép API. Các phần này thuộc plan09 và phải được nghiệm thu riêng. Pending checkout lưu {key,payload}, có memory fallback khi sessionStorage bị chặn; memory không sống qua reload. Backend chưa có public GET order.

Knowledge/about/contact/tracking chứa nội dung UI local; không coi là tính năng quản trị hay tracking trực tiếp từ backend. Bước tiếp theo: nghiệm thu plan09, rồi plan10 admin.

Cần bổ sung sau: ảnh sản phẩm thật và host Supabase nếu dùng, xác nhận nội dung thương hiệu/liên hệ trước khi public, thông tin deploy ở plan13.
