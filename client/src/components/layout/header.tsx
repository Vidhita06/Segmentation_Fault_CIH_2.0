import { Bell, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { useState } from "react";
import { useLocation } from "wouter";
import { useNotifications } from "@/hooks/use-notifications";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { unreadCount } = useNotifications();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h1>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
              </span>
              )}
            </Button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Profile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/settings")}
            className="w-10 h-10 bg-primary rounded-full text-white hover:bg-primary/90"
          >
            <User className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
