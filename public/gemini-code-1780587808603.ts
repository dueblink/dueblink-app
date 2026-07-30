import { HeroSection } from "@/components/landing/hero-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-white selection:bg-brand-secondary/20">
      {/* DueBlink Global Navigation Header */}
      <header className="border-b border-brand-border bg-white bg-opacity-80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between lg:px-8">
          
          {/* Left Wrapper: Clean native asset layout block */}
          <div className="flex flex-1 items-center justify-start">
            <img 
              src="/logo.png" 
              alt="DueBlink Logo" 
              className="h-[30px] w-auto object-contain"
              loading="eager"
            />
          </div>

          {/* Right Wrapper: Login Button */}
          <div className="flex flex-1 items-center justify-end">
            <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 transition-all flex items-center h-9">
              Login
            </button>
          </div>

        </div>
      </header>

      {/* DueBlink Real Hero Section Layout */}
      <HeroSection />
    </main>
  )
}