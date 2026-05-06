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
import StaffDetail from "@/pages/StaffDetail";
import Attendance from "@/pages/Attendance";
import MySchedule from "@/pages/MySchedule";
import ScheduleManagement from "@/pages/ScheduleManagement";
import Leave from "@/pages/Leave";
import Checklists from "@/pages/Checklists";
import Chat from "@/pages/Chat";
import Sales from "@/pages/Sales";
import SalesEntry from "@/pages/SalesEntry";
import SalesImport from "@/pages/SalesImport";
import SalesAccessSettings from "@/pages/SalesAccessSettings";
import Reservations from "@/pages/Reservations";
import Reports from "@/pages/Reports";
import ServiceNotes from "@/pages/ServiceNotes";
import Ingredients from "@/pages/Ingredients";
import PurchaseOrders from "@/pages/PurchaseOrders";
import Documents from "@/pages/Documents";
import DocumentBuilder from "@/pages/DocumentBuilder";
import DocumentSend from "@/pages/DocumentSend";
import DocumentSign from "@/pages/DocumentSign";
import DocumentDetail from "@/pages/DocumentDetail";
import SystemContractSend from "@/pages/SystemContractSend";
import Benefits from "@/pages/Benefits";
import Glossary from "@/pages/Glossary";
import Knowledge from "@/pages/Knowledge";
import KnowledgeArticleDetail from "@/pages/KnowledgeArticleDetail";
import RecipeDetail from "@/pages/RecipeDetail";
import CourseDetail from "@/pages/CourseDetail";
import QuizTake from "@/pages/QuizTake";
import Announcements from "@/pages/Announcements";
import Settings from "@/pages/Settings";
import AccessIntegration from "@/pages/AccessIntegration";
import ConsentSettings from "@/pages/ConsentSettings";
import MoreMenu from "@/pages/MoreMenu";
import Stores from "@/pages/Stores";
import WorkStats from "@/pages/WorkStats";
import AIScheduleRecommend from "@/pages/AIScheduleRecommend";
import AIStoreReport from "@/pages/AIStoreReport";
import NotFound from "@/pages/NotFound";
import RoleGuard from "@/components/auth/RoleGuard";

const queryClient = new QueryClient();

/** Wrap a route element so manager-only/toggle-gated routes are blocked
 *  cleanly when accessed by direct URL. */
const G = ({ children }: { children: React.ReactNode }) => (
  <RoleGuard>{children}</RoleGuard>
);

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
              <Route path="staff" element={<G><StaffManagement /></G>} />
              <Route path="staff/:id" element={<G><StaffDetail /></G>} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="schedule" element={<MySchedule />} />
              <Route path="schedule-management" element={<G><ScheduleManagement /></G>} />
              <Route path="leave" element={<Leave />} />
              <Route path="checklists" element={<Checklists />} />
              <Route path="chat" element={<Chat />} />
              <Route path="sales" element={<G><Sales /></G>} />
              <Route path="sales/entry" element={<G><SalesEntry /></G>} />
              <Route path="sales/import" element={<G><SalesImport /></G>} />
              <Route path="settings/sales-access" element={<G><SalesAccessSettings /></G>} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="service-notes" element={<ServiceNotes />} />
              <Route path="ingredients" element={<G><Ingredients /></G>} />
              <Route path="purchase-orders" element={<G><PurchaseOrders /></G>} />
              <Route path="documents" element={<Documents />} />
              <Route path="documents/templates/new" element={<G><DocumentBuilder /></G>} />
              <Route path="documents/templates/:id" element={<G><DocumentBuilder /></G>} />
              <Route path="documents/send/:templateId" element={<G><DocumentSend /></G>} />
              <Route path="documents/sign/:id" element={<DocumentSign />} />
              <Route path="documents/view/:id" element={<DocumentDetail />} />
              <Route path="documents/system-contract/:contractType" element={<G><SystemContractSend /></G>} />
              <Route path="benefits" element={<Benefits />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="knowledge/articles/new" element={<G><KnowledgeArticleDetail /></G>} />
              <Route path="knowledge/articles/:id" element={<KnowledgeArticleDetail />} />
              <Route path="knowledge/recipes/new" element={<G><RecipeDetail /></G>} />
              <Route path="knowledge/recipes/:id" element={<RecipeDetail />} />
              <Route path="knowledge/courses/new" element={<G><CourseDetail /></G>} />
              <Route path="knowledge/courses/:id" element={<CourseDetail />} />
              <Route path="knowledge/quizzes/:courseId/take" element={<QuizTake />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/access-integration" element={<G><AccessIntegration /></G>} />
              <Route path="settings/consents" element={<ConsentSettings />} />
              <Route path="more" element={<MoreMenu />} />
              <Route path="stores" element={<Stores />} />
              <Route path="work-stats" element={<WorkStats />} />
              <Route path="ai-schedule" element={<G><AIScheduleRecommend /></G>} />
              <Route path="ai-report" element={<G><AIStoreReport /></G>} />

export default App;
