import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/context/NotificationsContext";
import { 
  DollarSign, 
  Users, 
  Calculator,
  Clock,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  XCircle
} from "lucide-react";
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
import { format, subMonths, startOfYear, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from 'xlsx';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Salaries() {
  const [userData, setUserData] = useState(null);
  const [employees, setEmployees] = useLocalStorage("employees", []);
  const [attendance, setAttendance] = useLocalStorage("attendance", []);
  const [deductions, setDeductions] = useLocalStorage("deductions", []);
  const [trips, setTrips] = useLocalStorage("trips", []);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [customCommissions] = useLocalStorage("customCommissions", []);

  // تحميل بيانات المستخدم
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // التحقق من صلاحيات المستخدم
  const checkPermission = () => {
    try {
      const storedUserData = localStorage.getItem("userData");
      if (!storedUserData) return false;
      
      const userData = JSON.parse(storedUserData);
      return userData && (userData.role === "مدير");
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  if (!checkPermission()) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">غير مصرح</CardTitle>
            <CardDescription>
              عذراً، لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة.
              هذه الصفحة متاحة للمدراء فقط.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // الحصول على الموظفين النشطاء فقط
  const activeEmployees = employees.filter(emp => emp.status === "active");

  // تنسيق التاريخ كسلسلة نصية YYYY-MM
  const formatYearMonth = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // حساب إجمالي الخصومات للموظف في شهر معين
  const calculateDeductions = (employeeId, month) => {
    const monthStr = formatYearMonth(month);
    return deductions
      .filter(d => 
        String(d.employeeId) === String(employeeId) && 
        d.date.startsWith(monthStr) &&
        (d.transactionType === "deduction" || !d.transactionType)
      )
      .reduce((total, d) => total + Number(d.amount), 0);
  };

  // حساب إجمالي المكافآت للموظف في شهر معين
  const calculateRewards = (employeeId, month) => {
    const monthStr = formatYearMonth(month);
    return deductions
      .filter(d => 
        String(d.employeeId) === String(employeeId) && 
        d.date.startsWith(monthStr) &&
        d.transactionType === "reward"
      )
      .reduce((total, d) => total + Number(d.amount), 0);
  };

  // حساب إجمالي عمولات الرحلات للموظف في شهر معين
  const calculateTripCommissions = (employeeName, month) => {
    const monthStr = formatYearMonth(month);
    // Only consider completed trips
    const employeeTrips = trips.filter(trip => 
      trip.employee === employeeName && 
      trip.date.startsWith(monthStr) &&
      trip.status === "completed" // Only completed trips
    );

    return employeeTrips.reduce((total, trip) => {
      const commission = trip.commission !== undefined ? 
        parseFloat(trip.commission) : 
        (parseFloat(trip.tripPrice || 0) - parseFloat(trip.commercialPrice || 0));
      return total + (commission || 0);
    }, 0);
  };

  // حساب أيام الحضور والغياب للموظف في شهر معين
  const calculateAttendance = (employeeId, month) => {
    const monthStr = formatYearMonth(month);
    const employeeAttendance = attendance.filter(a => 
      String(a.employeeId) === String(employeeId) && 
      a.date.startsWith(monthStr)
    );

    return {
      present: employeeAttendance.filter(a => a.checkIn && a.checkOut).length,
      partial: employeeAttendance.filter(a => a.checkIn && !a.checkOut).length,
      absent: 22 - employeeAttendance.length // افتراض 22 يوم عمل في الشهر
    };
  };

  // حساب الراتب النهائي للموظف
  const calculateFinalSalary = (employee) => {
    const baseSalary = Number(employee.salary) || 0;
    const deductionsTotal = calculateDeductions(employee.id, selectedMonth);
    const rewardsTotal = calculateRewards(employee.id, selectedMonth);
    
    // Get employee's trips for calculating commissions
    const monthStr = formatYearMonth(selectedMonth);
    const employeeTrips = trips.filter(trip => 
      trip.employee === employee.name && 
      trip.date.startsWith(monthStr) &&
      trip.status === "completed" // Only completed trips
    );
    
    // Calculate commissions for each trip based on supplier
    let totalCommissionAmount = 0;
    
    employeeTrips.forEach(trip => {
      // Calculate trip commission amount
      const tripCommission = trip.commission !== undefined ? 
        parseFloat(trip.commission) : 
        (parseFloat(trip.tripPrice || 0) - parseFloat(trip.commercialPrice || 0));
      
      // Get supplier ID
      const supplierId = trip.supplierId || trip.supplier;
      
      // Get commission rate based on employee-supplier relationship
      let commissionRate = Number(employee.commission) / 100 || 0; // Default rate
      
      // Check if there's a custom rate for this employee-supplier pair
      if (supplierId && customCommissions) {
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
    
    const totalCommissions = employeeTrips.reduce((total, trip) => {
      const commission = trip.commission !== undefined ? 
        parseFloat(trip.commission) : 
        (parseFloat(trip.tripPrice || 0) - parseFloat(trip.commercialPrice || 0));
      return total + (commission || 0);
    }, 0);
    
    const attendance = calculateAttendance(employee.id, selectedMonth);
    
    // Calculate final salary
    const finalSalary = baseSalary + totalCommissionAmount + rewardsTotal - deductionsTotal;
    
    return {
      baseSalary,
      deductions: deductionsTotal,
      rewards: rewardsTotal,
      totalCommissions,
      finalSalary: Math.max(0, finalSalary)
    };
  };

  // حساب ما إذا كان الموظف قد حقق التارجت أم لا
  const hasMetTarget = (employee, month) => {
    const totalCommissions = calculateTripCommissions(employee.name, month);
    const baseSalary = Number(employee.salary) || 0;
    return totalCommissions >= baseSalary;
  };

  // تنسيق المبلغ كعملة
  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('ar-EG', {
      style: 'decimal'
    }).format(amount);
    return `${formatted} ج.م`;
  };

  // Generate commission data for all months in current year
  const getYearlyCommissionData = () => {
    const data = [];
    const monthNames = [
      "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Create data for each month from January to current month
    for (let month = 0; month <= currentMonth; month++) {
      // Filter trips for the month and only include completed trips
      const monthTrips = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate.getMonth() === month && 
               tripDate.getFullYear() === currentYear &&
               trip.status === "completed";
      });
      
      // Calculate total commissions for the month
      const totalCommissions = monthTrips.reduce((sum, trip) => {
        const commission = trip.commission !== undefined ? 
          parseFloat(trip.commission) : 
          (parseFloat(trip.tripPrice || 0) - parseFloat(trip.commercialPrice || 0));
        return sum + (commission || 0);
      }, 0);

      // Calculate total salaries for the month
      const totalSalaries = activeEmployees.reduce((total, emp) => {
        const salary = calculateFinalSalary(emp);
        return total + salary.finalSalary;
      }, 0);

      // Calculate profit (total commissions - total salaries)
      const profit = totalCommissions - totalSalaries;
      
      data.push({
        name: monthNames[month],
        month: month,
        commission: Math.max(0, profit), // Ensure profit is never negative
        date: format(new Date(currentYear, month), 'yyyy-MM'),
        completedTrips: monthTrips.length
      });
    }
    
    return data;
  };

  const yearlyCommissionData = getYearlyCommissionData();

  // تصدير البيانات إلى ملف Excel
  const exportToExcel = () => {
    try {
      // تجهيز البيانات للتصدير
      const exportData = activeEmployees.map(employee => {
        const salary = calculateFinalSalary(employee);
        const attendance = calculateAttendance(employee.id, selectedMonth);
        const metTarget = hasMetTarget(employee, selectedMonth);
        
        return {
          "اسم الموظف": employee.name,
          "الراتب الأساسي": salary.baseSalary,
          "أيام الحضور الكامل": attendance.present,
          "أيام الحضور الجزئي": attendance.partial,
          "أيام الغياب": attendance.absent,
          "الخصومات": salary.deductions,
          "المكافآت": salary.rewards,
          "إجمالي العمولات": salary.totalCommissions,
          "تحقيق التارجت": metTarget ? "نعم" : "لا",
          "صافي الراتب": salary.finalSalary
        };
      });

      // إنشاء ملف Excel
      const ws = XLSX.utils.json_to_sheet(exportData, { origin: 'A1' });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الرواتب");

      // تحديد عرض الأعمدة
      const colWidths = [
        { wch: 20 }, // اسم الموظف
        { wch: 15 }, // الراتب الأساسي
        { wch: 15 }, // أيام الحضور الكامل
        { wch: 15 }, // أيام الحضور الجزئي
        { wch: 12 }, // أيام الغياب
        { wch: 12 }, // الخصومات
        { wch: 12 }, // المكافآت
        { wch: 15 }, // إجمالي العمولات
        { wch: 12 }, // تحقيق التارجت
        { wch: 15 }, // صافي الراتب
      ];
      ws['!cols'] = colWidths;

      // تصدير الملف
      const monthName = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long' }).format(selectedMonth);
      XLSX.writeFile(wb, `رواتب_${monthName}.xlsx`);

      // إظهار رسالة نجاح
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير بيانات الرواتب لشهر ${monthName}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">حساب الرواتب</h1>
        <div className="flex items-center gap-4">
          <Select
            value={formatYearMonth(selectedMonth)}
            onValueChange={(value) => {
              const [year, month] = value.split('-');
              setSelectedMonth(new Date(year, month - 1));
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="اختر الشهر" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = formatYearMonth(date);
                const label = new Intl.DateTimeFormat('ar-EG', { 
                  year: 'numeric',
                  month: 'long'
                }).format(date);
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={exportToExcel}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            تصدير كملف Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                activeEmployees.reduce((total, emp) => total + calculateFinalSalary(emp).finalSalary, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموظفين النشطاء</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeEmployees.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                activeEmployees.reduce((total, emp) => total + calculateTripCommissions(emp.name, selectedMonth), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(
                Math.max(0,
                  activeEmployees.reduce((total, emp) => total + calculateTripCommissions(emp.name, selectedMonth), 0) -
                  activeEmployees.reduce((total, emp) => total + calculateFinalSalary(emp).finalSalary, 0)
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>كشف الرواتب</CardTitle>
          <CardDescription>
            تفاصيل رواتب الموظفين لشهر {new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long' }).format(selectedMonth)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الراتب الأساسي</TableHead>
                  <TableHead>أيام الحضور</TableHead>
                  <TableHead>الخصومات</TableHead>
                  <TableHead>المكافآت</TableHead>
                  <TableHead>إجمالي العمولات</TableHead>
                  <TableHead>تحقيق التارجت</TableHead>
                  <TableHead>صافي الراتب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((employee) => {
                  const salary = calculateFinalSalary(employee);
                  const attendance = calculateAttendance(employee.id, selectedMonth);
                  const metTarget = hasMetTarget(employee, selectedMonth);
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            كامل: {attendance.present}
                          </Badge>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            جزئي: {attendance.partial}
                          </Badge>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            غياب: {attendance.absent}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(salary.deductions)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(salary.rewards)}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {formatCurrency(salary.totalCommissions)}
                      </TableCell>
                      <TableCell>
                        {metTarget ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>تم تحقيق التارجت</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span>لم يتم تحقيق التارجت</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(salary.finalSalary)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Company Profit Chart - Full Width */}
      <div className="bg-white p-6 rounded-lg shadow mb-8 hover:shadow-md transition-all w-full">
        <div className="flex items-center mb-4">
          <DollarSign className="h-6 w-6 text-indigo-500 ml-2" />
          <h2 className="text-xl font-bold">اتجاه الأرباح</h2>
        </div>
        <p className="text-gray-500 mb-4">اتجاه الأرباح الشهرية للرحلات المكتملة في سنة {new Date().getFullYear()}</p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlyCommissionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "commission") {
                    return [formatCurrency(value), "صافي الربح"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label, data) => {
                  const currentData = data[0]?.payload;
                  return `شهر: ${label} (${currentData?.completedTrips || 0} رحلة مكتملة)`;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="commission" 
                stroke="#4f46e5" 
                fillOpacity={1} 
                fill="url(#colorCommission)" 
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 