import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'VinylFunders - Pre-sale Vinyl',
    template: '%s | VinylFunders'
  },
  description: 'Discover and support vinyl pre-sales on VinylFunders',
  openGraph: {
    type: 'website',
    siteName: 'VinylFunders',
    title: 'VinylFunders - Pre-sale Vinyl',
    description: 'Discover and support vinyl pre-sales on VinylFunders'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VinylFunders',
    description: 'Discover and support vinyl pre-sales on VinylFunders'
  },
  other: {
    'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 