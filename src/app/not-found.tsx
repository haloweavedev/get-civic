import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "404: Page Not Found",
  description: "The page you're looking for doesn't exist.",
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-gray-600">Page not found</p>
      <Link 
        href="/"
        className="mt-4 text-blue-500 hover:text-blue-600"
      >
        Return Home
      </Link>
    </div>
  )
}