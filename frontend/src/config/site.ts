/**
 * Site-wide configuration constants.
 */

export const siteConfig = {
  name: 'HM NATURALS',
  tagline: 'DẦU NÔNG SẢN NGUYÊN BẢN',
  description:
    'HM NATURALS — Dầu thực vật ép cơ học nguyên bản từ nông sản bản địa Việt Nam. Đậu phộng sẻ và mè đen thuần nông, không hóa chất tinh luyện.',
  url: 'https://hmnaturals.com',
  phone: '0836 501 863',
  zalo: 'https://zalo.me/0836501863',
  email: 'lienhe@hmnaturals.com',
  address: 'Cơ sở sản xuất & ép dầu Sơn Nam, Hưng Yên',
} as const;

export const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Câu chuyện', href: '/about' },
  { label: 'Góc kiến thức', href: '/knowledge' },
  { label: 'Liên hệ', href: '/contact' },
] as const;

