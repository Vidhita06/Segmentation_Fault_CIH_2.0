import { useState } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setCurrentUser } from "@/lib/auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data.user, formData.rememberMe);
      toast({
        title: "Success",
        description: "Login successful! Welcome back.",
      });
      setTimeout(() => setLocation("/dashboard"), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-gray-600 dark:text-gray-300 mb-8 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="text-white text-3xl" />
          </div>
          <h1 className="text-gray-800 dark:text-gray-100 text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to continue your wellness journey</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label className="block text-gray-700 dark:text-gray-200 text-sm font-medium mb-2">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-gray-600 dark:text-gray-300 text-sm">
                  Remember me
                </Label>
              </div>
              <Button variant="link" className="text-primary hover:text-primary/80 text-sm">
                Forgot Password?
              </Button>
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-gray-600 dark:text-gray-300 mt-6">
            Don't have an account?{" "}
            <Button
              variant="link"
              onClick={() => setLocation("/register")}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Button>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="flex items-center">
              <i className="fas fa-shield-alt mr-1"></i> Secure
            </span>
            <span className="flex items-center">
              <i className="fas fa-lock mr-1"></i> Encrypted
            </span>
            <span className="flex items-center">
              <Heart className="mr-1 h-4 w-4" /> Trusted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
