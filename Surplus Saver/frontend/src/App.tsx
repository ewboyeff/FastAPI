
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Store from "./pages/Store";
import Customer from "./pages/Customer";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerBalance from "./pages/CustomerBalance";
import CustomerOrders from "./pages/CustomerOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/store" 
              element={
                <ProtectedRoute requiredRole="store">
                  <Store />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <Customer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/profile" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/balance" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerBalance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/orders" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerOrders />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
