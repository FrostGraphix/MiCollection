import type { Metadata } from 'next';
import { Bricolage_Grotesque, Figtree, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { AuthProvider } from '@/context/AuthContext';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { HeaderWrapper } from '@/components/layout/HeaderWrapper';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { WhatsAppWidget } from '@/components/shop/WhatsAppWidget';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MiCollections — Every Variety. One Home. | FCT Abuja, Nigeria',
  description:
    'Your number one home of varieties in Abuja, Nigeria. Abayas, streetwear hoodies, chunky sneakers, bags, jewellery, smart gadgets, and kitchen essentials with 24/7 WhatsApp ordering & nationwide delivery.',
  keywords: [
    'MiCollections',
    'Abuja fashion',
    'Abayas Nigeria',
    'Sneakers Abuja',
    'Jewellery Abuja',
    'Smart Watch Nigeria',
    'Kitchen utensils Nigeria',
    'E-commerce Nigeria',
  ],
  openGraph: {
    title: 'MiCollections — Every Variety. One Home.',
    description:
      'Unisex clothing, abayas, shoes, bags, jewellery, gadgets & kitchen finds. Open 24 hours. Delivering nationwide from Abuja.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${figtree.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <AnnouncementBar />
                <HeaderWrapper />
                <main className="flex-1">{children}</main>
                <Footer />
                <CartDrawer />
                <WhatsAppWidget />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
