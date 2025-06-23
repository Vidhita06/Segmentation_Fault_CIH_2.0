import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CalendarPlus, Edit, Trash2, X, Lightbulb } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId } from "@/lib/auth";
import type { Schedule, InsertSchedule } from "@shared/schema";

export default function SchedulePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId()!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    duration: "",
    category: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      time: "",
      duration: "",
      category: "",
    });
  };

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        title: editingSchedule.title,
        time: editingSchedule.time,
        duration: String(editingSchedule.duration),
        category: editingSchedule.category,
      });
    } else {
      setFormData({
        title: "",
        time: "",
        duration: "",
        category: "",
      });
    }
  }, [editingSchedule]);

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: [`/api/schedules`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      return response.json();
    },
    enabled: !!userId,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: InsertSchedule) => {
      const response = await apiRequest("POST", "/api/schedules", data);
      return response.json();
    },
    onSuccess: (newSchedule) => {
      queryClient.setQueryData([`/api/schedules`, userId], (oldData: Schedule[] | undefined) => {
        return oldData ? [...oldData, newSchedule] : [newSchedule];
      });
      toast({
        title: "Success",
        description: "Task added successfully!",
      });
      setIsModalOpen(false);
      setEditingSchedule(null);
      resetForm();
      setShowTutorial(false);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (data: Schedule) => {
      const response = await apiRequest("PATCH", `/api/schedules/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`, userId] });
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
      setIsModalOpen(false);
      setEditingSchedule(null);
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedules`, userId] });
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSchedule) {
      updateScheduleMutation.mutate({
        ...editingSchedule,
        ...formData,
        duration: parseInt(formData.duration),
      });
    } else {
    createScheduleMutation.mutate({
      userId,
      title: formData.title,
      time: formData.time,
      duration: parseInt(formData.duration),
      category: formData.category,
      completed: false,
    });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setEditingSchedule(null);
    resetForm();
    setIsModalOpen(false);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="Schedule" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Schedule</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSchedule(null);
                  resetForm();
                  setIsModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? "Edit Task" : "Add New Task"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Task Name</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Morning walk"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", e.target.value)}
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <Button type="button" variant="outline" onClick={handleModalClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending} className="flex-1">
                      {editingSchedule 
                        ? (updateScheduleMutation.isPending ? "Updating..." : "Update Task")
                        : (createScheduleMutation.isPending ? "Adding..." : "Add Task")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tutorial Card */}
          {showTutorial && schedules.length === 0 && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="text-blue-600 dark:text-blue-300 h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      Getting Started with Schedule
                    </h3>
                    <p className="text-blue-700 dark:text-blue-400 text-sm mb-4">
                      Organize your daily activities with smart time management. Add tasks with categories, set durations, and get reminders.
                    </p>
                    <div className="flex space-x-4">
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        ✓ Set time slots
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        ✓ Add categories
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        ✓ Track duration
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={dismissTutorial}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Content */}
          <Card>
            <CardContent className="p-6">
              {schedules.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    No tasks scheduled
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Start organizing your day by adding your first task
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">
                            {schedule.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {schedule.time} - {schedule.duration} minutes • {schedule.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(schedule)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                          disabled={deleteScheduleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
