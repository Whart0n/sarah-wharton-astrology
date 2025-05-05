import { Cormorant_Garamond, Raleway } from 'next/font/google'
import { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import { MainNav } from '@/components/main-nav'
import { Footer } from '@/components/footer'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
})

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-raleway',
})

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
    <html lang="en" className={`${cormorant.variable} ${raleway.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl text-deepBlue">Sarah Wharton</span>
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
