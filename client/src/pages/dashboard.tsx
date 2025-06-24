import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, Calendar, Heart, TrendingUp, Brain, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserId } from "@/lib/auth";
import type { Schedule, Medicine, HealthReport, User as UserType } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { useEmergencyContacts } from "@/hooks/use-emergency-contacts";

export default function Dashboard() {
  const userId = getCurrentUserId();
  const [, setLocation] = useLocation();
  const [greeting, setGreeting] = useState("");
  const { toast } = useToast();
  
  // Emergency contacts hook
  const { showForm, handleSuccess } = useEmergencyContacts(userId);

  const { data: user } = useQuery<UserType>({
    queryKey: [`/api/users`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    };
    setGreeting(getGreeting());
  }, []);

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: [`/api/schedules`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: !!userId,
  });

  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: [`/api/medicines`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/medicines/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      return response.json();
    },
    enabled: !!userId,
  });
  
  const { data: healthReports = [] } = useQuery<HealthReport[]>({
    queryKey: [`/api/health-reports`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/health-reports/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch health reports');
      return response.json();
    },
    enabled: !!userId,
  });

  const todaySchedules = schedules.filter(schedule => !schedule.completed);
  const todayMedicines = medicines.length > 0 ? medicines.length : "--";
  
  const calculateHealthScore = () => {
    if (!user || healthReports.length === 0) return "--";
    let score = 50;
    if (user.age && user.age > 60) score -= 10;
    if (healthReports.some(r => r.bloodPressure && parseInt(r.bloodPressure.split('/')[0]) > 140)) score -= 15;
    if (healthReports.some(r => r.heartRate && (parseInt(r.heartRate) > 100 || parseInt(r.heartRate) < 60))) score -= 15;
    score += schedules.filter(s => s.completed).length * 2;
    score = Math.max(0, Math.min(100, score));
    return `${score}%`;
  };
  const healthScore = calculateHealthScore();

  useEffect(() => {
    const NOTIFICATION_KEY = "swaasthbuddy_notifications";
    
    // Use a more specific type for local reminder notifications
    type ReminderNotification = Notification & { sourceId: number };

    const checkReminders = () => {
      if (!userId || (!schedules.length && !medicines.length)) {
        return;
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format

      const allNotifications: ReminderNotification[] = JSON.parse(
        localStorage.getItem(NOTIFICATION_KEY) || "[]"
      );

      const todayStartTimestamp = new Date(now.setHours(0, 0, 0, 0)).getTime();
      
      const createdToday = (sourceId: number, type: 'schedule' | 'medicine') => {
        return allNotifications.some(
          (n) =>
            n.sourceId === sourceId &&
            n.type === type &&
            new Date(n.createdAt).getTime() >= todayStartTimestamp
        );
      };
      
      const newNotifications: (Omit<Notification, "id" | "createdAt" | "userId"> & { sourceId: number })[] = [];

      schedules.forEach((schedule) => {
        if (!schedule.completed && schedule.time === currentTime && !createdToday(schedule.id, 'schedule')) {
          const newNotif = {
            title: "Task Reminder",
            message: `It's time for: ${schedule.title}`,
            type: "schedule",
            read: false,
            sourceId: schedule.id,
          };
          newNotifications.push(newNotif);
          toast({ title: newNotif.title, description: newNotif.message });
        }
      });

      medicines.forEach((medicine) => {
        if (medicine.time === currentTime && !createdToday(medicine.id, 'medicine')) {
          const newNotif = {
            title: "Medicine Reminder",
            message: `Time for your ${medicine.name} (${medicine.dosage})`,
            type: "medicine",
            read: false,
            sourceId: medicine.id,
          };
          newNotifications.push(newNotif);
          toast({ title: newNotif.title, description: newNotif.message });
        }
      });

      if (newNotifications.length > 0) {
        const notificationsToStore: ReminderNotification[] = [
          ...allNotifications,
          ...newNotifications.map((n, i) => ({
            ...n,
            id: Date.now() + i, // Simple unique ID for local notifications
            userId: userId,
            createdAt: new Date().toISOString(),
          })),
        ];
        localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notificationsToStore));
        // Dispatch a custom event to notify other components like the header
        window.dispatchEvent(new CustomEvent("notifications-updated"));
      }
    };

    const intervalId = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Also check on initial load to catch up

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [schedules, medicines, userId, toast]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-auto">
        <Header title="Dashboard" />
        
        <div className="p-6 flex-1 flex flex-col">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {greeting}, {user?.firstName || "User"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Here's your health summary for today.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Today's Medicine</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {todayMedicines}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Pill className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Pending Tasks</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {todaySchedules.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Calendar className="text-secondary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Health Score</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{healthScore}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <Heart className="text-accent h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {user?.isPremium ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Next Appointment</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      Tomorrow
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800 border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Premium Feature</p>
                  <Button variant="link" onClick={() => setLocation('/premium')} className="text-primary p-0 h-auto">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity & DocBot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Today's Medicines */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  Today's Medicines
                </h3>
                <div className="space-y-3">
                  {medicines.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-gray-400 text-2xl">--</span>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          No medicines due today
                      </p>
                    </div>
                  ) : (
                      medicines.slice(0, 5).map((medicine) => (
                      <div
                        key={medicine.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Pill className="text-primary text-sm" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{medicine.name}</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {medicine.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                  {medicines.length > 5 && (
                    <Button variant="link" onClick={() => setLocation('/medicines')} className="text-primary p-0 h-auto w-full mt-2">
                      View Full List
                    </Button>
                  )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  Today's Schedule
                </h3>
                <div className="space-y-3">
                  {todaySchedules.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-gray-400 text-2xl">--</span>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                          No pending tasks
                      </p>
                    </div>
                  ) : (
                      todaySchedules.slice(0, 5).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-gray-700 dark:text-gray-300">{schedule.title}</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {schedule.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                  {todaySchedules.length > 5 && (
                    <Button variant="link" onClick={() => setLocation('/schedule')} className="text-primary p-0 h-auto w-full mt-2">
                      View Full Tasks
                    </Button>
                  )}
              </CardContent>
              </Card>
            </div>
            
            {/* DocBot Widget */}
            <Card 
              className="lg:col-span-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-primary/80 to-primary text-white cursor-pointer hover:from-primary hover:to-primary/90 transition-all"
              onClick={() => setLocation('/docbot')}
            >
              <Brain className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold mb-2">Ask DocBot</h3>
              <p className="text-sm opacity-90">
                Get instant health insights, report analysis, and exercise recommendations.
              </p>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Emergency Contact Form Modal */}
      <EmergencyContactForm
        userId={userId}
        isOpen={showForm}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
