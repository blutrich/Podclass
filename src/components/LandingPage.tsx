import { ArrowRight, BookOpen, Brain, Clock, Menu, Sparkles, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const NavLinks = () => (
    <>
      <button 
        className="text-lg font-medium hover:underline underline-offset-4"
        onClick={() => handleScrollToSection('features')}
      >
        Features
      </button>
      <button 
        className="text-lg font-medium hover:underline underline-offset-4"
        onClick={() => handleScrollToSection('how-it-works')}
      >
        How It Works
      </button>
      <button 
        className="text-lg font-medium hover:underline underline-offset-4"
        onClick={() => handleScrollToSection('pricing')}
      >
        Pricing
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 sm:px-8 lg:px-12 h-16 sm:h-24 flex items-center fixed w-full bg-background/80 backdrop-blur-sm z-50">
        <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate("/")}>
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-bold">PodClass</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="ml-auto hidden md:flex gap-8">
          <NavLinks />
        </nav>

        {/* Mobile Navigation */}
        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-6 mt-8">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex-1 pt-16 sm:pt-24">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Turning Podcast Insights Into Actionable Lessons
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Learn from industry-leading podcasts without spending hours listening. Get AI-powered summaries and
                    actionable takeaways in minutes.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" onClick={() => navigate("/signup")}>
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Learn More
                  </Button>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to learn efficiently from industry-leading podcasts
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <Brain className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-center">AI-Powered Insights</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Advanced AI technology transforms long podcast episodes into concise, actionable lessons
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <Sparkles className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-center">Personalized Learning</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Get recommendations tailored to your industry, role, and interests
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <Clock className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold text-center">Time-Saving</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Extract key insights from hour-long episodes in just minutes
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Three simple steps to start learning from your favorite podcasts
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto">
                  1
                </div>
                <h3 className="text-xl font-bold text-center">Choose Your Interests</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Tell us about your industry and topics you want to learn about
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto">
                  2
                </div>
                <h3 className="text-xl font-bold text-center">Get Recommendations</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Receive personalized podcast episode suggestions
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto">
                  3
                </div>
                <h3 className="text-xl font-bold text-center">Learn & Apply</h3>
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Get AI-generated summaries and actionable takeaways
                </p>
              </div>
            </div>
          </div>
        </section>
    
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Start Learning Today</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Try PodClass free for 14 days. No credit card required.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <Button className="w-full" size="lg" onClick={() => navigate("/signup")}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get 3 free lessons during your trial. Cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 PodClass. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </a>
        </nav>
      </footer>
    </div>
  )
}
