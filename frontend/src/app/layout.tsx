import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['vietnamese', 'latin'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'dầu lạc', 'dầu vừng', 'dầu gấc', 'dầu dừa',
    'dầu ăn tự nhiên', 'ép lạnh', 'nông sản Việt Nam',
    'HM Naturals',
  ],
  authors: [{ name: siteConfig.name }],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: 'vi_VN',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#26402F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${playfairDisplay.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
