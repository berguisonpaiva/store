import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bebas_Neue, DM_Mono, DM_Sans } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const APP_NAME = 'App';

const fontDisplay = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const fontSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const fontMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Aplicação',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <body className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} flex min-h-full flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem enableColorScheme>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster closeButton richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
