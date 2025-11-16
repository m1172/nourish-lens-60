import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { OnboardingRoute } from "./components/OnboardingRoute";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Diary from "./pages/Diary";
import Add from "./pages/Add";
import AddPhoto from "./pages/AddPhoto";
import AddSearch from "./pages/AddSearch";
import AddBarcode from "./pages/AddBarcode";
import AddVoice from "./pages/AddVoice";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Recipes from "./pages/Recipes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingRoute>
                  <Onboarding />
                </OnboardingRoute>
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Diary />
              </ProtectedRoute>
            } />
            <Route path="/add" element={
              <ProtectedRoute>
                <Add />
              </ProtectedRoute>
            } />
            <Route path="/add/photo" element={
              <ProtectedRoute>
                <AddPhoto />
              </ProtectedRoute>
            } />
            <Route path="/add/search" element={
              <ProtectedRoute>
                <AddSearch />
              </ProtectedRoute>
            } />
            <Route path="/add/barcode" element={
              <ProtectedRoute>
                <AddBarcode />
              </ProtectedRoute>
            } />
            <Route path="/add/voice" element={
              <ProtectedRoute>
                <AddVoice />
              </ProtectedRoute>
            } />
            <Route path="/recipes" element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
