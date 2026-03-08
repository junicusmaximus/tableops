import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import FindId from "@/pages/FindId";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import TodayBriefing from "@/pages/TodayBriefing";
import StaffManagement from "@/pages/StaffManagement";
import Attendance from "@/pages/Attendance";
import MySchedule from "@/pages/MySchedule";
import ScheduleManagement from "@/pages/ScheduleManagement";
import Leave from "@/pages/Leave";
import Checklists from "@/pages/Checklists";
import Chat from "@/pages/Chat";
import Sales from "@/pages/Sales";
import Reservations from "@/pages/Reservations";
import Reports from "@/pages/Reports";
import ServiceNotes from "@/pages/ServiceNotes";
import Ingredients from "@/pages/Ingredients";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Documents from "@/pages/Documents";
import Benefits from "@/pages/Benefits";
import Glossary from "@/pages/Glossary";
import Announcements from "@/pages/Announcements";
import Settings from "@/pages/Settings";
import MoreMenu from "@/pages/MoreMenu";
import Stores from "@/pages/Stores";
import WorkStats from "@/pages/WorkStats";
import AIScheduleRecommend from "@/pages/AIScheduleRecommend";
import AIStoreReport from "@/pages/AIStoreReport";
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
            <Route path="/find-id" element={<FindId />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="today-briefing" element={<TodayBriefing />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedule" element={<MySchedule />} />
              <Route path="schedule-management" element={<ScheduleManagement />} />
              <Route path="leave" element={<Leave />} />
              <Route path="checklists" element={<Checklists />} />
              <Route path="chat" element={<Chat />} />
              <Route path="sales" element={<Sales />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="service-notes" element={<ServiceNotes />} />
              <Route path="ingredients" element={<Ingredients />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="documents" element={<Documents />} />
              <Route path="benefits" element={<Benefits />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="settings" element={<Settings />} />
              <Route path="more" element={<MoreMenu />} />
              <Route path="stores" element={<Stores />} />
              <Route path="work-stats" element={<WorkStats />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
