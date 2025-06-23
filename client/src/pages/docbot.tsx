import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Target,
  Send
} from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface HealthAnalysis {
  overallScore: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  exerciseSuggestions: ExerciseSuggestion[];
  alerts: HealthAlert[];
  insights: string[];
  recommendation: string;
}

interface ExerciseSuggestion {
  type: string;
  duration: string;
  description: string;
  frequency: string;
  reason: string;
}

interface HealthAlert {
  severity: "info" | "warning" | "critical";
  message: string;
  metric: string;
  value: string;
  recommendation: string;
}

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export default function DocBotPage() {
  const userId = getCurrentUserId()!;
  const { toast } = useToast();
  const [personalizedInsight, setPersonalizedInsight] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const { data: analysis, isLoading, refetch } = useQuery<HealthAnalysis>({
    queryKey: [`/api/docbot/analyze`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/docbot/analyze/${userId}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error('Failed to get analysis');
      return response.json();
    },
    enabled: !!userId,
  });

  const generateInsightMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/docbot/insight", {
        age: 65, // Default age for elderly users
        healthConditions: []
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPersonalizedInsight(data.insight);
      toast({
        title: "New Insight Generated",
        description: "DocBot has provided you with a personalized health tip!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate insight. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/docbot/chat", { message, userId });
      const data = await response.json();
      return data.reply;
    },
    onSuccess: (data, variables) => {
      setChatMessages(prev => [
        ...prev,
        { sender: "user", text: variables },
        { sender: "bot", text: data },
      ]);
      setUserInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get response from DocBot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      sendMessageMutation.mutate(userInput.trim());
    }
  };

  const refreshAnalysis = () => {
    refetch();
    toast({
      title: "Analysis Refreshed",
      description: "Your health analysis has been updated.",
    });
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="DocBot - AI Health Assistant" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">DocBot AI</h1>
                  <p className="text-gray-600 dark:text-gray-300">Your intelligent health companion</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                  onClick={refreshAnalysis} 
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Analysis</span>
                </Button>
                
                <Button 
                  onClick={() => generateInsightMutation.mutate()}
                  disabled={generateInsightMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>Get Daily Tip</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : analysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Overall Health Score */}
                <Card className="lg:col-span-1">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Health Score</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className={`text-6xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      {analysis.overallScore}/5
                    </div>
                    <Badge className={getRiskColor(analysis.riskLevel)}>
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </CardContent>
                </Card>

                {/* Health Alerts */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Health Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysis.alerts.length > 0 ? (
                      <div className="space-y-3">
                        {analysis.alerts.map((alert, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            {getAlertIcon(alert.severity)}
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {alert.message}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {alert.metric}: {alert.value}
                              </div>
                              <div className="text-sm text-primary mt-1">
                                {alert.recommendation}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No health alerts at this time. Keep up the good work!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Exercise Suggestions */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Personalized Exercise Suggestions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.exerciseSuggestions.map((exercise, index) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                              {exercise.type}
                            </h4>
                            <Badge variant="outline">{exercise.frequency}</Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {exercise.description}
                          </p>
                          <div className="text-sm space-y-1">
                            <div><strong>Duration:</strong> {exercise.duration}</div>
                            <div><strong>Why:</strong> {exercise.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Health Recommendations */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Health Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5" />
                      <span>AI Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Personalized Daily Tip */}
                {personalizedInsight && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        <span>Today's Health Tip</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          {personalizedInsight}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Chat Interface */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>Chat with DocBot</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex items-end space-x-2 ${
                            msg.sender === "user" ? "justify-end" : ""
                          }`}
                        >
                          <div
                            className={`p-3 rounded-lg max-w-lg ${
                              msg.sender === "user"
                                ? "bg-primary text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {sendMessageMutation.isPending && (
                        <div className="flex items-center space-x-2">
                          <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="mt-4 flex items-center space-x-2">
                      <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask about your health reports or for exercise advice..."
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button type="submit" disabled={sendMessageMutation.isPending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to DocBot!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Upload some health reports to get started with AI-powered health analysis.
                  </p>
                  <Button onClick={refreshAnalysis}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}