import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthorizationProvider } from "@/contexts/AuthorizationContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { EventFinanceProvider } from "@/contexts/EventFinanceContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
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
import Pricing from "./pages/Pricing";
import Taratibu from "./pages/Taratibu";
import Muhimu from "./pages/Muhimu";
import Packages from "./pages/Packages";
import Hall from "./pages/Hall";
import AdminConsole from "./pages/AdminConsole";
import ManagingDirectorDashboard from "./pages/ManagingDirectorDashboard";
import Messages from "./pages/Messages";
import ManagingDirectorTransfer from "./pages/ManagingDirectorTransfer";
import Distribution from "./pages/Distribution";

const queryClient = new QueryClient();
const LIVE_DATA_RESET_MARKER = "kuringe_live_data_reset_v1";
const LEGACY_LOCAL_KEYS = [
  "kuringe_bookings_v1",
  "kuringe_payments_v1",
  "kuringe_payment_status_override_v1",
  "kuringe_event_budgets_v1",
  "kuringe_event_allocations_v1",
  "kuringe_event_distributions_v1",
  "kuringe_event_finance_logs_v1",
  "kuringe_inventory_items_v1",
  "kuringe_inventory_movements_v1",
  "kuringe_inventory_damages_v1",
  "kuringe_inventory_allocations_v1",
  "kuringe_policy_v1",
  "kuringe_approvals_v1",
  "kuringe_authorization_audit_v1",
];

const App = () => {
  useEffect(() => {
    const hasReset = localStorage.getItem(LIVE_DATA_RESET_MARKER) === "done";
    if (hasReset) return;
    LEGACY_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(LIVE_DATA_RESET_MARKER, "done");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthorizationProvider>
            <MessageProvider>
              <BookingProvider>
                <PaymentProvider>
                  <EventFinanceProvider>
                    <InventoryProvider>
                      <LanguageProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/venues" element={<Home />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/taratibu" element={<Taratibu />} />
                          <Route path="/muhimu" element={<Muhimu />} />
                          <Route path="/packages" element={<Packages />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/dashboard" element={<RouteGuard path="/dashboard"><Dashboard /></RouteGuard>} />
                          <Route path="/managing-director-dashboard" element={<RouteGuard path="/managing-director-dashboard"><ManagingDirectorDashboard /></RouteGuard>} />
                          <Route path="/bookings" element={<RouteGuard path="/bookings" transactional><Bookings /></RouteGuard>} />
                          <Route path="/customers" element={<RouteGuard path="/customers"><Customers /></RouteGuard>} />
                          <Route path="/payments" element={<RouteGuard path="/payments" transactional><Payments /></RouteGuard>} />
                          <Route path="/cash-movement" element={<RouteGuard path="/cash-movement" transactional><CashMovement /></RouteGuard>} />
                          <Route path="/services" element={<RouteGuard path="/services"><Services /></RouteGuard>} />
                          <Route path="/rentals" element={<RouteGuard path="/rentals"><Rentals /></RouteGuard>} />
                          <Route path="/documents" element={<RouteGuard path="/documents"><Documents /></RouteGuard>} />
                          <Route path="/reports" element={<RouteGuard path="/reports"><Reports /></RouteGuard>} />
                          <Route path="/md-transfer" element={<RouteGuard path="/md-transfer" transactional><ManagingDirectorTransfer /></RouteGuard>} />
                          <Route path="/distribution" element={<RouteGuard path="/distribution" transactional><Distribution /></RouteGuard>} />
                          <Route path="/portal" element={<RouteGuard path="/portal"><Portal /></RouteGuard>} />
                          <Route path="/settings" element={<RouteGuard path="/settings"><Settings /></RouteGuard>} />
                          <Route path="/foods" element={<Foods />} />
                          <Route path="/halls/:hallId" element={<Hall />} />
                          <Route path="/admin" element={<RouteGuard path="/admin"><AdminConsole /></RouteGuard>} />
                          <Route path="/messages" element={<RouteGuard path="/messages"><Messages /></RouteGuard>} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                          </Routes>
                        </BrowserRouter>
                      </LanguageProvider>
                    </InventoryProvider>
                  </EventFinanceProvider>
                </PaymentProvider>
              </BookingProvider>
            </MessageProvider>
          </AuthorizationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
