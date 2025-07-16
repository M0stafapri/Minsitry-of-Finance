import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useNotifications } from "@/context/NotificationsContext";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, X, AlertTriangle, Plus, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// Important: No test data used - all actual data comes from localStorage

export default function Attendance() {
  const [userData, setUserData] = useState(null);
  const [attendance, setAttendance] = useLocalStorage("attendance", []);
  const [employees, setEmployees] = useLocalStorage("employees", []);
  const [holidays, setHolidays] = useLocalStorage("holidays", []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [cairoDateTime, setCairoDateTime] = useState(null);
  
  // State for holiday management
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: "",
    description: ""
  });
  const [selectedHolidayToDelete, setSelectedHolidayToDelete] = useState(null);
  const [isDeleteHolidayDialogOpen, setIsDeleteHolidayDialogOpen] = useState(false);
  
  // Fetch Cairo time from WorldTime API
  const fetchCairoTime = async () => {
    try {
      const response = await fetch('http://worldtimeapi.org/api/timezone/Africa/Cairo');
      const data = await response.json();
      return new Date(data.datetime);
    } catch (error) {
      console.error('Error fetching Cairo time:', error);
      return new Date(); // Fallback to local time if API fails
    }
  };

  // Update Cairo time every minute
  useEffect(() => {
    const updateCairoTime = async () => {
      const time = await fetchCairoTime();
      setCairoDateTime(time);
    };

    // Initial fetch
    updateCairoTime();

    // Update every minute
    const interval = setInterval(updateCairoTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // Get current time in Cairo timezone
  const getCairoTime = () => {
    if (!cairoDateTime) {
      return new Date(); // Fallback to local time if API time not available yet
    }

    // Calculate the time difference since the last API update
    const timeSinceUpdate = Date.now() - cairoDateTime.getTime();
    const currentCairoTime = new Date(cairoDateTime.getTime() + timeSinceUpdate);
    
    return currentCairoTime;
  };
  
  // We're using actual data only from localStorage
  // No test data is used anywhere in the application
  
  // Create notification for check-in
  const notifyCheckIn = (employeeName, employeeId, time) => {
    try {
      // تحضير بيانات الإشعار المشتركة
      const notificationBaseData = {
      type: 'attendance-check-in',
      icon: 'Clock',
      color: 'blue',
        path: '/attendance',
        date: new Date().toISOString(),
        read: false
      };

      // إشعار للموظف نفسه
      addNotification({
        ...notificationBaseData,
        userId: String(employeeId),
        forUser: String(employeeId),
        title: 'تسجيل الحضور',
        message: `تم تسجيل حضورك اليوم في الساعة ${time}`
      });

      // إشعار للمدراء والمسؤولين
      const managers = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
      const managerIds = managers.map(manager => String(manager.id));

      if (managerIds.length > 0) {
          addNotification({
            ...notificationBaseData,
          forUsers: managerIds,
            title: 'تسجيل حضور موظف',
            message: `قام الموظف ${employeeName} بتسجيل الحضور في الساعة ${time}`
          });
        }

      console.log(`تم إرسال إشعارات الحضور للموظف ${employeeName} والمدراء`);
    } catch (error) {
      console.error('خطأ في إرسال إشعارات الحضور:', error);
    }
  };
  
  // Create notification for check-out
  const notifyCheckOut = (employeeName, employeeId, time) => {
    try {
      // تحضير بيانات الإشعار المشتركة
      const notificationBaseData = {
      type: 'attendance-check-out',
      icon: 'CheckCircle2',
      color: 'green',
        path: '/attendance',
        date: new Date().toISOString(),
        read: false
      };

      // إشعار للموظف نفسه
      addNotification({
        ...notificationBaseData,
        userId: String(employeeId),
        forUser: String(employeeId),
        title: 'تسجيل الانصراف',
        message: `تم تسجيل انصرافك اليوم في الساعة ${time}`
      });

      // إشعار للمدراء والمسؤولين
      const managers = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
      const managerIds = managers.map(manager => String(manager.id));

      if (managerIds.length > 0) {
          addNotification({
            ...notificationBaseData,
          forUsers: managerIds,
            title: 'تسجيل انصراف موظف',
            message: `قام الموظف ${employeeName} بتسجيل الانصراف في الساعة ${time}`
          });
        }

      console.log(`تم إرسال إشعارات الانصراف للموظف ${employeeName} والمدراء`);
    } catch (error) {
      console.error('خطأ في إرسال إشعارات الانصراف:', error);
    }
  };

  // Load user data and employee data
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        
        // Find the corresponding employee record
        const employeeRecord = employees.find(emp => 
          String(emp.id) === String(parsedUserData.id) || 
          String(emp.userId) === String(parsedUserData.id) ||
          emp.name === parsedUserData.name
        );
        
        if (employeeRecord) {
          // Merge user data with employee data
          setUserData({
            ...parsedUserData,
            id: String(employeeRecord.id), // Use employee ID consistently
            employeeId: String(employeeRecord.id),
            name: employeeRecord.name || parsedUserData.name
          });
          console.log("Found employee record:", employeeRecord);
        } else {
          console.warn("Employee record not found in system:", parsedUserData);
          // If no record exists, use base data with string ID
          setUserData({
            ...parsedUserData,
            id: String(parsedUserData.id),
            employeeId: String(parsedUserData.id)
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [employees]);

  // Filter employees based on user role
  const filteredEmployees = React.useMemo(() => {
    if (!userData) return [];
    
    // Managers and admins can see active employees only
    if (userData.role === "manager" || userData.role === "admin") {
      return employees
        .filter(emp => emp.status === "active") // Only show active employees
        .map(emp => ({
          ...emp,
          id: String(emp.id) // Ensure ID is string
        }));
    }
    
    // Regular employees can only see their own data
    const userId = String(userData.employeeId || userData.id);
    return employees
      .filter(emp => String(emp.id) === userId)
      .map(emp => ({
        ...emp,
        id: String(emp.id) // Ensure ID is string
      }));
  }, [employees, userData]);

  // Get days in current month
  const daysInMonth = React.useMemo(() => {
    const cairoTime = new Date(getCairoTime());
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    // Create array with all days of the month
    const days = [];
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  // Format date as yyyy-MM-dd
  const formatDate = (date) => {
    const cairoTime = getCairoTime();
    // If the input date is today, use Cairo time
    if (
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear()
    ) {
      date = cairoTime;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date as yyyy-MM
  const formatYearMonth = (date) => {
    // If date is already a Date object in Cairo time, use it directly
    // Otherwise, convert it to Cairo time
    const cairoDate = date instanceof Date ? date : new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const year = cairoDate.getFullYear();
    const month = String(cairoDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Format time as HH:mm:ss
  const formatTime = () => {
    const date = getCairoTime();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  };

  // Convert 24-hour time string to 12-hour format
  const convertTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    
    // Remove any existing period text if present
    timeStr = timeStr.replace(/صباحاً|مساءً/g, '').trim();
    
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'مساءً' : 'صباحاً';
    const displayHour = hours % 12 || 12; // Convert 0 to 12
    
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
  };

  // Calculate hours between two time strings
  const calculateHoursBetween = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    // Split time strings into hours and minutes
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);
    
    // Create Date objects for comparison using Cairo time
    const cairoTime = getCairoTime();
    const startDate = new Date(cairoTime);
    startDate.setHours(inHours, inMinutes, 0);
    
    const endDate = new Date(cairoTime);
    endDate.setHours(outHours, outMinutes, 0);
    
    // If checkout is before checkin (shouldn't happen), return 0
    if (endDate < startDate) return 0;
    
    // Calculate difference in milliseconds and convert to hours
    const diffInMilliseconds = endDate - startDate;
    const hours = diffInMilliseconds / (1000 * 60 * 60);
    
    // Round to 2 decimal places for more accurate comparison
    return Math.round(hours * 100) / 100;
  };

  // Determine if attendance is complete or partial based on hours
  const getAttendanceType = (checkIn, checkOut) => {
    const hours = calculateHoursBetween(checkIn, checkOut);
    if (hours >= 7) return 'complete';
    if (hours >= 1) return 'partial';
    return 'invalid';
  };

  // Check if date is today
  const isToday = (date) => {
    const cairoTime = getCairoTime();
    const cairoDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    return cairoDate.getDate() === cairoTime.getDate() &&
           cairoDate.getMonth() === cairoTime.getMonth() &&
           cairoDate.getFullYear() === cairoTime.getFullYear();
  };
  
  // Check if date is in the future
  const isFuture = (date) => {
    const cairoTime = getCairoTime();
    const cairoDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    cairoTime.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    cairoDate.setHours(0, 0, 0, 0);
    return cairoDate > cairoTime;
  };
  
  // Check if a date is at or beyond the 3-month limit
  const isThreeMonthsAgo = (date) => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1); // First day of month 3 months ago
    return date <= threeMonthsAgo;
  };
  
  // Check if date is in the current month
  const isCurrentMonth = (date) => {
    const cairoTime = getCairoTime();
    const cairoDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    return cairoDate.getMonth() === cairoTime.getMonth() && 
           cairoDate.getFullYear() === cairoTime.getFullYear();
  };
  
  // Check if current time is before 5:00 PM
  const isBeforeFivePM = () => {
    const cairoTime = getCairoTime();
    return cairoTime.getHours() < 17; // 17 is 5:00 PM in 24-hour format
  };
  
  // Navigate to previous month with 3-month limit
  const goToPreviousMonth = () => {
    // Only navigate if not beyond the 3-month limit
    if (!isThreeMonthsAgo(currentMonth)) {
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      setCurrentMonth(prevMonth);
    }
    // Button will be disabled at the 3-month limit, so no need for a message
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

  // Check if date is Friday
  const isFriday = (date) => {
    return date.getDay() === 5; // 5 is Friday (0 is Sunday, 6 is Saturday)
  };

  // Check if date is a holiday
  const isHoliday = (date) => {
    const dateStr = formatDate(date);
    return holidays.some(holiday => holiday.date === dateStr);
  };

  // Get holiday name for a specific date
  const getHolidayName = (date) => {
    const dateStr = formatDate(date);
    const holiday = holidays.find(holiday => holiday.date === dateStr);
    return holiday ? holiday.name : null;
  };

  // Check if date is a non-working day (Friday or holiday)
  const isNonWorkingDay = (date) => {
    return isFriday(date) || isHoliday(date);
  };

  // Add new holiday
  const handleAddHoliday = () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى إدخال التاريخ واسم الإجازة",
        variant: "destructive",
      });
      return;
    }

    // Check if holiday already exists
    const existingHoliday = holidays.find(holiday => holiday.date === newHoliday.date);
    if (existingHoliday) {
      toast({
        title: "الإجازة موجودة مسبقاً",
        description: `يوجد إجازة بالفعل في التاريخ ${newHoliday.date}`,
        variant: "destructive",
      });
      return;
    }

    const holidayToAdd = {
      id: Date.now().toString(),
      date: newHoliday.date,
      name: newHoliday.name.trim(),
      description: newHoliday.description.trim(),
      createdAt: new Date().toISOString()
    };

    setHolidays([...holidays, holidayToAdd]);
    setNewHoliday({ date: "", name: "", description: "" });
    setIsHolidayDialogOpen(false);

    toast({
      title: "تم إضافة الإجازة بنجاح",
      description: `تم إضافة إجازة "${holidayToAdd.name}" في ${holidayToAdd.date}`,
    });
  };

  // Delete holiday
  const handleDeleteHoliday = (holiday) => {
    setSelectedHolidayToDelete(holiday);
    setIsDeleteHolidayDialogOpen(true);
  };

  const confirmDeleteHoliday = () => {
    if (selectedHolidayToDelete) {
      const updatedHolidays = holidays.filter(holiday => holiday.id !== selectedHolidayToDelete.id);
      setHolidays(updatedHolidays);
      setSelectedHolidayToDelete(null);
      setIsDeleteHolidayDialogOpen(false);

      toast({
        title: "تم حذف الإجازة بنجاح",
        description: `تم حذف إجازة "${selectedHolidayToDelete.name}"`,
      });
    }
  };

  // Get holidays for current month
  const getCurrentMonthHolidays = () => {
    const monthYear = formatYearMonth(currentMonth);
    return holidays.filter(holiday => holiday.date.startsWith(monthYear));
  };

  // Format date for display
  const formatDateForDisplay = (date, formatStr) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    if (formatStr === 'EEEE, d MMMM yyyy') {
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } else if (formatStr === 'MMMM yyyy') {
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } else if (formatStr === 'EEEE') {
      return days[date.getDay()];
    } else if (formatStr === 'd MMMM') {
      return `${date.getDate()} ${months[date.getMonth()]}`;
    }
    
    return formatDate(date);
  };

  // Get all days in a month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = [];
    
    // Get the number of days in the month
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Generate an array of date objects for each day in the month
    for (let day = 1; day <= lastDay; day++) {
      daysInMonth.push(new Date(year, month, day));
    }
    
    return daysInMonth;
  };
  
  // Critical change: Ensuring we have a single source of truth for attendance records
  
  // Get all attendance records for an employee in the current month
  // This ensures consistent data between employee and manager views
  const getEmployeeAttendance = (employeeId) => {
    const monthYear = formatYearMonth(currentMonth);
    // Convert employeeId to string for consistent comparison
    const empId = String(employeeId);
    
    // Log for debugging
    console.log(`Getting monthly attendance for employee ${empId}`);
    
    const records = attendance.filter(record => {
      const recordEmployeeId = String(record.employeeId);
      return recordEmployeeId === empId && record.date.startsWith(monthYear);
    });

    // Log for debugging
    console.log(`Found ${records.length} records for employee ${empId}`);
    
    return records;
  };

  // Get monthly attendance summary for an employee
  const getMonthlyAttendanceSummary = (employeeId) => {
    // Convert employeeId to string for consistent comparison
    const empId = String(employeeId);
    
    // Get days in current month
    const daysInCurrentMonth = getDaysInMonth(currentMonth);
    const workDays = daysInCurrentMonth.filter(day => !isNonWorkingDay(day) && !isFuture(day)).length;
    
    // Initialize counters
    let completeDays = 0;
    let partialDays = 0;
    let absentDays = 0;
    
    // For each day in the month that's not in the future
    daysInCurrentMonth.filter(day => !isFuture(day)).forEach(day => {
      // Skip non-working days (Fridays and holidays)
      if (isNonWorkingDay(day)) return;
      
      // Get attendance record for this day
      const record = getAttendanceForDate(empId, day);
      
      // Determine status based on raw record data and attendance rules
      if (record?.checkIn && record?.checkOut) {
        const attendanceType = getAttendanceType(record.checkIn, record.checkOut);
        if (attendanceType === 'complete') {
          completeDays++;
        } else if (attendanceType === 'partial') {
          partialDays++;
        } else {
          // Invalid attendance (less than 1 hour) counts as absent
          absentDays++;
        }
      } else if (record?.checkIn) {
        partialDays++;
      } else {
        absentDays++;
      }
    });
    
    const attendedDays = completeDays + partialDays;
    const attendanceRate = workDays > 0 ? Math.round((completeDays / workDays) * 100) : 0;
    
    return {
      workDays,
      completeDays,
      partialDays,
      attendedDays,
      absentDays,
      attendanceRate
    };
  };

  // Get attendance records for an employee
  const getAttendanceForDate = (employeeId, date) => {
    const dateStr = formatDate(date);
    // Convert employeeId to string for consistent comparison
    const empId = String(employeeId);
    
    // Log for debugging
    console.log(`Searching attendance for employee ${empId} on date ${dateStr}`);
    
    const record = attendance.find(record => {
      const recordEmployeeId = String(record.employeeId);
      const match = recordEmployeeId === empId && record.date === dateStr;
      
      // Log for debugging
      if (match) {
        console.log(`Found record:`, record);
      }
      
      return match;
    });
    
    return record;
  };

  // State for warning dialog
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

  // Handle check out with warning
  const handleCheckOutWithWarning = () => {
    if (!userData) return;
    
    const cairoTime = getCairoTime();
    const today = new Date(cairoTime);
    const dateStr = formatDate(today);
    
    // استخدام المعرف الصحيح للموظف
    const employeeId = String(userData.employeeId || userData.id);
    const employeeName = userData.name;
    
    // Check if already checked in today
    const existingRecord = attendance.find(record => 
      String(record.employeeId) === employeeId && 
      record.date === dateStr
    );
    
    if (!existingRecord || !existingRecord.checkIn) {
      toast({
        title: "لم يتم تسجيل الحضور",
        description: "يجب تسجيل الحضور أولاً قبل تسجيل الانصراف",
        variant: "destructive",
      });
      return;
    }
    
    if (existingRecord.checkOut) {
      toast({
        title: "تم تسجيل الانصراف مسبقاً",
        description: `لقد قمت بتسجيل انصرافك اليوم في الساعة ${existingRecord.checkOut}`,
        variant: "destructive",
      });
      return;
    }

    // If before 5 PM, show warning dialog
    if (isBeforeFivePM()) {
      setIsWarningDialogOpen(true);
    } else {
      // After 5 PM, proceed directly
      processCheckOut();
    }
  };

  // Process the actual check out
  const processCheckOut = () => {
    const cairoTime = getCairoTime();
    const today = new Date(cairoTime);
    const dateStr = formatDate(today);
    const timeStr = formatTime();
    
    // استخدام المعرف الصحيح للموظف
    const employeeId = String(userData.employeeId || userData.id);
    const employeeName = userData.name;
    
    // Update record with check out time
    const updatedAttendance = attendance.map(record => 
      String(record.employeeId) === employeeId && record.date === dateStr
        ? { ...record, checkOut: timeStr }
        : record
    );
    
    setAttendance(updatedAttendance);
    
    // Send notifications
    notifyCheckOut(employeeName, employeeId, timeStr);
    
    toast({
      title: "تم تسجيل الانصراف بنجاح",
      description: `تم تسجيل انصرافك في الساعة ${timeStr}`,
    });

    // Close warning dialog if open
    setIsWarningDialogOpen(false);
  };

  // Handle check in
  const handleCheckIn = () => {
    if (!userData) return;
    
    const cairoTime = getCairoTime();
    const today = new Date(cairoTime);
    const dateStr = formatDate(today);
    const timeStr = formatTime();
    
    // استخدام المعرف الصحيح للموظف
    const employeeId = String(userData.employeeId || userData.id);
    const employeeName = userData.name;
    
    // Check if already checked in today
    const existingRecord = attendance.find(record => 
      String(record.employeeId) === employeeId && 
      record.date === dateStr
    );
    
    if (existingRecord && existingRecord.checkIn) {
      toast({
        title: "تم تسجيل الحضور مسبقاً",
        description: `لقد قمت بتسجيل حضورك اليوم في الساعة ${convertTo12Hour(existingRecord.checkIn)}`,
        variant: "destructive",
      });
      return;
    }
    
    // Create new record or update existing
    if (existingRecord) {
      const updatedAttendance = attendance.map(record => 
        String(record.employeeId) === employeeId && record.date === dateStr
          ? { ...record, checkIn: timeStr }
          : record
      );
      setAttendance(updatedAttendance);
    } else {
      const newRecord = {
        id: Date.now().toString(),
        employeeId: employeeId,
        employeeName: employeeName,
        date: dateStr,
        checkIn: timeStr,
            checkOut: null
      };
      setAttendance([...attendance, newRecord]);
      }
    
    // Send notifications
    notifyCheckIn(employeeName, employeeId, convertTo12Hour(timeStr));
    
    toast({
      title: "تم تسجيل الحضور بنجاح",
      description: `تم تسجيل حضورك في الساعة ${convertTo12Hour(timeStr)}`,
    });
  };
  
  // Determine attendance status for a specific day
  const getAttendanceStatus = (employeeId, date) => {
    // Skip for future days or non-working days
    if (isFuture(date) || isNonWorkingDay(date)) {
      return null;
    }
    
    const dateStr = formatDate(date);
    const record = attendance.find(rec => 
      rec.employeeId === employeeId && 
      rec.date === dateStr
    );
    
    if (!record || !record.checkIn) {
      // If no check-in record exists and the date is in the past, count as absence
      if (date < new Date()) {
        return 'absent';
      }
      return null; // For today, don't mark as absent yet
    } else if (record.checkIn && !record.checkOut) {
      return 'partial';
    } else if (record.checkIn && record.checkOut) {
      return 'complete';
    }
    
    return null;
  };
  
  // Calculate attendance statistics
  const getAttendanceStats = (employeeId) => {
    // Get all days this month up to today (excluding future days and non-working days)
    const today = new Date();
    const daysInMonth = getDaysInMonth(currentMonth);
    const pastDaysThisMonth = daysInMonth.filter(day => 
      !isFuture(day) && !isNonWorkingDay(day) && day <= today
    );
    const workDays = pastDaysThisMonth.length;
    
    // Initialize counters
    let completeDays = 0;
    let partialDays = 0;
    let absentDays = 0;
    
    // Get all attendance records for this employee this month
    const monthYearStr = formatYearMonth(currentMonth);
    const employeeRecords = attendance.filter(record => 
      record.employeeId === employeeId && 
      record.date.startsWith(monthYearStr)
    );
    
    // Count each day's status
    pastDaysThisMonth.forEach(day => {
      const dateStr = formatDate(day);
      const record = employeeRecords.find(rec => rec.date === dateStr);
      
      if (!record || !record.checkIn) {
        absentDays++;
      } else if (record.checkIn && record.checkOut) {
        // Check if the duration is 6 hours or more
        const duration = calculateHoursBetween(record.checkIn, record.checkOut);
        if (duration >= 6) {
          completeDays++;
        } else {
          partialDays++;
        }
      } else {
        partialDays++;
      }
    });
    
    const attendedDays = completeDays + partialDays;
    const attendanceRate = workDays > 0 ? Math.round((attendedDays / workDays) * 100) : 0;
    
    return {
      workDays,
      completeDays,
      partialDays,
      attendedDays,
      absentDays,
      attendanceRate
    };
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">سجل الحضور والانصراف</h1>
      
      {/* Today's attendance card for current employee */}
      {userData && userData.role === "employee" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>تسجيل الحضور والانصراف - اليوم</CardTitle>
            <CardDescription>
              {formatDateForDisplay(new Date(), 'EEEE, d MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="text-center md:text-right">
                <h3 className="text-lg font-medium mb-2">مرحباً {userData.name}</h3>
                <p className="text-gray-500">قم بتسجيل حضورك وانصرافك لليوم</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isToday(new Date()) && !isNonWorkingDay(new Date()) ? (
                  <>
                    <Button 
                      onClick={handleCheckIn}
                      className="flex items-center gap-2"
                      variant="default"
                      disabled={getAttendanceForDate(userData.id, new Date())?.checkIn}
                    >
                      <Clock className="h-4 w-4" />
                      تسجيل الحضور
                    </Button>
                    <Button 
                      onClick={handleCheckOutWithWarning}
                      className="flex items-center gap-2"
                      variant={getAttendanceForDate(userData.id, new Date())?.checkIn ? "default" : "outline"}
                      disabled={!getAttendanceForDate(userData.id, new Date())?.checkIn || getAttendanceForDate(userData.id, new Date())?.checkOut}
                    >
                      <Clock className="h-4 w-4" />
                      تسجيل الانصراف
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline" className="py-2 px-4">
                    {isFriday(new Date()) 
                      ? "اليوم الجمعة - لا يتطلب تسجيل حضور" 
                      : isHoliday(new Date())
                        ? `إجازة: ${getHolidayName(new Date())}`
                        : "لا يمكن تسجيل الحضور إلا في اليوم الحالي"}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Warning Dialog for Early Checkout */}
            <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    تنبيه - تسجيل انصراف مبكر
                  </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-base">
                  أنت على وشك تسجيل انصراف قبل نهاية الدوام الرسمي (5:00 مساءً).
                  هل أنت متأكد من رغبتك في تسجيل الانصراف الآن؟
                </DialogDescription>
                <DialogFooter className="flex gap-2 justify-end mt-4">
                  <Button variant="outline" onClick={() => setIsWarningDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={processCheckOut}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    نعم، تسجيل الانصراف
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Today's status */}
            {isToday(new Date()) && !isNonWorkingDay(new Date()) && (
              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-2">حالة اليوم:</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">الحضور:</span>
                    {getAttendanceForDate(userData.id, new Date())?.checkIn ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                        <span className="text-green-600">{convertTo12Hour(getAttendanceForDate(userData.id, new Date())?.checkIn)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-gray-400 ml-1" />
                        <span className="text-gray-400">لم يتم التسجيل</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">الانصراف:</span>
                    {getAttendanceForDate(userData.id, new Date())?.checkOut ? (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                        <span className="text-green-600">{convertTo12Hour(getAttendanceForDate(userData.id, new Date())?.checkOut)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-gray-400 ml-1" />
                        <span className="text-gray-400">لم يتم التسجيل</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Monthly attendance table */}
      {/* إزالة تأثير الـ flip المزعج */}

      <Card key={formatDateForDisplay(currentMonth, 'MMMM-yyyy')}>
        <CardHeader>
          <div className="flex justify-between items-center">
            {/* زر السهم الأيمن */}
            <div className="flex flex-col items-center">
              <Button 
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                disabled={isThreeMonthsAgo(currentMonth)}
                className="h-11 w-11 mb-1 rounded-full bg-blue-50 hover:bg-blue-100 shadow-sm transition-all duration-300 ease-in-out"
                title="الشهر السابق"
              >
                <ChevronRight className="h-6 w-6 text-blue-600" />
              </Button>
              <span className="text-xs text-gray-500">الشهر السابق</span>
            </div>

            {/* العنوان في المنتصف */}
            <div className="flex flex-col items-center justify-center">
              <CardTitle className="text-center text-xl text-blue-700 flex items-center justify-center gap-2">
                سجل الحضور
              </CardTitle>
              <span className="text-sm font-medium text-gray-500 mt-1">
                {formatDateForDisplay(currentMonth, 'MMMM yyyy')}
                {isCurrentMonth(currentMonth) && <span className="mr-2 text-green-500">(الشهر الحالي)</span>}
              </span>
            </div>

            {/* زر السهم الأيسر */}
            <div className="flex flex-col items-center">
              <Button 
                variant="outline"
                size="icon"
                onClick={isCurrentMonth(currentMonth) ? undefined : goToNextMonth}
                disabled={isCurrentMonth(currentMonth)}
                className="h-11 w-11 mb-1 rounded-full bg-blue-50 hover:bg-blue-100 shadow-sm transition-all duration-300 ease-in-out"
                title="الشهر التالي"
              >
                <ChevronLeft className="h-6 w-6 text-blue-600" />
              </Button>
              <span className="text-xs text-gray-500">الشهر التالي</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userData && userData.role === "employee" ? (
            // Employee view - show only their attendance
            <>
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <h3 className="font-medium mb-4 text-indigo-700 dark:text-indigo-300 flex items-center">
                  <Clock className="h-5 w-5 ml-2" />
                  إحصائيات الحضور:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg shadow-sm border-r-4 border-blue-400 hover:shadow-md transition-all">
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-1">أيام العمل</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-200">{getAttendanceStats(userData.id).workDays}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/30 rounded-lg shadow-sm border-r-4 border-emerald-400 hover:shadow-md transition-all">
                    <p className="text-sm text-emerald-600 dark:text-emerald-300 mb-1">أيام الحضور الكامل</p>
                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{getAttendanceStats(userData.id).completeDays}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 rounded-lg shadow-sm border-r-4 border-amber-400 hover:shadow-md transition-all">
                    <p className="text-sm text-amber-600 dark:text-amber-300 mb-1">الحضور الجزئي</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-200">{getAttendanceStats(userData.id).partialDays}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/30 rounded-lg shadow-sm border-r-4 border-red-400 hover:shadow-md transition-all">
                    <p className="text-sm text-red-600 dark:text-red-300 mb-1">أيام الغياب</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-200">{getAttendanceStats(userData.id).absentDays}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg shadow-sm border-r-4 border-purple-400 hover:shadow-md transition-all">
                    <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">نسبة الحضور</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-200">{getAttendanceStats(userData.id).attendanceRate}%</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اليوم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحضور</TableHead>
                      <TableHead>الانصراف</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getDaysInMonth(currentMonth).map(day => {
                      const record = getAttendanceForDate(userData.id, day);
                      const isFri = isFriday(day);
                      const isHolidayDay = isHoliday(day);
                      const isFutureDay = isFuture(day);
                      const holidayName = getHolidayName(day);
                      
                      return (
                        <TableRow 
                          key={formatDate(day)}
                          className={`${isFutureDay ? "opacity-60" : ""} ${isToday(day) ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""}`}
                        >
                          <TableCell>
                            {isToday(day) ? (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-blue-500 ml-1" />
                                <span className="text-blue-600">{formatDateForDisplay(day, 'EEEE')}</span>
                              </div>
                            ) : (
                              formatDateForDisplay(day, 'EEEE')
                            )}
                          </TableCell>
                          <TableCell>
                            {isToday(day) ? (
                              <div className="flex items-center">
                                <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                  {formatDateForDisplay(day, 'd MMMM')}
                                </span>
                                <span className="mr-1 text-xs text-blue-500">(اليوم)</span>
                              </div>
                            ) : (
                              formatDateForDisplay(day, 'd MMMM')
                            )}
                          </TableCell>
                          <TableCell>
                            {isFri ? (
                              <Badge variant="outline">يوم الجمعة</Badge>
                            ) : isHolidayDay ? (
                              <Badge variant="outline">{holidayName}</Badge>
                            ) : record?.checkIn ? (
                              <span className="font-medium text-blue-600">{convertTo12Hour(record.checkIn)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isFri ? (
                              <Badge variant="outline">يوم الجمعة</Badge>
                            ) : isHolidayDay ? (
                              <Badge variant="outline">{holidayName}</Badge>
                            ) : record?.checkOut ? (
                              <span className="font-medium text-green-600">{convertTo12Hour(record.checkOut)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isFri ? (
                              <Badge variant="outline">إجازة</Badge>
                            ) : isHolidayDay ? (
                              <Badge variant="outline">إجازة: {holidayName}</Badge>
                            ) : isFutureDay ? (
                              <span className="text-gray-400">لم يحن الوقت بعد</span>
                            ) : record?.checkIn && record?.checkOut ? (
                              getAttendanceType(record.checkIn, record.checkOut) === 'complete' ? (
                              <Badge variant="success">حضور كامل</Badge>
                              ) : (
                                <Badge variant="warning">حضور جزئي</Badge>
                              )
                            ) : record?.checkIn ? (
                              <Badge variant="warning">حضور جزئي</Badge>
                            ) : (
                              <Badge variant="destructive">غياب</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            // Admin view - show all employees attendance
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-2 text-blue-800 dark:text-blue-200">إحصائيات الحضور للشهر الحالي: {formatDateForDisplay(currentMonth, 'MMMM yyyy')}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">اضغط على اسم أي موظف لعرض تفاصيل الحضور والانصراف</p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-center">أيام العمل</TableHead>
                      <TableHead className="text-center">الحضور الكامل</TableHead>
                      <TableHead className="text-center">الحضور الجزئي</TableHead>
                      <TableHead className="text-center">إجمالي الحضور</TableHead>
                      <TableHead className="text-center">أيام الغياب</TableHead>
                      <TableHead className="text-center">نسبة الحضور</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map(employee => {
                      // Use the shared function to ensure consistency with employee view
                      const summary = getMonthlyAttendanceSummary(employee.id);
                      const { workDays, completeDays, partialDays, attendedDays, absentDays, attendanceRate } = summary;
                      
                      return (
                        <TableRow 
                          key={employee.id}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setSelectedEmployee(employee)}
                        >
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell className="text-center">{workDays}</TableCell>
                          <TableCell className="text-center">{completeDays}</TableCell>
                          <TableCell className="text-center">{partialDays}</TableCell>
                          <TableCell className="text-center">{attendedDays}</TableCell>
                          <TableCell className="text-center">{absentDays}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-center">
                              <div className="h-2 w-12 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600" 
                                  style={{ width: `${attendanceRate}%` }}
                                />
                              </div>
                              <span className="font-medium">{attendanceRate}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Selected Employee Detailed Attendance */}
              {selectedEmployee && (
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">تفاصيل حضور {selectedEmployee.name}</h3>
                      <p className="text-sm text-gray-500">لشهر {formatDateForDisplay(currentMonth, 'MMMM yyyy')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setSelectedEmployee(null)}
                        className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg border-0 transition-all duration-300 flex items-center justify-center"
                        title="إغلاق"
                      >
                        <div className="bg-white rounded-full h-6 w-6 flex items-center justify-center">
                          <X className="h-4 w-4 text-red-600 font-bold" />
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Detailed attendance table - exact match to employee view */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اليوم</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>الحضور</TableHead>
                          <TableHead>الانصراف</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* IMPORTANT: This is the critical part for data consistency */}
                        {getDaysInMonth(currentMonth).map(day => {
                          // Get the exact record by accessing attendance array directly
                          const dateStr = formatDate(day);
                          const record = attendance.find(rec => 
                            rec.employeeId === selectedEmployee.id && 
                            rec.date === dateStr
                          );
                          
                          const isFri = isFriday(day);
                          const isFutureDay = isFuture(day);
                          const isHolidayDay = isHoliday(day);
                          const holidayName = getHolidayName(day);
                          
                          // Debug output to console
                          if (record) {
                            console.log(`Manager view: date=${dateStr}, emp=${selectedEmployee.id}, checkIn=${record.checkIn}, checkOut=${record.checkOut}`);
                          }
                          
                          return (
                            <TableRow 
                              key={dateStr}
                              className={`${isFutureDay ? "opacity-60" : ""} ${isToday(day) ? "bg-blue-50 dark:bg-blue-900/20 font-medium" : ""}`}
                            >
                              <TableCell>
                                {isToday(day) ? (
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-blue-500 ml-1" />
                                    <span className="text-blue-600">{formatDateForDisplay(day, 'EEEE')}</span>
                                  </div>
                                ) : (
                                  formatDateForDisplay(day, 'EEEE')
                                )}
                              </TableCell>
                              <TableCell>
                                {isToday(day) ? (
                                  <div className="flex items-center">
                                    <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                      {formatDateForDisplay(day, 'd MMMM')}
                                    </span>
                                    <span className="mr-1 text-xs text-blue-500">(اليوم)</span>
                                  </div>
                                ) : (
                                  formatDateForDisplay(day, 'd MMMM')
                                )}
                              </TableCell>
                              <TableCell>
                                {isFri ? (
                                  <Badge variant="outline">يوم الجمعة</Badge>
                                ) : isHolidayDay ? (
                                  <Badge variant="outline">{holidayName}</Badge>
                                ) : record?.checkIn ? (
                                  <span className="font-medium text-blue-600">{convertTo12Hour(record.checkIn)}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isFri ? (
                                  <Badge variant="outline">يوم الجمعة</Badge>
                                ) : isHolidayDay ? (
                                  <Badge variant="outline">{holidayName}</Badge>
                                ) : record?.checkOut ? (
                                  <span className="font-medium text-green-600">{convertTo12Hour(record.checkOut)}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isFri ? (
                                  <Badge variant="outline">إجازة</Badge>
                                ) : isHolidayDay ? (
                                  <Badge variant="outline">إجازة: {holidayName}</Badge>
                                ) : isFutureDay ? (
                                  <span className="text-gray-400">لم يحن الوقت بعد</span>
                                ) : record?.checkIn && record?.checkOut ? (
                                  getAttendanceType(record.checkIn, record.checkOut) === 'complete' ? (
                                  <Badge variant="success">حضور كامل</Badge>
                                  ) : (
                                    <Badge variant="warning">حضور جزئي</Badge>
                                  )
                                ) : record?.checkIn ? (
                                  <Badge variant="warning">حضور جزئي</Badge>
                                ) : (
                                  <Badge variant="destructive">غياب</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Holiday Management Section - Only for Managers */}
      {userData && (userData.role === "manager" || userData.role === "admin") && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  إدارة أيام الإجازات
                </CardTitle>
                <CardDescription>
                  إضافة وحذف أيام الإجازات الرسمية التي لا تتطلب تسجيل حضور
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsHolidayDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة إجازة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">إجازات شهر {formatDateForDisplay(currentMonth, 'MMMM yyyy')}</h4>
                <Badge variant="outline">
                  {getCurrentMonthHolidays().length} إجازة
                </Badge>
              </div>
              
              {getCurrentMonthHolidays().length > 0 ? (
                <div className="grid gap-3">
                  {getCurrentMonthHolidays().map(holiday => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{holiday.name}</span>
                          <span className="text-sm text-gray-500">{holiday.date}</span>
                          {holiday.description && (
                            <span className="text-sm text-gray-600">{holiday.description}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteHoliday(holiday)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>لا توجد إجازات محددة لهذا الشهر</p>
                  <p className="text-sm">اضغط على "إضافة إجازة" لإضافة إجازة جديدة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة إجازة جديدة</DialogTitle>
            <DialogDescription>
              أضف إجازة رسمية جديدة. لن يتم احتساب هذا اليوم في سجل الحضور والانصراف.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday-date">تاريخ الإجازة</Label>
              <Input
                id="holiday-date"
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="holiday-name">اسم الإجازة</Label>
              <Input
                id="holiday-name"
                placeholder="مثال: عيد الفطر، عيد الأضحى، إلخ"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="holiday-description">وصف الإجازة (اختياري)</Label>
              <Input
                id="holiday-description"
                placeholder="وصف تفصيلي للإجازة"
                value={newHoliday.description}
                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddHoliday}>
              إضافة الإجازة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation Dialog */}
      <Dialog open={isDeleteHolidayDialogOpen} onOpenChange={setIsDeleteHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد حذف الإجازة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف الإجازة "{selectedHolidayToDelete?.name}"؟
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteHolidayDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDeleteHoliday}>
              حذف الإجازة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
