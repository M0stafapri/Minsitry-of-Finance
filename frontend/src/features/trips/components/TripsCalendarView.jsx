import React, { useState, useEffect, useRef, useCallback } from "react";
import "@/styles/scrollbar.css";
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Copy,
  User,
  Trash2,
  CheckSquare,
  XSquare,
  FileText
} from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { TripDetailsDialog } from "./TripDetailsDialog";
import { TripForm } from "./TripForm";
import { DeleteTripDialog } from "./DeleteTripDialog";
import { SettlementDialog } from "./SettlementDialog";
import { cn } from "@/lib/utils";
import { generateTripNumber } from "../utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function TripsCalendarView({ trips = [], suppliers = [], isDialogOpen, setIsDialogOpen }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [allTrips, setAllTrips] = useLocalStorage("trips", []);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tripNumber: "",
    type: "",
    date: "",
    customerName: "",
    customerPhone: "",
    route: "",
    commercialPrice: "",
    tripPrice: "",
    paidAmount: "",
    collection: "",
    commission: "",
    supplier: "",
    vehicleType: "",
    driverName: "",
    driverPhone: "",
    paymentProof: "",
    quantity: 1,
    baseCommercialPrice: "",
    baseTripPrice: "",
    isSettled: false
  });
  const [selectedSupplierVehicles, setSelectedSupplierVehicles] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [settlementStatus, setSettlementStatus] = useState("all");
  const [employees] = useLocalStorage("employees", []);
  const [expandedCells, setExpandedCells] = useState({});
  const [tripToDelete, setTripToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tripToSettle, setTripToSettle] = useState(null);
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = useState(false);
  const [invoices, setInvoices] = useLocalStorage("invoices", []);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [selectedTripForMenu, setSelectedTripForMenu] = useState(null);
  const scrollContainerRef = useRef(null);
  const expandedCellRefs = useRef({});

  // Status colors for trips
  const statusColors = {
    completed: "bg-green-100 border-green-300 text-green-800",
    active: "bg-yellow-100 border-yellow-300 text-yellow-800",
    cancelled: "bg-red-100 border-red-300 text-red-800",
  };

  // تحسين معالجة حدث العجلة للتمرير
  useEffect(() => {
    // استخدام معامل أفضل لتعديل سرعة التمرير
    const SCROLL_SENSITIVITY = 0.3;
    
    const handleWheel = (e) => {
      // تحسين طريقة العثور على الحاوية القابلة للتمرير
      const container = e.target.closest('.trip-cell-scrollable[data-expanded="true"]');
      if (!container) return;
      
      // تحسين الكشف عن حدود التمرير
      const { scrollHeight, clientHeight, scrollTop } = container;
      const scrollMax = scrollHeight - clientHeight;
      
      // التأكد من أن الحاوية قابلة للتمرير أصلاً
      if (scrollMax <= 0) return;
      
      // تحسين الكشف عن وصول التمرير للأعلى أو الأسفل
      const isAtBottom = scrollTop >= scrollMax - 1;
      const isAtTop = scrollTop <= 1;
      
      // تطبيق التمرير المخصص بناءً على اتجاه العجلة
      if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
        e.preventDefault();
        e.stopPropagation();
        
        // تطبيق تمرير أكثر سلاسة مع معامل حساسية معدل
        container.scrollTop += e.deltaY * SCROLL_SENSITIVITY;
      }
    };
    
    // تحسين معالجة التمرير باللمس للأجهزة المحمولة
    const handleTouchStart = (e) => {
      const container = e.target.closest('.trip-cell-scrollable[data-expanded="true"]');
      if (!container) return;
      
      // تخزين موضع اللمس البدائي
      container._touchY = e.touches[0].clientY;
      container._scrollTop = container.scrollTop;
    };
    
    const handleTouchMove = (e) => {
      const container = e.target.closest('.trip-cell-scrollable[data-expanded="true"]');
      if (!container || !container._touchY) return;
      
      // حساب المسافة التي تم تحريكها
      const touchDelta = container._touchY - e.touches[0].clientY;
      const { scrollHeight, clientHeight, scrollTop } = container;
      const scrollMax = scrollHeight - clientHeight;
      
      if (scrollMax <= 0) return;
      
      const newScrollTop = container._scrollTop + touchDelta;
      
      // التأكد من أن التمرير ضمن الحدود
      if ((touchDelta > 0 && scrollTop < scrollMax) || (touchDelta < 0 && scrollTop > 0)) {
        e.preventDefault();
        container.scrollTop = Math.max(0, Math.min(newScrollTop, scrollMax));
      }
    };
    
    // إضافة مستمعي الأحداث
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      // إزالة جميع مستمعي الأحداث عند تفكيك المكون
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // تحسين وظيفة تبديل توسيع الخلية
  const toggleCellExpansion = useCallback((cellId) => {
    // إغلاق جميع الخلايا الموسعة الأخرى عند فتح خلية جديدة
    if (!expandedCells[cellId]) {
      setExpandedCells({
        [cellId]: true
      });
      
      // استخدام setTimeout للانتظار حتى يتم تحديث DOM، ثم التركيز وتمرير الحاوية إلى الأعلى
      setTimeout(() => {
        const scrollContainer = document.querySelector(`[data-cell-id="${cellId}"] .trip-cell-scrollable`);
        if (scrollContainer) {
          scrollContainer.scrollTop = 0; // إعادة تعيين موضع التمرير
          scrollContainer.focus();
          
          // حفظ مرجع الحاوية للاستخدام لاحقًا
          expandedCellRefs.current[cellId] = scrollContainer;
        }
      }, 100);
    } else {
      setExpandedCells(prev => {
        const newState = {
          ...prev,
          [cellId]: !prev[cellId]
        };
        
        // إذا تم إغلاق الخلية، إزالة المرجع المخزن
        if (!newState[cellId]) {
          delete expandedCellRefs.current[cellId];
        }
        
        return newState;
      });
    }
  }, [expandedCells]);

  // Generate calendar days for the current month
  useEffect(() => {
    const generateCalendar = () => {
      const daysInMonth = getDaysInMonth(currentMonth);
      const startWeekday = getDay(startOfMonth(currentMonth));
      const days = [];

      // Add empty cells for days before the start of the month
      for (let i = 0; i < startWeekday; i++) {
        days.push({ day: null, isCurrentMonth: false });
      }

      // Add days of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        days.push({
          day,
          date,
          isCurrentMonth: true,
          isToday: isSameDay(date, new Date())
        });
      }

      // Add empty cells to complete the last week if needed
      const remainingCells = 7 - (days.length % 7 || 7);
      if (remainingCells < 7) {
        for (let i = 0; i < remainingCells; i++) {
          days.push({ day: null, isCurrentMonth: false });
        }
      }

      setCalendarDays(days);
    };

    generateCalendar();
  }, [currentMonth]);

  // Get trips for a specific day - Use allTrips instead of props.trips to ensure consistency
  const getTripsForDay = (date) => {
    if (!date) return [];
    
    return trips.filter(trip => {
      if (!trip.date) return false;
      
      try {
        const tripDate = parseISO(trip.date);
        const isSameDate = isSameDay(tripDate, date);
        
        // Apply filters
        const matchesSupplier = selectedSupplier === "all" || trip.supplier === selectedSupplier;
        const matchesEmployee = selectedEmployee === "all" || trip.employee === selectedEmployee;
        const matchesSettlement = settlementStatus === "all" || 
          (settlementStatus === "settled" && trip.isSettled) || 
          (settlementStatus === "unsettled" && !trip.isSettled);

        return isSameDate && matchesSupplier && matchesEmployee && matchesSettlement;
      } catch (error) {
        console.error("Error parsing trip date:", trip.date);
        return false;
      }
    });
  };

  // Reset context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuOpen) {
        setContextMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuOpen]);

  // Automatically update trip status based on date
  useEffect(() => {
    // Function to update trip statuses
    const updateTripStatuses = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const updatedTrips = allTrips.map(trip => {
        if (!trip.date || trip.status === "cancelled") {
          // Don't auto-update cancelled trips or trips without dates
          return trip;
        }
        
        try {
          const tripDate = parseISO(trip.date);
          tripDate.setHours(0, 0, 0, 0);
          
          // Set to "completed" if trip date is in the past
          if (tripDate < today && trip.status === "active") {
            return { ...trip, status: "completed" };
          }
          
          // Set to "active" if trip date is in the future
          if (tripDate >= today && trip.status === "completed") {
            return { ...trip, status: "active" };
          }
          
          return trip;
        } catch (error) {
          console.error("Error parsing trip date:", trip.date, error);
          return trip;
        }
      });
      
      // Only update if there are changes
      if (JSON.stringify(updatedTrips) !== JSON.stringify(allTrips)) {
        setAllTrips(updatedTrips);
      }
    };
    
    // Update statuses when component mounts
    updateTripStatuses();
    
    // Set up an hourly check to make updates more responsive
    const hourlyInterval = setInterval(updateTripStatuses, 60 * 60 * 1000); // Check every hour
    
    // Set up a midnight check for the day change
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Exactly midnight
    const timeUntilMidnight = tomorrow - now;
    
    // Initial timeout to run at midnight
    const midnightTimeout = setTimeout(() => {
      updateTripStatuses();
      
      // Then set up daily interval
      const dailyInterval = setInterval(updateTripStatuses, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);
    
    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(hourlyInterval);
    };
    // Use empty dependency array to only run once on mount
    // The function will internally check allTrips for updates
  }, []);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Handle trip click to show details
  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setIsDetailsDialogOpen(true);
  };

  // Day names in Arabic
  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['customerName', 'customerPhone', 'date', 'type', 'supplier', 'vehicleType', 'tripPrice'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    try {
      // Get user data for employee name
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (currentTrip) {
        // Edit existing trip
        const updatedTrips = allTrips.map(trip => 
          trip.id === currentTrip.id ? { ...formData, id: currentTrip.id } : trip
        );
        setAllTrips(updatedTrips);
        
        toast({
          title: "تم تعديل الرحلة بنجاح",
          duration: 3000
        });
      } else {
        // Create new trip
        const newTrip = {
          ...formData,
          id: Date.now(),
          tripNumber: generateTripNumber(),
          status: "active",
          employee: userData?.name || ""
        };
        
        // Update trips in localStorage
        const updatedTrips = [...allTrips, newTrip];
        setAllTrips(updatedTrips);
        
        toast({
          title: "تم إضافة الرحلة بنجاح",
          duration: 3000
        });
      }
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setCurrentTrip(null);
      setFormData({
        tripNumber: "",
        type: "",
        date: "",
        customerName: "",
        customerPhone: "",
        route: "",
        commercialPrice: "",
        tripPrice: "",
        paidAmount: "",
        collection: "",
        commission: "",
        supplier: "",
        vehicleType: "",
        driverName: "",
        driverPhone: "",
        paymentProof: "",
        quantity: 1,
        baseCommercialPrice: "",
        baseTripPrice: "",
        isSettled: false
      });
    } catch (error) {
      console.error('Error saving trip:', error);
      toast({
        title: "حدث خطأ أثناء حفظ الرحلة",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  // Calculate total trips for current month - using filtered trips from props
  const getCurrentMonthTrips = () => {
    return trips.filter(trip => {
      try {
        const tripDate = parseISO(trip.date);
        const isCurrentMonthTrip = isSameMonth(tripDate, currentMonth);
        
        // Apply filters
        const matchesSupplier = selectedSupplier === "all" || trip.supplier === selectedSupplier;
        const matchesEmployee = selectedEmployee === "all" || trip.employee === selectedEmployee;
        const matchesSettlement = settlementStatus === "all" || 
          (settlementStatus === "settled" && trip.isSettled) || 
          (settlementStatus === "unsettled" && !trip.isSettled);

        return isCurrentMonthTrip && matchesSupplier && matchesEmployee && matchesSettlement;
      } catch (error) {
        console.error("Error parsing trip date:", trip.date);
        return false;
      }
    }).length;
  };

  // Handle trip actions
  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (trip) => {
    setCurrentTrip(trip);
    setFormData(trip);
    setIsDialogOpen(true);
  };

  const handleDelete = (trip) => {
    setTripToDelete(trip);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      const updatedTrips = allTrips.filter(trip => trip.id !== tripToDelete.id);
      setAllTrips(updatedTrips);
      setTripToDelete(null);
      setIsDeleteDialogOpen(false);
      toast({
        title: "تم حذف الرحلة بنجاح",
        duration: 3000
      });
    }
  };

  const handleSettlement = (trip) => {
    // تطبيق التسوية مباشرة بدون حاجة للتأكيد
    const updatedTrips = allTrips.map(t => 
      t.id === trip.id ? { ...t, isSettled: !t.isSettled } : t
    );
    setAllTrips(updatedTrips);
    toast({
      title: trip.isSettled ? "تم إلغاء تسوية الرحلة" : "تم تسوية الرحلة بنجاح",
      duration: 3000
    });
  };

  const handleStatusChange = (trip, newStatus) => {
    // Get current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    let tripDate;
    try {
      tripDate = parseISO(trip.date || new Date().toISOString());
      tripDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    } catch (error) {
      console.error("Error parsing trip date:", error);
      // Use current date as fallback if parsing fails
      tripDate = new Date();
      tripDate.setHours(0, 0, 0, 0);
    }
    
    // Check for specific restrictions based on current status and trip date
    
    // Case 1: Any trip can be cancelled without restrictions
    if (newStatus === "cancelled") {
      // Set isSettled to true automatically when changing to cancelled
      const updatedTrips = allTrips.map(t => 
        t.id === trip.id ? { ...t, status: newStatus, isSettled: true } : t
      );
      setAllTrips(updatedTrips);
      
      toast({
        title: "تم تغيير حالة الرحلة بنجاح",
        description: "تم تسوية الرحلة تلقائيًا",
        duration: 3000
      });
      return;
    }
    
    // Case 2: Cannot change completed trip to active
    if (trip.status === "completed" && newStatus === "active") {
      toast({
        title: "لا يمكن تغيير حالة الرحلة",
        description: "لا يمكن تحويل الرحلة المكتملة إلى قيد التنفيذ",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // Case 3: Cannot change active trip to completed
    if (trip.status === "active" && newStatus === "completed") {
      toast({
        title: "لا يمكن تغيير حالة الرحلة",
        description: "لا يمكن تحويل الرحلة قيد التنفيذ إلى مكتملة",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // Case 4: Cancelled trip to active - only if trip date is in the future
    if (trip.status === "cancelled" && newStatus === "active") {
      if (tripDate < today) {
        toast({
          title: "لا يمكن تغيير حالة الرحلة",
          description: "لا يمكن تحويل الرحلة الملغاة إلى قيد التنفيذ إلا إذا كان تاريخ الرحلة في المستقبل",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }
    
    // Case 5: Cancelled trip to completed - only if trip date is in the past
    if (trip.status === "cancelled" && newStatus === "completed") {
      if (tripDate >= today) {
        toast({
          title: "لا يمكن تغيير حالة الرحلة",
          description: "لا يمكن تحويل الرحلة الملغاة إلى مكتملة إلا إذا كان تاريخ الرحلة في الماضي",
          variant: "destructive", 
          duration: 3000
        });
        return;
      }
    }
    
    // If all checks pass, update the status
    const updatedTrips = allTrips.map(t => 
      t.id === trip.id ? { ...t, status: newStatus } : t
    );
    setAllTrips(updatedTrips);
    
    toast({
      title: "تم تغيير حالة الرحلة بنجاح",
      duration: 3000
    });
  };

  const handleCopyBooking = (trip) => {
    const supplier = suppliers.find(s => s.id === Number(trip.supplier));
    const bookingMessage = `حجز جديد:
التاريخ: ${trip.date}
العميل: ${trip.customerName}
الجوال: ${trip.customerPhone}
المسار: ${trip.route}
نوع المركبة: ${trip.vehicleType}
${supplier ? `المورد: ${supplier.name}` : ''}
${trip.driverName ? `السائق: ${trip.driverName}` : ''}
${trip.driverPhone ? `جوال السائق: ${trip.driverPhone}` : ''}`;

    navigator.clipboard.writeText(bookingMessage);
    toast({
      title: "تم نسخ رسالة الحجز",
      description: "تم نسخ رسالة الحجز إلى الحافظة",
      duration: 3000
    });
  };

  const handleCopyDriver = (trip) => {
    if (!trip.driverName && !trip.driverPhone) {
      toast({
        title: "لا توجد بيانات سائق",
        description: "لم يتم تسجيل بيانات السائق لهذه الرحلة",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    const driverInfo = `بيانات السائق:
${trip.driverName ? `الاسم: ${trip.driverName}` : ''}
${trip.driverPhone ? `الجوال: ${trip.driverPhone}` : ''}`;

    navigator.clipboard.writeText(driverInfo);
    toast({
      title: "تم نسخ بيانات السائق",
      description: "تم نسخ بيانات السائق إلى الحافظة",
      duration: 3000
    });
  };

  const handleGenerateInvoice = (trip) => {
    // Check if trip is cancelled
    if (trip.status === "cancelled") {
      toast({
        title: "لا يمكن إصدار فاتورة",
        description: "لا يمكن إصدار فاتورة للرحلات الملغاة",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    // Check if an invoice already exists for this trip
    const existingInvoice = invoices.find(invoice => invoice.tripId === trip.id);
    if (existingInvoice) {
      toast({
        title: "الفاتورة موجودة بالفعل",
        description: `رقم الفاتورة: ${existingInvoice.id}`,
        variant: "warning",
        duration: 3000
      });
      return;
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create new invoice
    const newInvoice = {
      id: invoiceNumber,
      tripId: trip.id,
      date: new Date().toISOString(),
      customerName: trip.customerName,
      amount: trip.tripPrice,
      status: "pending"
    };

    // Add to invoices
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);

    toast({
      title: "تم إصدار الفاتورة بنجاح",
      description: `رقم الفاتورة: ${invoiceNumber}`,
      duration: 3000
    });
  };

  // Function to adjust menu position to keep it within viewport
  const adjustMenuPosition = (clientX, clientY) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Menu dimensions (approximate)
    const menuWidth = 224; // 56 * 4
    const menuHeight = 350; // Approximate height of the full menu
    
    let left = clientX;
    let top = clientY;
    
    // Check if menu would go off the right edge
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth - 10; // 10px padding
    }
    
    // Check if menu would go off the bottom edge
    if (top + menuHeight > viewportHeight) {
      // If the menu would go below viewport, position it above the click point
      // But check if there's enough space above
      if (clientY - menuHeight > 0) {
        top = clientY - menuHeight;
      } else {
        // Not enough space above or below, center it in the available space
        top = Math.max(10, viewportHeight / 2 - menuHeight / 2);
      }
    }
    
    // Ensure minimum distance from edges
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    return { top, left };
  };

  // Function to handle right click on trip
  const handleTripContextMenu = (e, trip) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedTripForMenu(trip);
    
    // Get element position
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Position menu next to the trip element, not at cursor position
    // Menu appears at the center-right of the trip card
    const offsetX = 10; // Small offset from the right edge
    const offsetY = rect.height / 2; // Center vertically
    
    const menuX = rect.right + offsetX;
    const menuY = rect.top + offsetY;
    
    // Calculate adjusted position
    const position = adjustMenuPosition(menuX, menuY);
    setContextMenuPosition(position);
    
    setContextMenuOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters Row - Moved outside the calendar box */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="جميع الموردين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الموردين</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="جميع الموظفين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الموظفين</SelectItem>
              {employees.map(employee => (
                <SelectItem key={employee.id} value={employee.name}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={settlementStatus} onValueChange={setSettlementStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="حالة التسوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="settled">تمت التسوية</SelectItem>
              <SelectItem value="unsettled">لم تتم التسوية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Box */}
      <div className="bg-white rounded-lg shadow">
        {/* Month Navigation */}
        <div className="p-4 border-b">
          <div className="flex justify-center items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToPreviousMonth}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="w-48 text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {format(currentMonth, "MMMM yyyy", { locale: ar })}
              </h2>
              <div className="text-sm text-gray-500">
                {getCurrentMonthTrips()} رحلة
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={goToCurrentMonth}
              className="mr-2"
            >
              اليوم
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map((day, index) => (
              <div 
                key={index} 
                className="py-2 px-1 sm:px-3 text-center text-xs sm:text-sm font-medium text-gray-700 border-r last:border-r-0 border-gray-200"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dayData, index) => {
              const dayTrips = dayData.date ? getTripsForDay(dayData.date) : [];
              const cellId = dayData.date ? dayData.date.toISOString() : `empty-${index}`;
              const isExpanded = expandedCells[cellId];
              const hasMoreTrips = dayTrips.length > 2;
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "relative border-r border-b last:border-r-0 p-0.5 sm:p-1 transition-colors flex flex-col",
                    dayData.isCurrentMonth ? "bg-white" : "bg-gray-50",
                    dayData.isToday && "bg-blue-50",
                    isExpanded ? "min-h-[180px]" : "min-h-[90px] sm:min-h-[120px]"
                  )}
                  data-cell-id={cellId}
                >
                  {dayData.day && (
                    <>
                      <div className="flex justify-between items-center w-full px-0.5 mb-1.5">
                        <div className="flex items-center">
                          <div className={cn(
                            "flex justify-center items-center h-6 w-6 rounded-full text-sm font-medium",
                            dayData.isToday ? "bg-primary text-white" : "text-gray-700"
                          )}>
                            {dayData.day}
                          </div>
                          
                          {dayTrips.length > 0 && (
                            <span 
                              className="text-xs text-gray-500 mr-1 cursor-pointer hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (dayTrips.length > 2) {
                                  toggleCellExpansion(cellId);
                                }
                              }}
                            >
                              (عدد الرحلات: {dayTrips.length})
                            </span>
                          )}
                        </div>

                        {/* Show more/less button with smooth transition (only if there are more than 2 trips) */}
                        {dayTrips.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCellExpansion(cellId);
                            }}
                            className={cn(
                              "h-5 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600",
                              "rounded-full hover:bg-gray-100",
                              "expand-transition"
                            )}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col min-h-0">
                        <div 
                          className={cn(
                            "flex-1 space-y-1 overflow-y-auto trip-cell-scrollable",
                            "scrollbar-custom",
                            isExpanded ? "max-h-[140px]" : "max-h-[60px]"
                          )}
                          ref={isExpanded ? scrollContainerRef : null}
                          tabIndex={0}
                          data-expanded={isExpanded ? "true" : "false"}
                        >
                          {dayTrips.length > 0 ? (
                            (isExpanded ? dayTrips : dayTrips.slice(0, 2)).map((trip) => (
                              <div
                                key={trip.id || trip.tripNumber || `${trip.date}-${trip.customerName}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Focus the parent scrollable container first
                                  e.currentTarget.closest('.trip-cell-scrollable')?.focus();
                                  handleViewDetails(trip);
                                }}
                                onContextMenu={(e) => {
                                  e.stopPropagation();
                                  // Focus the parent scrollable container first
                                  e.currentTarget.closest('.trip-cell-scrollable')?.focus();
                                  handleTripContextMenu(e, trip);
                                }}
                                className={cn(
                                  "p-1 sm:p-1.5 rounded-md border text-[10px] sm:text-xs cursor-pointer transition-all duration-200",
                                  "relative hover:shadow-sm",
                                  statusColors[trip.status || "active"]
                                )}
                              >
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="font-bold">#{trip.tripNumber}</span>
                                    {trip.employee && (
                                      <span className="text-[8px] sm:text-[10px] text-gray-600 truncate">
                                        {trip.employee}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] flex items-center flex-shrink-0">
                                    {trip.status === "completed" ? (
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                    ) : trip.status === "cancelled" ? (
                                      <XCircle className="h-3 w-3 mr-0.5" />
                                    ) : (
                                      <Clock className="h-3 w-3 mr-0.5" />
                                    )}
                                  </span>
                                </div>
                                <div className="truncate text-[9px] sm:text-xs">{trip.customerName}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-xs text-gray-400 mt-4">لا توجد رحلات</div>
                          )}
                        </div>
                        
                        {/* Show more/less button with smooth transition */}
                        {dayTrips.length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCellExpansion(cellId);
                            }}
                            className={cn(
                              "w-full mt-1 py-0.5 px-2 text-[10px] text-gray-500 hover:text-gray-700",
                              "flex items-center justify-center gap-1 rounded-md hover:bg-gray-100",
                              "expand-transition"
                            )}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className={cn("h-3 w-3 expand-transition", "transform rotate-0")} />
                                <span>عرض أقل</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className={cn("h-3 w-3 expand-transition", "transform rotate-0")} />
                                <span>عرض {dayTrips.length - 2} رحلة إضافية</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t flex items-center justify-end gap-4">
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className="h-3 w-3 rounded-full bg-green-100 border border-green-300"></div>
            <span className="text-xs text-gray-600 mr-1">مكتملة</span>
          </div>
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className="h-3 w-3 rounded-full bg-yellow-100 border border-yellow-300"></div>
            <span className="text-xs text-gray-600 mr-1">قيد التنفيذ</span>
          </div>
          <div className="flex items-center space-x-1 space-x-reverse">
            <div className="h-3 w-3 rounded-full bg-red-100 border border-red-300"></div>
            <span className="text-xs text-gray-600 mr-1">ملغاة</span>
          </div>
        </div>
      </div>

      {/* Forms and Dialogs */}
      <TripForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        setFormData={setFormData}
        currentTrip={currentTrip}
        suppliers={suppliers}
        selectedSupplierVehicles={selectedSupplierVehicles}
        setSelectedSupplierVehicles={setSelectedSupplierVehicles}
        onSubmit={handleSubmit}
      />

      <TripDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        selectedTrip={selectedTrip}
        suppliers={suppliers}
      />

      <DeleteTripDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      {/* Trip Context Menu */}
      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger className="hidden">
          Trigger
        </DropdownMenuTrigger>
        {contextMenuOpen && selectedTripForMenu && (
          <DropdownMenuContent
            className="w-56 z-50"
            style={{
              position: 'fixed',
              top: `${contextMenuPosition.top}px`,
              left: `${contextMenuPosition.left}px`,
            }}
            forceMount
            sideOffset={0}
            align="start"
            alignOffset={0}
          >
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              handleViewDetails(selectedTripForMenu);
              setContextMenuOpen(false);
            }}>
              <Eye className="ml-2 h-4 w-4" />
              عرض التفاصيل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              handleEdit(selectedTripForMenu);
              setContextMenuOpen(false);
            }}>
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              handleCopyBooking(selectedTripForMenu);
              setContextMenuOpen(false);
            }}>
              <Copy className="ml-2 h-4 w-4" />
              نسخ رسالة الحجز للواتساب
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.preventDefault();
              handleCopyDriver(selectedTripForMenu);
              setContextMenuOpen(false);
            }}>
              <User className="ml-2 h-4 w-4" />
              نسخ بيانات السائق
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CheckCircle2 className="ml-2 h-4 w-4" />
                حالة التسوية
                <ChevronRight className="mr-auto h-4 w-4" />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={24} alignOffset={-5}>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSettlement(selectedTripForMenu);
                    setContextMenuOpen(false);
                  }}
                >
                  <XCircle className="ml-2 h-4 w-4 text-orange-500" />
                  إلغاء التسوية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.preventDefault();
                  handleSettlement(selectedTripForMenu);
                  setContextMenuOpen(false);
                }}>
                  <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                  تسوية الرحلة
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Clock className="ml-2 h-4 w-4" />
                حالة الرحلة
                <ChevronRight className="mr-auto h-4 w-4" />
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={24} alignOffset={-5}>
                {selectedTripForMenu && (
                  <>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange(selectedTripForMenu, "active");
                        setContextMenuOpen(false);
                      }}
                      disabled={
                        // Disabled if:
                        // 1. Trip is completed (can't go back to active)
                        // 2. Trip is cancelled and trip date is in the past
                        (selectedTripForMenu.status === "completed") || 
                        (selectedTripForMenu.status === "cancelled" && 
                          (() => {
                            try {
                              const tripDate = parseISO(selectedTripForMenu.date || new Date().toISOString());
                              return tripDate < new Date();
                            } catch (e) {
                              console.error("Error parsing date:", e);
                              return false;
                            }
                          })())
                      }
                    >
                      <Clock className="ml-2 h-4 w-4 text-yellow-500" />
                      قيد التنفيذ
                      {selectedTripForMenu.status === "completed" && (
                        <span className="mr-2 text-xs text-gray-500">(لا يمكن تحويل رحلة مكتملة إلى قيد التنفيذ)</span>
                      )}
                      {selectedTripForMenu.status === "cancelled" && 
                        (() => {
                          try {
                            const tripDate = parseISO(selectedTripForMenu.date || new Date().toISOString());
                            return tripDate < new Date();
                          } catch (e) {
                            return false;
                          }
                        })() && (
                        <span className="mr-2 text-xs text-gray-500">(تاريخ الرحلة في الماضي)</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        handleStatusChange(selectedTripForMenu, "completed");
                        setContextMenuOpen(false);
                      }}
                      disabled={
                        // Disabled if:
                        // 1. Trip is active (can't manually set to completed)
                        // 2. Trip is cancelled and trip date is in the future
                        (selectedTripForMenu.status === "active") || 
                        (selectedTripForMenu.status === "cancelled" && 
                          (() => {
                            try {
                              const tripDate = parseISO(selectedTripForMenu.date || new Date().toISOString());
                              return tripDate >= new Date();
                            } catch (e) {
                              console.error("Error parsing date:", e);
                              return false;
                            }
                          })())
                      }
                    >
                      <CheckSquare className="ml-2 h-4 w-4 text-green-500" />
                      مكتملة
                      {selectedTripForMenu.status === "active" && (
                        <span className="mr-2 text-xs text-gray-500">(لا يمكن تحويل رحلة قيد التنفيذ إلى مكتملة)</span>
                      )}
                      {selectedTripForMenu.status === "cancelled" && 
                        (() => {
                          try {
                            const tripDate = parseISO(selectedTripForMenu.date || new Date().toISOString());
                            return tripDate >= new Date();
                          } catch (e) {
                            return false;
                          }
                        })() && (
                        <span className="mr-2 text-xs text-gray-500">(تاريخ الرحلة في المستقبل)</span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      handleStatusChange(selectedTripForMenu, "cancelled");
                      setContextMenuOpen(false);
                    }}>
                      <XSquare className="ml-2 h-4 w-4 text-red-500" />
                      ملغاة
                      <span className="mr-2 text-xs text-gray-500">(سيتم تسوية الرحلة تلقائيًا)</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              className="text-red-600 dark:text-red-400"
              onClick={(e) => {
                e.preventDefault();
                handleDelete(selectedTripForMenu);
                setContextMenuOpen(false);
              }}
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
} 