import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import RoleSelect from "./pages/RoleSelect.tsx";
import RecruiterDashboard from "./pages/RecruiterDashboard.tsx";
import Analytics from "./pages/Analytics.tsx";
import CandidateDashboard from "./pages/CandidateDashboard.tsx";
import JobDetail from "./pages/JobDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/role" element={<RoleSelect />} />
            <Route path="/recruiter" element={<RecruiterDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/candidate" element={<CandidateDashboard />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
