import { Metadata } from "next"
import Image from "next/image"
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
      <section className="relative py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-manrope font-bold text-rose_quartz-400 mb-6 tracking-tight">
                About Sarah
              </h1>
              <p className="text-xl md:text-2xl text-cool_gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 font-sora">
                Professional astrologer passionate about helping you navigate your journey with clarity and purpose.
              </p>
            </div>
            
            {/* Full-size Image */}
            <div className="lg:w-1/2 relative h-[500px] w-full rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/sarah-portrait.png" 
                alt="Sarah Wharton, Professional Astrologer" 
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-footer-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* MDX Content */}
            <div className="order-1 md:order-2 md:col-span-2">
              <div className="prose prose-slate max-w-none md:prose-lg">
                <MDXRemote source={mdxContent} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-manrope font-bold text-rose_quartz-400 mb-6">What to Expect in a Reading</h2>
            <p className="text-lg text-cool_gray-400 mb-6">
              My sessions are collaborative and conversational. I offer a safe, non-judgmental space for reflection, insight, and discovery. Whether you're completely new to astrology or a longtime student of your chart, I'll meet you where you are and provide insights that are both accessible and profound.
            </p>
            <p className="text-lg text-cool_gray-400 mb-8">
              Each reading includes detailed chart analysis alongside practical guidance for integrating that insight into your daily life. My goal is not only to interpret your chart, but to help you apply its wisdom in a way that supports your growth and well-being.
            </p>
            <div className="mt-8">
              <Link href="/services">
                <button className="rounded-full px-8 py-3 bg-powder_blue-500 hover:bg-powder_blue-600 text-white font-sora text-lg tracking-wide transition-all transform hover:-translate-y-1 shadow-md">
                  Explore My Services
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
    </div>
  )
}
