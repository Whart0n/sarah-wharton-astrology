import { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import { MainNav } from '@/components/main-nav'
import { Footer } from '@/components/footer'
import './globals.css'
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'Sarah Wharton | Professional Astrology Readings',
  description: 'Professional astrology readings and consultations to help guide you through life\'s journey with clarity and purpose.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-tea font-manrope antialiased">
        <ClientLayout>{children}</ClientLayout>
        <ToastProvider />
      </body>
    </html>
  );
}
