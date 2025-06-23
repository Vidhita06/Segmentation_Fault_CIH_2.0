import { useState } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      setLocation("/onboarding");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      username: formData.username,
      password: formData.password,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-gray-600 dark:text-gray-300 mb-8 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="text-white text-3xl" />
          </div>
          <h1 className="text-gray-800 dark:text-gray-100 text-2xl font-bold">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-300">Join thousands on their wellness journey</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">First Name</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Last Name</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Email Address"
                required
              />
            </div>
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Username</Label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Username"
                required
              />
            </div>
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Password"
                required
              />
            </div>
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Confirm Password</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm Password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105"
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-6">
            Already have an account?{" "}
            <Button
              variant="link"
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
