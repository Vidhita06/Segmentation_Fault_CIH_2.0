import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Calendar, Stethoscope, Crown, Check, Smartphone, CreditCard } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId, getCurrentUser } from "@/lib/auth";
import type { User } from "@shared/schema";

export default function PremiumPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId()!;
  const currentUser = getCurrentUser();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const { data: user } = useQuery<User>({
    queryKey: [`/api/users`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });

  const isPremium = user?.isPremium || currentUser?.isPremium || false;

  const upgradeMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const response = await apiRequest("POST", "/api/premium/upgrade", {
        userId,
        paymentMethod,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users`, userId] });
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = (method: string) => {
    setSelectedPaymentMethod(method);
    toast({
      title: "Processing Payment",
      description: "Please wait while we process your payment...",
    });
    upgradeMutation.mutate(method);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    toast({
      title: "Welcome to Premium!",
      description: "All premium features are now unlocked.",
    });
  };

  const premiumFeatures = [
    {
      icon: Video,
      title: "Video Consultations",
      description: "Connect with doctors via video calls for face-to-face consultations",
      color: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300",
    },
    {
      icon: Calendar,
      title: "Appointment Tracker",
      description: "Smart appointment management with automated reminders",
      color: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300",
    },
    {
      icon: Stethoscope,
      title: "Ask-A-Doctor",
      description: "24/7 access to medical professionals for quick consultations",
      color: "bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="Premium Features" />
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Premium Features</h2>
            <p className="text-gray-600 dark:text-gray-300">Unlock advanced health management tools</p>
          </div>

          {/* Premium Status Card */}
          <Card className={`mb-8 ${isPremium ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}>
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center">
                    <Crown className="mr-2 h-6 w-6" />
                    {isPremium ? "Premium Active" : "Premium Plan"}
                  </h3>
                  <p className="opacity-90">
                    {isPremium ? "All premium features unlocked" : "Upgrade to unlock all features"}
                  </p>
                </div>
                <div className="text-right">
                  {isPremium ? (
                    <div>
                      <div className="text-sm opacity-90">Next billing</div>
                      <div className="font-semibold">Jan 15, 2024</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold">₹499</div>
                      <div className="text-sm opacity-90">per month</div>
                    </div>
                  )}
                </div>
              </div>
              {!isPremium && (
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="mt-4 bg-white text-orange-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Upgrade Now
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {premiumFeatures.map((feature) => (
              <Card key={feature.title} className="border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Premium Dashboard (Visible only if premium) */}
          {isPremium && (
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="consultations" className="w-full">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <TabsList className="grid w-full grid-cols-3 bg-transparent">
                      <TabsTrigger value="consultations" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                        Video Consultations
                      </TabsTrigger>
                      <TabsTrigger value="appointments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                        Appointments
                      </TabsTrigger>
                      <TabsTrigger value="ask-doctor" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                        Ask-A-Doctor
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="consultations" className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                      Video Consultations
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Schedule and manage your video consultations with healthcare professionals.
                    </p>
                    <Button>
                      <Video className="mr-2 h-4 w-4" />
                      Schedule Consultation
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="appointments" className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                      Appointment Tracker
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Keep track of all your medical appointments in one place with smart reminders.
                    </p>
                    <Button>
                      <Calendar className="mr-2 h-4 w-4" />
                      Add Appointment
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="ask-doctor" className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                      Ask-A-Doctor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Get instant medical advice from qualified professionals available 24/7.
                    </p>
                    <Button>
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Ask Question
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade to Premium</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white text-center">
                <div className="text-2xl font-bold">₹499</div>
                <div className="text-sm opacity-90">per month</div>
              </div>
              
              <div className="space-y-4">
                {[
                  "Video consultations with doctors",
                  "Smart appointment tracking", 
                  "24/7 Ask-A-Doctor service"
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handlePayment("upi")}
                  disabled={upgradeMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span>Pay with UPI</span>
                </Button>
                <Button
                  onClick={() => handlePayment("netbanking")}
                  disabled={upgradeMutation.isPending}
                  className="w-full flex items-center justify-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Net Banking</span>
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Success Modal */}
        <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
          <DialogContent className="max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500 dark:text-green-300" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold mb-2">Payment Successful!</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Welcome to Swaasth Buddy Premium! All premium features are now unlocked.
            </p>
            <Button onClick={closeSuccessModal} className="w-full">
              Continue
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
