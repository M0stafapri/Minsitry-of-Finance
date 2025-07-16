import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useNotifications } from "@/context/NotificationsContext";
import {
  LayoutDashboard,
  Users,
  User,
  Truck,
  Map,
  FileText,
  Quote,
  Calculator,
  Menu,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Shield,
  Bell,
  DollarSign,
  Percent,
  TrendingDown,
  FolderOpen,
  UserCog,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "@/styles/custom-scrollbar.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarItems = [
  { icon: LayoutDashboard, label: "لوحة القيادة", path: "/" },
  { 
    icon: Users, 
    label: "المستخدمين", 
    path: "/employees",
    roles: ["مدير"]
  },
  { icon: Truck, label: "الاكواد المؤسسية", path: "/suppliers" },
  { icon: User, label: "ادارة التوقيعات", path: "/customers" },
  /*{
    icon: Map,
    label: "الرحلات",
    path: "/trips",
    submenu: [
      { icon: Map, label: "جميع الرحلات", path: "/trips" },
      { icon: CheckCircle2, label: "الرحلات المكتملة", path: "/trips/completed" },
      { icon: Clock, label: "رحلات قيد التنفيذ", path: "/trips/in-progress" },
      { icon: XCircle, label: "الرحلات الملغاة", path: "/trips/cancelled" }
    ]
  },
  {
    icon: FolderOpen,
    label: "إدارة المستندات",
    path: "/documents",
    submenu: [
  { icon: FileText, label: "الفواتير", path: "/invoices" },
      { icon: Quote, label: "عروض الأسعار", path: "/quotations" }
    ]
  },
  {
    icon: UserCog,
    label: "إدارة الموارد البشرية",
    path: "/hr",
    submenu: [
  { icon: Clock, label: "الحضور والانصراف", path: "/attendance" },
      { icon: Percent, label: "المكافآت و الخصومات", path: "/deductions" },
      { icon: DollarSign, label: "الرواتب", path: "/salaries", roles: ["مدير"] },
      { icon: Percent, label: "تحديد العمولات", path: "/commission-settings", roles: ["مدير"] }
    ]
  },
  { icon: Calculator, label: "التسويات المالية", path: "/settlement" }*/
];

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { notifications, unreadCount, markAsRead, markAllAsRead, formatRelativeTime, navigateToNotificationPage } = useNotifications();
  
  // Filter notifications for the current user
  const userNotifications = React.useMemo(() => {
    if (!localStorage.getItem('userData')) return [];
    
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('Filtering notifications for user:', userData);
    
    return notifications.filter(notification => {
      // Direct notification to user
      const isDirectNotification = notification.forUser === userData.username;
      
      // Group notification
      const isInGroupNotification = notification.forUsers && 
        Array.isArray(notification.forUsers) && 
        notification.forUsers.includes(userData.username);
      
      // Role-based notification
      const isRoleNotification = notification.forRoles &&
        Array.isArray(notification.forRoles) &&
        notification.forRoles.includes(userData.role);
      
      // Public notification
      const isPublicNotification = !notification.forUser && 
        !notification.forUsers && 
        !notification.forRoles;
      
      const shouldSeeNotification = isDirectNotification || 
        isInGroupNotification || 
        isRoleNotification || 
        isPublicNotification;
    
      console.log(`Notification ${notification.id}: Direct=${isDirectNotification}, Group=${isInGroupNotification}, Role=${isRoleNotification}, Public=${isPublicNotification}, Show=${shouldSeeNotification}`);
      
      return shouldSeeNotification;
    });
  }, [notifications]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const [openSubmenu, setOpenSubmenu] = React.useState(null);

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const renderMenuItem = (item) => {
    // التحقق من صلاحيات المستخدم
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRole = userData.role || 'employee';
    
    // إذا كان العنصر يتطلب أدواراً محددة، تحقق من دور المستخدم
    if (item.roles && !item.roles.includes(userRole)) {
      return null;
    }

    // التحقق من الأدوار في العناصر الفرعية أيضاً
    if (item.submenu) {
      // تصفية العناصر الفرعية بناءً على الأدوار
      const filteredSubmenu = item.submenu.filter(subItem => 
        !subItem.roles || subItem.roles.includes(userRole)
      );
      
      // إذا كانت كل العناصر الفرعية محظورة، لا تعرض القائمة الرئيسية
      if (filteredSubmenu.length === 0) {
        return null;
      }
      
      // تحديث العناصر الفرعية بالقائمة المصفاة
      item = { ...item, submenu: filteredSubmenu };
    }

    if (item.submenu) {
      const isOpen = openSubmenu === item.label;
      const isActive = location.pathname === item.path || item.submenu.some(subItem => location.pathname === subItem.path);
      
      return (
        <div key={item.label} className="relative">
          <div 
            onClick={() => toggleSubmenu(item.label)}
            className={cn(
              "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
              isActive && "bg-primary/10 text-primary border-r-4 border-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: isSidebarOpen ? 1 : 0 }}
              className="mr-4 flex-1"
            >
              {item.label}
            </motion.span>
            <motion.div
              initial={false}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
          
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-gray-50 dark:bg-gray-700"
            >
              {item.submenu.map((subItem) => (
                <Link
                  key={subItem.path}
                  to={subItem.path}
                  className={cn(
                    "flex items-center py-2 pr-12 pl-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600",
                    location.pathname === subItem.path && "bg-primary/5 text-primary"
                  )}
                >
                  <subItem.icon className="ml-2 h-4 w-4" />
                  <span>{subItem.label}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
          location.pathname === item.path &&
            "bg-primary/10 text-primary border-r-4 border-primary"
        )}
      >
        <item.icon className="h-5 w-5" />
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: isSidebarOpen ? 1 : 0 }}
          className="mr-4"
        >
          {item.label}
        </motion.span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile Menu Button */}
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg"
          >
            <div className="p-4">
              <h1 className="text-xl font-bold text-primary mb-6">
              وزارة المالية سلطة التصديق الالكتروني
              </h1>
              <nav className="space-y-2">
                {sidebarItems.map(renderMenuItem)}
              </nav>
            </div>
          </motion.div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {isSidebarOpen && (
        <motion.aside
          initial={{ width: 0 }}
          animate={{ width: "16rem" }}
          exit={{ width: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed h-screen bg-white dark:bg-gray-800 shadow-lg hidden lg:flex flex-col overflow-hidden"
        >
        <div className="p-4 flex justify-between items-center shrink-0">
      
          <motion.h1
            initial={{ opacity: 1 }}
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="text-xl font-bold text-primary"
          >
            <br></br>
         وزارة المالية
         <br></br>
          سلطةالتصديق الالكتروني
          </motion.h1>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <nav className="mt-8 pb-4">
            {sidebarItems.map(renderMenuItem)}
          </nav>
        </div>
      </motion.aside>
      )}

      {/* Menu Button for Large Screens */}
      <div className="fixed top-0 right-0 z-50 hidden lg:flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full items-center px-6 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 absolute top-1 right-1 z-50"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center justify-between w-full">
          <img 
            src="/assets/img/logo.png" 
            alt="Ministry of Finance Logo" 
            className="h-24 w-24 mr-4 mt-8 rounded-full border-4 border-primary bg-white shadow-2xl drop-shadow-xl transition-transform duration-300 hover:scale-105" 
            style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)' }}
          />
          <div className="flex items-center space-x-4">
            <div className="text-right ml-4">
              {localStorage.getItem('userData') && (
                <div>
                  <p className="font-medium">
                    {JSON.parse(localStorage.getItem('userData'))?.name || 'المستخدم'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {JSON.parse(localStorage.getItem('userData'))?.role === 'مدير' ? 'مدير' : 
                     JSON.parse(localStorage.getItem('userData'))?.role === 'موظف' ? 'موظف' : 
                     JSON.parse(localStorage.getItem('userData'))?.role || 'موظف'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Notifications Icon */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-sm font-medium">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
                      تعليم الكل كمقروء
                    </Button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((notification) => {
                      // Determine icon based on notification type
                      let Icon = CheckCircle2;
                      let iconBgColor = 'bg-green-100';
                      let iconColor = 'text-green-600';
                      let textColor = '';
                      
                      if (notification.icon === 'DollarSign') {
                        Icon = DollarSign;
                        iconBgColor = 'bg-amber-100';
                        iconColor = 'text-amber-600';
                      } else if (notification.icon === 'Map') {
                        Icon = Map;
                        iconBgColor = 'bg-blue-100';
                        iconColor = 'text-blue-600';
                      } else if (notification.icon === 'TrendingDown') {
                        Icon = TrendingDown;
                        iconBgColor = 'bg-red-100';
                        iconColor = 'text-red-600';
                        textColor = 'text-red-600';
                      }
                      
                      return (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                          onClick={() => {
                            const path = navigateToNotificationPage(notification);
                            navigate(path);
                          }}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 ml-2">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgColor} ${iconColor}`}>
                                <Icon className="h-4 w-4" />
                              </span>
                            </div>
                            <div>
                              <h4 className={`text-sm font-medium ${textColor}`}>
                                {notification.title || (notification.type === 'certificate_expiry' ? 'تنبيه بانتهاء الشهادة' : 'إشعار')}
                              </h4>
                              <p className={`text-xs ${textColor || 'text-gray-500 dark:text-gray-400'}`}>
                                {notification.message || (notification.type === 'certificate_expiry' ? `ستنتهي صلاحية شهادة العميل ${notification.customerName || ''} بتاريخ ${notification.expiryDate ? new Date(notification.expiryDate).toLocaleDateString('ar-EG') : ''}` : '')}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{
  notification.createdAt ?
    new Date(notification.createdAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) : ''
}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>لا توجد إشعارات حالياً</p>
                    </div>
                  )}
                </div>
                {userNotifications.length > 0 && (
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700 text-center">
                    <Link to="#" className="text-xs text-primary hover:underline">عرض كل الإشعارات</Link>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    {JSON.parse(localStorage.getItem('userData'))?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">الملف الشخصي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // إزالة بيانات المستخدم والتوكن
                  localStorage.removeItem('userData');
                  localStorage.removeItem('authToken');
                  // استخدام React Router للتنقل بدلاً من window.location.href
                  navigate('/login');
                }}>
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 p-4 lg:p-8",
          isSidebarOpen ? "lg:mr-64" : "lg:mr-0",
          "mt-16 lg:mt-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
