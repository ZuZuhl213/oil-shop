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

## Admin catalog và media — plan 10

- `/admin/login`, `/admin/categories`, `/admin/products`, `/admin/products/[id]` dùng API hiện có qua proxy, cookie HttpOnly và CSRF; không lưu session ID bằng JavaScript. Redirect sau login chỉ chấp nhận đường dẫn admin nội bộ.
- Khi nhận 401 trong lúc sửa, form vẫn mounted và giữ bản nháp, hiển thị dialog đăng nhập lại; đăng nhập thành công không tự gửi lại thao tác lưu. Lỗi mạng/422/409 có thông báo và retry bằng thao tác lưu rõ ràng.
- Quản lý danh mục/sản phẩm/quy cách, tạo/sửa/ẩn/kích hoạt lại; không delete, saleType không đổi sau create. Giá nguyên VND, ID string, minQuantity/quantityStep tối đa 2 số thập phân và tương thích tiền nguyên. Sản phẩm chưa có variant active có cảnh báo.
- Lọc admin sản phẩm trên toàn bộ các trang API đã tải, không chỉ trang đầu. Đây là cách làm cho catalog V1; catalog lớn nên bổ sung bộ lọc backend.
- Upload JPEG/PNG/WebP ≤5 MiB qua backend; preview/URL mới chỉ ở bản nháp cho đến khi lưu product thành công. Lỗi upload giữ ảnh cũ; lỗi save giữ URL mới để retry. Storefront dùng thumbnail đã lưu và trở về hình minh họa nếu ảnh lỗi.
- Navigation quản trị có thêm Đơn hàng và Voucher từ plan 11.

Server-only `PROXY_MAX_MEDIA_BODY_BYTES` mặc định 6291456 (6 MiB), riêng endpoint media; JSON vẫn dùng `PROXY_MAX_BODY_BYTES` 1 MiB. Backend cần cấu hình Supabase theo `backend/README.md`. Host triển khai phải hỗ trợ file 5 MiB **cộng multipart overhead**; chưa xác nhận giới hạn production. Nếu host không đáp ứng, cần đổi contract trước deploy.

Kiểm thử admin thật qua proxy:

```bash
# Cần Docker, Java toolchain 21 và dependencies frontend đã cài.
npm run test:admin:e2e
```

Lệnh build frontend, chạy Spring với PostgreSQL Testcontainers, tạo admin dùng riêng cho test, chạy Playwright desktop/mobile trên port3200, rồi dọn các process/container do nó tạo. Đổi port bằng `PLAN10_FRONTEND_PORT`. Storage dùng fake adapter; không dùng database, admin hoặc Supabase credentials thật của người dùng. Plain `npm run test:e2e` skip các test admin yêu cầu fixture này. Nếu lỗi, log được giữ trong `/tmp/hm-admin-e2e-*`.


## Admin orders và vouchers — plan 11

- `/admin/vouchers`, `/admin/vouchers/[id]`: danh sách phân trang, tạo/sửa voucher và PATCH bật/tắt. `usedCount` chỉ hiển thị, không gửi trong body. Khi server từ chối quantity sau lần khách dùng mới, tải lại số đã dùng và giữ nguyên bản nháp để sửa. Phần trăm 1–100; minOrderValue=0 và quantity=0 hợp lệ; cap trống là null, cap 0 báo lỗi. FIXED luôn gửi cap null.
- Bắt đầu/kết thúc voucher và bộ lọc thời gian đơn nhập theo Việt Nam (UTC+7), chuyển sang Instant UTC độc lập timezone browser/host; không gắn Z vào giờ local. Giữ độ chính xác Instant cũ khi không sửa field. Bộ lọc đơn dùng khoảng `[from,to)`.
- `/admin/orders`, `/admin/orders/[id]`: filter status/type/mã đơn hoặc phone/date và phân trang API; snapshot customer/items/giá/voucher và totals do backend cung cấp. Không sửa customer/items/giá, không có tra cứu public PII.
- Status theo NEW → CONTACTED → CONFIRMED → COMPLETED; hủy từ ba trạng thái chưa kết thúc có confirmation và nhắc hoàn voucher. Pending chặn gửi trùng; 409 tải trạng thái thật, giữ note draft; nếu refresh lỗi thì khóa status actions cho đến khi tải lại thành công.
- QUOTE_REQUEST hiển thị “Yêu cầu báo giá”, giá NULL là “Chưa có giá”; hoàn tất chỉ đánh dấu xử lý, không ghi nhận doanh thu.
- Customer note và admin note riêng. Note save lỗi/401 giữ draft tại trang qua dialog đăng nhập lại, không tự gửi lại và không lưu PII vào localStorage. Rời trang/reload mất note chưa lưu.

Kiểm thử riêng Plan 11 qua backend thật:

```bash
npm run test:admin:e2e -- e2e/admin-vouchers.spec.ts e2e/admin-orders.spec.ts
```

Runner nhận file/option Playwright sau `--`. Không truyền file thì chạy toàn bộ auth/catalog/orders/vouchers desktop/mobile. Full lint còn lỗi baseline `HeroSection.tsx` thuộc protected code; kiểm tra ESLint riêng các file Plan 11 trước bàn giao. Chưa nghiệm thu host/domain/credentials production.
