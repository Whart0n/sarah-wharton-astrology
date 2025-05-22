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
            <h1 className="text-5xl md:text-6xl font-manrope font-bold text-darkpurple mb-6 tracking-tight">
              Contact Me
            </h1>
            <p className="text-xl md:text-2xl text-darkpurple mb-8 max-w-3xl mx-auto font-sora">
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
              <h2 className="text-2xl font-serif text-darkpurple mb-6">Get in Touch</h2>
              
              <div className="space-y-8">
                <Card className="bg-desert-sand-50 border border-desert-sand-200 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-lg mb-2 text-darkpurple">Email</h3>
                    <p className="text-darkpurple mb-2">For general inquiries or questions:</p>
                    <a href="mailto:sarah@sarahwharton.com" className="text-powder-blue-500 hover:text-powder-blue-600">
                      sarah@sarahwharton.com
                    </a>
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
              <h2 className="text-2xl font-serif text-darkpurple mb-6">Send a Message</h2>
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
            <p className="text-darkpurple/80 max-w-2xl mx-auto">
              Quick answers to frequently asked questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">How quickly will I receive a response?</h3>
                <p className="text-darkpurple/80">
                  I strive to respond to all inquiries within 24-48 hours during business days.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">Do you offer emergency readings?</h3>
                <p className="text-darkpurple/80">
                  While I don't typically offer same-day appointments, I do my best to accommodate urgent situations when possible. Please email me directly for immediate needs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">What if I need to reschedule?</h3>
                <p className="text-darkpurple/80">
                  You can reschedule your appointment up to 24 hours before your scheduled time without any penalty. Please contact me directly to arrange a new time.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-blush/30 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg mb-2 text-plum">Do you offer gift certificates?</h3>
                <p className="text-darkpurple/80">
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
