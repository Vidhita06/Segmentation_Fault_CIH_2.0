import { Heart, Home, Calendar, Pill, BarChart3, Crown, Settings, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Medicines", href: "/medicines", icon: Pill },
  { name: "Health Reports", href: "/reports", icon: BarChart3 },
  { name: "DocBot AI", href: "/docbot", icon: Brain },
  { name: "Premium", href: "/premium", icon: Crown },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className={cn("w-64 bg-white dark:bg-gray-900 shadow-lg", className)}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-800 dark:text-gray-100">
            Swaasth Buddy
          </span>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
