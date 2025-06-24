import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, BarChart3, Brain, RefreshCw, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUserId } from "@/lib/auth";
import type { HealthReport } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getCurrentUserId()!;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<HealthReport | null>(null);

  const { data: reports = [] } = useQuery<HealthReport[]>({
    queryKey: [`/api/health-reports`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/health-reports/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    enabled: !!userId,
  });

  const uploadReportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("report", file);

      const response = await fetch("/api/health-reports", {
        method: "POST",
        body: formData,
        // No 'Content-Type' header, browser will set it to 'multipart/form-data'
      });

      if (!response.ok) {
        throw new Error("Failed to upload report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/health-reports`, userId] });
      toast({
        title: "Success",
        description: "Health report uploaded successfully!",
      });
      setIsModalOpen(false);
      setSelectedFile(null);
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest("DELETE", `/api/reports/${reportId}`);
      if (!response.ok) {
        throw new Error("Failed to delete report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/health-reports`, userId] });
      toast({
        title: "Success",
        description: "Health report deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the report.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setReportToDelete(null);
    }
  });

  const analyzeReportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("report", file);

      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze report");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.reply || JSON.stringify(data, null, 2));
      toast({
        title: "Analysis Complete",
        description: "DocBot has analyzed the report.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze the report.",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadReportMutation.mutate(selectedFile);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      analyzeReportMutation.mutate(selectedFile);
    }
  };

  const handleSendToContacts = async (reportId: number) => {
    try {
      const res = await fetch(`/api/health-reports/${reportId}/send-to-contacts`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast({ title: 'Sent', description: 'Report sent to emergency contacts!', variant: 'default' });
    } catch {
      toast({ title: 'Error', description: 'Failed to send report to contacts.', variant: 'destructive' });
    }
  };

  const healthMetrics = [
    { label: "Blood Pressure", value: "120/80", color: "text-green-600" },
    { label: "Blood Sugar", value: "95 mg/dL", color: "text-blue-600" },
    { label: "Heart Rate", value: "72 bpm", color: "text-red-600" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="Health Reports" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Health Reports</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Health Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Select your PDF report</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-input"
                    />
                    <Button onClick={() => document.getElementById('file-input')?.click()}>
                      Choose File
                    </Button>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="flex space-x-2">
                      <Button onClick={handleAnalyze} disabled={true} className="flex-1">
                        {analyzeReportMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            Analyze with DocBot
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleUpload} 
                        disabled={!selectedFile || uploadReportMutation.isPending}
                        className="flex-1"
                      >
                          <Upload className="mr-2 h-4 w-4" />
                        {uploadReportMutation.isPending ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Analysis Result:</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {analysisResult}
                      </p>
                    </div>
                  )}

                  <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full mt-2">
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Health Analytics */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                  Health Analytics
                </h3>
                <div className="space-y-4">
                  {healthMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-gray-600 dark:text-gray-300">{metric.label}</span>
                      <span className={`font-semibold ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Recent Reports
              </h3>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No reports uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">
                            {report.fileName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Uploaded on {new Date(report.uploadDate!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/reports/${report.id}/view`, '_blank')}
                        >
                          View
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setReportToDelete(report)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendToContacts(report.id)}
                          title="Send to Emergency Contacts"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Send to Contacts
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

      <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report
              "{reportToDelete?.fileName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reportToDelete) {
                  deleteReportMutation.mutate(reportToDelete.id);
                }
              }}
              disabled={deleteReportMutation.isPending}
            >
              {deleteReportMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
