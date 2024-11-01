import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-6xl font-bold mb-6">
          Senate Insights
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Powerful communication analytics platform for modern businesses
        </p>
        
        <SignedOut>
          <div className="space-x-4">
            <Link 
              href="/sign-up" 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Get Started
            </Link>
            <Link 
              href="/sign-in" 
              className="border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 px-6 rounded-lg"
            >
              Learn More
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <Link 
            href="/dashboard" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Go to Dashboard
          </Link>
        </SignedIn>
      </div>

      {/* Feature Highlights */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
          <p className="text-gray-600">Monitor and analyze your communications in real-time</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
          <p className="text-gray-600">Get intelligent insights with our advanced AI analysis</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Multi-channel Support</h3>
          <p className="text-gray-600">Integrate calls, SMS, and emails in one platform</p>
        </div>
      </div>
    </div>
  );
}