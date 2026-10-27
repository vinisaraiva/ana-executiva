import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { PlatformAdminProvider } from "@/hooks/usePlatformAdmin";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Dashboard from "./pages/Dashboard";
import Imports from "./pages/Imports";
import NewImport from "./pages/NewImport";
import RunDetails from "./pages/RunDetails";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TenantDetails = lazy(() => import("./pages/TenantDetails"));
const JobsDashboard = lazy(() => import("./pages/JobsDashboard"));
const WhatsAppCommands = lazy(() => import("./pages/WhatsAppCommands"));

const queryClient = new QueryClient();

function AdminLoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

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
                <Route path="/app/imports" element={<Imports />} />
                <Route path="/app/imports/new" element={<NewImport />} />
                <Route path="/app/imports/:id" element={<RunDetails />} />
                <Route path="/app/chat" element={<Chat />} />
                <Route path="/app/settings" element={<Settings />} />
                <Route
                  path="/app/settings/whatsapp-commands"
                  element={
                    <Suspense fallback={<AdminLoadingFallback />}>
                      <WhatsAppCommands />
                    </Suspense>
                  }
                />
                
                {/* Admin routes with lazy loading and protection */}
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <Suspense fallback={<AdminLoadingFallback />}>
                        <AdminDashboard />
                      </Suspense>
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/tenant/:id"
                  element={
                    <AdminGuard>
                      <Suspense fallback={<AdminLoadingFallback />}>
                        <TenantDetails />
                      </Suspense>
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/jobs"
                  element={
                    <AdminGuard>
                      <Suspense fallback={<AdminLoadingFallback />}>
                        <JobsDashboard />
                      </Suspense>
                    </AdminGuard>
                  }
                />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
