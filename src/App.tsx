import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Customers from "./pages/Customers";
import Payments from "./pages/Payments";
import CashMovement from "./pages/CashMovement";
import Services from "./pages/Services";
import Rentals from "./pages/Rentals";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Portal from "./pages/Portal";
import Settings from "./pages/Settings";
import Foods from "./pages/Foods";
import NotFound from "./pages/NotFound";
import Home from "./pages/Index";
import Venues from "./pages/Venues";
import Pricing from "./pages/Pricing";
import Taratibu from "./pages/Taratibu";
import Muhimu from "./pages/Muhimu";
import Packages from "./pages/Packages";
import Hall from "./pages/Hall";
import AdminConsole from "./pages/AdminConsole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/taratibu" element={<Taratibu />} />
            <Route path="/muhimu" element={<Muhimu />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/cash-movement" element={<CashMovement />} />
            <Route path="/services" element={<Services />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/foods" element={<Foods />} />
            <Route path="/halls/:hallId" element={<Hall />} />
            <Route path="/admin" element={<AdminConsole />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
