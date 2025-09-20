import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Vinyl Collections',
  description: 'Discover and explore vinyl collections from independent artists on VinylFunders. Browse presales, limited editions, and support your favorite musicians.',
  keywords: ['vinyl collections', 'music exploration', 'vinyl presales', 'independent artists', 'music discovery'],
  openGraph: {
    title: 'Explore Vinyl Collections | VinylFunders',
    description: 'Discover and explore vinyl collections from independent artists on VinylFunders.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Vinyl Collections | VinylFunders',
    description: 'Discover and explore vinyl collections from independent artists.',
  },
};

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
