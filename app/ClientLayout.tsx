"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { Footer } from "@/components/footer";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <div className="flex min-h-screen flex-col">
      {!isLanding && (
        <header className="border-b sticky top-0 z-40 bg-tea/95 backdrop-blur supports-[backdrop-filter]:bg-tea/60">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <span className="font-sora text-2xl text-hunter">Sarah Wharton</span>
            </div>
            <MainNav />
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
      {!isLanding && <Footer />}
    </div>
  );
}
