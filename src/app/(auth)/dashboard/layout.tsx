"use client"

import { UserButton } from "@clerk/nextjs";
import { 
  Menu,
  Home,
  MessageCircle,
  Settings,
  Plug,
  BarChart,
  Code,
  Layers,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QueryProvider } from "@/components/providers/query-provider";
import { useState } from "react";

const navigation = [
  { 
    name: 'Overview', 
    href: '/dashboard',
    icon: Home
  },
  { 
    name: 'Communications', 
    href: '',
    icon: MessageCircle,
    children: [
      { name: 'Email', href: '/dashboard/communications/email' },
      { name: 'Calls', href: '/dashboard/communications/calls' },
      { name: 'SMS', href: '/dashboard/communications/sms' }
    ]
  },
  { 
    name: 'Integrations', 
    href: '',
    icon: Plug,
    children: [
      { name: 'Gmail Setup', href: '/dashboard/integrations/gmail' },
      { name: 'Twilio Setup', href: '/dashboard/integrations/twilio' }
    ]
  },
  { 
    name: 'Categories',
    href: '/dashboard/categories',
    icon: Layers
  },
  { 
    name: 'Insights',
    href: '/dashboard/insights',
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
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (name: string) => {
    setOpenItems(prev => 
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  const NavItem = ({ item, mobile = false }: { item: typeof navigation[number]; mobile?: boolean }) => {
    const isOpen = openItems.includes(item.name);
    return (
      <div key={item.name}>
        <Link
          href={item.href}
          className={`group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-blue-600 ${mobile ? 'justify-between' : ''}`}
          onClick={() => item.children && toggleItem(item.name)}
        >
          <div className="flex items-center gap-x-3">
            {item.icon && <item.icon className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-blue-600" />}
            {item.name}
          </div>
          {item.children && (
            <ChevronDown className={`ml-auto h-5 w-5 shrink-0 text-gray-400 group-hover:text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </Link>
        {item.children && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.name}
                href={child.href}
                className="group flex items-center gap-x-3 rounded-md p-2 pl-11 text-sm font-medium leading-6 text-gray-600 hover:bg-gray-50 hover:text-blue-600"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <header className="fixed top-0 z-40 w-full border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex h-16 shrink-0 items-center px-6">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                      Get Civic
                    </Link>
                  </div>
                  <nav className="flex flex-col gap-1 px-3 py-4">
                    {navigation.map((item) => (
                      <NavItem key={item.name} item={item} mobile={true} />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Get Civic
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex pt-16">
          {/* Sidebar Navigation (desktop) */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col pt-16">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
              <nav className="flex flex-1 flex-col pt-8">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavItem item={item} />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 pb-8 lg:pl-72">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}