import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact | Sarah Wharton Astrology",
  description: "Get in touch with Sarah for questions about astrology readings or to inquire about services.",
}

export default function ContactPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-manrope font-bold text-rose-quartz-400 mb-6 tracking-tight">
              Contact Me
            </h1>
            <p className="text-xl md:text-2xl text-cool-gray-400 mb-8 max-w-3xl mx-auto font-sora">
              Have questions or need more information? Reach out and I'll get back to you promptly.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-wheat-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-serif text-rose-quartz-400 mb-6">Get in Touch</h2>
              
              <div className="space-y-8">
                <Card className="bg-desert-sand-50 border border-desert-sand-200 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-lg mb-2 text-rose-quartz-400">Email</h3>
                    <p className="text-cool-gray-400 mb-2">For general inquiries or questions:</p>
                    <a href="mailto:sarah@sarahwharton.com" className="text-powder-blue-500 hover:text-powder-blue-600">
                      sarah@sarahwharton.com
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="bg-desert-sand-50 border border-desert-sand-200 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-lg mb-2 text-rose-quartz-400">Follow Me</h3>
                    <p className="text-cool-gray-400 mb-4"></p>
                    <div className="flex space-x-4">
                      <a href="#" className="text-powder-blue-500 hover:text-powder-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                      <a href="#" className="text-powder-blue-500 hover:text-powder-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a>
                      <a href="#" className="text-powder-blue-500 hover:text-powder-blue-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <Link href="/booking">
                  <button className="btn-elegant">
                    BOOK A READING
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-serif text-rose-quartz-400 mb-6">Send a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-blush-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-serif text-plum mb-4">Common Questions</h2>
            <p className="text-plum/70 max-w-2xl mx-auto">
              Quick answers to frequently asked questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">How quickly will I receive a response?</h3>
                <p className="text-plum/70">
                  I strive to respond to all inquiries within 24-48 hours during business days.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">Do you offer emergency readings?</h3>
                <p className="text-plum/70">
                  While I don't typically offer same-day appointments, I do my best to accommodate urgent situations when possible. Please email me directly for immediate needs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">What if I need to reschedule?</h3>
                <p className="text-plum/70">
                  You can reschedule your appointment up to 24 hours before your scheduled time without any penalty. Please contact me directly to arrange a new time.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">Do you offer gift certificates?</h3>
                <p className="text-plum/70">
                  Yes! Astrology readings make wonderful gifts. Contact me directly to arrange a gift certificate for a loved one.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
