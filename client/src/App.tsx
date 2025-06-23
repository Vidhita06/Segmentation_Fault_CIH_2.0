import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Schedule from "@/pages/schedule";
import Medicines from "@/pages/medicines";
import Reports from "@/pages/reports";
import DocBot from "@/pages/docbot";
import Premium from "@/pages/premium";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { isAuthenticated } from "./lib/auth";

// A wrapper for routes that should only be accessible to non-authenticated users
const PublicRoute = (props: any) => {
  if (isAuthenticated()) {
    return <Redirect to="/dashboard" />;
  }
  return <Route {...props} />;
};

// A wrapper for routes that require authentication
const ProtectedRoute = (props: any) => {
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  return <Route {...props} />;
};

function Router() {
  return (
    <Switch>
      <PublicRoute path="/" component={Landing} />
      <PublicRoute path="/login" component={Login} />
      <PublicRoute path="/register" component={Register} />

      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/schedule" component={Schedule} />
      <ProtectedRoute path="/medicines" component={Medicines} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/docbot" component={DocBot} />
      <ProtectedRoute path="/premium" component={Premium} />
      <ProtectedRoute path="/settings" component={Settings} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="swaasth-buddy-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
