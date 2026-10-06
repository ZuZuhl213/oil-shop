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
  categoryName?: string;
  categorySlug?: string;
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
    images: [], imagesRevision: 0,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 0,
    visualType: 'peanut',
    tag: 'Bán chạy nhất',
    featured: true,
    variants: [
      { id: '1', productId: '1', name: '250ml', sku: 'DL-250', price: 95000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '2', productId: '1', name: '500ml', sku: 'DL-500', price: 165000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
      { id: '3', productId: '1', name: '1000ml', sku: 'DL-1000', price: 310000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 2 },
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
    images: [], imagesRevision: 0,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 1,
    visualType: 'sesame',
    tag: 'Rang củi thủ công',
    featured: true,
    variants: [
      { id: '4', productId: '2', name: '250ml', sku: 'DV-250', price: 145000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '5', productId: '2', name: '500ml', sku: 'DV-500', price: 260000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
      { id: '6', productId: '2', name: '1000ml', sku: 'DV-1000', price: 490000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 2 },
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
    images: [], imagesRevision: 0,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 2,
    visualType: 'sachi',
    tag: 'Dưỡng sinh Organic',
    featured: true,
    variants: [
      { id: '7', productId: '3', name: '250ml', sku: 'SC-250', price: null, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
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
    images: [], imagesRevision: 0,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 3,
    visualType: 'gac',
    tag: 'Giàu Beta-Carotene',
    variants: [
      { id: '8', productId: '4', name: '100ml', sku: 'DG-100', price: 120000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '9', productId: '4', name: '250ml', sku: 'DG-250', price: 280000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
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
    name: 'Dầu Dừa Ép Nhiệt Cơ Học Tinh Khiết',
    slug: 'dau-dua-nguyen-chat',
    shortDescription: 'Cơm dừa tươi ép nhiệt cơ học, thơm dịu ngọt lành, dùng ẩm thực và làm đẹp.',
    description:
      'Dầu dừa nguyên chất vừa thu hái. Không qua xử lý tẩy trắng hay khử mùi hóa chất, giữ nguyên vẹn axit lauric kháng khuẩn và mùi thơm dừa mộc mạc.',
    thumbnailUrl: null,
    images: [], imagesRevision: 0,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 4,
    visualType: 'coconut',
    variants: [
      { id: '10', productId: '5', name: '500ml', sku: 'DD-500', price: 95000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '11', productId: '5', name: '1000ml', sku: 'DD-1000', price: 180000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
    ],
    specs: [
      { label: 'Nguồn gốc', value: 'Dừa tươi chọn lọc' },
      { label: 'Công nghệ', value: 'Ép nhiệt cơ học' },
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
    images: [], imagesRevision: 0,
    saleType: 'FIXED_PRICE',
    status: 'ACTIVE',
    sortOrder: 5,
    visualType: 'seeds',
    variants: [
      { id: '12', productId: '6', name: '1kg túi mộc', sku: 'LD-1', price: 65000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '13', productId: '6', name: '5kg bao dứa', sku: 'LD-5', price: 300000, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
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
    images: [], imagesRevision: 0,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 6,
    visualType: 'byproduct',
    tag: 'Bán buôn / Đại lý',
    variants: [
      { id: '14', productId: '7', name: 'Bao 25kg', sku: 'BL-25', price: null, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
      { id: '15', productId: '7', name: 'Bao 50kg', sku: 'BL-50', price: null, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 1 },
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
    images: [], imagesRevision: 0,
    saleType: 'QUOTE',
    status: 'ACTIVE',
    sortOrder: 7,
    visualType: 'byproduct',
    tag: 'Phân bón sinh học',
    variants: [
      { id: '16', productId: '8', name: 'Bao 25kg', sku: 'BV-25', price: null, minQuantity: 1, quantityStep: 1, isActive: true, sortOrder: 0 },
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

export interface ScientificSource {
  name: string;
  url: string;
}

export interface ArticleSection {
  id: string;
  title: string;
  bodyHtml: string;
}

export interface KnowledgeArticleDto {
  id: string;
  slug: string;
  title: string;
  categoryKey: string;
  categoryName: string;
  date?: string;
  excerpt: string;
  takeaway: string;
  bodyHtml: string;
  introduction: string;
  sections: ArticleSection[];
  imageUrl: string;
  imageSource?: ScientificSource;
  sources?: ScientificSource[];
  disclaimer?: string;
  relatedProductSlug?: string;
  featured?: boolean;
  thumbnailType?: 'peanut' | 'sesame' | 'sachi' | 'gac' | 'coconut' | 'byproduct' | 'seeds';
}

// Kiến thức tổng quát được biên tập từ nguồn tham khảo; ví dụ thực hành là gợi ý của HM NATURALS.
// Các section tạo đồng thời mục lục và bodyHtml để đường dẫn trong bài luôn khớp.
export const mockKnowledgeArticles: KnowledgeArticleDto[] = [
  {
    "id": "saturated-vs-unsaturated-guide",
    "slug": "saturated-vs-unsaturated-guide",
    "title": "Hiểu đúng về các nhóm chất béo",
    "categoryKey": "oil-knowledge",
    "categoryName": "Kiến thức dầu",
    "imageUrl": "/images/knowledge/longchau-chat-beo.jpg",
    "imageSource": {
      "name": "Long Châu · Các nhóm chất béo",
      "url": "https://nhathuoclongchau.com.vn/bai-viet/chat-beo-bao-hoa-va-chat-beo-khong-bao-hoa-tac-dong-den-suc-khoe-nhu-the-nao-64927.html"
    },
    "excerpt": "Phân biệt chất béo bão hòa, không bão hòa và đọc nhãn dầu ăn để chọn cho bữa cơm gia đình.",
    "takeaway": "Chọn nguồn chất béo phù hợp và dùng vừa đủ; một loại dầu không quyết định chất lượng cả khẩu phần.",
    "introduction": "Khi chọn dầu ăn, chúng ta thường để ý mùi thơm, màu sắc hoặc dòng chữ “nguyên chất”. Hiểu thêm về chất béo giúp bạn nhìn nhãn chai có cơ sở hơn, rồi chọn theo món ăn và nhu cầu của gia đình.",
    "sections": [
      {
        "id": "ba-nhom-chat-beo",
        "title": "Ba nhóm chất béo thường gặp",
        "bodyHtml": `
<p>Chất béo bão hòa có nhiều trong bơ, mỡ động vật, dầu dừa và dầu cọ. Dầu có nguồn gốc thực vật vẫn có thể chứa nhiều chất béo bão hòa; vì vậy không nên chỉ dựa vào tên nguyên liệu để kết luận.</p>
 <p>Chất béo không bão hòa đơn thường gặp trong dầu ô liu, dầu lạc và quả bơ. Chất béo không bão hòa đa gồm các nhóm như omega-3, omega-6, có trong nhiều loại hạt, dầu thực vật và cá béo. Mỗi thực phẩm thường chứa hỗn hợp các nhóm này.</p>
    `
      },
      {
        "id": "nguyen-tac-thay-the",
        "title": "Hiểu nguyên tắc thay thế",
        "bodyHtml": `
<p>WHO khuyến nghị ưu tiên chất béo không bão hòa và hạn chế chất béo bão hòa. Điều đáng chú ý là <strong>thay thế một phần nguồn chất béo</strong>, thay vì giữ nguyên lượng bơ, mỡ rồi thêm dầu vào bữa ăn.</p>
 <p>Harvard Nutrition Source cũng nhấn mạnh chất lượng nguồn chất béo trong toàn bộ chế độ ăn. Rau, đậu, ngũ cốc nguyên hạt và thực phẩm đa dạng vẫn cần có mặt; dầu ăn không thể làm nhiệm vụ của những nhóm thực phẩm ấy.</p>
    `
      },
      {
        "id": "doc-nhan-chai",
        "title": "Ba điểm cần đọc trên nhãn chai",
        "bodyHtml": `
<ol>
 <li><strong>Nguyên liệu:</strong> xem dầu được làm từ loại hạt, quả nào và có phối trộn hay không. Ghi lại nguyên liệu mà gia đình cần tránh vì dị ứng.</li>
 <li><strong>Mục đích sử dụng:</strong> đọc hướng dẫn nấu ăn của nhà sản xuất. Một chai dùng tạo hương có thể khác chai được thiết kế cho chiên xào.</li>
 <li><strong>Thông tin bảo quản:</strong> kiểm tra hạn dùng, yêu cầu sau khi mở nắp và dung tích. Chai vừa với tốc độ dùng thường thuận tiện hơn chai lớn mua vì khuyến mại.</li>
 </ol>
    `
      },
      {
        "id": "thay-doi-tu-bua-com",
        "title": "Bắt đầu từ một bữa cơm",
        "bodyHtml": `
<p>Hãy nhìn lại món ăn bạn thường nấu: món nào cần dầu để làm chín, món nào chỉ cần vài giọt tạo hương? Chuẩn bị lượng dầu trước khi nấu giúp bạn quan sát và điều chỉnh, thay vì rót liên tục theo cảm giác.</p>
 <p>Ví dụ biên tập: với một bữa có món xào, bạn có thể chọn thêm canh và rau luộc để cách chế biến đa dạng hơn. Khi thử chai dầu mới, giữ các gia vị khác gần như cũ để nhận ra mùi vị của dầu có hợp khẩu vị không.</p>
 <p>Nếu đang theo chế độ ăn do bác sĩ hoặc chuyên gia dinh dưỡng hướng dẫn, hãy ưu tiên kế hoạch riêng ấy. Các nguyên tắc trên chỉ giúp bạn đặt câu hỏi tốt hơn khi mua và dùng dầu.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Long Châu · Các nhóm chất béo",
        "url": "https://nhathuoclongchau.com.vn/bai-viet/chat-beo-bao-hoa-va-chat-beo-khong-bao-hoa-tac-dong-den-suc-khoe-nhu-the-nao-64927.html"
      },
      {
        "name": "WHO · Hướng dẫn về chất béo",
        "url": "https://www.who.int/news/item/17-07-2023-who-updates-guidelines-on-fats-and-carbohydrates"
      },
      {
        "name": "Harvard Nutrition Source · Types of Fat",
        "url": "https://nutritionsource.hsph.harvard.edu/what-should-you-eat/fats-and-cholesterol/types-of-fat/"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true
  },
  {
    "id": "peanut-oil-diet-balance",
    "slug": "peanut-oil-diet-balance",
    "title": "Dầu lạc trong căn bếp Việt",
    "categoryKey": "kitchen-tips",
    "categoryName": "Cách sử dụng",
    "imageUrl": "/images/knowledge/longchau-dau-lac.jpg",
    "imageSource": {
      "name": "Long Châu · Thành phần dầu lạc",
      "url": "https://nhathuoclongchau.com.vn/bai-viet/dau-lac-co-chua-nhung-chat-gi-loi-ich-cua-dau-lac-doi-voi-suc-khoe.html"
    },
    "excerpt": "Cách chọn dầu lạc, phối với món xào và món ướp, cùng lưu ý quan trọng về dị ứng đậu phộng.",
    "takeaway": "Phân biệt dầu tinh luyện và dầu ép; người dị ứng đậu phộng cần tránh dầu lạc chưa tinh luyện.",
    "introduction": "Dầu lạc, còn gọi là dầu đậu phộng, quen thuộc trong nhiều gian bếp Việt. Hương của hạt có thể làm món ăn đậm đà hơn, nhưng cách dùng phù hợp còn tùy quy trình chế biến và hướng dẫn của từng chai dầu.",
    "sections": [
      {
        "id": "thanh-phan-dau-lac",
        "title": "Thành phần và hương vị",
        "bodyHtml": `
<p>Bài Long Châu giới thiệu dầu lạc như một nguồn chất béo không bão hòa đơn, đa, đồng thời vẫn có chất béo bão hòa và vitamin E. Tỷ lệ thực tế thay đổi theo nguyên liệu và chế biến; không nên lấy số liệu chung để gán cho một sản phẩm cụ thể.</p>
 <p>Trong căn bếp, hãy bắt đầu bằng điều có thể quan sát: dầu có hương nhẹ hay đậm, món ăn có hợp mùi đó không? Dầu là nguyên liệu nấu ăn; những lời quảng cáo về chữa bệnh không phải tiêu chí để chọn cho món xào.</p>
    `
      },
      {
        "id": "chon-loai-dau",
        "title": "Dầu ép và dầu tinh luyện",
        "bodyHtml": `
<p>Đọc nhãn để biết dầu được ép, tinh luyện hay phối trộn. Các cách chế biến có thể tạo sản phẩm khác nhau về hương vị và điều kiện sử dụng. Đừng dùng một nhiệt độ “điểm khói của dầu lạc” trên mạng cho tất cả các chai.</p>
 <p>FARE lưu ý người dị ứng đậu phộng cần tránh dầu lạc ép lạnh, ép đùn hoặc các loại chưa tinh luyện vì có thể còn protein gây dị ứng. Với dầu tinh luyện cao, hãy trao đổi với bác sĩ dị ứng thay vì tự thử tại nhà.</p>
    `
      },
      {
        "id": "thuc-hanh-mon-xao",
        "title": "Gợi ý thực hành với món xào",
        "bodyHtml": `
<ol>
 <li>Chuẩn bị rau, đạm và gia vị trước khi bật bếp. Chọn món quen thuộc để dễ nhận ra ảnh hưởng của mùi dầu.</li>
 <li>Lấy lượng dầu phù hợp với hướng dẫn trên chai và lượng thức ăn. Đặt chai lại vào chỗ bảo quản ngay sau khi lấy dầu.</li>
 <li>Nấu theo công thức của món ăn, điều chỉnh nhiệt để dầu không bốc khói. Nếu dầu đã bốc khói rõ, dừng dùng phần dầu đó.</li>
 <li>Nếm món sau khi hoàn thành. Lần sau giảm hoặc đổi dầu nếu hương lạc lấn át hương rau, cá hay gia vị mà bạn muốn giữ.</li>
 </ol>
    `
      },
      {
        "id": "goi-y-phoi-mon",
        "title": "Phối món và chuẩn bị cho lần sau",
        "bodyHtml": `
<p>Gợi ý biên tập: thử dầu lạc với rau xào tỏi, đậu phụ áp chảo hoặc một món thịt ướp quen thuộc. Với phần ướp, chỉ chuẩn bị đủ cho lần nấu đó; đây là cách thử hương vị, không phải công thức bảo quản thực phẩm.</p>
 <p>Nếu muốn so sánh hai chai dầu, thử chúng ở hai lần nấu cùng một món, ghi lại lượng đã dùng và cảm nhận của gia đình. Bạn sẽ dễ chọn hơn so với thay cả dầu lẫn công thức trong một lần.</p>
 <p>Khi nấu cho khách, hỏi trước về dị ứng và cho biết món có dùng dầu lạc. Dụng cụ, nước chấm và đồ ăn kèm cũng cần được xem xét, thay vì chỉ đổi chai dầu trong chảo.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Long Châu · Thành phần dầu lạc",
        "url": "https://nhathuoclongchau.com.vn/bai-viet/dau-lac-co-chua-nhung-chat-gi-loi-ich-cua-dau-lac-doi-voi-suc-khoe.html"
      },
      {
        "name": "FARE · Dị ứng đậu phộng và dầu lạc",
        "url": "https://www.foodallergy.org/living-food-allergy/food-allergy-essentials/common-allergens/peanut"
      },
      {
        "name": "American Heart Association · Healthy Cooking Oils",
        "url": "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/healthy-cooking-oils"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true,
    "relatedProductSlug": "dau-lac-nguyen-chat"
  },
  {
    "id": "dau-vung-cach-su-dung",
    "slug": "dau-vung-cach-su-dung",
    "title": "Dầu vừng: chọn đúng, thêm đúng lúc",
    "categoryKey": "kitchen-tips",
    "categoryName": "Cách sử dụng",
    "imageUrl": "/images/knowledge/joc-dau-vung.jpg",
    "imageSource": {
      "name": "Just One Cookbook · Cách dùng dầu vừng",
      "url": "https://www.justonecookbook.com/sesame-oil/"
    },
    "excerpt": "Phân biệt dầu vừng rang và chưa rang; gợi ý nêm canh, trộn rau, làm nước chấm và ướp món ăn.",
    "takeaway": "Dầu vừng rang thường đậm hương, hợp làm điểm nhấn; hãy đọc nhãn trước khi dùng để nấu.",
    "introduction": "Chỉ một chút hương vừng đã có thể thay đổi cảm nhận về bát mì hay đĩa rau. Nhưng “dầu vừng” không phải một sản phẩm duy nhất: loại rang và loại chưa rang có cách dùng khác nhau, cần nhận biết trước khi mở bếp.",
    "sections": [
      {
        "id": "rang-va-chua-rang",
        "title": "Nhận biết loại rang và chưa rang",
        "bodyHtml": `
<p>Theo Just One Cookbook, dầu từ hạt vừng rang thường có sắc vàng nâu đến nâu sẫm, hương bùi rõ. Loại chưa rang thường nhạt màu hơn và có vị nhẹ hơn. Nhãn chai là căn cứ tốt hơn việc chỉ nhìn màu qua bao bì.</p>
 <p>Dầu rang thường được dùng để hoàn thiện hương vị món ăn, làm sốt và phần ướp. Dầu chưa rang có thể phù hợp cho các công thức cần vị dầu nhẹ. Hãy đối chiếu hướng dẫn của sản phẩm bạn đang cầm, vì mỗi nhà sản xuất có cách chế biến riêng.</p>
    `
      },
      {
        "id": "them-dau-dung-luc",
        "title": "Thêm hương ở cuối món ăn",
        "bodyHtml": `
<p>Với dầu vừng rang, thêm một lượng nhỏ sau khi món ăn đã chín là cách dễ cảm nhận hương. Just One Cookbook gợi ý dùng cho canh, mì, rau và nước sốt; khi dùng nấu, cần tránh làm dầu cháy hoặc đắng.</p>
 <p>Gợi ý biên tập: múc riêng một ít canh vào bát thử, thêm vài giọt dầu rồi nếm. Nếu hợp, mới điều chỉnh phần còn lại. Cách thử từng phần giúp tránh việc cả nồi bị quá nồng hương vừng.</p>
    `
      },
      {
        "id": "nuoc-cham-va-mon-tron",
        "title": "Thử với nước chấm và món trộn",
        "bodyHtml": `
<ol>
 <li>Chuẩn bị một phần nước chấm quen thuộc, chẳng hạn nền nước tương phù hợp khẩu vị gia đình. Giữ lại một ít chưa thêm dầu để so sánh.</li>
 <li>Thêm dầu vừng rang từng ít một, khuấy và nếm. Không cần một lượng cố định cho mọi loại dầu, bởi độ đậm hương khác nhau.</li>
 <li>Với rau hoặc mì trộn, chuẩn bị thực phẩm theo công thức của món ăn rồi trộn sốt lúc sắp dùng. Trộn đều để hương không tập trung ở một chỗ.</li>
 <li>Ghi lại cách phối mà bạn thích. Lần sau đổi một yếu tố, như độ chua hoặc hương tỏi, để dễ điều chỉnh hơn.</li>
 </ol>
    `
      },
      {
        "id": "nhung-dieu-can-luu-y",
        "title": "Lưu ý khi chọn và dùng",
        "bodyHtml": `
<p>Đừng hiểu “vừng đen” hay “vừng trắng” là lời bảo đảm cho một công dụng sức khỏe cụ thể. Trong bài này, lựa chọn dựa trên loại dầu, hướng vị và món ăn; các sản phẩm Kadoya được dẫn để tham khảo sự đa dạng của dầu vừng, không phải để thay thế hướng dẫn trên chai.</p>
 <p>Với món ướp, thử lượng nhỏ và xem dầu có hợp các gia vị khác không. Nếu món đã có vừng rang hoặc sốt vừng, bạn có thể cần ít dầu tạo hương hơn để hương tổng thể dễ chịu.</p>
 <p>Người có dị ứng vừng cần tránh nguyên liệu gây dị ứng. Khi nấu cho người khác, hãy nói rõ dầu và sốt đang dùng có vừng; đọc thành phần của chai phối trộn thay vì chỉ nhìn tên ở mặt trước.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Just One Cookbook · Cách dùng dầu vừng",
        "url": "https://www.justonecookbook.com/sesame-oil/"
      },
      {
        "name": "Kadoya · Các loại dầu vừng",
        "url": "https://www.kadoya.com/english/products/family.html"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true,
    "relatedProductSlug": "dau-vung-ep-lanh"
  },
  {
    "id": "dau-dua-ep-lanh-am-thuc",
    "slug": "dau-dua-ep-lanh-am-thuc",
    "title": "Dầu dừa cho món ngọt và món nấu",
    "categoryKey": "kitchen-tips",
    "categoryName": "Cách sử dụng",
    "imageUrl": "/images/knowledge/harvard-dau-dua.jpg",
    "imageSource": {
      "name": "Harvard Nutrition Source · Coconut Oil",
      "url": "https://nutritionsource.hsph.harvard.edu/food-features/coconut-oil/"
    },
    "excerpt": "Chọn dầu dừa theo mùi vị, dùng trong bánh và món nấu, hiểu đúng về đông đặc và chất béo bão hòa.",
    "takeaway": "Dầu dừa tạo hương vị riêng nhưng giàu chất béo bão hòa; dùng theo món ăn và khẩu phần.",
    "introduction": "Hương dừa có thể hợp với bánh, món ngọt hoặc một số món nấu, nhưng cũng dễ làm đổi vị công thức quen. Chọn đúng chai và thử từng lượng nhỏ sẽ giúp bạn tận dụng hương đó mà vẫn kiểm soát món ăn.",
    "sections": [
      {
        "id": "chon-theo-huong-vi",
        "title": "Chọn theo hương vị cần có",
        "bodyHtml": `
<p>Harvard Nutrition Source phân biệt dầu dừa nguyên chất và dầu tinh luyện: loại nguyên chất thường giữ hương dừa rõ hơn; loại tinh luyện có thể có hương nhẹ hơn. Bạn nên đọc nhãn và chọn theo công thức, thay vì mặc định chai nào cũng giống nhau.</p>
 <p>Gợi ý biên tập: nếu muốn chiếc bánh có hương dừa, hãy chọn công thức vốn sử dụng dầu dừa. Với món mặn, thử phần nhỏ trước để xem hương này có hợp gia vị và nguyên liệu của gia đình.</p>
    `
      },
      {
        "id": "chat-beo-va-trang-thai",
        "title": "Hiểu chất béo và trạng thái của dầu",
        "bodyHtml": `
<p>Dầu dừa có tỷ lệ chất béo bão hòa cao. Harvard lưu ý rằng dầu dừa thông thường không tương đương sản phẩm MCT chuyên biệt; không nên suy từ quảng cáo MCT sang tác dụng giảm cân hay bảo vệ tim mạch của dầu dừa.</p>
 <p>Dầu có thể trắng và rắn khi lạnh, trong và lỏng hơn khi ấm. Thay đổi trạng thái tự nhiên này không tự chứng minh dầu bị hỏng, cũng không đủ để chứng minh dầu nguyên chất. Vẫn cần kiểm tra nhãn, hạn dùng và tình trạng bảo quản.</p>
    `
      },
      {
        "id": "thuc-hanh-lam-banh",
        "title": "Dùng trong một mẻ bánh nhỏ",
        "bodyHtml": `
<ol>
 <li>Chọn công thức có hướng dẫn dùng dầu dừa và chuẩn bị đúng lượng. Không thay toàn bộ bơ bằng dầu chỉ vì cả hai đều là chất béo.</li>
 <li>Đọc xem công thức cần dầu lỏng hay rắn. Chuẩn bị nguyên liệu theo trạng thái ấy trước khi trộn để tránh thao tác vội ở giữa công thức.</li>
 <li>Làm mẻ nhỏ ở lần thử đầu, giữ nguyên các nguyên liệu khác. Quan sát hương, cấu trúc và cảm nhận khi bánh nguội.</li>
 <li>Ghi lại chai dầu và lượng đã dùng. Nếu muốn điều chỉnh, đổi từng yếu tố ở lần sau để biết thay đổi nào tạo kết quả bạn thích.</li>
 </ol>
    `
      },
      {
        "id": "chon-mon-va-khau-phan",
        "title": "Chọn món và giữ khẩu phần cân bằng",
        "bodyHtml": `
<p>Gợi ý biên tập: dầu dừa có thể là một lựa chọn về hương vị cho bánh chuối, bánh yến mạch hoặc món nấu mang phong vị dừa khi công thức cho phép. Đó là lựa chọn ẩm thực, không biến món ngọt thành thực phẩm có thể ăn không giới hạn.</p>
 <p>Hãy cân nhắc cả bữa ăn thay vì chỉ nhìn một nguyên liệu. Nếu hôm đó đã có nhiều món béo, bạn có thể chọn cách chế biến nhẹ hơn cho các món còn lại. Không cần thêm dầu dừa vào mọi đồ uống hay món ăn để “bổ sung dưỡng chất”.</p>
 <p>Cất riêng dụng cụ lấy dầu phục vụ nấu ăn với phần dùng ngoài da. Thao tác tách riêng này giúp quản lý chai và mục đích dùng dễ hơn; hướng dẫn chăm sóc da được trình bày trong một bài riêng.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Harvard Nutrition Source · Coconut Oil",
        "url": "https://nutritionsource.hsph.harvard.edu/food-features/coconut-oil/"
      },
      {
        "name": "Lalifa · Các loại dầu thực vật",
        "url": "https://mayepdaugiadinh.com/8-loai-dau-thuc-vat-pho-bien-tai-viet-nam-va-cach-dung/"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true,
    "relatedProductSlug": "dau-dua-nguyen-chat"
  },
  {
    "id": "dau-dua-cham-soc-da",
    "slug": "dau-dua-cham-soc-da",
    "title": "Dầu dừa và da: dưỡng ẩm có chọn lọc",
    "categoryKey": "skin-care",
    "categoryName": "Chăm sóc da",
    "imageUrl": "/images/knowledge/cleveland-duong-da.jpg",
    "imageSource": {
      "name": "Cleveland Clinic · Dầu dừa và làn da",
      "url": "https://health.clevelandclinic.org/coconut-oil-for-skin"
    },
    "excerpt": "Hiểu khi nào dầu dừa có thể hỗ trợ dưỡng ẩm, cách thử trên da và vì sao da dễ nổi mụn cần thận trọng.",
    "takeaway": "Có thể hợp với vùng da cơ thể khô, nhưng dầu dừa dễ gây bít tắc và không phải cách trị mụn.",
    "introduction": "Dầu dừa xuất hiện trong nhiều lời khuyên làm đẹp tại nhà. Trước khi dùng, điều hữu ích nhất là xác định vùng da, vấn đề bạn muốn cải thiện và sản phẩm có phù hợp cho mục đích chăm sóc da hay không.",
    "sections": [
      {
        "id": "duong-am-co-chon-loc",
        "title": "Dưỡng ẩm có chọn lọc",
        "bodyHtml": `
<p>Cleveland Clinic cho biết dầu dừa có thể giúp giảm mất nước qua da và làm mềm vùng da cơ thể khô. Lợi ích dưỡng ẩm không có nghĩa sản phẩm phù hợp cho mọi người hoặc cho mọi vùng trên cơ thể.</p>
 <p>Cũng theo nguồn này, dầu dừa dễ gây bít tắc lỗ chân lông. Da mặt và các vùng dễ nổi mụn như ngực, lưng cần đặc biệt thận trọng. Không nên xem dầu dừa là phương pháp ngăn hoặc điều trị mụn.</p>
    `
      },
      {
        "id": "thu-tren-vung-nho",
        "title": "Thử trước trên một vùng nhỏ",
        "bodyHtml": `
<p>American Academy of Dermatology khuyên thử sản phẩm chăm sóc da mới trên vùng nhỏ, như mặt trong cánh tay, hai lần mỗi ngày trong 7–10 ngày. Dùng lượng thông thường và tuân theo hướng dẫn của sản phẩm.</p>
 <p>Theo dõi đỏ, ngứa, sưng hoặc khó chịu. Nếu có phản ứng, rửa nhẹ để loại bỏ sản phẩm và ngừng dùng. Phản ứng nặng hoặc kéo dài cần được bác sĩ đánh giá; thử ở nhà không thay thế xét nghiệm dị ứng chuyên môn.</p>
    `
      },
      {
        "id": "quy-trinh-don-gian",
        "title": "Giữ quy trình đơn giản",
        "bodyHtml": `
<ol>
 <li>Đọc nhãn để xác định mục đích sử dụng. Một chai bán để nấu ăn không tự động có hướng dẫn chăm sóc da phù hợp.</li>
 <li>Chọn một vùng da cơ thể khô, không bị tổn thương và không dễ nổi mụn. Thực hiện bước thử nhỏ trước khi mở rộng vùng dùng.</li>
 <li>Nếu da dung nạp, dùng ít trên vùng cần dưỡng ẩm theo hướng dẫn. Cleveland Clinic gợi ý chăm sóc da cơ thể sau khi tắm.</li>
 <li>Quan sát sự thay đổi của da. Không tăng lượng chỉ vì muốn thấy hiệu quả nhanh; dừng lại khi xuất hiện khó chịu hoặc nổi mụn.</li>
 </ol>
    `
      },
      {
        "id": "khong-ky-vong-qua-muc",
        "title": "Không kỳ vọng vượt quá bằng chứng",
        "bodyHtml": `
<p>Bài này không hướng dẫn dùng dầu để làm trắng, trị nám hay thay thế thuốc cho bệnh da. Nếu mục tiêu của bạn là xử lý mụn, viêm da hoặc một tổn thương đang tiến triển, hãy chọn hướng chăm sóc cùng bác sĩ da liễu.</p>
 <p>Gợi ý tổ chức quy trình: khi thử một sản phẩm mới, ghi lại ngày bắt đầu, vùng dùng và phản ứng. Giữ các sản phẩm quen thuộc khác ổn định để dễ nhận ra thay đổi liên quan đến sản phẩm mới.</p>
 <p>Không cần trộn thêm nhiều nguyên liệu nhà bếp trong lần đầu. Một quy trình ít bước giúp bạn theo dõi thuận tiện hơn, cũng tránh việc không biết thành phần nào gây khó chịu khi da phản ứng.</p>
 <p>Cuối cùng, hãy đánh giá bằng cảm nhận và tình trạng da của chính bạn, không bằng một ảnh trước–sau trên mạng. “Tự nhiên” chỉ mô tả nguồn gốc, không bảo đảm da sẽ hợp hoặc rằng mọi vấn đề da đều được cải thiện.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Cleveland Clinic · Dầu dừa và làn da",
        "url": "https://health.clevelandclinic.org/coconut-oil-for-skin"
      },
      {
        "name": "American Academy of Dermatology · Thử sản phẩm trên da",
        "url": "https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products/"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true
  },
  {
    "id": "bao-quan-dau-thuc-vat",
    "slug": "bao-quan-dau-thuc-vat",
    "title": "Bảo quản dầu: từ lúc mở nắp đến khi dùng",
    "categoryKey": "kitchen-tips",
    "categoryName": "Cách sử dụng",
    "imageUrl": "/images/knowledge/lalifa-dau-thuc-vat.webp",
    "imageSource": {
      "name": "Lalifa · Các loại dầu thực vật",
      "url": "https://mayepdaugiadinh.com/8-loai-dau-thuc-vat-pho-bien-tai-viet-nam-va-cach-dung/"
    },
    "excerpt": "Sắp xếp chai dầu trong căn bếp, theo dõi ngày mở nắp và nhận biết lúc cần ngừng sử dụng.",
    "takeaway": "Cất dầu nơi mát, tránh ánh sáng; kiểm tra mùi, hạn dùng và hướng dẫn riêng của từng chai.",
    "introduction": "Một chai dầu phù hợp vẫn cần được chăm sóc trong quá trình dùng. Bạn không cần một tủ bếp cầu kỳ: chọn vị trí, quản lý lượng mua và hình thành vài thao tác đều đặn đã giúp việc sử dụng rõ ràng hơn.",
    "sections": [
      {
        "id": "chon-cho-cat",
        "title": "Chọn chỗ cất thuận tiện",
        "bodyHtml": `
<p>American Heart Association khuyên bảo quản dầu ở nơi tối, mát. Trong căn bếp, hãy kiểm tra vị trí hiện tại: chai có nằm sát bếp nóng, dưới ánh nắng cửa sổ hay trên kệ bị chiếu sáng thường xuyên không?</p>
 <p>Gợi ý biên tập: chọn một ngăn tủ dễ với tới nhưng không cạnh nguồn nhiệt. Dành chỗ riêng cho dầu nấu ăn và dầu tạo hương để bạn nhìn thấy các chai đang có, tránh mở thêm chai mới chỉ vì quên chai cũ.</p>
    `
      },
      {
        "id": "mua-vua-muc-dung",
        "title": "Mua theo mức dùng của gia đình",
        "bodyHtml": `
<p>AHA gợi ý mua chai nhỏ hơn nếu ít dùng, để có cơ hội dùng hết trước hạn. Hãy ước lượng từ thói quen thực tế, chẳng hạn số bữa nấu trong tuần và món nào thường cần dầu.</p>
 <p>Bạn có thể ghi ngày mở nắp lên nhãn phụ, rồi xem lại các chai khi chuẩn bị danh sách mua hàng. Ghi chú này giúp quản lý, không tạo ra một hạn dùng mới: hạn và yêu cầu sau mở nắp vẫn theo nhà sản xuất.</p>
 <p>Nếu đang thử một loại dầu lần đầu, hãy cân nhắc dung tích nhỏ. Sau vài món, bạn sẽ biết hương vị có phù hợp và chai đó được dùng thường xuyên hay chỉ dành cho một món đặc biệt.</p>
    `
      },
      {
        "id": "thao-tac-hang-ngay",
        "title": "Một trình tự sau mỗi lần nấu",
        "bodyHtml": `
<ol>
 <li>Lấy đúng chai cho món ăn và kiểm tra nhãn nếu bạn chưa quen loại dầu. Để chai ngoài khu vực thao tác với thực phẩm sống.</li>
 <li>Chuẩn bị lượng cần dùng, giữ dụng cụ lấy dầu sạch và khô. Không đổ phần dầu đã lấy ra hoặc đã dùng vào lại chai đang bảo quản.</li>
 <li>Kiểm tra nắp đã đóng kín, giữ vùng miệng chai gọn sạch rồi trả chai về chỗ cũ.</li>
 <li>Trước lần mua tiếp theo, xem lại lượng còn, hạn dùng và ghi chú mở nắp. Cách làm này giúp tránh tích nhiều chai ít được dùng.</li>
 </ol>
    `
      },
      {
        "id": "khi-nao-ngung-dung",
        "title": "Khi nào cần ngừng dùng?",
        "bodyHtml": `
<p>AHA lưu ý dầu có mùi bất thường có thể đã ôi; không nên tiếp tục dùng. Nguồn này cũng khuyên không tái sử dụng dầu nấu ăn và không dùng dầu đã bốc khói.</p>
 <p>Đừng cố che mùi lạ bằng tỏi, hành hoặc gia vị mạnh. Nếu không chắc tình trạng của chai, hãy xem hướng dẫn hoặc hỏi nơi cung cấp, thay vì thử nấu một món để kiểm tra bằng cách ăn.</p>
 <p>Riêng dầu dừa, việc chuyển rắn khi lạnh rồi lỏng khi ấm là đặc điểm vật lý được Harvard mô tả. Hãy phân biệt điều đó với đánh giá chất lượng: trạng thái, màu hoặc mùi đơn lẻ không thay thế việc kiểm tra toàn bộ điều kiện sử dụng.</p>
 <p>Một góc cất gọn và vài ghi chú ngắn giúp bạn dễ kiểm tra hơn. Khi gia đình có nhiều người nấu, thống nhất vị trí và cách ghi ngày mở nắp để mọi người cùng theo dõi được.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "American Heart Association · Healthy Cooking Oils",
        "url": "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/healthy-cooking-oils"
      },
      {
        "name": "Harvard Nutrition Source · Coconut Oil",
        "url": "https://nutritionsource.hsph.harvard.edu/food-features/coconut-oil/"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true
  },
  {
    "id": "cooking-oil-usage-guide",
    "slug": "cooking-oil-usage-guide",
    "title": "Chọn dầu theo món ăn, không theo trào lưu",
    "categoryKey": "oil-knowledge",
    "categoryName": "Kiến thức dầu",
    "imageUrl": "/images/knowledge/lalifa-dau-thuc-vat.webp",
    "imageSource": {
      "name": "Lalifa · Các loại dầu thực vật",
      "url": "https://mayepdaugiadinh.com/8-loai-dau-thuc-vat-pho-bien-tai-viet-nam-va-cach-dung/"
    },
    "excerpt": "So sánh các loại dầu quen thuộc để chọn cho món xào, salad, nước chấm, món ngọt và bánh.",
    "takeaway": "Bắt đầu từ món ăn, rồi chọn loại dầu, hương vị và cách chế biến phù hợp với hướng dẫn sản phẩm.",
    "introduction": "Không cần mua thật nhiều chai dầu để nấu đa dạng. Hãy bắt đầu từ các món gia đình thích, chọn một dầu dùng thường xuyên và thêm dầu tạo hương khi có nhu cầu rõ ràng. Bảng dưới đây giúp định hướng trước khi đọc nhãn.",
    "sections": [
      {
        "id": "bang-chon-dau",
        "title": "Bảng chọn nhanh cho căn bếp",
        "bodyHtml": `
<div class="article-table-scroll" role="region" aria-label="Bảng chọn dầu theo món ăn" tabindex="0"><table>
 <caption>Gợi ý phối món; cách nấu thực tế tùy loại dầu và hướng dẫn trên chai. Trên màn hình nhỏ, cuộn ngang để xem đủ cột.</caption>
 <thead><tr><th scope="col">Loại dầu</th><th scope="col">Gợi ý món ăn</th><th scope="col">Điểm cần xem</th></tr></thead>
 <tbody>
 <tr><th scope="row">Lạc</th><td>Món xào, món ướp</td><td>Hương hạt, dị ứng</td></tr>
 <tr><th scope="row">Vừng</th><td>Nước chấm, rau trộn</td><td>Rang hay chưa rang</td></tr>
 <tr><th scope="row">Dừa</th><td>Bánh, món ngọt</td><td>Hương dừa, khẩu phần</td></tr>
 <tr><th scope="row">Ô liu</th><td>Salad, làm sốt</td><td>Loại dầu, cách nấu</td></tr>
 <tr><th scope="row">Hướng dương</th><td>Món cần hương nhẹ</td><td>Hướng dẫn chế biến</td></tr>
 <tr><th scope="row">Đậu nành</th><td>Nấu ăn hàng ngày</td><td>Thành phần, dị ứng</td></tr>
 <tr><th scope="row">Gấc</th><td>Thêm màu cho cơm, cháo</td><td>Thành phần dầu nền</td></tr>
 <tr><th scope="row">Bơ</th><td>Sốt, món xào</td><td>Loại dầu, nhiệt sử dụng</td></tr>
 </tbody></table></div>
    `
      },
      {
        "id": "chon-theo-cong-thuc",
        "title": "Đọc công thức trước khi chọn chai",
        "bodyHtml": `
<p>Phân biệt công thức cần dầu để nấu với công thức cần dầu tạo hương. Dầu vừng rang, chẳng hạn, thường được thêm ở cuối món; dầu có hương rõ có thể làm thay đổi một chiếc bánh vốn cần vị nhẹ.</p>
 <p>Gợi ý biên tập: viết ba món hay nấu nhất vào danh sách mua hàng. Đối chiếu nhãn chai với những món ấy, rồi xem bạn đã có dầu phù hợp ở nhà chưa. Cách này giúp lựa chọn có mục đích hơn việc mua theo lời quảng cáo chung.</p>
    `
      },
      {
        "id": "thu-va-dieu-chinh",
        "title": "Thử một thay đổi mỗi lần",
        "bodyHtml": `
<ol>
 <li>Chọn món đã quen cách nấu và có công thức rõ. Giữ nguyên nguyên liệu chính, lượng gia vị và cách chế biến ở lần thử đầu.</li>
 <li>Chỉ đổi loại dầu khi hướng dẫn cho phép. Chuẩn bị mẻ nhỏ để dễ điều chỉnh và tránh phải bỏ cả phần ăn lớn nếu không hợp vị.</li>
 <li>So sánh hương khi món vừa xong và khi đã nguội bớt. Hỏi người cùng ăn xem mùi dầu có lấn át món hay tạo điểm nhấn dễ chịu.</li>
 <li>Ghi lại lựa chọn phù hợp. Bạn không cần tìm “dầu tốt nhất” cho mọi món; cần biết chai nào hữu ích cho thực đơn của mình.</li>
 </ol>
    `
      },
      {
        "id": "giu-su-da-dang",
        "title": "Giữ sự đa dạng ở cả bữa ăn",
        "bodyHtml": `
<p>Một bữa ăn còn được tạo nên bởi rau, đạm, tinh bột và cách chế biến. Thay dầu không tự biến món chiên thành món có thể dùng không giới hạn, cũng không làm mất đi yêu cầu kiểm soát khẩu phần.</p>
 <p>Nếu muốn thay đổi, bạn có thể bắt đầu bằng món sốt trộn tự chuẩn bị hoặc một món xào đơn giản, sau đó thêm món luộc và canh để thực đơn phong phú. Hãy xem đây là gợi ý tổ chức bữa ăn, không phải chế độ điều trị.</p>
 <p>Với người có dị ứng hoặc nhu cầu dinh dưỡng riêng, danh sách dầu cần dùng phải được điều chỉnh theo hướng dẫn cá nhân. Luôn kiểm tra cả thành phần của sốt, dầu phối trộn và nguyên liệu đi kèm.</p>
    `
      }
    ],
    "sources": [
      {
        "name": "Lalifa · Các loại dầu thực vật",
        "url": "https://mayepdaugiadinh.com/8-loai-dau-thuc-vat-pho-bien-tai-viet-nam-va-cach-dung/"
      },
      {
        "name": "Just One Cookbook · Cách dùng dầu vừng",
        "url": "https://www.justonecookbook.com/sesame-oil/"
      },
      {
        "name": "American Heart Association · Healthy Cooking Oils",
        "url": "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/healthy-cooking-oils"
      }
    ],
    "disclaimer": "Thông tin dinh dưỡng và chăm sóc da mang tính tổng quát, không xác nhận công dụng y tế của sản phẩm HM NATURALS. Gợi ý phối món và tổ chức căn bếp do chúng tôi biên tập.",
    "featured": true
  }
].map((article) => ({
  ...article,
  bodyHtml: article.sections.map((section) =>
    `<section aria-labelledby="${section.id}"><h2 id="${section.id}">${section.title}</h2>${section.bodyHtml}</section>`
  ).join(''),
}));

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
  const legacySlugs: Record<string, string> = {
    'unsaturated-fats-guide': 'saturated-vs-unsaturated-guide',
    'smoke-point-guide': 'peanut-oil-diet-balance',
    'kitchen-marinating-tips': 'dau-vung-cach-su-dung',
    'sachi-cold-salad': 'dau-dua-ep-lanh-am-thuc',
  };
  const resolvedSlug = legacySlugs[slug] ?? slug;
  return mockKnowledgeArticles.find((article) => article.slug === resolvedSlug);
}
