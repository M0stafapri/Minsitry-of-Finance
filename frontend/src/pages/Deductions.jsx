import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useToast } from "@/components/ui/use-toast";
import { useNotifications } from "@/context/NotificationsContext";
import { 
  AlertCircle, 
  Clock, 
  DollarSign, 
  UserX, 
  AlertTriangle, 
  ShieldAlert,
  FileQuestion,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Edit,
  Trash2
} from "lucide-react";

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para obtener solo el día de la semana
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString("ar-EG", { weekday: "long" });
  const dayNumber = date.getDate();
  return `${dayName} ${dayNumber}`;
};

const formatYearMonth = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Fecha inválida en formatYearMonth:", date);
    return "";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const deductionTypes = [
  { id: "absence", label: "غياب", icon: UserX, color: "red" },
  { id: "penalty", label: "جزاء", icon: AlertTriangle, color: "amber" },
  { id: "late", label: "تأخير", icon: Clock, color: "orange" },
  { id: "misconduct", label: "سوء سلوك", icon: ShieldAlert, color: "purple" },
  { id: "partial", label: "حضور جزئي", icon: Clock, color: "blue" },
  { id: "other", label: "أخرى", icon: FileQuestion, color: "gray" }
];

const rewardTypes = [
  { id: "performance", label: "أداء متميز", icon: TrendingDown, color: "green" },
  { id: "overtime", label: "عمل إضافي", icon: Clock, color: "green" },
  { id: "bonus", label: "مكافأة شهرية", icon: DollarSign, color: "green" },
  { id: "other", label: "أخرى", icon: FileQuestion, color: "gray" }
];

// Función para obtener el icono de un tipo de deducción o recompensa
const getTypeIcon = (typeId, transactionType) => {
  try {
    // Determinar qué array usar según el tipo de transacción
    const typesArray = transactionType === "reward" ? rewardTypes : deductionTypes;
    const itemType = typesArray.find(type => type.id === typeId);
    
    if (!itemType) {
      console.error("Tipo no encontrado:", typeId, "para transacción:", transactionType);
      return <FileQuestion className="h-4 w-4 text-gray-500" />;
    }
    
    const IconComponent = itemType.icon;
    const colorClasses = {
      "red": "text-red-500",
      "amber": "text-amber-500",
      "orange": "text-orange-500",
      "purple": "text-purple-500",
      "blue": "text-blue-500",
      "green": "text-green-500",
      "gray": "text-gray-500"
    };
    
    return <IconComponent className={`h-4 w-4 ${colorClasses[itemType.color] || "text-gray-500"}`} />;
  } catch (error) {
    console.error("Error al obtener el icono:", error);
    return <FileQuestion className="h-4 w-4 text-gray-500" />;
  }
};

// Función para obtener el nombre de un tipo de deducción
const getDeductionTypeName = (typeId) => {
  try {
    const deductionType = deductionTypes.find(type => type.id === typeId);
    return deductionType ? deductionType.label : "غير معروف";
  } catch (error) {
    console.error("Error al obtener el nombre del tipo:", error);
    return "غير معروف";
  }
};

// Función para obtener las clases de color para un tipo de deducción
const getDeductionTypeColorClasses = (typeId) => {
  try {
    const deductionType = deductionTypes.find(type => type.id === typeId);
    if (!deductionType) return "border-gray-200 text-gray-700 bg-gray-50";
    
    const colorMap = {
      "red": "border-red-200 text-red-700 bg-red-50",
      "amber": "border-amber-200 text-amber-700 bg-amber-50",
      "orange": "border-orange-200 text-orange-700 bg-orange-50",
      "purple": "border-purple-200 text-purple-700 bg-purple-50",
      "blue": "border-blue-200 text-blue-700 bg-blue-50",
      "gray": "border-gray-200 text-gray-700 bg-gray-50"
    };
    
    return colorMap[deductionType.color] || "border-gray-200 text-gray-700 bg-gray-50";
  } catch (error) {
    console.error("Error al obtener las clases de color:", error);
    return "border-gray-200 text-gray-700 bg-gray-50";
  }
};

export default function Deductions() {
  const [userData, setUserData] = useState(null);
  const [employees, setEmployees] = useLocalStorage("employees", []);
  const [deductions, setDeductions] = useLocalStorage("deductions", []);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [transactionType, setTransactionType] = useState("deduction");
  const [deductionType, setDeductionType] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionReason, setDeductionReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDeduction, setCurrentDeduction] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deductionToDelete, setDeductionToDelete] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  
  // Format date as yyyy-MM-dd
  const formatDate = (date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        if (typeof date === 'string') {
          // Si es un string, intentar convertirlo a fecha
          const dateObj = new Date(date);
          if (!isNaN(dateObj.getTime())) {
            date = dateObj;
          } else {
            console.error("Fecha inválida en formatDate:", date);
            return date; // Devolver el string original si no se puede convertir
          }
        } else {
          console.error("Fecha inválida en formatDate:", date);
          return "";
        }
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error al formatear la fecha:", error);
      return typeof date === 'string' ? date : "";
    }
  };

  // Format date for display
  const formatDateForDisplay = (date, format = 'yyyy-MM-dd') => {
    if (!date) return '';
    
    // Simple implementation for common formats
    if (format === 'yyyy-MM-dd') {
      return formatDate(date);
    } else if (format === 'MMMM yyyy') {
      const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } else if (format === 'EEEE') {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[date.getDay()];
    } else if (format === 'EEEE, d MMMM yyyy') {
      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    return formatDate(date);
  };
  
  // Check if date is in the current month
  const isCurrentMonth = (date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is at or beyond the 3-month limit
  const isThreeMonthsAgo = (date) => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1); // First day of month 3 months ago
    return date <= threeMonthsAgo;
  };
  
  // Navigate to previous month with 3-month limit
  const goToPreviousMonth = () => {
    // Only navigate if not beyond the 3-month limit
    if (!isThreeMonthsAgo(currentMonth)) {
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      setCurrentMonth(prevMonth);
    }
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    
    // Don't allow going beyond current month
    if (nextMonth.getMonth() > today.getMonth() && nextMonth.getFullYear() >= today.getFullYear()) {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      setCurrentMonth(nextMonth);
    }
  };

  // تحميل بيانات المستخدم
  useEffect(() => {
    try {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
        
        // البحث عن سجل الموظف المطابق
        const employeeRecord = employees.find(emp => 
          String(emp.id) === String(parsedUserData.id) || 
          String(emp.userId) === String(parsedUserData.id) ||
          emp.name === parsedUserData.name
        );

        if (employeeRecord) {
          // دمج بيانات المستخدم مع بيانات الموظف
          setUserData({
            ...parsedUserData,
            id: String(employeeRecord.id), // استخدام معرف الموظف بشكل متسق
            employeeId: String(employeeRecord.id),
            name: employeeRecord.name || parsedUserData.name
          });
          console.log("تم العثور على سجل الموظف:", employeeRecord);
        } else {
          console.warn("لم يتم العثور على سجل الموظف في النظام:", parsedUserData);
          // في حالة عدم وجود سجل، نستخدم البيانات الأساسية مع تحويل المعرف إلى نص
          setUserData({
            ...parsedUserData,
            id: String(parsedUserData.id),
            employeeId: String(parsedUserData.id)
          });
        }
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات المستخدم:", error);
    }
  }, [employees]);
  
  // تسجيل بيانات الخصومات للتحقق من المشكلة
  useEffect(() => {
    if (userData) {
      console.log("معرف المستخدم الحالي:", userData.id, typeof userData.id);
      console.log("معرف الموظف الحالي:", userData.employeeId, typeof userData.employeeId);
      
      // التأكد من تحويل جميع المعرفات إلى نصوص عند المقارنة
      const userDeductions = deductions.filter(d => 
        String(d.employeeId) === String(userData.employeeId || userData.id)
      );
      console.log("خصومات المستخدم الحالي:", userDeductions);
    }
  }, [deductions, userData]);
  

  
  // تنسيق الشهر والسنة كسلسلة نصية yyyy-MM
  const formatYearMonth = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  // الحصول على خصومات موظف معين لشهر معين
  const getEmployeeDeductionsForMonth = (employeeId, month) => {
    const monthYearStr = formatYearMonth(month);
    return deductions.filter(deduction => 
      String(deduction.employeeId) === String(employeeId) && 
      deduction.date.startsWith(monthYearStr)
    );
  };
  
  // الحصول على جميع خصومات شهر معين
  const getAllDeductionsForMonth = (month) => {
    const monthYearStr = formatYearMonth(month);
    return deductions.filter(deduction => 
      deduction.date.startsWith(monthYearStr)
    );
  };
  
  // الحصول على إحصائيات خصومات موظف معين لشهر معين
  const getEmployeeDeductionStats = (employeeId, month) => {
    const employeeDeductions = getEmployeeDeductionsForMonth(employeeId, month);
    
    // حساب إجمالي الخصومات
    const totalAmount = employeeDeductions.reduce((sum, deduction) => sum + Number(deduction.amount), 0);
    
    // حساب عدد الخصومات حسب النوع
    const deductionsByType = {};
    deductionTypes.forEach(type => {
      deductionsByType[type.id] = employeeDeductions.filter(d => d.type === type.id).length;
    });
    
    // الحصول على آخر خصم
    const lastDeduction = employeeDeductions.length > 0 
      ? employeeDeductions.sort((a, b) => new Date(b.date) - new Date(a.date))[0] 
      : null;
    
    return {
      count: employeeDeductions.length,
      totalAmount,
      deductionsByType,
      lastDeduction
    };
  };

  // الحصول على الموظفين النشطاء فقط
  const activeEmployees = employees.filter(emp => emp.status === "active");

  // دالة مساعدة لإرسال الإشعارات
  const sendNotification = (employeeId, title, message, isReward = false) => {
    try {
      console.log('Sending notification to employee:', employeeId);
      console.log('Notification data:', { title, message, isReward });

      // تحضير بيانات الإشعار
      const notificationData = {
        type: isReward ? 'reward' : 'deduction',
        icon: isReward ? 'TrendingUp' : 'TrendingDown',
        color: isReward ? 'green' : 'red',
        path: '/deductions',
        timestamp: new Date().toISOString(),
        read: false,
        title,
        message,
        forUser: employeeId
      };

      // إرسال الإشعار
      addNotification(notificationData);
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const addOrUpdateDeduction = () => {
    if (!selectedEmployee || !deductionType || !deductionAmount) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      // البحث عن الموظف في قائمة الموظفين
      const targetEmployee = employees.find(emp => String(emp.id) === String(selectedEmployee));
      if (!targetEmployee) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الموظف",
          variant: "destructive",
        });
        return;
      }

      // تحديد نوع العملية
      const isRewardType = transactionType === "reward";
      const operationType = isRewardType ? "reward" : "deduction";

      if (isEditMode && currentDeduction) {
        // تحديث خصم/مكافأة موجودة
        const updatedDeductions = deductions.map(d => {
          if (d.id === currentDeduction.id) {
            const updatedDeduction = {
              ...d,
              type: deductionType,
              amount: deductionAmount,
              reason: deductionReason,
              employeeId: String(targetEmployee.id),
              employeeName: targetEmployee.name,
              transactionType: operationType,
              updatedAt: new Date().toISOString(),
              updatedBy: userData?.username
            };

            // إرسال إشعار للموظف
            sendNotification(
              targetEmployee.username,
              isRewardType ? "تم تعديل مكافأة" : "تم تعديل خصم",
                                isRewardType 
                    ? `تم تعديل مكافأة ${getTypeName(deductionType, "reward")} بقيمة ${deductionAmount} ج.م` 
                    : `تم تعديل خصم ${getTypeName(deductionType, "deduction")} بقيمة ${deductionAmount} ج.م`,
              isRewardType
            );

            return updatedDeduction;
          }
          return d;
        });

        setDeductions(updatedDeductions);
        toast({
          title: "تم التحديث",
          description: isRewardType 
            ? `تم تحديث مكافأة ${getTypeName(deductionType, "reward")} للموظف ${targetEmployee.name}` 
            : `تم تحديث خصم ${getTypeName(deductionType, "deduction")} للموظف ${targetEmployee.name}`,
        });
      } else {
        // إضافة خصم/مكافأة جديدة
        const newDeduction = {
          id: Date.now().toString(),
          employeeId: String(targetEmployee.id),
          employeeName: targetEmployee.name,
          transactionType: operationType,
          type: deductionType,
          amount: deductionAmount,
          reason: deductionReason,
          date: new Date().toISOString(),
          createdBy: userData?.username,
          createdAt: new Date().toISOString()
        };

        setDeductions([newDeduction, ...deductions]);

        // إرسال إشعار للموظف
        sendNotification(
          targetEmployee.username,
          isRewardType ? "مكافأة جديدة" : "خصم جديد",
          isRewardType 
            ? `تم إضافة مكافأة ${getTypeName(deductionType, "reward")} بقيمة ${deductionAmount} ج.م` 
            : `تم إضافة خصم ${getTypeName(deductionType, "deduction")} بقيمة ${deductionAmount} ج.م`,
          isRewardType
        );

        toast({
          title: "تمت الإضافة",
          description: isRewardType 
            ? `تم إضافة مكافأة ${getTypeName(deductionType, "reward")} للموظف ${targetEmployee.name}` 
            : `تم إضافة خصم ${getTypeName(deductionType, "deduction")} للموظف ${targetEmployee.name}`,
        });
      }

      // إغلاق النافذة وإعادة تعيين النموذج
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error in addOrUpdateDeduction:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const deleteDeduction = () => {
    if (!deductionToDelete) return;

    try {
      // البحث عن الموظف
      const targetEmployee = employees.find(emp => String(emp.id) === String(deductionToDelete.employeeId));
      if (!targetEmployee) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الموظف",
          variant: "destructive",
        });
        return;
      }

      // حذف الخصم/المكافأة
      const updatedDeductions = deductions.filter(d => d.id !== deductionToDelete.id);
      setDeductions(updatedDeductions);

      // تحديد نوع العملية
      const isRewardType = deductionToDelete.transactionType === "reward";

      // إرسال إشعار للموظف
      sendNotification(
        targetEmployee.username,
        isRewardType ? "تم حذف مكافأة" : "تم حذف خصم",
        isRewardType 
          ? `تم حذف مكافأة ${getTypeName(deductionToDelete.type, "reward")} بقيمة ${deductionToDelete.amount} ج.م` 
          : `تم حذف خصم ${getTypeName(deductionToDelete.type, "deduction")} بقيمة ${deductionToDelete.amount} ج.م`,
        isRewardType
      );

      toast({
        title: "تم الحذف",
        description: isRewardType ? "تم حذف المكافأة بنجاح" : "تم حذف الخصم بنجاح",
      });

      setIsDeleteDialogOpen(false);
      setDeductionToDelete(null);
    } catch (error) {
      console.error('Error in deleteDeduction:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف البيانات",
        variant: "destructive",
      });
    }
  };

  // إعداد نموذج التعديل
  const setupEditForm = (deduction) => {
    setCurrentDeduction(deduction);
    setSelectedEmployee(deduction.employeeId);
    // Establecer el tipo de transacción (recompensa/deducción)
    setTransactionType(deduction.transactionType || "deduction");
    setDeductionType(deduction.type);
    setDeductionAmount(deduction.amount);
    setDeductionReason(deduction.reason || "");
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // إعداد نموذج الحذف
  const setupDeleteDialog = (deduction) => {
    setDeductionToDelete(deduction);
    setIsDeleteDialogOpen(true);
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setSelectedEmployee(null);
    setTransactionType("deduction");
    setDeductionType("");
    setDeductionAmount("");
    setDeductionReason("");
    setIsEditMode(false);
    setCurrentDeduction(null);
  };

  // الحصول على خصومات الشهر الحالي
  const currentMonthDeductions = deductions.filter(deduction => {
    const deductionDate = new Date(deduction.date);
    return formatYearMonth(deductionDate) === formatYearMonth(currentMonth);
  });

  // الحصول على أيقونة نوع الخصم
  const getDeductionTypeIcon = (typeId) => {
    const type = deductionTypes.find(t => t.id === typeId);
    if (!type) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    
    const IconComponent = type.icon;
    
    let colorClass = "text-gray-500";
    if (type.color === "red") colorClass = "text-red-500";
    else if (type.color === "amber") colorClass = "text-amber-500";
    else if (type.color === "orange") colorClass = "text-orange-500";
    else if (type.color === "purple") colorClass = "text-purple-500";
    else if (type.color === "blue") colorClass = "text-blue-500";
    
    return <IconComponent className={`h-5 w-5 ${colorClass}`} />;
  };

  // الحصول على اسم نوع الخصم أو المكافأة
  const getTypeName = (typeId, transactionType) => {
    // تحديد أي مصفوفة يجب استخدامها
    const typesArray = transactionType === "reward" ? rewardTypes : deductionTypes;
    return typesArray.find(t => t.id === typeId)?.label || "غير معروف";
  };

  // الحصول على فئة اللون لنوع الخصم أو المكافأة
  const getTypeColorClasses = (typeId, transactionType) => {
    // تحديد أي مصفوفة يجب استخدامها
    const typesArray = transactionType === "reward" ? rewardTypes : deductionTypes;
    const type = typesArray.find(t => t.id === typeId);
    if (!type) return "";
    
    let bgClass = "bg-gray-100";
    let textClass = "text-gray-800";
    
    if (type.color === "red") {
      bgClass = "bg-red-100";
      textClass = "text-red-800";
    } else if (type.color === "amber") {
      bgClass = "bg-amber-100";
      textClass = "text-amber-800";
    } else if (type.color === "orange") {
      bgClass = "bg-orange-100";
      textClass = "text-orange-800";
    } else if (type.color === "purple") {
      bgClass = "bg-purple-100";
      textClass = "text-purple-800";
    } else if (type.color === "blue") {
      bgClass = "bg-blue-100";
      textClass = "text-blue-800";
    }
    
    return `${bgClass} ${textClass}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">سجل المكافآت و الخصومات</h1>
        {/* زر إضافة خصم جديد للمدير والمسؤول */}
        {userData && (userData.role === "admin" || userData.role === "manager") && (
          <Button 
            onClick={() => {
              setIsEditMode(false);
              setSelectedEmployee("");
              setDeductionType("");
              setDeductionAmount("");
              setIsDialogOpen(true);
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <TrendingDown className="h-4 w-4" />
            إضافة مكافأة أو خصم جديد
          </Button>
        )}
      </div>
      
      {/* بطاقة التنقل بين الأشهر */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-center items-center w-full">
            {/* أزرار التنقل بين الأشهر */}
            <div className="flex items-center justify-between w-full max-w-2xl">
              {/* زر الشهر السابق - في أقصى اليمين */}
              <div className="flex flex-col items-center order-1">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const today = new Date();
                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                    if (currentMonth > threeMonthsAgo) {
                      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                      setCurrentMonth(prevMonth);
                    }
                  }}
                  disabled={(() => {
                    const today = new Date();
                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                    return currentMonth <= threeMonthsAgo;
                  })()}
                  className="h-12 w-12 mb-1 rounded-full bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-300 ease-in-out"
                  title="الشهر السابق"
                >
                  <ChevronRight className="h-6 w-6 text-red-600" />
                </Button>
                <span className="text-xs text-gray-500">الشهر السابق</span>
              </div>

              {/* العنوان في المنتصف */}
              <div className="flex flex-col items-center justify-center order-2 flex-grow mx-4">
                <CardTitle className="text-center text-xl text-red-700 flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <span>سجل المكافآت و الخصومات</span>
                </CardTitle>
                <div className="text-2xl font-bold text-gray-800 mt-1 text-center">
                  {(() => {
                    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                    return (
                      <div className="px-4 py-2 bg-gradient-to-r from-red-50 to-green-50 rounded-lg shadow-sm border border-gray-100">
                        {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        {(() => {
                          const today = new Date();
                          return (currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()) ? 
                            <span className="mr-2 text-green-500 text-sm">(الشهر الحالي)</span> : null;
                        })()}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* زر الشهر التالي - في أقصى اليسار */}
              <div className="flex flex-col items-center order-3">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                    if (nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1)) {
                      setCurrentMonth(nextMonth);
                    } else {
                      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    }
                  }}
                  disabled={(() => {
                    const today = new Date();
                    return currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
                  })()}
                  className="h-12 w-12 mb-1 rounded-full bg-red-50 hover:bg-red-100 shadow-sm transition-all duration-300 ease-in-out"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="h-6 w-6 text-red-600" />
                </Button>
                <span className="text-xs text-gray-500">الشهر التالي</span>
              </div>
            </div>

            {/* تم نقل زر إضافة مكافأة أو خصم جديد إلى أعلى الصفحة */}
          </div>
        </CardHeader>
      </Card>



      {userData && (userData.role === "manager" || userData.role === "admin") && (
        <>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]" aria-describedby="deduction-form-description">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "تعديل المكافأة أو الخصم" : "إضافة مكافأة أو خصم جديد"}</DialogTitle>
                <div id="deduction-form-description" className="text-sm text-gray-500">
                  {isEditMode ? "تعديل بيانات المكافأة أو الخصم الحالي" : "إضافة مكافأة أو خصم جديد للموظف"}
                </div>
              </DialogHeader>
              
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employee" className="text-right col-span-1 text-base">
                    الموظف <span className="text-red-500">*</span>
                  </Label>
                  {isEditMode ? (
                    <div className="col-span-3">
                      <div className="h-12 flex items-center px-3 border rounded-md bg-gray-50">
                        {currentDeduction?.employeeName}
                      </div>
                      <input type="hidden" value={selectedEmployee} />
                    </div>
                  ) : (
                  <Select
                    value={selectedEmployee}
                    onValueChange={setSelectedEmployee}
                    className="col-span-3"
                    required
                  >
                    <SelectTrigger id="employee" className="h-12 text-base">
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transactionType" className="text-right col-span-1 text-base">
                    نوع العملية <span className="text-red-500">*</span>
                  </Label>
                  {isEditMode ? (
                    // En modo edición, mostrar un campo de solo lectura
                    <div className="col-span-3">
                      <div className="h-12 flex items-center px-3 border rounded-md bg-gray-50">
                        <Badge variant="outline" className={transactionType === "reward" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                          {transactionType === "reward" ? "مكافأة" : "خصم"}
                        </Badge>
                      </div>
                      <input type="hidden" value={transactionType} />
                    </div>
                  ) : (
                    // En modo creación, permitir seleccionar
                    <Select
                      value={transactionType}
                      onValueChange={setTransactionType}
                      className="col-span-3"
                      required
                    >
                      <SelectTrigger id="transactionType" className="h-12 text-base">
                        <SelectValue placeholder="اختر نوع العملية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deduction">خصم</SelectItem>
                        <SelectItem value="reward">مكافأة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right col-span-1 text-base">
                    السبب <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={deductionType}
                    onValueChange={setDeductionType}
                    className="col-span-3"
                    required
                  >
                    <SelectTrigger id="type" className="h-12 text-base">
                      <SelectValue placeholder={transactionType === "reward" ? "اختر سبب المكافأة" : "اختر سبب الخصم"} />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionType === "reward" ? (
                        // Opciones para recompensas
                        <>
                          <SelectItem value="performance">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-green-500" />
                              <span>أداء متميز</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="overtime">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span>عمل إضافي</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bonus">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-500" />
                              <span>مكافأة شهرية</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="other">
                            <div className="flex items-center gap-2">
                              <FileQuestion className="h-4 w-4 text-gray-500" />
                              <span>أخرى</span>
                            </div>
                          </SelectItem>
                        </>
                      ) : (
                        // Opciones para deducciones
                        deductionTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <type.icon className={`h-4 w-4 text-${type.color}-500`} />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right col-span-1 text-base">
                    القيمة <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    className="col-span-3 h-12 text-base"
                    placeholder={transactionType === "reward" ? "أدخل قيمة المكافأة" : "أدخل قيمة الخصم"}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right col-span-1 text-base pt-2">
                    ملاحظات
                  </Label>
                  <Textarea
                    id="notes"
                    value={deductionReason}
                    onChange={(e) => setDeductionReason(e.target.value)}
                    className="col-span-3 min-h-[100px] text-base"
                    placeholder={transactionType === "reward" ? "أدخل ملاحظات عن المكافأة (اختياري)" : "أدخل ملاحظات عن الخصم (اختياري)"}
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6 flex justify-center">
                <Button 
                  type="submit" 
                  onClick={addOrUpdateDeduction}
                  style={{
                    height: "48px",
                    fontSize: "1rem",
                    padding: "0 2rem",
                    minWidth: "160px",
                    backgroundColor: transactionType === "reward" ? "#16a34a" : "#dc2626",
                    color: "white"
                  }}
                  className="font-medium hover:opacity-90 transition-opacity"
                >
                  {isEditMode ? 
                    "حفظ التغييرات" : 
                    (transactionType === "reward" ? 
                      "إضافة المكافأة" : 
                      "إضافة الخصم")
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]" aria-describedby="deduction-delete-description">
              <DialogHeader>
                <DialogTitle className={deductionToDelete?.transactionType === "reward" ? "text-green-600" : "text-red-600"}>
                  {deductionToDelete?.transactionType === "reward" ? "تأكيد حذف المكافأة" : "تأكيد حذف الخصم"}
                </DialogTitle>
                <div id="deduction-delete-description" className="text-sm text-gray-500">
                  هل أنت متأكد من حذف {deductionToDelete?.transactionType === "reward" ? "المكافأة" : "الخصم"}؟
                </div>
              </DialogHeader>
              
              {deductionToDelete && (
                <div className="py-4 border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">الموظف:</span>
                    <span>{deductionToDelete.employeeName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">النوع:</span>
                    <span>
                      <Badge variant="outline" className={deductionToDelete.transactionType === "reward" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                        {deductionToDelete.transactionType === "reward" ? "مكافأة" : "خصم"}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">السبب:</span>
                    <span>{getTypeName(deductionToDelete.type, deductionToDelete.transactionType || "deduction")}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">القيمة:</span>
                    <span className={deductionToDelete.transactionType === "reward" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {deductionToDelete.transactionType === "reward" ? "+" : "-"}{deductionToDelete.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">التاريخ:</span>
                    <span>{formatDate(deductionToDelete.date)}</span>
                  </div>
                </div>
              )}
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>إلغاء</Button>
                <Button variant="destructive" onClick={deleteDeduction}>تأكيد الحذف</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* عرض جميع الخصومات للمديرين فقط */}
      {userData && (userData.role === "manager" || userData.role === "admin") && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  المكافآت و الخصومات {(() => {
                    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                    return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
                  })()}
                </CardTitle>
                <CardDescription>
                  قائمة بجميع المكافآت و الخصومات المسجلة للموظفين خلال الشهر الحالي
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg border border-red-100 shadow-sm overflow-hidden flex items-center hover:border-red-200 transition-colors">
                  <div className="px-3 py-2 bg-red-50 border-r border-red-100 text-red-600 text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline-block"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z"></path><path d="m21 21-4.3-4.3"></path></svg>
                    فلترة
                  </div>
                  <div className="flex items-center gap-2 px-3">
                    {/* Filtro de tipo de transacción */}
                    <div className="relative">
                      <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                        <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0 text-gray-700">
                          <SelectValue placeholder="جميع المعاملات" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-red-100">
                          <SelectItem value="all" className="hover:bg-red-50 hover:text-red-700">جميع المعاملات</SelectItem>
                          <SelectItem value="reward" className="hover:bg-green-50 hover:text-green-700">المكافآت فقط</SelectItem>
                          <SelectItem value="deduction" className="hover:bg-red-50 hover:text-red-700">الخصومات فقط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de empleados */}
                    <div className="relative">
                      <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0 text-gray-700">
                          <SelectValue placeholder="جميع الموظفين" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-red-100">
                          <SelectItem value="all" className="hover:bg-red-50 hover:text-red-700">جميع الموظفين</SelectItem>
                          {activeEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id} className="hover:bg-red-50 hover:text-red-700">
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    // Toggle entre ordenación ascendente y descendente
                    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                    setSortOrder(newSortOrder);
                    console.log("Ordenar por fecha:", newSortOrder);
                  }}
                  className="bg-white rounded-full p-2 border border-red-100 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  {sortOrder === 'asc' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path><path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="m3 16 4 4 4-4"></path><path d="M7 20V4"></path><path d="m21 8-4-4-4 4"></path><path d="M17 4v16"></path></svg>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentMonthDeductions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">لا توجد مكافآت و خصومات</h3>
                <p className="mt-2">لم يتم تسجيل أي مكافآت أو خصومات للموظفين خلال الشهر الحالي</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>

                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>السبب</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Filtrar deducciones por empleado y tipo de transacción
                      let filteredDeductions = currentMonthDeductions;
                      
                      // Filtrar por empleado si es necesario
                      if (filterEmployee !== "all") {
                        filteredDeductions = filteredDeductions.filter(deduction => 
                          String(deduction.employeeId) === String(filterEmployee)
                        );
                      }
                      
                      // Filtrar por tipo de transacción si es necesario
                      if (transactionTypeFilter !== "all") {
                        filteredDeductions = filteredDeductions.filter(deduction => {
                          if (transactionTypeFilter === "reward") {
                            return deduction.transactionType === "reward";
                          } else if (transactionTypeFilter === "deduction") {
                            // Incluir tanto las deducciones explícitas como las antiguas que no tienen transactionType
                            return deduction.transactionType === "deduction" || !deduction.transactionType;
                          }
                          return true;
                        });
                      }
                      
                      // Agrupar las deducciones por fecha
                      const deductionsByDate = {};
                      filteredDeductions.forEach(deduction => {
                        const dateKey = deduction.date.substring(0, 10); // YYYY-MM-DD
                        if (!deductionsByDate[dateKey]) {
                          deductionsByDate[dateKey] = [];
                        }
                        deductionsByDate[dateKey].push(deduction);
                      });
                      
                      // Ordenar las fechas según el sortOrder
                      const sortedDates = Object.keys(deductionsByDate).sort((a, b) => {
                        const dateA = new Date(a);
                        const dateB = new Date(b);
                        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
                      });
                      // Generar las filas de la tabla agrupadas por fecha
                      return sortedDates.map((dateKey, dateIndex) => {
                        const deductions = deductionsByDate[dateKey];
                        return (
                          <React.Fragment key={dateKey}>
                            {/* Encabezado de fecha */}
                            <TableRow>
                              <TableCell colSpan={7} className="py-3 px-4 bg-gradient-to-r from-red-50 to-red-100 border-y border-red-200">
                                <div className="flex items-center justify-center">
                                  <div className="bg-white px-4 py-1.5 rounded-full border border-red-200 shadow-sm flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-red-500" />
                                    <span className="font-medium text-red-700">{getDayOfWeek(dateKey)}</span>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <div className="flex items-center gap-2">
                                      {/* Contador de deducciones */}
                                      {deductions.filter(d => d.transactionType === "deduction" || !d.transactionType).length > 0 && (
                                        <span className="text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">
                                          {deductions.filter(d => d.transactionType === "deduction" || !d.transactionType).length} خصومات
                                        </span>
                                      )}
                                      
                                      {/* Contador de recompensas */}
                                      {deductions.filter(d => d.transactionType === "reward").length > 0 && (
                                        <span style={{backgroundColor: "#16a34a"}} className="text-sm text-white px-2 py-0.5 rounded-full">
                                          {deductions.filter(d => d.transactionType === "reward").length} مكافآت
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Filas de deducciones para esta fecha */}
                            {deductions.map((deduction) => (
                              <TableRow key={deduction.id}>
                                <TableCell className="font-medium">{deduction.employeeName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={deduction.transactionType === "reward" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                    {deduction.transactionType === "reward" ? "مكافأة" : "خصم"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTypeIcon(deduction.type, deduction.transactionType)}
                                    <Badge variant="outline" className={getTypeColorClasses(deduction.type, deduction.transactionType)}>
                                      {getTypeName(deduction.type, deduction.transactionType)}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className={`font-bold ${deduction.transactionType === "reward" ? "text-green-600" : "text-red-600"}`}>
                                  {deduction.transactionType === "reward" ? 
                                    <span>+{deduction.amount} ج.م</span> : 
                                    <span>-{deduction.amount} ج.م</span>
                                  }
                                </TableCell>
                                <TableCell className="max-w-xs truncate">{deduction.reason || "—"}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                      onClick={() => setupEditForm(deduction)}
                                      title={deduction.transactionType === "reward" ? "تعديل المكافأة" : "تعديل الخصم"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                        <path d="m15 5 4 4"></path>
                                      </svg>
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-100"
                                      onClick={() => setupDeleteDialog(deduction)}
                                      title={deduction.transactionType === "reward" ? "حذف المكافأة" : "حذف الخصم"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                      </svg>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Solo se muestra la sección de deducciones para el empleado si es un empleado regular */}
      {userData && userData.role === "employee" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <span>المكافآت و الخصومات الخاصة بك</span>
            </CardTitle>
            <CardDescription>
              قائمة بجميع المكافآت و الخصومات المسجلة لك - {(() => {
                const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filtrar deducciones por mes actual y empleado
              const monthYearStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
              const employeeDeductions = deductions.filter(deduction => 
                String(deduction.employeeId) === String(userData.id) && 
                deduction.date.startsWith(monthYearStr)
              );
              
              if (employeeDeductions.length === 0) {
                return (
                  <div className="text-center py-10 text-gray-500">
                    <div className="flex justify-center mb-4">
                      <TrendingDown className="h-12 w-12 mx-1 text-red-400" />
                      <DollarSign className="h-12 w-12 mx-1 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium">لا توجد مكافآت أو خصومات</h3>
                    <p className="mt-2">لم يتم تسجيل أي مكافآت أو خصومات لك في هذا الشهر</p>
                  </div>
                );
              }
              
              // Calcular estadísticas para las deducciones del mes
              const totalAmount = employeeDeductions.reduce((sum, deduction) => sum + Number(deduction.amount), 0);
              
              // Contar deducciones por tipo
              const deductionsByType = {};
              deductionTypes.forEach(type => {
                deductionsByType[type.id] = employeeDeductions.filter(d => d.type === type.id).length;
              });
              
              return (
                <div className="overflow-x-auto">
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-green-50 border border-gray-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      <h3 className="font-medium text-gray-800">
                        ملخص المكافآت و الخصومات لشهر {(() => {
                          const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                          return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
                        })()} 
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* إحصائيات خصومات الموظف */}
                      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600">عدد المعاملات</div>
                        <div className="flex justify-between items-center mt-1">
                          <div>
                            <span className="text-sm text-green-600 mr-1">مكافآت:</span>
                            <span className="text-lg font-bold text-green-600">
                              {employeeDeductions.filter(d => d.transactionType === "reward").length}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-red-600 mr-1">خصومات:</span>
                            <span className="text-lg font-bold text-red-600">
                              {employeeDeductions.filter(d => d.transactionType === "deduction" || !d.transactionType).length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600">إجمالي المبالغ</div>
                        <div className="flex justify-between items-center mt-1">
                          <div>
                            <span className="text-sm text-green-600 mr-1">مكافآت:</span>
                            <span className="text-lg font-bold text-green-600">
                              {employeeDeductions.filter(d => d.transactionType === "reward").reduce((sum, d) => sum + Number(d.amount), 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-red-600 mr-1">خصومات:</span>
                            <span className="text-lg font-bold text-red-600">
                              {employeeDeductions.filter(d => d.transactionType === "deduction" || !d.transactionType).reduce((sum, d) => sum + Number(d.amount), 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600">أسباب الخصومات</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-red-600">غياب:</span>
                            <span className="font-bold text-red-600">{deductionsByType.absence || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-red-600">تأخير:</span>
                            <span className="font-bold text-red-600">{deductionsByType.late || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600">أسباب المكافآت</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-600">أداء متميز:</span>
                            <span className="font-bold text-green-600">
                              {employeeDeductions.filter(d => d.transactionType === "reward" && d.type === "performance").length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-600">عمل إضافي:</span>
                            <span className="font-bold text-green-600">
                              {employeeDeductions.filter(d => d.transactionType === "reward" && d.type === "overtime").length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النوع</TableHead>
                        <TableHead>السبب</TableHead>
                        <TableHead>القيمة</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeDeductions
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((deduction) => (
                        <TableRow key={deduction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {deduction.transactionType === "reward" ? 
                                <DollarSign className="h-4 w-4 text-green-500" /> : 
                                <TrendingDown className="h-4 w-4 text-red-500" />}
                              <Badge variant="outline" className={deduction.transactionType === "reward" ? "border-green-200 text-green-700 bg-green-50" : "border-red-200 text-red-700 bg-red-50"}>
                                {deduction.transactionType === "reward" ? "مكافأة" : "خصم"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {deduction.transactionType === "reward" ? 
                                getTypeIcon(deduction.type, "reward") : 
                                getTypeIcon(deduction.type, "deduction")}
                              <span className="text-sm">
                                {deduction.transactionType === "reward" ? 
                                  getTypeName(deduction.type, "reward") : 
                                  getTypeName(deduction.type, "deduction")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 truncate">{deduction.reason || "—"}</div>
                          </TableCell>
                          <TableCell className={`font-bold ${deduction.transactionType === "reward" ? "text-green-600" : "text-red-600"}`}>
                            {deduction.amount} ج.م
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(deduction.date)}</div>
                            <div className="text-xs text-gray-500">{getDayOfWeek(deduction.date)}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
