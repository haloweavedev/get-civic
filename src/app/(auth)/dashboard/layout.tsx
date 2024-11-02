// src/app/(auth)/dashboard/layout.tsx
import { UserButton } from "@clerk/nextjs";
import { 
  Menu,
  Home,
  MessageCircle,
  Settings,
  Plug,
  BarChart,
  Code
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QueryProvider } from "@/components/providers/query-provider";

const navigation = [
  { 
    name: 'Overview', 
    href: '/dashboard',
    icon: Home
  },
  { 
    name: 'Communications', 
    href: '/dashboard/communications',
    icon: MessageCircle,
    children: [
      { name: 'Email', href: '/dashboard/communications/email' },
      { name: 'Calls', href: '/dashboard/communications/calls' },
      { name: 'SMS', href: '/dashboard/communications/sms' }
    ]
  },
  { 
    name: 'Integrations', 
    href: '/dashboard/integrations',
    icon: Plug,
    children: [
      { name: 'Gmail Setup', href: '/dashboard/integrations/gmail' },
      { name: 'Twilio Setup', href: '/dashboard/integrations/twilio' }
    ]
  },
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics',
    icon: BarChart
  },
  { 
    name: 'API', 
    href: '/dashboard/api',
    icon: Code
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings',
    icon: Settings 
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <header className="border-b bg-white">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <nav className="flex flex-col gap-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2 text-sm font-medium hover:text-blue-500 transition-colors"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
              <Link href="/dashboard" className="text-xl font-bold">
                Senate Insights
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex">
          {/* Sidebar Navigation (desktop) */}
          <div className="hidden lg:flex h-[calc(100vh-64px)] w-64 flex-col border-r bg-white">
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-blue-500 transition-colors"
                  >
                    {item.icon && <item.icon className="h-4 w-4 mr-3" />}
                    {item.name}
                  </Link>
                  {item.children && (
                    <div className="ml-4 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="group flex items-center px-2 py-1 text-sm text-gray-600 hover:text-blue-500 transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}