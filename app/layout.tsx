import { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import { MainNav } from '@/components/main-nav' // Ensure MainNav no longer links to /services
import { Footer } from '@/components/footer'
import './globals.css'

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
        <div className="flex min-h-screen flex-col">
          <header className="border-b sticky top-0 z-40 bg-tea/95 backdrop-blur supports-[backdrop-filter]:bg-tea/60">
            <div className="container flex h-16 items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="font-sora text-2xl text-hunter">Sarah Wharton</span>
              </div>
              <MainNav />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <ToastProvider />
      </body>
    </html>
  )
}
