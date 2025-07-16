import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from "@/context/NotificationsContext";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Suppliers from "@/pages/Suppliers";
import Customers from "@/pages/Customers";
import Trips from "@/pages/Trips";
import CompletedTrips from "@/pages/CompletedTrips";
import InProgressTrips from "@/pages/InProgressTrips";
import CancelledTrips from "@/pages/CancelledTrips";
import TripsCalendar from "@/pages/TripsCalendar";
import Invoices from "@/pages/Invoices";
import Quotations from "@/pages/Quotations";
import CreateQuotation from "@/pages/CreateQuotation";
import EditQuotation from "@/pages/EditQuotation";
import Settlement from "@/pages/Settlement";
import Attendance from "@/pages/Attendance";
import Deductions from "@/pages/Deductions";
import Salaries from "@/pages/Salaries";
import CommissionSettings from "@/pages/CommissionSettings";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import Layout from "@/components/Layout";
import CreateInvoice from "@/pages/CreateInvoice";
import EditInvoice from "@/pages/EditInvoice";

// مكون للتحقق من تسجيل الدخول والصلاحيات
const AuthRoute = ({ children, requiredRoles = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userDataString = localStorage.getItem('userData');
        if (!userDataString) {
          return { authenticated: false, hasPermission: false };
        }
        
        const userData = JSON.parse(userDataString);
        if (!userData || !userData.id) {
          return { authenticated: false, hasPermission: false };
        }

        // التحقق من الصلاحيات إذا كانت مطلوبة
        if (requiredRoles.length > 0) {
          const hasRole = requiredRoles.includes(userData.role);
          return { authenticated: true, hasPermission: hasRole };
        }

        // منع الموظفين من الوصول لصفحة الموظفين
        if (location.pathname === '/employees' && userData.role === 'موظف') {
          return { authenticated: true, hasPermission: false };
        }
        
        return { authenticated: true, hasPermission: true };
      } catch (error) {
        console.error('Error checking authentication:', error);
        return { authenticated: false, hasPermission: false };
      }
    };

    const { authenticated, hasPermission: permission } = checkAuth();
    setIsAuthenticated(authenticated);
    setHasPermission(permission);
    setLoading(false);
    
    if (!authenticated && location.pathname !== '/login') {
      navigate('/login', { replace: true, state: { from: location } });
    } else if (authenticated && !permission) {
      navigate('/', { replace: true });
    }
  }, [navigate, location, requiredRoles]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  return isAuthenticated && hasPermission ? children : null;
};

// مكون لتغليف المسارات المحمية بالتخطيط
const ProtectedLayout = () => {
  return (
    <AuthRoute>
      <Layout>
        <Outlet />
      </Layout>
    </AuthRoute>
  );
};

function App() {
  // Always fetch customers on app start for notifications
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await import('./api/index.js').then(mod => mod.customerAPI.getAllCustomers());
        if (response && response.status === 'success' && response.data && response.data.customers) {
          localStorage.setItem('customers', JSON.stringify(response.data.customers));
        }
      } catch (e) {
        // Ignore errors
      }
    };
    fetchCustomers();
  }, []);
  return (
    <NotificationsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            <Route 
              path="/employees" 
              element={
                <AuthRoute requiredRoles={['مدير']}>
                  <Employees />
                </AuthRoute>
              } 
            />

            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/completed" element={<CompletedTrips />} />
            <Route path="/trips/in-progress" element={<InProgressTrips />} />
            <Route path="/trips/cancelled" element={<CancelledTrips />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/create" element={<CreateInvoice />} />
            <Route path="/invoices/edit/:id" element={<EditInvoice />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/quotations/create" element={<CreateQuotation />} />
            <Route path="/quotations/edit/:id" element={<EditQuotation />} />
            <Route path="/settlement" element={<Settlement />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/deductions" element={<Deductions />} />
            
            <Route 
              path="/salaries" 
              element={
                <AuthRoute requiredRoles={["مدير"]}>
                  <Salaries />
                </AuthRoute>
              } 
            />
            
            <Route 
              path="/commission-settings" 
              element={
                <AuthRoute requiredRoles={["مدير"]}>
                  <CommissionSettings />
                </AuthRoute>
              } 
            />
            
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </NotificationsProvider>
  );
}

export default App;
