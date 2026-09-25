import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StorefrontProviders } from '@/components/layout/StorefrontProviders';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

/**
 * Storefront layout wrapping all customer-facing routes.
 * Provides Header + Footer shell + Cart/Nav drawers around page content.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontProviders>
      <div className="flex flex-col min-h-dvh bg-warm-cream">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </StorefrontProviders>
  );
}
