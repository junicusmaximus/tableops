import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import TodayBriefing from "@/pages/TodayBriefing";
import Attendance from "@/pages/Attendance";
import Schedule from "@/pages/Schedule";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import Sales from "@/pages/Sales";
import ServiceNotes from "@/pages/ServiceNotes";
import Ingredients from "@/pages/Ingredients";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Leave from "@/pages/Leave";
import Documents from "@/pages/Documents";
import Benefits from "@/pages/Benefits";
import Glossary from "@/pages/Glossary";
import Chat from "@/pages/Chat";
import Announcements from "@/pages/Announcements";
import Stores from "@/pages/Stores";
import AdminSettings from "@/pages/AdminSettings";
import MoreMenu from "@/pages/MoreMenu";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="today-briefing" element={<TodayBriefing />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="reports" element={<Reports />} />
              <Route path="sales" element={<Sales />} />
              <Route path="service-notes" element={<ServiceNotes />} />
              <Route path="ingredients" element={<Ingredients />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="leave" element={<Leave />} />
              <Route path="documents" element={<Documents />} />
              <Route path="benefits" element={<Benefits />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="chat" element={<Chat />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="stores" element={<Stores />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="more" element={<MoreMenu />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
