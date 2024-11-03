import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe, MessageCircle, Activity, Zap, Shield } from "lucide-react";
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        {/* Navigation */}
        <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex-shrink-0">
                <Link href="/" className="text-2xl font-semibold">
                  Senate Insights
                </Link>
              </div>
              <div className="hidden md:flex md:items-center md:space-x-6">
                <Link href="#features" className="text-sm text-gray-700 hover:text-gray-900">
                  Features
                </Link>
                <Link href="#security" className="text-sm text-gray-700 hover:text-gray-900">
                  Security
                </Link>
                <Link href="#platform" className="text-sm text-gray-700 hover:text-gray-900">
                  Platform
                </Link>
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

        {/* Hero Content */}
        <div className="pt-32 sm:pt-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Transform Public Communication with AI
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Automate constituent feedback analysis, generate insights at scale, and deliver personalized responses through advanced AI technology.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <SignedOut>
                  <Link href="/sign-up">
                    <Button size="lg" className="rounded-md px-8">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/contact" className="text-sm font-semibold leading-6 text-gray-900">
                    Contact Sales <span aria-hidden="true">→</span>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" className="rounded-md px-8">
                      Go to Dashboard
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-32 sm:mt-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Processing Time Reduced</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">98%</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Response Accuracy</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">99.9%</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Time to Resolution</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">↓60%</dd>
            </div>
          </dl>
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
                <Activity className="h-5 w-5 flex-none text-blue-600" />
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
                <MessageCircle className="h-5 w-5 flex-none text-blue-600" />
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
                <Zap className="h-5 w-5 flex-none text-blue-600" />
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

      {/* Platform Section */}
      <div id="platform" className="mt-32 sm:mt-40 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-base font-semibold leading-7 text-blue-600">
                Advanced Technology
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                A platform built for scale
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Leverage cutting-edge AI technology to automatically process, analyze, and respond to constituent communications across all channels.
              </p>

              <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-gray-600 lg:max-w-none">
                <div className="relative pl-9">
                  <dt className="inline font-semibold text-gray-900">
                    <Globe className="absolute left-1 top-1 h-5 w-5 text-blue-600" />
                    Multi-channel Support
                  </dt>
                  <dd className="inline ml-1">
                    Process communications from calls, SMS, and emails through a single unified platform.
                  </dd>
                </div>

                <div className="relative pl-9">
                  <dt className="inline font-semibold text-gray-900">
                    <Shield className="absolute left-1 top-1 h-5 w-5 text-blue-600" />
                    Enterprise Security
                  </dt>
                  <dd className="inline ml-1">
                    Bank-grade encryption and security measures to protect sensitive constituent data.
                  </dd>
                </div>
              </dl>
            </div>

            {/* Platform Visual */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-gray-900 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:px-8 lg:max-w-none lg:pt-0">
              <div className="relative mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
                <div className="h-[400px] w-full bg-gradient-to-b from-blue-600/20 to-blue-600/5 rounded-2xl p-8">
                  {/* You can add a screenshot or illustration here */}
                  <div className="h-full w-full border-2 border-blue-600/10 rounded-xl flex items-center justify-center text-blue-200">
                    <Image src="/images/homepage-SS.png" alt="Screenshot of homepage" layout="fill" objectFit="cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-32 sm:mt-40 mb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to transform your communication?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join forward-thinking organizations using Senate Insights to streamline their constituent communications.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="rounded-md px-8">
                    Get Started Today
                  </Button>
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-semibold leading-6 text-gray-900"
                >
                  Contact Sales <span aria-hidden="true">→</span>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-md px-8">
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