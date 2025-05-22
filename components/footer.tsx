import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-rose-quartz-500 text-cool-gray-100 py-12">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <h3 className="text-cool-gray-100 font-serif text-2xl mb-4">Sarah Wharton Astrology</h3>
          <p className="text-sm text-cool-gray-200">
           Professional astrology readings
            to help you navigate life's journey with clarity and purpose.
          </p>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-serif text-cool-gray-100 mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm text-cool-gray-200 hover:text-white hover:underline transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm text-cool-gray-200 hover:text-white hover:underline transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/services" className="text-sm text-cool-gray-200 hover:text-white hover:underline transition-colors">
                Services
              </Link>
            </li>
            <li>
              <Link href="/booking" className="text-sm text-cool-gray-200 hover:text-white hover:underline transition-colors">
                Book a Reading
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-cool-gray-200 hover:text-white hover:underline transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-serif text-cool-gray-100 mb-4">Contact</h4>
          <div className="text-sm space-y-2 text-cool-gray-200">
            <p>Email: sarah@sarahwharton.com</p>
          </div>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-serif text-plum mb-4">Subscribe</h4>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 text-sm bg-white text-plum/80 border border-blush focus:outline-none focus:border-plum"
            />
            <button className="btn-elegant py-2 px-4 text-sm">
              SUBSCRIBE
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mt-12 pt-6 border-t border-blush">
        <p className="text-xs text-plum/60 text-center">
          &copy; {new Date().getFullYear()} Sarah Wharton. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
