# HM Naturals — Frontend

## Trạng thái

✅ **Foundation đã triển khai** — Next.js App Router + TypeScript + Tailwind CSS v4.

Đã hoàn thành:
- Khởi tạo Next.js 16 với App Router, TypeScript strict, Tailwind CSS v4
- Design tokens chuyển từ prototype `index.html` (palette, typography, spacing)
- Google Fonts: Be Vietnam Pro (body) + Playfair Display (display)
- Storefront layout shell: Header + Footer + responsive navigation
- Routing: tất cả storefront routes với page stubs
- API contracts: TypeScript types matching backend Spring Boot DTOs
- API client: typed HTTP client cho `/api/v1/*`
- Mock data: 8 sản phẩm mẫu (3 categories, FIXED_PRICE + QUOTE)
- Currency formatting (VND)
- SEO: metadata, OpenGraph, Vietnamese locale

## Cấu trúc

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout (fonts, metadata)
│   │   ├── globals.css                    # Tailwind v4 + design tokens
│   │   └── (storefront)/                  # Customer-facing routes
│   │       ├── layout.tsx                 # Header + Footer shell
│   │       ├── page.tsx                   # / — Trang chủ
│   │       ├── products/
│   │       │   ├── page.tsx               # /products — Danh sách sản phẩm
│   │       │   └── [slug]/page.tsx        # /products/:slug — Chi tiết sản phẩm
│   │       ├── knowledge/page.tsx         # /knowledge — Góc kiến thức
│   │       ├── about/page.tsx             # /about — Về chúng tôi
│   │       └── contact/page.tsx           # /contact — Liên hệ
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx                 # Sticky navbar + brand + nav links
│   │       └── Footer.tsx                 # 3-column footer + copyright
│   ├── config/
│   │   └── site.ts                        # Site name, contact, nav links
│   └── lib/
│       ├── api/
│       │   ├── client.ts                  # Typed fetch client → Spring Boot
│       │   └── contracts/types.ts         # TypeScript ↔ Java DTO contract
│       ├── format/
│       │   └── currency.ts                # VND formatting utilities
│       └── mock-data.ts                   # Sample products for dev
├── .env.example                            # Server-only proxy environment template
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Routes

| Route | Màn hình | Trạng thái |
|-------|----------|------------|
| `/` | Trang chủ | Stub ✅ |
| `/products` | Danh sách sản phẩm | API-first + mock fallback ✅ |
| `/products/[slug]` | Chi tiết sản phẩm | API-first + mock fallback ✅ |
| `/knowledge` | Góc kiến thức | Stub ✅ |
| `/about` | Về chúng tôi | Stub ✅ |
| `/contact` | Liên hệ | Stub ✅ |

## Chạy dev

```bash
cd frontend
npm run dev
```

Mở `http://localhost:3000`.

## API Backend

Browser chỉ gọi same-origin /api/v1/*. Next.js proxy đọc BACKEND_API_ORIGIN ở server để chuyển request tới Spring Boot, đồng thời giữ cookie session, CSRF và Idempotency-Key.

Chạy:

    cp .env.example .env.local
    npm run dev

Đặt BACKEND_API_ORIGIN trong .env.local, mặc định là http://localhost:8080.

Catalog giữ mock data làm fallback khi backend chưa chạy. Checkout và voucher chỉ gửi request khi backend sẵn sàng; receipt đọc OrderReceipt vừa nhận trong session hiện tại.

## Trạng thái triển khai

### Đã hoàn thành (Screens & Components hoàn chỉnh) ✅

1. **Cart System & Slide-over Drawers**:
   - `CartContext` (`localStorage` persistence, tính tạm tính, freeship progress tracker, cập nhật số lượng)
   - `CartDrawer` (slide-over trượt từ phải sang với nút tăng/giảm, xóa, tính phí ship và nút Đặt Hàng)
   - `MobileNavDrawer` (thực đơn điều hướng mobile với hotline xưởng & liên hệ Zalo)

2. **HomeScreen (`/`)**:
   - Hero Showcase: Giới thiệu Dầu Phộng Ép Lạnh Cối Đá, badge Vụ Mùa 2026, 3 chỉ số niềm tin (100% Cơ học, Lọc 48h vải mộc, Chắn UV)
   - Category Rail: Lọc tương tác danh mục thời gian thực
   - 2–4 Cột Product Grid: Hiển thị sản phẩm với hình ảnh SVG chai dầu thủ công
   - 3 Nguyên Tắc Sản Xuất: Ép cơ học chậm, lọc vải mộc 48h, bảo quản chai thủy tinh tối màu
   - Brand Story Banner: Nền xanh rừng đậm, tôn vinh hạt nông sản bản địa
   - Góc Kiến Thức: 3 bài viết cẩm nang nổi bật với thời gian đọc & điểm cốt lõi
   - Trust Pillars: 4 cam kết chất lượng

3. **ProductListScreen (`/products`)**:
   - Thanh tìm kiếm trực tiếp (live search debounced) theo tên dầu, mè, đậu phộng...
   - Bộ lọc danh mục (Tất cả, Dầu thực vật, Hạt bản địa, Phụ phẩm sạch)
   - Sắp xếp: Mặc định, Giá tăng dần, Giá giảm dần
   - Trạng thái rỗng (empty search alert) với nút "Xem lại tất cả"

4. **ProductDetailScreen (`/products/[slug]`)**:
   - Gallery ảnh chai dầu chuẩn tỉ lệ 4:3 với nhãn minh họa
   - Bộ chọn quy cách (dung tích 250ml, 500ml, 1000ml) với cập nhật giá tức thì
   - Bộ điều khiển số lượng (+ / -)
   - Bảng thông số kỹ thuật (Nguồn giống, Phương pháp ép, Quy cách đóng gói, Hạn dùng)
   - Thêm vào giỏ hàng kích hoạt CartDrawer
   - **Sticky Bottom Purchase Bar**: Thanh đặt mua dính đáy màn hình trên thiết bị di động
   - Đăng ký báo giá sỉ cho sản phẩm QUOTE (Dầu Sachi, Bã lạc, Bã mè)
   - Sản phẩm liên quan cùng danh mục

5. **Order & Checkout Screen (`/checkout`)**:
   - Form thông tin khách hàng: Họ tên, Số điện thoại, Địa chỉ giao hàng, Ghi chú
   - Hệ thống mã giảm giá (Voucher): Hỗ trợ mã `HMN10` (-10%) và `FREESHIP`
   - Phương thức thanh toán: COD (Tiền mặt khi nhận hàng) & Chuyển khoản VietQR
   - Tóm tắt đơn hàng; phí giao nhận được shop xác nhận qua điện thoại

6. **Order Receipt & Status Screen (`/orders/[code]`)**:
   - Thông báo đặt hàng thành công + Nút sao chép mã đơn 1-chạm
   - **Timeline Stepper 5 bước theo dõi đơn**: Tiếp nhận -> Xác nhận -> Ép dầu & đóng chai -> Đang giao -> Hoàn tất
   - Tóm tắt sản phẩm đã đặt và địa chỉ nhận hàng
   - Hotline hỗ trợ trực tiếp xưởng

7. **Knowledge Hub (`/knowledge` & `/knowledge/[slug]`)**:
   - Danh sách bài viết cẩm nang phân theo chủ đề
   - Trang đọc bài viết hoàn chỉnh với hộp "Điểm Cốt Lõi Cần Nhớ" và khối giới thiệu sản phẩm liên quan

8. **Tra cứu đơn hàng (`/tracking`)**, **Về chúng tôi (`/about`)**, **Liên hệ (`/contact`)**:
   - Trang tra cứu nhanh trạng thái đơn hàng bằng mã đơn
   - Trang giới thiệu câu chuyện thương hiệu và 3 giá trị cốt lõi
   - Trang liên hệ với kênh Zalo, hotline, thời gian tiếp khách tại xưởng và form gửi tin nhắn

## Bước tiếp theo

1. Admin Dashboard (/admin):
   - Đăng nhập admin với cookie session
   - Quản lý danh mục, sản phẩm, quy cách
   - Quản lý trạng thái đơn hàng và voucher
