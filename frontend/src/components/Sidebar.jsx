const navigation = [
  // ... existing navigation items ...
  {
    name: "الرواتب",
    href: "/salaries",
    icon: DollarSign,
    roles: ["manager", "admin"] // Only visible to managers and admins
  },
  // ... existing code ...
]; 

const menuItems = [
  {
    title: "لوحة التحكم",
    href: "/",
    icon: LayoutDashboard,
    permission: { resource: "dashboard", action: "view" }
  },
  {
    title: "الأكواد المؤسسية",
    href: "/suppliers",
    icon: Users,
    permission: { resource: "suppliers", action: "view" }
  },
  {
    title: "الرواتب",
    href: "/salaries",
    icon: Wallet,
    permission: { resource: "salaries", action: "view" },
    hideForEmployee: true
  },
  {
    title: "العمولات",
    href: "/commissions",
    icon: CircleDollarSign,
    permission: { resource: "commissions", action: "view" },
    hideForEmployee: true
  },
  {
    title: "التقارير",
    href: "/reports",
    icon: FileBarChart,
    permission: { resource: "reports", action: "view" }
  },
  {
    title: "الإعدادات",
    href: "/settings",
    icon: Settings,
    permission: { resource: "settings", action: "view" }
  }
];

{menuItems.map((item, index) => {
  const isActive = pathname === item.href;
  
  // التحقق من صلاحيات المستخدم ودوره
  const hasPermission = checkPermission(item.permission);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.role || 'employee';
  
  // إخفاء العنصر إذا كان المستخدم لا يملك الدور المطلوب
  if (!hasPermission || (item.roles && !item.roles.includes(userRole))) {
    return null;
  }

  return (
    <Link
      key={index}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
        isActive ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : ""
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
})} 