import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-deepBlue text-white/80 py-12">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <h3 className="text-gold font-serif text-2xl mb-4">Sarah Wharton</h3>
          <p className="text-sm">
            Illuminating your path through the stars. Professional astrology readings
            to help you navigate life's journey with clarity and purpose.
          </p>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-medium text-white mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm hover:text-gold transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm hover:text-gold transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/services" className="text-sm hover:text-gold transition-colors">
                Services
              </Link>
            </li>
            <li>
              <Link href="/booking" className="text-sm hover:text-gold transition-colors">
                Book a Reading
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm hover:text-gold transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-medium text-white mb-4">Contact</h4>
          <address className="not-italic text-sm space-y-2">
            <p>Email: sarah@sarahwharton.com</p>
          </address>
        </div>
        
        <div className="col-span-1">
          <h4 className="font-medium text-white mb-4">Subscribe</h4>
          <div className="flex space-x-2">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 rounded-md text-sm bg-deepBlue-light text-white/80 border border-deepBlue-light focus:outline-none focus:border-gold"
            />
            <Button variant="gold" size="sm">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mt-12 pt-6 border-t border-deepBlue-light flex flex-col md:flex-row justify-between items-center">
        <p className="text-xs text-white/60">
          &copy; {new Date().getFullYear()} Sarah Wharton. All rights reserved.
        </p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <SocialIcon icon={<FacebookIcon />} />
          <SocialIcon icon={<InstagramIcon />} />
          <SocialIcon icon={<TwitterIcon />} />
          <SocialIcon icon={<YoutubeIcon />} />
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a
      href="#"
      className="h-8 w-8 rounded-full bg-deepBlue-light flex items-center justify-center hover:bg-gold transition-colors"
    >
      {icon}
    </a>
  )
}

// Simple social media icons
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
    </svg>
  )
}
