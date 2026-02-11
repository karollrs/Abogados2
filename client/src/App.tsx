import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/Calllogs";
import CallLogs from "@/pages/Calllogs";
import Attorneys from "@/pages/Attorneys";



function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/calls" component={CallLogs} />
      <Route path="/attorneys" component={Attorneys} />
      <Route path="/call-logs" component={CallLogs} />
    
    </Switch>

  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
