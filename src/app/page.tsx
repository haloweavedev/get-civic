import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, Activity, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 right-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-violet-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-semibold text-gray-900">
                Get Civic
              </Link>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-6">
              <SignedOut>
                <Link href="/sign-in">
                  <Button variant="outline" className="ml-4">
                    Sign In
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 sm:pt-40 lg:pt-48">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900">
              Transform Public Communication with AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Automate constituent feedback analysis, generate insights at scale, and deliver personalized responses through advanced AI technology.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="rounded-md px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
                <Link href="/contact" className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors duration-300">
                  Contact Sales <span aria-hidden="true">→</span>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-md px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="mx-auto max-w-7xl px-6 mt-32 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Advanced Platform</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage public communication
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {/* Automated Analysis */}
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="rounded-md bg-blue-600/10 p-2 ring-1 ring-inset ring-blue-600/20">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                Automated Analysis
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  AI-powered analysis of constituent communications across all channels, providing real-time insights and sentiment tracking.
                </p>
              </dd>
            </div>

            {/* Unified Communication */}
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="rounded-md bg-blue-600/10 p-2 ring-1 ring-inset ring-blue-600/20">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                Unified Communication
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Seamlessly integrate calls, SMS, and emails into a single platform with intelligent routing and prioritization.
                </p>
              </dd>
            </div>

            {/* Smart Responses */}
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <div className="rounded-md bg-blue-600/10 p-2 ring-1 ring-inset ring-blue-600/20">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                Smart Responses
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">
                  Generate personalized, context-aware responses powered by advanced AI, ensuring consistent and accurate communication.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-32 sm:mt-40 mb-24 relative">
        <div className="absolute inset-0 h-1/2"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to transform your communication?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join forward-thinking organizations using Get Civic to streamline their constituent communications.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="rounded-md px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300">
                    Get Started Today
                  </Button>
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 transition-colors duration-300"
                >
                  Contact Sales <span aria-hidden="true">→</span>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-md px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-300">
                    Go to Dashboard
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}