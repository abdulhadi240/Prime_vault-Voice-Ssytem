import type { Metadata } from 'next';
import { Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  variable: '--inter',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Home Services — Command Center',
  description: 'AI Voice Agent Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmMono.variable}`}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
