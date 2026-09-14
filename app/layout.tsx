import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://redxcinema.com'),
  title: {
    default: 'REDX CINEMA - Stream Movies & TV Series in Dual Audio (English & Hindi)',
    template: '%s | REDX CINEMA',
  },
  description: 'REDX CINEMA is a premium discovery and streaming platform offering legally authorized movies and TV series in HD & 4K with dual English and Hindi audio support and subtitles.',
  keywords: [
    'REDX Cinema',
    'Dual Audio Movies',
    'Hindi Dubbed Movies',
    'English Movies',
    'Free Legal Streaming',
    'HLS Player',
    'Watch Movies Online HD'
  ],
  authors: [{ name: 'REDX Cinema Media' }],
  creator: 'REDX Cinema',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://redxcinema.com',
    siteName: 'REDX CINEMA',
    title: 'REDX CINEMA - Dual Audio Streaming Platform',
    description: 'Stream movies and TV series with English & Hindi audio and subtitles in 1080p & 4K.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        width: 1200,
        height: 630,
        alt: 'REDX CINEMA Backdrop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REDX CINEMA - Dual Audio Streaming',
    description: 'Stream movies and TV series with English and Hindi audio.',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#08080a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#08080a] text-zinc-100 antialiased selection:bg-brand-primary selection:text-white">
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
