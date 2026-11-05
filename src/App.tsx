import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Briefings from "./pages/Briefings";
import AnaSettings from "./pages/AnaSettings";
import LegalNotices from "./pages/LegalNotices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TenantProvider>
        <TooltipProvider>
          <Toaster/><Sonner/>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/privacidade" element={<LegalNotices kind="privacy"/>}/>
              <Route path="/termos" element={<LegalNotices kind="terms"/>}/>
              <Route path="/app" element={<Dashboard/>}/>
              <Route path="/app/emails" element={<Inbox/>}/>
              <Route path="/app/briefings" element={<Briefings/>}/>
              <Route path="/app/settings" element={<AnaSettings/>}/>
              <Route path="/app/imports/*" element={<Navigate to="/app" replace/>}/>
              <Route path="/app/chat" element={<Navigate to="/app" replace/>}/>
              <Route path="/app/settings/whatsapp-commands" element={<Navigate to="/app/settings" replace/>}/>
              <Route path="/admin/*" element={<Navigate to="/app" replace/>}/>
              <Route path="*" element={<NotFound/>}/>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TenantProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;
