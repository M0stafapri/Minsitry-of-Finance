import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useNotifications } from "@/context/NotificationsContext";
import { employeeAPI, customerAPI, supplierAPI, tripAPI } from "@/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Truck,
  Map,
  Car,
  Award,
  Medal,
  ChevronDown,
  Search
} from "lucide-react";
import { format, subMonths, startOfYear, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { TripDetailsDialog } from "@/features/trips/components/TripDetailsDialog";
import { Link } from "react-router-dom";

function Dashboard() {
  // State for real data from backend
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fallback to localStorage data
  const [localStorageEmployees] = useLocalStorage("employees", []);
  const [localStorageTrips] = useLocalStorage("trips", []);
  const [localStorageSuppliers] = useLocalStorage("suppliers", []);
  const [localStorageCustomers] = useLocalStorage("customers", []);
  
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTargetSectionOpen, setIsTargetSectionOpen] = useState(true);
  
  // استخدام مفتاح userData بدلاً من currentUser للحصول على بيانات المستخدم الحالي
  const [userData, setUserData] = useState(null);
  const { notifyTargetAchievement } = useNotifications();
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  // Filtered suppliers for dashboard search bar
  const dashboardFilteredSuppliers = React.useMemo(() => {
    if (!supplierSearchTerm.trim()) return suppliers;
    const searchLower = supplierSearchTerm.toLowerCase();
    return suppliers.filter((supplier) => {
      // Check all string fields
      const stringMatch = Object.values(supplier).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchLower)
      );
      // Explicitly check institutionalCode as string or number
      const code = supplier.institutionalCode;
      const codeMatch = code !== undefined && code !== null && code.toString().toLowerCase().includes(searchLower);
      return stringMatch || codeMatch;
    });
  }, [suppliers, supplierSearchTerm]);

  // Fetch real data from backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check authentication token
      const authToken = localStorage.getItem('authToken');
      console.log('🔐 Auth token exists:', !!authToken);
      if (authToken) {
        console.log('🔐 Auth token (first 20 chars):', authToken.substring(0, 20) + '...');
      }
      
      // Fetch dashboard stats first (public endpoint - no auth required)
      const dashboardStatsResponse = await employeeAPI.getDashboardStats();
      
      if (dashboardStatsResponse.status === 'success') {
        const stats = dashboardStatsResponse.data.statistics;
        const dashboardEmployees = dashboardStatsResponse.data.employees || [];
        
        setEmployees(dashboardEmployees);
        console.log('✅ Dashboard stats fetched successfully:', {
          totalEmployees: stats.totalEmployees,
          activeEmployees: stats.activeEmployees,
          managerCount: stats.managerCount,
          employeeCount: stats.employeeCount
        });
        console.log('📊 Dashboard employees data:', dashboardEmployees);
      } else {
        console.warn('⚠️ Failed to fetch dashboard stats, using localStorage data');
        setEmployees(localStorageEmployees);
      }
      
      // Fetch other data in parallel (these require authentication)
      const [customersResponse, suppliersResponse, tripsResponse] = await Promise.allSettled([
        customerAPI.getAllCustomers(),
        supplierAPI.getAllSuppliers(),
        tripAPI.getAllTrips()
      ]);
      
      // Handle customers data
      if (customersResponse.status === 'fulfilled' && customersResponse.value.status === 'success') {
        setCustomers(customersResponse.value.data.customers || []);
        console.log('✅ Customers data fetched successfully:', customersResponse.value.data.customers?.length || 0, 'customers');
      } else {
        console.warn('⚠️ Failed to fetch customers from API, using localStorage data');
        console.error('❌ Customers API Error:', customersResponse.reason);
        setCustomers(localStorageCustomers);
      }
      
      // Handle suppliers data
      if (suppliersResponse.status === 'fulfilled' && suppliersResponse.value.status === 'success') {
        setSuppliers(suppliersResponse.value.data.suppliers || []);
        console.log('✅ Suppliers data fetched successfully:', suppliersResponse.value.data.suppliers?.length || 0, 'suppliers');
      } else {
        console.warn('⚠️ Failed to fetch suppliers from API, using localStorage data');
        console.error('❌ Suppliers API Error:', suppliersResponse.reason);
        setSuppliers(localStorageSuppliers);
      }
      
      // Handle trips data
      if (tripsResponse.status === 'fulfilled' && tripsResponse.value.status === 'success') {
        setTrips(tripsResponse.value.data.trips || []);
        console.log('✅ Trips data fetched successfully:', tripsResponse.value.data.trips?.length || 0, 'trips');
      } else {
        console.warn('⚠️ Failed to fetch trips from API, using localStorage data');
        console.error('❌ Trips API Error:', tripsResponse.reason);
        setTrips(localStorageTrips);
      }
      
      console.log('🎉 Dashboard data refresh completed successfully');
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message || 'حدث خطأ أثناء جلب البيانات');
      
      // Fallback to localStorage data
      setEmployees(localStorageEmployees);
      setCustomers(localStorageCustomers);
      setSuppliers(localStorageSuppliers);
      setTrips(localStorageTrips);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // قراءة بيانات المستخدم من localStorage عند تحميل الصفحة
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        console.log('👤 Current user data:', parsedUserData);
      }
    } catch (error) {
      console.error('خطأ في قراءة بيانات المستخدم:', error);
    }
  }, []);

  // Filtrar viajes según الرول المستخدم
  const filteredTrips = React.useMemo(() => {
    // Si el usuario tiene rol "موظف" (empleado), solo mostrar sus propias routes
    if (userData?.role === "employee") {
      return trips.filter(trip => trip.employee === userData.name);
    }
    // Para administradores وآخرين، عرض جميع الرحلات
    return trips;
  }, [trips, userData]);

  // Calculate statistics using real data
  const totalClients = [...new Set(filteredTrips.map(trip => trip.customerName))].length;
  const totalTrips = filteredTrips.length;
  const activeEmployees = employees.filter(emp => emp.status === "active" || emp.status === "نشط").length || employees.length;
  const totalEmployees = employees.length;
  
  // Debug logging for dashboard statistics
  console.log('📈 Dashboard Statistics:', {
    totalClients,
    totalTrips,
    activeEmployees,
    totalEmployees,
    employeesCount: employees.length,
    employeesData: employees,
    filteredTripsCount: filteredTrips.length
  });

  // Current date
  const today = new Date();
  
  // Today's trips
  const todaysTrips = filteredTrips.filter(trip => {
    const tripDate = new Date(trip.date);
    return (
      tripDate.getDate() === today.getDate() &&
      tripDate.getMonth() === today.getMonth() &&
      tripDate.getFullYear() === today.getFullYear()
    );
  });
  const todaysTripsCount = todaysTrips.length;
  
  // Monthly profit (commission) calculation
  const monthlyProfit = React.useMemo(() => {
    // If user is not an employee, return 0
    if (userData?.role !== "employee") return 0;

    // Get current month trips for the employee
    const currentMonthTrips = filteredTrips.filter(trip => {
      const tripDate = new Date(trip.date);
      return (
        tripDate.getMonth() === today.getMonth() &&
        tripDate.getFullYear() === today.getFullYear() &&
        trip.status === "completed" // Only consider completed trips
      );
    });

    // Get employee data
    const employee = employees.find(emp => emp.name === userData.name);
    if (!employee) return 0;

    // Get custom commission settings
    const customCommissions = JSON.parse(localStorage.getItem("customCommissions") || "[]");
    
    // Calculate commissions for each trip based on supplier
    let totalCommissionAmount = 0;
    
    currentMonthTrips.forEach(trip => {
      // Calculate trip commission amount
      const tripCommission = trip.commission !== undefined ? 
        parseFloat(trip.commission) : 
        (parseFloat(trip.tripPrice || 0) - parseFloat(trip.commercialPrice || 0));
      
      // Get supplier ID
      const supplierId = trip.supplierId || trip.supplier;
      
      // Get commission rate based on employee-supplier relationship
      let commissionRate = Number(employee.commission) / 100 || 0; // Default rate
      
      // Check if there's a custom rate for this employee-supplier pair
      if (supplierId && customCommissions.length > 0) {
        const customRate = customCommissions.find(
          comm => String(comm.employeeId) === String(employee.id) && 
                  String(comm.supplierId) === String(supplierId)
        );
        
        if (customRate) {
          commissionRate = Number(customRate.commissionRate) / 100 || 0;
        }
      }
      
      // Add to total commission amount
      const tripCommissionAmount = Math.max(0, tripCommission * commissionRate);
      totalCommissionAmount += tripCommissionAmount;
    });
    
    return totalCommissionAmount;
  }, [filteredTrips, userData, employees, today]);
  
  // Upcoming trips
  const upcomingTrips = filteredTrips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate > today && trip.status === "active";
  });
  const upcomingTripsCount = upcomingTrips.length;

  // Recent activity - use all trips, not filtered trips
  // para que todos المستخدمين يرون نفس البيانات من النشاط الأخير
  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
    
  // Get current month name in Arabic
  const getCurrentMonthName = () => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[new Date().getMonth()];
  };
  
  // Calculate target achievement for all employees for the current month
  const getEmployeeTargetAchievements = () => {
    // Get current month trips
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter only completed trips for the current month
    const currentMonthTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate.getMonth() === currentMonth && 
             tripDate.getFullYear() === currentYear &&
             trip.status === "completed"; // Only consider completed trips
    });
    
    // Calculate commissions for each employee
    const employeeCommissions = {};
    
    currentMonthTrips.forEach(trip => {
      if (trip.employee && trip.commission) {
        const employeeName = trip.employee;
        const commission = parseFloat(trip.commission) || 0;
        
        if (!employeeCommissions[employeeName]) {
          employeeCommissions[employeeName] = 0;
        }
        
        employeeCommissions[employeeName] += commission;
      }
    });
    
    // Get employee targets and calculate achievements
    const achievements = employees
      .filter(emp => emp.role === "employee" || emp.role === "موظف")
      .map(emp => {
        const monthlyCommission = employeeCommissions[emp.name] || 0;
        const target = parseFloat(emp.monthlyTarget) || 0;
        const achievement = target > 0 ? (monthlyCommission / target) * 100 : 0;
        
        return {
          name: emp.name,
          commission: monthlyCommission,
          target: target,
          achievement: Math.min(achievement, 100), // Cap at 100%
          status: achievement >= 100 ? "completed" : achievement >= 80 ? "near" : "behind"
        };
      })
      .sort((a, b) => b.achievement - a.achievement);
    
    return achievements;
  };

  // Get top performing employees
  const getTopEmployees = () => {
    // Get current month and year
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filter trips for current month - use all trips, not just filtered trips
    const currentMonthTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
    });
    
    // Count trips per employee
    const employeeTrips = {};
    
    currentMonthTrips.forEach(trip => {
      if (trip.employee) {
        if (!employeeTrips[trip.employee]) {
          // Find employee name from employees array
          const employee = employees.find(e => e.id?.toString() === trip.employee?.toString() || e.name === trip.employee);
          employeeTrips[trip.employee] = {
            id: trip.employee,
            name: employee ? employee.name : trip.employee,
            count: 0
          };
        }
        employeeTrips[trip.employee].count += 1;
      }
    });
    
    // Convert to array and sort by trip count
    const topEmployees = Object.values(employeeTrips)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
      
    return topEmployees;
  };

  // Get monthly data for charts
  const getMonthlyData = () => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: new Date()
    });

    return months.map(month => {
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate.getMonth() === month.getMonth() && 
               tripDate.getFullYear() === month.getFullYear();
      });

      return {
        month: format(month, 'MMM', { locale: ar }),
        trips: monthTrips.length,
        revenue: monthTrips.reduce((sum, trip) => sum + (parseFloat(trip.tripPrice) || 0), 0)
      };
    });
  };

  // Get yearly commission data
  const getYearlyCommissionData = () => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: new Date()
    });

    return months.map(month => {
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate.getMonth() === month.getMonth() && 
               tripDate.getFullYear() === month.getFullYear() &&
               trip.status === "completed";
      });

      const totalCommission = monthTrips.reduce((sum, trip) => {
        const commission = parseFloat(trip.commission) || 0;
        return sum + commission;
      }, 0);

      return {
        month: format(month, 'MMM', { locale: ar }),
        commission: totalCommission
      };
    });
  };

  // Get supplier chart data
  const getSupplierChartData = () => {
    const supplierTrips = {};
    
    trips.forEach(trip => {
      const supplierName = suppliers.find(s => s.id === Number(trip.supplier))?.name || trip.supplier;
      if (supplierName) {
        supplierTrips[supplierName] = (supplierTrips[supplierName] || 0) + 1;
      }
    });

    return Object.entries(supplierTrips)
      .map(([name, trips]) => ({ name, trips }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);
  };

  // Utility functions
  function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  }

  function AnimatedNumber({ value, duration = 1500, formatter = (val) => val }) {
    const [displayValue, setDisplayValue] = useState(0);
    const requestRef = useRef();
    const startTimeRef = useRef();

    useEffect(() => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
        
        const easeOutQuad = (t) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);
        const currentValue = Math.floor(easedProgress * value);
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestRef.current = requestAnimationFrame(animate);
        }
      };
      
      requestRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }, [value, duration]);

    return <span>{formatter(displayValue)}</span>;
  }

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setIsDetailsDialogOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={fetchDashboardData}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              إعادة المحاولة
            </button>
            {error.includes('تسجيل الدخول') && (
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome message */}
      <div className="bg-indigo-50 rounded-lg p-6 mb-8 border-r-4 border-indigo-500 animate-fadeIn">
        <h2 className="text-2xl font-bold text-indigo-700 mb-1">
          مرحباً {userData?.name ? userData.name.split(' ')[0] : "الموظف"} <span className="text-red-500 text-2xl">❤️</span>
        </h2>
        <p className="text-indigo-600">نتمنى لك يوم سعيد</p>
      </div>
      
      {/* Supplier Search Bar and Results */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن وحدة حسابية (بالكود المؤسسي أو الاسم)"
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={supplierSearchTerm}
            onChange={(e) => setSupplierSearchTerm(e.target.value)}
          />
        </div>
        {supplierSearchTerm.trim() && dashboardFilteredSuppliers.length > 0 && (
          <div className="bg-white rounded shadow p-2 mt-2">
            {dashboardFilteredSuppliers.map((supplier) => (
              <div key={supplier._id || supplier.id} className="flex items-center justify-between border-b last:border-0 py-2 px-2 hover:bg-gray-50">
                <span>
                  {supplier.name} <span className="text-xs text-gray-500">({supplier.institutionalCode})</span>
                </span>
                <Link
                  to={`/suppliers?highlight=${encodeURIComponent(supplier.institutionalCode)}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm ml-2"
                  title="اذهب إلى الكود المؤسسي"
                >
                  الذهاب إلى الكود المؤسسي
                </Link>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Removed: تحقيق التارجت - شهر ... and related stats */}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            لوحة القيادة
          </h1>
          {!localStorage.getItem('authToken') && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ بعض البيانات من التخزين المحلي - يرجى تسجيل الدخول للحصول على جميع البيانات المحدثة
            </p>
          )}
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-all hover:shadow-lg active:shadow-inner"
          onClick={fetchDashboardData}
        >
          <TrendingUp className="ml-2 h-5 w-5" />
          تحديث البيانات
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow transform hover:translate-y-[-2px] transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">إجمالي التوقيعات</h3>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedNumber value={customers.length} />
          </p>
          <p className="text-sm text-gray-500">عدد التوقيعات النشطة</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow transform hover:translate-y-[-2px] transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">إجمالي المستخدمين</h3>
            <UserCheck className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedNumber value={totalEmployees} />
          </p>
          <p className="text-sm text-gray-500">
            <AnimatedNumber value={activeEmployees} /> موظف نشط
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow transform hover:translate-y-[-2px] transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">إجمالي الاكواد المؤسسية</h3>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold">
            <AnimatedNumber value={suppliers.length} />
          </p>
          <p className="text-sm text-gray-500">عدد الاكواد المؤسسية</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Removed: الرحلات في الأشهر الستة الماضية (Trips in the Last Six Months) */}
      </div>

      {/* Statistics and Recent Activity */}
      {/* Removed: النشاط الأخير, توزيع الرحلات حسب الموردين */}

      {/* Removed: الرحلات القادمة */}

      {/* Trip Details Dialog */}
      <TripDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        selectedTrip={selectedTrip}
        suppliers={suppliers}
      />
    </div>
  );
}

export default Dashboard;
