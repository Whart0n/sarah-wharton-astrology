import { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import fs from "fs"
import path from "path"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "About | Sarah Wharton Astrology",
  description: "Learn about Sarah Wharton and her approach to astrology readings.",
}

export default async function AboutPage() {
  // Load content from MDX file
  const mdxContent = await fs.promises.readFile(
    path.join(process.cwd(), "content/about.mdx"),
    "utf-8"
  )

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-deepBlue text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="md:w-1/3">
              <div className="rounded-full overflow-hidden border-4 border-gold/60 shadow-xl" style={{ maxWidth: '400px' }}>
                <img 
                  src="/images/sarah-portrait.png" 
                  alt="Sarah Wharton, Professional Astrologer" 
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif mb-6 gold-gradient-text">
                About the Astrologer
              </h1>
              <p className="text-lg md:text-xl max-w-3xl mx-auto md:mx-0 text-white/80">
                Learn about my background and discover my approach to astrology
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Sidebar */}
            <div className="order-2 md:order-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-serif text-deepBlue mb-3">Areas of Expertise</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Natal Chart Analysis
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Relationship Compatibility
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Career & Life Path Guidance
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Timing & Forecasting
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Spiritual Development
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-serif text-deepBlue mb-3">Credentials</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Certified Astrologer (NCGR)
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        10+ Years Professional Experience
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Advanced Studies in Traditional and Modern Techniques
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button asChild variant="gold" className="w-full">
                      <Link href="/booking">Book a Reading</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* MDX Content */}
            <div className="order-1 md:order-2 md:col-span-2">
              <div className="prose prose-slate max-w-none md:prose-lg">
                <MDXRemote source={mdxContent} />
                
                <div className="star-divider"></div>
                
                <h2>My Approach to Astrology</h2>
                <p>
                  I believe that astrology is a powerful tool for self-discovery and personal growth. My readings are focused on empowering you to make informed decisions and understand your unique gifts and challenges.
                </p>
                <p>
                  Rather than making predictions that feel set in stone, I work with you to understand the cosmic energies at play in your life and how you can best navigate them. Astrology is not about predetermination, but about understanding the potentials and possibilities available to you.
                </p>
                
                <h3>What to Expect in a Reading</h3>
                <p>
                  My sessions are collaborative and conversational. I provide a safe, non-judgmental space for exploration and discovery. Whether you're new to astrology or have been studying your chart for years, I meet you where you are and provide insights that are both accessible and profound.
                </p>
                <p>
                  Each reading includes both analysis of your chart and practical guidance for integrating these insights into your daily life. I'm interested not just in what your chart says, but in how this information can serve your growth and well-being.
                </p>
                
                <div className="not-prose mt-8">
                  <Button asChild variant="deepBlue">
                    <Link href="/services">Explore My Services</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-deepBlue-light text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif mb-6">
            Ready to Discover Your Cosmic Blueprint?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 text-white/80">
            Book a personalized astrology reading and gain insights into your life's journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="gold">
              <Link href="/booking">Book a Reading</Link>
            </Button>
            <Button asChild className="bg-deepBlue text-white border-none hover:bg-deepBlue/80 shadow-lg">
              <Link href="/contact">Ask a Question</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
