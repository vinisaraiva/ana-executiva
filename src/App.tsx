import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { PlatformAdminProvider } from "@/hooks/usePlatformAdmin";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Briefings from "./pages/Briefings";
import AnaSettings from "./pages/AnaSettings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const queryClient = new QueryClient();

const Loading = () => <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <PlatformAdminProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacidade" element={<PrivacyPolicy />} />
                <Route path="/termos" element={<TermsOfService />} />
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/emails" element={<Inbox />} />
                <Route path="/app/briefings" element={<Briefings />} />
                <Route path="/app/settings" element={<AnaSettings />} />
                <Route path="/app/imports/*" element={<Navigate to="/app" replace />} />
                <Route path="/app/chat" element={<Navigate to="/app" replace />} />
                <Route path="/app/settings/whatsapp-commands" element={<Navigate to="/app/settings" replace />} />
                <Route path="/admin" element={<AdminGuard><Suspense fallback={<Loading />}><AdminDashboard /></Suspense></AdminGuard>} />
                <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PlatformAdminProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;
