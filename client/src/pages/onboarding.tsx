import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    age: "",
    gender: "",
    height: "",
    weight: "",
    // Step 2: Health Conditions
    healthConditions: [] as string[],
    // Step 3: Lifestyle
    activityLevel: "",
    sleepHours: "",
    smoking: "",
    // Step 4: Emergency Contact
    contactName: "",
    relationship: "",
    phoneNumber: "",
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const healthConditions = [
    "Diabetes",
    "Hypertension", 
    "Heart Disease",
    "Arthritis",
    "High Cholesterol",
    "Osteoporosis"
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    // Store onboarding completion in localStorage
    localStorage.setItem("swaasth_buddy_onboarding_completed", "true");
    localStorage.setItem("swaasth_buddy_onboarding_data", JSON.stringify(formData));
    
    toast({
      title: "Success",
      description: "Onboarding completed! Welcome to Swaasth Buddy.",
    });
    setTimeout(() => setLocation("/dashboard"), 1000);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHealthConditionChange = (condition: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      healthConditions: checked 
        ? [...prev.healthConditions, condition]
        : prev.healthConditions.filter(c => c !== condition)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Onboarding Steps */}
        <Card className="shadow-lg">
          <CardContent className="pt-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">Age</Label>
                      <Input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        placeholder="65"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm font-medium mb-2">Height (cm)</Label>
                      <Input
                        type="number"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium mb-2">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        placeholder="70"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Health Conditions */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  Health Conditions
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Please select any conditions that apply to you:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {healthConditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2 p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                      <Checkbox
                        id={condition}
                        checked={formData.healthConditions.includes(condition)}
                        onCheckedChange={(checked) => handleHealthConditionChange(condition, checked as boolean)}
                      />
                      <Label htmlFor={condition}>{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  Lifestyle Habits
                </h2>
                <div className="space-y-6">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Activity Level</Label>
                    <Select value={formData.activityLevel} onValueChange={(value) => handleInputChange("activityLevel", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="lightly-active">Lightly Active</SelectItem>
                        <SelectItem value="moderately-active">Moderately Active</SelectItem>
                        <SelectItem value="very-active">Very Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Sleep Hours (per night)</Label>
                    <Input
                      type="number"
                      value={formData.sleepHours}
                      onChange={(e) => handleInputChange("sleepHours", e.target.value)}
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Do you smoke?</Label>
                    <RadioGroup value={formData.smoking} onValueChange={(value) => handleInputChange("smoking", value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="smoking-yes" />
                        <Label htmlFor="smoking-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="smoking-no" />
                        <Label htmlFor="smoking-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Emergency Contact */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  Emergency Contact
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Contact Name</Label>
                    <Input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Relationship</Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleInputChange("relationship", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="caregiver">Caregiver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Phone Number</Label>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={previousStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              ) : (
                <div />
              )}
              
              {currentStep < totalSteps ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={completeOnboarding}>
                  Complete Setup
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
