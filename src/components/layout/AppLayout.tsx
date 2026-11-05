import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps { children: ReactNode; title?: string; }

export function AppLayout({children,title}:AppLayoutProps){
  const navigate=useNavigate();
  const {user,loading}=useAuth();
  useEffect(()=>{if(!loading&&!user)navigate("/login",{replace:true});},[loading,user,navigate]);
  if(loading)return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>;
  if(!user)return null;
  return <div className="min-h-screen bg-background"><AppSidebar/><div className="pl-64"><AppHeader title={title}/><main className="p-6">{children}</main></div></div>;
}
