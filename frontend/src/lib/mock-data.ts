/**
 * Mock catalog data for development.
 * Matches the product examples and knowledge hub articles from index.html & backend schema.
 */

import type {
  CategoryDto,
  ProductDto,
  PageDto,
} from '@/lib/api/contracts/types';

// ─── Categories ──────────────────────────────────────────────────────

export const mockCategories: CategoryDto[] = [
  {
    id: '1',
    name: 'Dầu thực vật ép lạnh',
    slug: 'dau-thuc-vat',
    description: 'Các loại dầu ăn tự nhiên, ép cơ học chậm không gia nhiệt',
    sortOrder: 0,
    isActive: true,
  },
  {
    id: '2',
    name: 'Hạt giống & Nguyên liệu',
    slug: 'hat-nguyen-lieu',
    description: 'Hạt lạc sẻ, mè đen đồi và nông sản bản địa thuần chủng',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: '3',
    name: 'Phụ phẩm nông nghiệp',
    slug: 'phu-pham',
    description: 'Bã lạc khô, bã vừng hữu cơ dùng trong chăn nuôi và bón cây',
    sortOrder: 2,
    isActive: true,
  },
];

// ─── Product Specs Interface ─────────────────────────────────────────

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ExtendedProductDto extends ProductDto {
  visualType: 'peanut' | 'sesame' | 'sachi' | 'byproduct' | 'gac' | 'coconut' | 'seeds';
  tag?: string;
  specs: ProductSpec[];
  quoteTiers?: string[];
  featured?: boolean;
}

// ─── Products ────────────────────────────────────────────────────────

export const mockProducts: ExtendedProductDto[] = [
  {
    id: '1',
    categoryId: '1',
    name: 'Dầu Phộng Ép Lạnh Cối Đá',
    slug: 'dau-lac-nguyen-chat',
    shortDescription: 'Lạc sẻ đỏ bản địa ép cơ học chậm, lọc vải mộc 48h, giữ mùi thơm ngậy đặc trưng.',
    description:
      'Dầu phộng (dầu lạc) được ép từ 100% hạt lạc sẻ đỏ Bắc Bộ thuần bản địa, hạt vỏ mỏng giàu dầu và thơm bùi. Quy trình ép cơ học cối đá tốc độ chậm không sinh nhiệt cao, sau đó lắng lọc tự nhiên qua vải mộc 48 tiếng. Thích hợp cho các món chiên xào lửa vừa, phi hành tỏi dậy mùi và ướp thịt nướng.',
    thumbnailUrl: null,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 0,
    visualType: 'peanut',
    tag: 'Bán chạy nhất',
    featured: true,
    variants: [
      { id: '1', productId: '1', name: '250ml', sku: 'DL-250', price: 95000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '2', productId: '1', name: '500ml', sku: 'DL-500', price: 165000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
      { id: '3', productId: '1', name: '1000ml', sku: 'DL-1000', price: 310000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 2 },
    ],
    specs: [
      { label: 'Nguồn giống', value: 'Hạt lạc sẻ đỏ bản địa vỏ mỏng' },
      { label: 'Phương pháp ép', value: 'Ép cơ học cối đá chậm, lắng vải mộc 48h' },
      { label: 'Quy cách đóng gói', value: 'Chai thủy tinh hổ phách tối màu chống tia UV' },
      { label: 'Hạn sử dụng', value: '12 tháng kể từ ngày ép mùa vụ' },
    ],
  },
  {
    id: '2',
    categoryId: '1',
    name: 'Dầu Mè Đen Rang Mộc',
    slug: 'dau-vung-ep-lanh',
    shortDescription: 'Hạt mè đen nương đồi rang củi mộc, ép chậm sánh đậm, đượm hương thơm Á Đông.',
    description:
      'Hạt mè đen đồi thuần chủng được làm sạch, phơi nắng tự nhiên rồi rang chín tới trên than củi nhãn trước khi đưa vào cối ép chậm. Dầu có sắc nâu hổ phách sẫm, độ sánh đặc quánh và hương thơm nồng nàn. Lý tưởng cho các món trộn gỏi, nêm canh, ướp thịt nướng và bổ sung vi chất cho trẻ nhỏ.',
    thumbnailUrl: null,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 1,
    visualType: 'sesame',
    tag: 'Rang củi thủ công',
    featured: true,
    variants: [
      { id: '4', productId: '2', name: '250ml', sku: 'DV-250', price: 145000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '5', productId: '2', name: '500ml', sku: 'DV-500', price: 260000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
      { id: '6', productId: '2', name: '1000ml', sku: 'DV-1000', price: 490000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 2 },
    ],
    specs: [
      { label: 'Nguồn giống', value: 'Mè đen nương đồi thuần chủng' },
      { label: 'Phương pháp ép', value: 'Rang than củi nhãn, ép cơ học nguyên chất' },
      { label: 'Màu sắc & Hương vị', value: 'Nâu hổ phách sẫm, thơm đượm mộc bản' },
      { label: 'Bảo quản', value: 'Nơi râm mát, đậy kín nắp sau khi sử dụng' },
    ],
  },
  {
    id: '3',
    categoryId: '1',
    name: 'Dầu Hạt Sachi Ép Sống',
    slug: 'dau-sachi-ep-song',
    shortDescription: 'Hạt Sachi giàu Omega 3-6-9, ép sống cơ học bảo toàn chất béo dưỡng sinh.',
    description:
      'Hạt Sachi hữu cơ thu hái từ các nông hộ Tây Nguyên, ép sống cơ học hoàn toàn không qua gia nhiệt hay tinh luyện hóa học. Hàm lượng Omega 3-6-9 cao gấp nhiều lần dầu cá, thích hợp dùng ăn sống, trộn salad tươi, sốt vinaigrette hoặc bổ sung trực tiếp vào bát cháo ăn dặm của bé.',
    thumbnailUrl: null,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 2,
    visualType: 'sachi',
    tag: 'Dưỡng sinh Organic',
    featured: true,
    variants: [
      { id: '7', productId: '3', name: '250ml', sku: 'SC-250', price: null, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
    ],
    quoteTiers: [
      'Chai thủy tinh 250ml dùng thử gia đình',
      'Thùng 12 chai (250ml) cho tiệm thực dưỡng',
      'Can 5 Lít cho nhà hàng / bếp ăn cao cấp',
      'Hợp đồng cung ứng định kỳ theo tháng',
    ],
    specs: [
      { label: 'Nguồn nguyên liệu', value: 'Hạt Sachi hữu cơ Tây Nguyên' },
      { label: 'Phương pháp chế biến', value: 'Ép sống cơ học, lắng cặn tự nhiên' },
      { label: 'Thành phần dinh dưỡng', value: 'Giàu Omega 3-6-9, Vitamin E và Phytosterol' },
      { label: 'Ứng dụng chính', value: 'Ăn sống, trộn salad, ăn dặm cho trẻ' },
    ],
  },
  {
    id: '4',
    categoryId: '1',
    name: 'Dầu Gấc Nếp Tự Nhiên',
    slug: 'dau-gac-tu-nhien',
    shortDescription: 'Màng gấc nếp đỏ au chiết xuất tự nhiên, giàu beta-carotene và lycopene cho mắt.',
    description:
      'Dầu gấc chiết xuất từ màng hạt của những quả gấc nếp chín mọng vườn đồi Bắc Bộ. Màu đỏ thắm tự nhiên, giàu tiền vitamin A (beta-carotene) và lycopene chống oxy hóa. Thích hợp cho vào nấu xôi gấc, làm màu tự nhiên cho món ăn dặm, canh súp hoặc chăm sóc làn da mịn màng.',
    thumbnailUrl: null,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 3,
    visualType: 'gac',
    tag: 'Giàu Beta-Carotene',
    variants: [
      { id: '8', productId: '4', name: '100ml', sku: 'DG-100', price: 120000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '9', productId: '4', name: '250ml', sku: 'DG-250', price: 280000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
    ],
    specs: [
      { label: 'Nguyên liệu', value: 'Màng gấc nếp tươi chín đỏ' },
      { label: 'Dầu dung môi nền', value: 'Dầu phộng ép lạnh thô HM Naturals' },
      { label: 'Đóng gói', value: 'Chai thủy tinh tối màu chống oxy hóa' },
    ],
  },
  {
    id: '5',
    categoryId: '1',
    name: 'Dầu Dừa Ép Lạnh Tinh Khiết',
    slug: 'dau-dua-nguyen-chat',
    shortDescription: 'Cơm dừa tươi Bến Tre ép lạnh ly tâm, thơm dịu ngọt lành, dùng ẩm thực và làm đẹp.',
    description:
      'Dầu dừa nguyên chất ép lạnh từ cơm dừa tươi Bến Tre vừa thu hái. Không qua xử lý tẩy trắng hay khử mùi hóa chất, giữ nguyên vẹn axit lauric kháng khuẩn và mùi thơm dừa mộc mạc.',
    thumbnailUrl: null,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 4,
    visualType: 'coconut',
    variants: [
      { id: '10', productId: '5', name: '500ml', sku: 'DD-500', price: 95000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '11', productId: '5', name: '1000ml', sku: 'DD-1000', price: 180000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
    ],
    specs: [
      { label: 'Nguồn gốc', value: 'Dừa tươi Bến Tre chọn lọc' },
      { label: 'Công nghệ', value: 'Ép lạnh ly tâm nhiệt độ thấp' },
      { label: 'Điểm đông tự nhiên', value: 'Dưới 24°C chuyển thể rắn ngà tự nhiên' },
    ],
  },
  {
    id: '6',
    categoryId: '2',
    name: 'Hạt Lạc Sẻ Đỏ Bắc Bộ',
    slug: 'lac-do-bac-bo',
    shortDescription: 'Lạc sẻ vụ mới phơi giàn khô giòn, hạt đều mẩy, vị bùi béo đậm đà.',
    description:
      'Lạc sẻ đỏ Bắc Bộ loại 1, trồng trên đất phù sa bãi bồi ven sông. Hạt nhỏ chắc, vỏ lụa màu đỏ thắm, hàm lượng dầu cao. Thích hợp làm nhân bánh truyền thống, rang muối ớt, nấu chè hoặc tự ép dầu thủ công tại nhà.',
    thumbnailUrl: null,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 5,
    visualType: 'seeds',
    variants: [
      { id: '12', productId: '6', name: '1kg túi mộc', sku: 'LD-1', price: 65000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '13', productId: '6', name: '5kg bao dứa', sku: 'LD-5', price: 300000, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
    ],
    specs: [
      { label: 'Giống', value: 'Lạc sẻ đỏ thuần chủng vụ mùa mới' },
      { label: 'Độ ẩm', value: 'Dưới 9%, không chất chống mọt' },
    ],
  },
  {
    id: '7',
    categoryId: '3',
    name: 'Bã Đậu Phộng Ép Khô',
    slug: 'ba-lac',
    shortDescription: 'Phụ phẩm sạch giàu đạm thực vật, dùng làm thức ăn gia súc hoặc ủ phân vi sinh.',
    description:
      'Bã lạc sau khi ép kiệt dầu bằng máy cơ học, giữ độ sạch tinh khiết tuyệt đối không lẫn tạp chất hay hóa chất dung môi. Giàu protein thực vật và khoáng chất, là nguồn thức ăn giàu đạm cho bò sữa, gia súc hoặc ủ vi sinh làm phân bón hữu cơ cao cấp cho cây trồng đặc sản.',
    thumbnailUrl: null,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 6,
    visualType: 'byproduct',
    tag: 'Bán buôn / Đại lý',
    variants: [
      { id: '14', productId: '7', name: 'Bao 25kg', sku: 'BL-25', price: null, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
      { id: '15', productId: '7', name: 'Bao 50kg', sku: 'BL-50', price: null, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 1 },
    ],
    quoteTiers: [
      'Bao 25kg sấy khô mộc đóng bao kín',
      'Bao 50kg cho trang trại chăn nuôi',
      'Hợp đồng cung cấp theo tấn theo tháng',
    ],
    specs: [
      { label: 'Hàm lượng đạm', value: 'Protein thô >= 42%' },
      { label: 'Độ ẩm', value: '< 10%, sấy mộc tự nhiên' },
      { label: 'Đóng gói', value: 'Bao dứa 2 lớp lót nilon' },
    ],
  },
  {
    id: '8',
    categoryId: '3',
    name: 'Bã Mè Đen Hữu Cơ Sạch',
    slug: 'ba-vung',
    shortDescription: 'Bã mè đen rang thơm sau ép dầu, nguồn đạm và khoáng chất quý cho đất hữu cơ.',
    description:
      'Bã mè đen nguyên chất sau quy trình ép dầu cối chậm. Có mùi thơm nhẹ của hạt mè rang, giàu canxi, phospho và đạm thực vật. Rất được ưa chuộng trong nông nghiệp sinh thái, ủ phân bón hoa hồng, hoa lan và cây ăn trái cao cấp.',
    thumbnailUrl: null,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 7,
    visualType: 'byproduct',
    tag: 'Phân bón sinh học',
    variants: [
      { id: '16', productId: '8', name: 'Bao 25kg', sku: 'BV-25', price: null, minQuantity: '1', quantityStep: '1', isActive: true, sortOrder: 0 },
    ],
    quoteTiers: [
      'Bao 25kg sấy khô',
      'Cung cấp theo tấn cho nhà vườn sinh thái',
    ],
    specs: [
      { label: 'Thành phần', value: '100% bã mè đen sau ép dầu' },
      { label: 'Đặc tính', value: 'Dễ phân hủy sinh học, giàu khoáng vi lượng' },
    ],
  },
];

// ─── Knowledge Articles ──────────────────────────────────────────────

export interface KnowledgeArticleDto {
  id: string;
  slug: string;
  title: string;
  categoryKey: string;
  categoryName: string;
  date: string;
  readTime: string;
  excerpt: string;
  takeaway: string;
  bodyHtml: string;
  relatedProductSlug?: string;
  featured?: boolean;
  thumbnailType?: 'peanut' | 'sesame' | 'sachi' | 'gac' | 'coconut' | 'byproduct' | 'seeds';
}

export const mockKnowledgeArticles: KnowledgeArticleDto[] = [
  {
    id: '1',
    slug: 'smoke-point-guide',
    title: 'Điểm Khói Của Dầu Đậu Phộng & Cách Dùng Xào Nấu Chuẩn Vị',
    categoryKey: 'oil-knowledge',
    categoryName: 'Kiến Thức Dầu Thực Vật',
    date: 'Vụ Mùa 2026',
    readTime: '4 phút đọc',
    excerpt: 'Hiểu rõ nhiệt độ bốc khói của dầu ép cơ học thô để chiên xào giòn thơm mà không lo biến đổi dưỡng chất hay sinh mùi khét.',
    takeaway: 'Dầu phộng ép cơ học thô giữ điểm khói tự nhiên ở mức 160°C - 190°C. Thích hợp cho các món xào lửa vừa, phi hành tỏi thơm nồng và ướp ngấm thớ thịt trước khi chế biến.',
    bodyHtml: `
      <p>Trong gian bếp Việt, dầu đậu phộng (dầu lạc) từ lâu đã là linh hồn của những đĩa rau muống xào tỏi xanh mướt hay mẻ cá kho đậm đà. Tuy nhiên, không ít người nội trợ vẫn băn khoăn: liệu dầu lạc nguyên chất ép cơ học có chịu được nhiệt độ cao hay không?</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">1. Điểm khói của dầu ép cơ học thô là gì?</h3>
      <p>Điểm khói (Smoke Point) là ngưỡng nhiệt độ mà tại đó dầu ăn bắt đầu bốc khói xanh và phân hủy chất béo thành các hợp chất có hại. Dầu đậu phộng tinh luyện công nghiệp có điểm khói trên 220°C nhờ qua xử lý hóa chất khử mùi và tẩy màu. Ngược lại, <b>dầu đậu phộng ép cơ học thô HM NATURALS</b> giữ trọn dưỡng chất tự nhiên và polyphenol, nên có điểm khói tự nhiên dao động từ <b>160°C đến 190°C</b>.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">2. Cách dùng dầu phộng chuẩn vị trong nấu nướng</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm my-3">
        <li><b>Phi hành tỏi khử dầu:</b> Cho dầu vào chảo ấm, thả vài tép tỏi đập dập khi dầu vừa lăn tăn bọt nhỏ. Khi tỏi chuyển vàng nhạt và dậy hương thơm nồng, hạ nhiệt độ vừa phải để xào thức ăn.</li>
        <li><b>Xào rau củ:</b> Xào nhanh tay trên lửa vừa, rau giữ được màu xanh bóng và vị ngọt thanh mà không bị khét dầu.</li>
        <li><b>Ướp thực phẩm:</b> Dùng 1 muỗng dầu lạc trộn đều cùng thịt hoặc cá trước khi nướng 15 phút giúp món ăn giữ ẩm mọng nước.</li>
      </ul>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">3. Những điều cần tránh</h3>
      <p>Không nên đun dầu đến mức bốc khói dày đặc trên chảo và tuyệt đối không tái sử dụng dầu chiên đi chiên lại nhiều lần. Nâng niu nhiệt độ chính là cách tôn vinh giọt dầu mộc bản địa.</p>
    `,
    relatedProductSlug: 'dau-lac-nguyen-chat',
    featured: true,
  },
  {
    id: '2',
    slug: 'amber-glass-storage',
    title: 'Vì Sao Dầu Ép Cơ Học Cần Bảo Quản Trong Chai Thủy Tinh Tối Màu?',
    categoryKey: 'storage',
    categoryName: 'Bảo Quản Dầu Ăn',
    date: 'Vụ Mùa 2026',
    readTime: '3 phút đọc',
    excerpt: 'Ánh sáng và tia UV là tác nhân hàng đầu phá hủy vitamin E tự nhiên trong dầu thực vật. Tìm hiểu cách xưởng ép giữ dầu tươi mới bền lâu.',
    takeaway: 'Chai thủy tinh màu hổ phách ngăn chặn đến 90% quang phổ ánh sáng có hại, bảo vệ các liên kết axit béo chưa bão hòa khỏi bị oxy hóa sinh mùi hôi dầu.',
    bodyHtml: `
      <p>Nhiều người tiêu dùng thường thắc mắc vì sao các dòng dầu thực vật công nghiệp ngoài siêu thị thường đóng trong chai nhựa trong suốt, trong khi dầu ép cơ học tự nhiên của HM NATURALS lại luôn được bảo quản trong chai thủy tinh sẫm màu.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">1. Ánh sáng — Kẻ thù số một của giọt dầu mộc</h3>
      <p>Dầu lạc và dầu mè đen nguyên bản chứa hàm lượng Vitamin E, phytosterol và axit béo không no rất cao. Khi tiếp xúc với ánh sáng mặt trời hoặc ánh đèn huỳnh quang công suất lớn, quá trình quang oxy hóa (photo-oxidation) diễn ra nhanh gấp hàng chục lần so với trong bóng tối.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">2. Ưu thế vượt trội của thủy tinh hổ phách</h3>
      <p>Thủy tinh màu hổ phách (amber glass) đóng vai trò như một tấm màng lọc quang học tự nhiên, hấp thụ gần như hoàn toàn tia cực tím (UV-A, UV-B) và ánh sáng xanh có bước sóng dưới 450nm. Nhờ đó, chất dầu giữ được độ tươi, màu vàng óng tự nhiên và hương thơm nguyên bản suốt vụ mùa mà không cần bất kỳ chất bảo quản nào.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">3. Mẹo bảo quản tại gian bếp gia đình</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm my-3">
        <li>Đặt chai dầu ở nơi râm mát, tránh ánh nắng chiếu trực tiếp từ cửa sổ.</li>
        <li>Không để chai dầu cạnh bếp gas hoặc lò vi sóng nơi có nguồn nhiệt cao.</li>
        <li>Vặn chặt nắp sau mỗi lần sử dụng để hạn chế không khí tràn vào chai.</li>
      </ul>
    `,
    relatedProductSlug: 'dau-vung-ep-lanh',
    featured: true,
  },
  {
    id: '3',
    slug: 'kitchen-marinating-tips',
    title: 'Mẹo Ướp Thịt Nướng Dậy Mùi Thơm Sâu Với Dầu Mè Đen Rang Củi',
    categoryKey: 'kitchen-tips',
    categoryName: 'Mẹo Bếp Lành',
    date: 'Vụ Mùa 2026',
    readTime: '5 phút đọc',
    excerpt: 'Chỉ với một muỗng cà phê dầu mè đen rang củi mộc, thớ thịt nướng giữ được độ ẩm mềm tự nhiên và hương thơm ngậy sâu lắng.',
    takeaway: 'Trộn dầu mè đen vào khâu ướp cuối cùng giúp tạo lớp màng mỏng khóa ẩm trong thớ thịt, khi nướng trên than hồng bề mặt giòn bóng mà bên trong vẫn mềm ngọt.',
    bodyHtml: `
      <p>Hạt mè đen nương đồi rang chín tới trên than củi nhãn mang đến một loại dầu có sắc nâu cánh gián ấm áp và hương thơm nồng nàn không thể trộn lẫn. Trong nghệ thuật ướp nướng, dầu mè đen chính là chất xúc tác kỳ diệu giúp nâng tầm vị giác.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">1. Nguyên lý khóa ẩm của dầu thực vật tự nhiên</h3>
      <p>Khi ướp gia vị mặn như muối, nước mắm hay xì dầu, thịt thường có xu hướng bị rút nước ra ngoài khiến thớ thịt dễ bị khô ráp khi nướng. Nếu cho một lượng nhỏ dầu mè đen vào sau cùng, dầu sẽ tạo lớp màng lipid bao bọc các mao dẫn của thớ thịt, giữ trọn vẹn nước ngọt tự nhiên bên trong.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">2. Tỉ lệ ướp chuẩn vị xưởng gợi ý</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm my-3">
        <li><b>Đối với 500g thịt bò / thịt heo:</b> Dùng 1 muỗng canh hành tỏi băm, 1 muỗng xì dầu, chút tiêu xay và <b>1 muỗng cà phê dầu mè đen HM NATURALS</b>.</li>
        <li>Ướp trong 20–30 phút trước khi đặt lên vỉ nướng than hoa.</li>
        <li>Khi thịt gần chín vàng đều hai mặt, quét phết nhẹ thêm một lớp dầu mè đen pha chút mật ong để màu nướng lên óng ả bắt mắt.</li>
      </ul>
    `,
    relatedProductSlug: 'dau-vung-ep-lanh',
    featured: true,
  },
  {
    id: '4',
    slug: 'sachi-cold-salad',
    title: 'Cách Dùng Dầu Hạt Sachi Ép Sống Trong Món Salad & Sốt Trộn Dưỡng Sinh',
    categoryKey: 'recipes',
    categoryName: 'Thực Dưỡng Lành',
    date: 'Vụ Mùa 2026',
    readTime: '4 phút đọc',
    excerpt: 'Hạt Sachi được mệnh danh là siêu thực phẩm với hàm lượng Omega 3-6-9 dồi dào. Khám phá cách phối sốt trộn ngon miệng.',
    takeaway: 'Dầu hạt Sachi ép sống tuyệt đối không nên gia nhiệt xào nấu. Hãy dùng trộn trực tiếp vào salad rau củ tươi, rưới lên cháo ấm hoặc pha sốt chanh mật ong.',
    bodyHtml: `
      <p>Khác với dầu phộng và dầu mè thường dùng trong xào nấu, dầu hạt Sachi được xếp vào nhóm dầu thực dưỡng ăn sống. Ép cơ học từ hạt sachi tươi, dầu sở hữu vị bùi nhẹ như hạt dẻ và hơi ngai ngái tươi mát của thảo mộc tự nhiên.</p>
      <h3 class="text-base font-bold text-forest-green mt-4 mb-2">1. Công thức sốt Vinaigrette Sachi chanh mật ong</h3>
      <ul class="list-disc pl-5 space-y-1.5 text-sm my-3">
        <li>2 muỗng canh dầu hạt Sachi HM Naturals</li>
        <li>1 muỗng canh nước cốt chanh tươi hoặc giấm táo hữu cơ</li>
        <li>1 muỗng cà phê mật ong hoa rừng</li>
        <li>1 nhúm muối hồng Himalaya và tiêu đen giã dập</li>
      </ul>
      <p>Khuấy đều hỗn hợp cho đến khi nhũ hóa sánh nhẹ, rưới đều lên tô xà lách giòn cùng cà chua bi và hạt óc chó.</p>
    `,
    relatedProductSlug: 'dau-sachi-ep-song',
    featured: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

export function getMockProductsPage(params?: {
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
}): PageDto<ExtendedProductDto> {
  let filtered = mockProducts.filter((p) => p.status === 'ACTIVE');

  if (params?.category && params.category !== 'all') {
    const cat = mockCategories.find((c) => c.slug === params.category);
    if (cat) {
      filtered = filtered.filter((p) => p.categoryId === cat.id);
    }
  }

  if (params?.keyword) {
    const kw = params.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        p.shortDescription?.toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw),
    );
  }

  const page = params?.page ?? 0;
  const size = params?.size ?? 12;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
  };
}

export function getMockProductBySlug(slug: string): ExtendedProductDto | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getMockKnowledgeArticles(): KnowledgeArticleDto[] {
  return mockKnowledgeArticles;
}

export function getMockArticleBySlug(slug: string): KnowledgeArticleDto | undefined {
  return mockKnowledgeArticles.find((a) => a.slug === slug);
}
