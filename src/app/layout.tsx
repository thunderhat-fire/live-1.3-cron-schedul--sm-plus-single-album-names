import "./globals.css";
import "@/styles/index.scss";
import "@/styles/__theme_custom.scss";
import "@/styles/__theme_colors.scss";
import "rc-slider/assets/index.css";
import "react-loading-skeleton/dist/skeleton.css";
import '@livekit/components-styles';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthProviders from "./providers";
import { Toaster } from 'react-hot-toast';
import ClientProviders from './ClientProviders';
import MainNav2Logged from "@/components/Header/MainNav2Logged";
import Footer from "@/shared/Footer/Footer";
import CookieBanner from "@/components/CookieBanner";
import Script from 'next/script';
import FloatingLiveStreamWindow from '@/components/LiveStream/FloatingLiveStreamWindow';
import { prisma } from '@/lib/prisma';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from 'next/dynamic';
import { RadioProvider } from "@/contexts/RadioContext";
import { CartProvider } from "@/contexts/CartContext";
import { initializeAppServices } from '@/lib/startup';
import OrganizationStructuredData from '@/components/StructuredData/OrganizationStructuredData';

const GlobalStreamWindow = dynamic(
  () => import('@/components/Streaming/GlobalStreamWindow'),
  { ssr: false }
);

const GlobalRadioPlayer = dynamic(
  () => import('@/components/radio/GlobalRadioPlayer'),
  { ssr: false }
);

const FooterRadioPlayer = dynamic(
  () => import('@/components/radio/FooterRadioPlayer'),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://vinylfunders.com'),
  title: {
    default: "VinylFunders | Fund Vinyl Presales & Support Independent Artists",
    template: "%s | VinylFunders"
  },
  description: "Join VinylFunders to discover and fund vinyl presales from independent artists. We handle pressing, packing and posting directly to your fans. Start your vinyl journey today!",
  keywords: ["vinyl presale", "independent artists", "music crowdfunding", "vinyl records", "music platform", "artist funding", "vinyl pressing", "music community", "limited edition vinyl"],
  authors: [{ name: "VinylFunders" }],
  creator: "VinylFunders",
  publisher: "VinylFunders",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vinylfunders.com',
    siteName: 'VinylFunders',
    title: 'VinylFunders | Fund Vinyl Presales & Support Independent Artists',
    description: 'Join VinylFunders to discover and fund vinyl presales from independent artists. We handle pressing, packing and posting directly to your fans.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VinylFunders - Vinyl Presale Platform for Independent Artists',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VinylFunders | Fund Vinyl Presales & Support Independent Artists',
    description: 'Join VinylFunders to discover and fund vinyl presales from independent artists.',
    images: ['/images/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/favicon.png',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize app services (presale scheduler, etc.)
  initializeAppServices();
  
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let isAuthor = false;
  if (userId) {
    // Check if the user has at least one stream
    const streamCount = await prisma.stream.count({
      where: { creatorId: userId }
    });
    isAuthor = streamCount > 0;
  }

  const isPlusUser = session?.user?.isPlusMember ?? false;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DK87KW3D4B"
          strategy="afterInteractive"
        />
        <Script
          id="ga4-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-DK87KW3D4B');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <OrganizationStructuredData />
        <AuthProviders session={session}>
          <ClientProviders>
            <CartProvider>
              <RadioProvider>
                <Toaster position="top-right" />
                <MainNav2Logged />
                <main>{children}</main>
                <FooterRadioPlayer />
                {/* Keep GlobalRadioPlayer for audio engine but position off-screen */}
                <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                  <GlobalRadioPlayer />
                </div>
                <CookieBanner />
                <Footer />
                {/* Brevo Conversations Chat Widget */}
                <Script
                  id="brevo-chat-widget"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: `
                      (function(d, w, c) {
                          w.BrevoConversationsID = '680f40c9a1cf874040043004';
                          w[c] = w[c] || function() {
                              (w[c].q = w[c].q || []).push(arguments);
                          };
                          var s = d.createElement('script');
                          s.async = true;
                          s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
                          if (d.head) d.head.appendChild(s);
                      })(document, window, 'BrevoConversations');
                    `,
                  }}
                />
              </RadioProvider>
            </CartProvider>
          </ClientProviders>
        </AuthProviders>
      </body>
    </html>
  );
}
