
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/lib/types";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Ingredients from "./pages/Ingredients";
import Meals from "./pages/Meals";
import ServedMeals from "./pages/ServedMeals";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Logs from "./pages/Logs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes for ingredients management */}
            <Route 
              path="/ingredients" 
              element={
                <ProtectedRoute>
                  <Ingredients />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes for meals management */}
            <Route 
              path="/meals" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <Meals />
                </ProtectedRoute>
              } 
            />
            
            {/* Route for served meals history */}
            <Route 
              path="/served-meals" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.CHEF]}>
                  <ServedMeals />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes for reports - accessible only to admin and manager */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes for user management - accessible only to admin */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            
            {/* Route for system logs - accessible only to admin and manager */}
            <Route 
              path="/logs" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                  <Logs />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all unknown routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
