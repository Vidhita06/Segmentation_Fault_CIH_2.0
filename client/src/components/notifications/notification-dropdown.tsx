import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, Lightbulb, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId } from "@/lib/auth";
import type { Notification } from "@shared/schema";
import { useNotifications } from "@/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId();

  const { notifications, unreadCount, isLoading } = useNotifications();

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Mark API notifications as read
      if (userId) {
      await apiRequest("PATCH", `/api/notifications/${userId}/read-all`);
      }

      // Mark local notifications as read
      const NOTIFICATION_KEY = "swaasthbuddy_notifications";
      const stored = localStorage.getItem(NOTIFICATION_KEY);
      const allLocal = stored ? JSON.parse(stored) : [];
      const updatedLocal = allLocal.map((n: Notification) =>
        n.userId === userId ? { ...n, read: true } : n
      );
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updatedLocal));
      
      // Trigger a UI update
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications`, userId] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
        toast({
            title: "Error",
            description: "Could not mark notifications as read.",
            variant: "destructive"
        })
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medicine":
        return <Pill className="h-4 w-4 text-primary" />;
      case "appointment":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "tip":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      default:
        return <Pill className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  return (
    <Card className="absolute right-0 top-12 w-80 shadow-lg border z-50 bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                notification.read ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {notification.message}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {getTimeAgo(notification.createdAt!)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
