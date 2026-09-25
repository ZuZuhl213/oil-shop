/**
 * Site-wide configuration constants.
 */

export const siteConfig = {
  name: 'HM Naturals',
  tagline: 'Dầu Ăn & Nông Sản Tự Nhiên',
  description:
    'HM Naturals — Dầu ăn ép lạnh & nông sản tự nhiên từ Việt Nam. Dầu lạc, dầu vừng, dầu gấc nguyên chất.',
  url: 'https://hmnaturals.com',
  phone: '0912 345 678',
  zalo: 'https://zalo.me/0912345678',
  email: 'lienhe@hmnaturals.com',
  address: 'Hưng Yên, Việt Nam',
} as const;

export const navLinks = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Góc kiến thức', href: '/knowledge' },
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Liên hệ', href: '/contact' },
] as const;
