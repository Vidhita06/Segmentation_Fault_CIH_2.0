import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Key, LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ui/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId, clearCurrentUser } from "@/lib/auth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId()!;
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: user } = useQuery<User>({
    queryKey: [`/api/users`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        age: user.age?.toString() || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const changePasswordMutation = useMutation({
    mutationFn: async (passwords: typeof passwordData) => {
      if (passwords.newPassword !== passwords.confirmPassword) {
        throw new Error("New passwords do not match.");
      }
      const response = await apiRequest("POST", `/api/auth/change-password`, {
        userId: userId,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users`, userId] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordData);
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Reset form data if canceling
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          age: user.age?.toString() || "",
          phone: user.phone || "",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const saveProfile = () => {
    updateUserMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      age: formData.age ? parseInt(formData.age) : undefined,
      phone: formData.phone,
    });
  };

  const logout = () => {
    clearCurrentUser();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    setTimeout(() => setLocation("/"), 1000);
  };

  const toggleDarkMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
    toast({
      title: "Success",
      description: `${theme === "light" ? "Dark" : "Light"} mode enabled`,
    });
  };

  // Emergency Contacts State
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contacts on mount
  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/emergency-contacts?userId=${userId}`);
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch {
        toast({ title: 'Error', description: 'Failed to load emergency contacts', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchContacts();
  }, [userId]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="Settings" />
        
        <div className="p-6">
          <div className="grid gap-6">
            {/* Profile Management */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Profile Information
                  </h3>
                  <Button variant="ghost" onClick={toggleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium mb-2">Phone</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-gray-50 dark:bg-gray-800" : ""}
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex space-x-4 mt-6">
                    <Button 
                      onClick={saveProfile}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={toggleEdit}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="mt-4"
                  >
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
                  Notification Preferences
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">
                        Medicine Reminders
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Get notified when it's time to take your medicine
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">
                        Appointment Reminders
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Receive reminders for upcoming appointments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">
                        Health Tips
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Get daily health tips and wellness advice
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
                  Appearance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">Dark Mode</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch 
                    checked={theme === "dark"}
                    onCheckedChange={toggleDarkMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
                  Account
                </h3>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left p-4 h-auto"
                  >
                    <Key className="mr-3 h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-100">
                        Change Password
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Update your account password
                      </p>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="w-full justify-start text-left p-4 h-auto border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <div>
                      <h4 className="font-medium">Sign Out</h4>
                      <p className="text-sm opacity-75">Sign out of your account</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading...</div>
                ) : (
                  <form className="space-y-4">
                    {contacts.map((contact, i) => (
                      <div key={i} className="space-y-1">
                        <label className="block font-medium">Family Member {i + 1} Email</label>
                        <Input
                          type="email"
                          value={contact?.email || ''}
                          disabled
                        />
                      </div>
                    ))}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
