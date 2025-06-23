import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import type { Notification } from "@shared/schema";

// This is a local-only extension of the Notification type
type ReminderNotification = Notification & { sourceId?: number };

const NOTIFICATION_KEY = "swaasthbuddy_notifications";

export function useNotifications() {
  const userId = getCurrentUserId();

  // 1. Fetch notifications from the API
  const { data: apiNotifications = [], isLoading: isApiLoading, refetch } = useQuery<Notification[]>({
    queryKey: [`/api/notifications`, userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/notifications/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch API notifications');
      return response.json();
    },
    enabled: !!userId,
  });

  // 2. State for local notifications from localStorage
  const [localNotifications, setLocalNotifications] = useState<ReminderNotification[]>([]);

  // 3. Effect to load local notifications and listen for updates
  useEffect(() => {
    if (!userId) return;

    const loadLocalNotifications = () => {
      const stored = localStorage.getItem(NOTIFICATION_KEY);
      const allLocal = stored ? JSON.parse(stored) : [];
      const userLocalNotifications = allLocal.filter((n: ReminderNotification) => n.userId === userId);
      setLocalNotifications(userLocalNotifications);
    };

    loadLocalNotifications();

    const handleStorageUpdate = () => {
        loadLocalNotifications();
        refetch(); // also refetch api notifications
    }

    window.addEventListener("notifications-updated", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate); // For changes in other tabs

    return () => {
      window.removeEventListener("notifications-updated", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [userId, refetch]);
  
  // 4. Merge, remove duplicates, and sort notifications
  const combined = [...apiNotifications, ...localNotifications];
  const uniqueNotifications = Array.from(new Map(combined.map(n => [n.id, n])).values());
  const sortedNotifications = uniqueNotifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 5. Calculate unread count
  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  return {
    notifications: sortedNotifications,
    unreadCount,
    isLoading: isApiLoading,
  };
} 