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
      <section className="bg-deepBlue text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-6 gold-gradient-text">
            Contact Me
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/80">
            Have questions or need more information? Reach out and I'll get back to you promptly.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-serif text-deepBlue mb-6">Get in Touch</h2>
              
              <div className="space-y-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium text-lg mb-2">Email</h3>
                    <p className="text-muted-foreground mb-2">For general inquiries or questions:</p>
                    <a href="mailto:sarah@sarahwharton.com" className="text-deepBlue hover:text-deepBlue-light">
                      sarah@sarahwharton.com
                    </a>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium text-lg mb-2">Follow Me</h3>
                    <p className="text-muted-foreground mb-4">Connect on social media for updates and cosmic insights:</p>
                    <div className="flex space-x-4">
                      <a href="#" className="text-deepBlue hover:text-gold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                      </a>
                      <a href="#" className="text-deepBlue hover:text-gold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                      </a>
                      <a href="#" className="text-deepBlue hover:text-gold transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                        </svg>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <Button asChild variant="gold">
                  <Link href="/booking">Book a Reading</Link>
                </Button>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-serif text-deepBlue mb-6">Send a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-serif text-deepBlue mb-4">Common Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick answers to frequently asked questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-2">How quickly will I receive a response?</h3>
                <p className="text-muted-foreground">
                  I strive to respond to all inquiries within 24-48 hours during business days.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-2">Do you offer emergency readings?</h3>
                <p className="text-muted-foreground">
                  While I don't typically offer same-day appointments, I do my best to accommodate urgent situations when possible. Please email me directly for immediate needs.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-2">What if I need to reschedule?</h3>
                <p className="text-muted-foreground">
                  You can reschedule your appointment up to 24 hours before your scheduled time without any penalty. Please contact me directly to arrange a new time.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-2">Do you offer gift certificates?</h3>
                <p className="text-muted-foreground">
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
