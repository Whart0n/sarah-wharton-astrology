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
                About Sarah
              </h1>
              <p className="text-lg md:text-xl max-w-3xl mx-auto md:mx-0 text-white/80">
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           

            {/* MDX Content */}
            <div className="order-1 md:order-2 md:col-span-2">
              <div className="prose prose-slate max-w-none md:prose-lg">
                <MDXRemote source={mdxContent} />
                
                <div className="star-divider"></div>
                
            
                
                <h3>What to Expect in a Reading</h3>
                <p>
                  My sessions are collaborative and conversational. I offer a safe, non-judgmental space for reflection, insight, and discovery. Whether you're completely new to astrology or a longtime student of your chart, I'll meet you where you are and provide insights that are both accessible and profound.
                </p><br></br>
                <p>
                  Each reading includes detailed chart analysis alongside practical guidance for integrating that insight into your daily life. My goal is not only to interpret your chart, but to help you apply its wisdom in a way that supports your growth and well-being.
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
