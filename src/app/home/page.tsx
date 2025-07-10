"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import { Button } from "@/components/ui              {[
                { id: "home", label: "Home" },
                { id: "features", label: "Features" },
                { id: "how-it-works", label: "How It Works" },
                { id: "pricing", label: "Pricing" }
              ].map((item) => ( { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Sparkles,
  Palette,
  Zap,
  Users,
  Download,
  Star,
  Check,
  ArrowRight,
  Play,
  Menu,
  X,
  Moon,
  Sun,
  Target,
  Layers,
  Wand2,
  Clock,
  Shield,
  Infinity,
} from "lucide-react"

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "how-it-works", "benefits", "pricing"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/20 dark:border-gray-700/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Flatify AI</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {[
                { id: "home", label: "Home" },
                { id: "features", label: "Features" },
                { id: "how-it-works", label: "How It Works" },
                { id: "pricing", label: "Pricing" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    activeSection === item.id
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link href="/role-select">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[73px] bg-white dark:bg-gray-900 border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              {{
                id: "home",
                label: "Home"
              },
              {
                id: "features",
                label: "Features"
              },
              {
                id: "how-it-works",
                label: "How It Works"
              },
              {
                id: "pricing",
                label: "Pricing"
              },
              }.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    activeSection === item.id
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link href="/role-select" className="block">
                <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-indigo-600 dark:text-indigo-400">
            AI-Powered Logo Generation
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Create Beautiful Flat Logos with AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your brand identity with our AI-powered logo generator. Create unique,
            professional flat design logos in minutes.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link href="/role-select">
              <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Start Generating <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400"
              >
                View Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800/50 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-indigo-600 dark:text-indigo-400">
              Features
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Powerful Features for Perfect Logos
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the next generation of logo design with our advanced AI technology
              and intuitive tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {{
              icon: <Wand2 className="w-6 h-6" />,
              title: "AI-Powered Design",
              description:
                "Generate unique logos instantly using advanced artificial intelligence algorithms.",
            },
            {
              icon: <Palette className="w-6 h-6" />,
              title: "Custom Styling",
              description:
                "Customize colors, fonts, and layouts to match your brand's unique identity.",
            },
            {
              icon: <Layers className="w-6 h-6" />,
              title: "Multiple Variations",
              description:
                "Generate multiple logo variations to find the perfect match for your brand.",
            },
            {
              icon: <Download className="w-6 h-6" />,
              title: "Easy Export",
              description:
                "Download your logos in multiple formats suitable for any use case.",
            },
            {
              icon: <Target className="w-6 h-6" />,
              title: "Industry Focus",
              description:
                "Specialized logo generation based on your industry and preferences.",
            },
            {
              icon: <Infinity className="w-6 h-6" />,
              title: "Unlimited Generation",
              description:
                "Create as many logos as you need until you find the perfect one.",
            },
            }.map((feature, index) => (
              <Card key={index} className="bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-indigo-600 dark:text-indigo-400">
              Process
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create your perfect logo in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {{
              icon: <Play className="w-6 h-6" />,
              title: "Start Your Project",
              description:
                "Choose your industry and describe your brand's vision.",
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: "AI Generation",
              description:
                "Our AI generates multiple unique logo concepts based on your input.",
            },
            {
              icon: <Download className="w-6 h-6" />,
              title: "Download & Use",
              description:
                "Customize your favorite design and download in preferred format.",
            },
            }.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800/50 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-indigo-600 dark:text-indigo-400">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the perfect plan for your logo design needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {{
              title: "Basic",
              price: "Free",
              features: [
                "5 Logo Generations",
                "Basic Customization",
                "Standard Export Formats",
                "Email Support",
              ],
            },
            {
              title: "Professional",
              price: "$19",
              popular: true,
              features: [
                "50 Logo Generations",
                "Advanced Customization",
                "All Export Formats",
                "Priority Support",
                "Brand Guidelines",
              ],
            },
            {
              title: "Enterprise",
              price: "$49",
              features: [
                "Unlimited Generations",
                "Full Customization Suite",
                "All Export Formats",
                "24/7 Priority Support",
                "Brand Guidelines",
                "Team Collaboration",
              ],
            },
            }.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-indigo-600 dark:border-indigo-400"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {plan.title}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "Free" && (
                      <span className="text-gray-600 dark:text-gray-300">/month</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center justify-center text-gray-600 dark:text-gray-300"
                      >
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/role-select">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400"
                      }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Flatify AI
              </span>
            </div>
            <div className="flex space-x-6">
              <Link href="/help">
                <span className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Help
                </span>
              </Link>
              <Link href="/privacy">
                <span className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Privacy
                </span>
              </Link>
              <Link href="/terms">
                <span className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                  Terms
                </span>
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Flatify AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
