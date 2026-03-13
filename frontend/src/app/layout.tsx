import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';

export const metadata: Metadata = {
  title: 'Lynara Campaign - Plateforme de campagnes marketing multicanales',
  description:
    'Plateforme de campagnes marketing multicanales pilotée par des agents IA (Email, WhatsApp, Instagram, Facebook, TikTok)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
