import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pill, Edit, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId } from "@/lib/auth";
import type { Medicine, InsertMedicine } from "@shared/schema";

export default function MedicinesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId()!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    time: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      time: "",
    });
  };

  useEffect(() => {
    if (editingMedicine) {
      setFormData({
        name: editingMedicine.name,
        dosage: editingMedicine.dosage,
        frequency: editingMedicine.frequency,
        time: editingMedicine.time,
      });
    } else {
      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        time: "",
      });
    }
  }, [editingMedicine]);

  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: [`/api/medicines`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/medicines/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch medicines');
      return response.json();
    },
    enabled: !!userId,
  });

  const createMedicineMutation = useMutation({
    mutationFn: async (data: InsertMedicine) => {
      const response = await apiRequest("POST", "/api/medicines", data);
      return response.json();
    },
    onSuccess: (newMedicine) => {
      queryClient.setQueryData([`/api/medicines`, userId], (oldData: Medicine[] | undefined) => {
        return oldData ? [...oldData, newMedicine] : [newMedicine];
      });
      toast({
        title: "Success",
        description: "Medicine added successfully!",
      });
      setIsModalOpen(false);
      setEditingMedicine(null);
      resetForm();
      setShowTutorial(false);
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: async (data: Medicine) => {
      const response = await apiRequest("PATCH", `/api/medicines/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/medicines`, userId] });
      toast({
        title: "Success",
        description: "Medicine updated successfully!",
      });
      setIsModalOpen(false);
      setEditingMedicine(null);
    },
  });

  const deleteMedicineMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medicines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/medicines`, userId] });
      toast({
        title: "Success",
        description: "Medicine deleted successfully!",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMedicine) {
      updateMedicineMutation.mutate({
        ...editingMedicine,
        ...formData,
      });
    } else {
    createMedicineMutation.mutate({
      userId,
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      time: formData.time,
      stockLevel: 30,
    });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditClick = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setEditingMedicine(null);
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
        <Header title="Medicines" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Medicine Management</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMedicine(null);
                  resetForm();
                  setIsModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medicine
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Medicine Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Aspirin"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={formData.dosage}
                        onChange={(e) => handleInputChange("dosage", e.target.value)}
                        placeholder="100mg"
                        required
                      />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once-daily">Once daily</SelectItem>
                          <SelectItem value="twice-daily">Twice daily</SelectItem>
                          <SelectItem value="three-times-daily">Three times daily</SelectItem>
                          <SelectItem value="as-needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <Button type="button" variant="outline" onClick={handleModalClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending} className="flex-1">
                      {editingMedicine
                        ? (updateMedicineMutation.isPending ? "Updating..." : "Update Medicine")
                        : (createMedicineMutation.isPending ? "Adding..." : "Add Medicine")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tutorial Card */}
          {showTutorial && medicines.length === 0 && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pill className="text-green-600 dark:text-green-300 h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                      Medicine Reminder System
                    </h3>
                    <p className="text-green-700 dark:text-green-400 text-sm mb-4">
                      Never miss a dose with intelligent medication scheduling. Set timing, dosage, frequency, and get low stock alerts.
                    </p>
                    <div className="flex space-x-4">
                      <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        ✓ Set reminders
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        ✓ Track dosage
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                        ✓ Low stock alerts
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

          {/* Medicine Content */}
          <Card>
            <CardContent className="p-6">
              {medicines.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    No medicines added
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Start managing your medications by adding your first medicine
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Medicine
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Pill className="text-primary h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">
                            {medicine.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {medicine.dosage} - {medicine.frequency} at {medicine.time}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Stock: {medicine.stockLevel} pills
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(medicine)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMedicineMutation.mutate(medicine.id)}
                          disabled={deleteMedicineMutation.isPending}
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
