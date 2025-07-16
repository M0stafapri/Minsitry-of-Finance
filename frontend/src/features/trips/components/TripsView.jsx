import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, FileDown } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { TripTable } from "./TripTable";
import { TripForm } from "./TripForm";
import { TripDetailsDialog } from "./TripDetailsDialog";
import { DeleteTripDialog } from "./DeleteTripDialog";
import { SettlementDialog } from "./SettlementDialog";
import { TripFilters } from "./TripFilters";
import { generateTripNumber, filterTripsByDate, sortTrips, tripTypes } from "../utils";
import { syncAllTripsWithCustomers } from "@/lib/utils/customerSync";
import * as XLSX from 'xlsx';

// Lista de tipos de vehículos (misma que en la página de proveedores y formulario de viajes)
const vehicleTypes = [
  { id: "h1", name: "H1" },
  { id: "hiace", name: "هايس" },
  { id: "coaster", name: "كوستر" },
  { id: "bus28", name: "باص 28" },
  { id: "bus33", name: "باص 33" },
  { id: "mcv500", name: "مرسيدس MCV500" },
  { id: "mcv600", name: "مرسيدس MCV600" },
  { id: "wedding", name: "زفة" },
  { id: "elantra", name: "النترا" },
  { id: "tucson", name: "توسان" },
  { id: "sportage", name: "سبورتاج" },
  { id: "mg", name: "ام جي" },
];

function TripsView({ title, trips, emptyMessage, filterStatus, showTitle = true, isDialogOpen: propIsDialogOpen, setIsDialogOpen: propSetIsDialogOpen, onTripsCountChange }) {
  // Usar localStorage para todos los viajes (para operaciones de guardado)
  const [allTrips, setAllTrips] = useLocalStorage("trips", []);
  const [suppliers] = useLocalStorage("suppliers", []);
  const [employees] = useLocalStorage("employees", []);
  const [customers] = useLocalStorage("customers", []);
  const { notifyTripCompletion } = useNotifications();
  
  // Add local state for dialog if not provided as prop
  const [localIsDialogOpen, setLocalIsDialogOpen] = React.useState(false);
  const isDialogOpen = propIsDialogOpen !== undefined ? propIsDialogOpen : localIsDialogOpen;
  const setIsDialogOpen = propSetIsDialogOpen || setLocalIsDialogOpen;
  
  // Estado local para los viajes que se muestran en esta vista
  const [displayTrips, setDisplayTrips] = useState([]);
  
  // Actualizar los viajes mostrados cuando cambien los trips o el filtro
  useEffect(() => {
    // Si se proporciona un filterStatus específico, respetarlo
    if (filterStatus) {
      // Usar los viajes filtrados que se pasan como prop
      setDisplayTrips(trips || []);
    } else {
      // Si no hay filtro específico (página principal de viajes), usar todos los viajes
      setDisplayTrips(allTrips);
    }
  }, [trips, filterStatus, allTrips]);
  
  // استخراج بيانات المستخدم الحالي من localStorage
  const [userData, setUserData] = useState(null);
  
  // Cargar datos del usuario al inicio
  React.useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('خطأ في قراءة بيانات المستخدم:', error);
    }
  }, []);
  
  // Get toast function at the component level (not inside a hook or effect)
  const { toast } = useToast();
  
  // Synchronize customer data in trips with the latest data from customers table
  React.useEffect(() => {
    // Only run if we have both trips and customers
    if (allTrips.length > 0 && customers.length > 0) {
      // Synchronize all trips with the latest customer data
      const { updatedTrips, hasChanges } = syncAllTripsWithCustomers(allTrips, customers);
      
      // If changes were made, update the trips in localStorage
      if (hasChanges) {
        setAllTrips(updatedTrips);
        
        // Show a toast notification about the update
        toast({
          title: "تم تحديث بيانات التوقيعات",
          description: "تم تحديث بيانات التوقيعات في الرحلات بناءً على أحدث البيانات"
        });
      }
    }
  }, [allTrips, customers, setAllTrips, toast]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("currentMonth");
  const [customDate, setCustomDate] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedSuppliers, setSelectedSuppliers] = React.useState([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState([]);
  const [settlementStatus, setSettlementStatus] = React.useState("all");
  const [sortField, setSortField] = React.useState("date");
  const [sortDirection, setSortDirection] = React.useState("desc");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSettlementDialogOpen, setIsSettlementDialogOpen] = React.useState(false);
  const [currentTrip, setCurrentTrip] = React.useState(null);
  const [selectedTrip, setSelectedTrip] = React.useState(null);
  const [tripToDelete, setTripToDelete] = React.useState(null);
  const [tripToSettle, setTripToSettle] = React.useState(null);
  const [selectedSupplierVehicles, setSelectedSupplierVehicles] = React.useState([]);
  const [selectedTrips, setSelectedTrips] = React.useState([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [isBulkSettlementDialogOpen, setIsBulkSettlementDialogOpen] = React.useState(false);
  const [bulkSettlementAction, setBulkSettlementAction] = React.useState(null); // 'settled' or 'unsettled'
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = React.useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = React.useState(false);
  const [tripStatusData, setTripStatusData] = React.useState(null);
  const [invoices, setInvoices] = useLocalStorage("invoices", []);

  const [formData, setFormData] = React.useState({
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

  const filteredTrips = React.useMemo(() => {
    // Filtrar las rutas según el rol del usuario
    let filtered = displayTrips; // Usar los viajes que se muestran en esta vista
    
    // Si el usuario tiene rol "موظف" (empleado), solo mostrar sus propias rutas
    if (userData?.role === "employee") {
      filtered = filtered.filter(trip => trip.employee === userData.name);
    }

    if (searchTerm) {
      filtered = filtered.filter((trip) =>
        trip.tripNumber?.toString().includes(searchTerm) ||
        trip.route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.customerPhone?.includes(searchTerm)
      );
    }

    filtered = filterTripsByDate(filtered, dateFilter, customDate, startDate, endDate);

    // Filter by multiple suppliers
    if (selectedSuppliers.length > 0) {
      filtered = filtered.filter(trip => selectedSuppliers.includes(trip.supplier));
    }
    
    // Filter by multiple employees
    if (selectedEmployees.length > 0) {
      filtered = filtered.filter(trip => selectedEmployees.includes(trip.employee));
    }

    // Filter by settlement status
    if (settlementStatus !== "all") {
      if (settlementStatus === "settled") {
        filtered = filtered.filter(trip => trip.isSettled === true);
      } else if (settlementStatus === "unsettled") {
        filtered = filtered.filter(trip => trip.isSettled === false);
      }
    }

    return sortTrips(filtered, sortField, sortDirection);
  }, [displayTrips, userData, searchTerm, dateFilter, customDate, startDate, endDate, selectedSuppliers, selectedEmployees, settlementStatus, sortField, sortDirection]);

  // Send filtered trips count to parent component
  React.useEffect(() => {
    if (onTripsCountChange) {
      onTripsCountChange(filteredTrips.length);
    }
  }, [filteredTrips.length, onTripsCountChange]);

  const handleViewDetails = (trip) => {
    setSelectedTrip(trip);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (trip) => {
    setCurrentTrip(trip);
    setFormData({
      ...trip,
      baseCommercialPrice: trip.baseCommercialPrice || trip.commercialPrice,
      baseTripPrice: trip.baseTripPrice || trip.tripPrice,
      quantity: trip.quantity || 1
    });
    if (setIsDialogOpen) {
    setIsDialogOpen(true);
    }
  };

  const handleDelete = (trip) => {
    setTripToDelete(trip);
    setIsDeleteDialogOpen(true);
  };

  const handleGenerateInvoice = (trip) => {
    // Check if trip is cancelled
    if (trip.status === "cancelled") {
      toast({
        title: "لا يمكن إنشاء فاتورة",
        description: "لا يمكن إنشاء فاتورة للرحلات الملغاة",
        variant: "destructive"
      });
      return;
    }

    // Check if invoice already exists for this trip
    const existingInvoice = invoices.find(inv => inv.tripDetails?.tripNumber === trip.tripNumber);
    if (existingInvoice) {
      toast({
        title: "يوجد فاتورة للرحلة من قبل",
        description: `الفاتورة رقم ${existingInvoice.id} تم إنشاؤها مسبقاً لهذه الرحلة`,
        variant: "destructive"
      });
      return;
    }

    // Create invoice data from trip
    const today = new Date().toISOString().split('T')[0];
    const tripPrice = Number(trip.tripPrice);
    const paidAmount = Number(trip.paidAmount || 0);
    const remainingAmount = tripPrice - paidAmount;

    // Determine invoice status automatically
    let status;
    if (paidAmount === 0) {
      status = "معلق";
    } else if (paidAmount < tripPrice) {
      status = "معلق";
    } else {
      status = "مدفوع";
    }

    const invoice = {
      id: trip.tripNumber,
      customerName: trip.customerName,
      date: today, // Use today's date
      items: [{
        item: tripTypes.find(t => t.id === trip.type)?.name || trip.type,
        date: trip.date,
        description: trip.route,
        unitPrice: tripPrice / (trip.quantity || 1),
        quantity: trip.quantity || 1,
        total: tripPrice
      }],
      totalAmount: tripPrice,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      status: status, // Add status field
      tripDetails: trip // Store the full trip details
    };

    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        const invoiceContent = `
          <div id="invoice" style="
            width: 794px;
            height: 1123px;
            margin: auto;
            padding: 40px;
            position: relative;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
          ">
            <!-- Background Logo -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 80%;
              height: 80%;
              background: url('/src/assets/img/logo.png') no-repeat center;
              background-size: contain;
              opacity: 0.05;
              z-index: -1;
            "></div>

            <!-- Header Section -->
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 40px;
            ">
              <!-- Logo on the right -->
              <img src="/src/assets/img/logo.png" alt="Logo" style="
                width: 120px;
                height: auto;
              ">
              
              <!-- Title on the left -->
              <div style="
                font-size: 36px;
                font-weight: bold;
                color: #1a1a1a;
              ">فاتورة</div>
            </div>

            <!-- Company Info -->
            <div style="
              margin-top: 20px;
              line-height: 1.6;
              color: #2a2a2a;
            ">
              <strong>الدولية للنقل السياحي</strong><br>
              27ش ميدان ابن الحكم، امام دنيا الجمبري<br>
              برج المرمر، الدور السادس<br>
              حلمية الزيتون، القاهرة
            </div>

            <!-- Invoice Details -->
            <div style="
              margin-top: 30px;
              font-size: 14px;
              color: #333;
              position: relative;
              height: 80px;
            ">
              <!-- Right side - Invoice To -->
              <div style="
                position: absolute;
                right: 0;
                top: 0;
              ">
                <span style="font-weight: bold;">فاتورة لـ</span>
                <span style="margin-right: 8px;">${invoice.customerName}</span>
              </div>

              <!-- Left side - Invoice Number and Date -->
              <div style="
                position: absolute;
                left: 0;
                top: 0;
              ">
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: bold;">رقم الفاتورة</span>
                  <span style="margin-right: 8px;">${invoice.id}</span>
                </div>
                <div>
                  <span style="font-weight: bold;">تاريخ الفاتورة</span>
                  <span style="margin-right: 8px;">${invoice.date}</span>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            <table style="
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
              font-size: 14px;
              table-layout: fixed;
            ">
              <thead>
                <tr>
                  <th style="
                    width: 15%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">البند</th>
                  <th style="
                    width: 15%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">التاريخ</th>
                  <th style="
                    width: 30%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">الوصف</th>
                  <th style="
                    width: 15%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">سعر الوحدة</th>
                  <th style="
                    width: 10%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">الكمية</th>
                  <th style="
                    width: 15%;
                    border: 0.5px solid #e5e5e5;
                    padding: 8px 10px;
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: right;
                  ">المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map(item => `
                  <tr>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.item || '-'}</td>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.date || '-'}</td>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.description || '-'}</td>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.quantity}</td>
                    <td style="
                      border: 0.5px solid #e5e5e5;
                      padding: 12px 15px;
                      background-color: #fbfbfb;
                      vertical-align: top;
                      text-align: right;
                    ">${item.total?.toFixed(2) || '0.00'}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <!-- Totals Section -->
            <div style="
              display: grid;
              grid-template-columns: 15% 15% 30% 15% 10% 15%;
              margin-top: 0;
              font-size: 14px;
              border-collapse: collapse;
            ">
              <!-- Total Row -->
              <div style="
                grid-column: 4;
                padding: 6px 0;
                background-color: #f8f9fa;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span style="font-weight: bold;">الإجمالي</span>
              </div>
              <div style="
                grid-column: 6;
                padding: 6px 0;
                background-color: #f8f9fa;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span>${(invoice.totalAmount || 0) === 0 ? '0.00' : `${Number(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`}</span>
              </div>

              <!-- Paid Amount Row -->
              <div style="
                grid-column: 4;
                padding: 6px 0;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span style="font-weight: bold;">المبلغ المدفوع</span>
              </div>
              <div style="
                grid-column: 6;
                padding: 6px 0;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span>${(invoice.paidAmount || 0) === 0 ? '0.00' : `${Number(invoice.paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`}</span>
              </div>

              <!-- Remaining Amount Row -->
              <div style="
                grid-column: 4;
                padding: 6px 0;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
                font-weight: bold;
              ">
                <span>المبلغ المستحق</span>
              </div>
              <div style="
                grid-column: 6;
                padding: 6px 0;
                border-bottom: 1px solid #eee;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
                font-weight: bold;
              ">
                <span>${(invoice.remainingAmount || 0) === 0 ? '0.00' : `${Number(invoice.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`}</span>
              </div>
            </div>

            <!-- Notes Section -->
            <div style="
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #dc2626;
              font-weight: bold;
              font-size: 14px;
              line-height: 1.8;
            ">
              <p>- هذه الفاتورة عادية وغير ضريبية، يُرجى مراعاة أن هذه الفاتورة تُصدر لأغراض التسجيل التجاري فقط.</p>
              <p>- يتم توفير سيارات بديلة علي الفور من نفس النوع المذكور اعلاه، وذلك في حالة تعطل السيارة او توقفها عن العمل</p>
              <p>- قد تتغير الأسعار في حالة زيادة اسعار الوقود</p>
            </div>
          </div>
        `;

        // Create a temporary container for the invoice
        const container = document.createElement('div');
        container.innerHTML = invoiceContent;
        document.body.appendChild(container);

        // Configure html2pdf options
        const opt = {
          margin: 0,
          filename: `invoice-${invoice.id}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
          },
          jsPDF: { 
            unit: 'px', 
            format: [794, 1123],
            orientation: 'portrait'
          }
        };

        // Generate PDF
        window.html2pdf().from(container).set(opt).save()
          .then(() => {
            document.body.removeChild(container);
            document.body.removeChild(script);

            // Add invoice to invoices list
            setInvoices(prev => [invoice, ...prev]);

            toast({
              title: "تم تحميل الفاتورة",
              description: "تم تحميل الفاتورة بصيغة PDF بنجاح وإضافتها إلى سجل الفواتير"
            });
          })
          .catch(error => {
            document.body.removeChild(container);
            document.body.removeChild(script);
            console.error('Error generating PDF:', error);
            toast({
              title: "خطأ في تحميل الفاتورة",
              description: "حدث خطأ أثناء إنشاء ملف PDF",
              variant: "destructive"
            });
          });
      };

      script.onerror = () => {
        toast({
          title: "خطأ في تحميل المكتبة",
          description: "حدث خطأ أثناء تحميل مكتبة إنشاء PDF",
          variant: "destructive"
        });
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطأ في تحميل الفاتورة",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive"
      });
    }
  };

  const handleSettlement = (trip, skipDialog = false) => {
    if (skipDialog) {
      // If the trip is cancelled, don't allow unsettling it
      if (trip.status === "cancelled" && !trip.isSettled) {
        toast({
          title: "لا يمكن إلغاء تسوية الرحلات الملغاة",
          description: "الرحلات الملغاة يجب أن تكون مسواة دائمًا",
          variant: "destructive"
        });
        return;
      }
      
      // Apply the settlement change directly
      const updatedAllTrips = allTrips.map(t => 
        t.id === trip.id ? { ...t, isSettled: trip.isSettled } : t
      );
      setAllTrips(updatedAllTrips);
      
      // Update displayed trips if needed
      if (displayTrips.some(t => t.id === trip.id)) {
        const updatedDisplayTrips = displayTrips.map(t => 
          t.id === trip.id ? { ...t, isSettled: trip.isSettled } : t
        );
        setDisplayTrips(updatedDisplayTrips);
      }
      toast({
        title: trip.isSettled ? "تم تسوية الرحلة بنجاح" : "تم إلغاء تسوية الرحلة",
      });
    } else {
      setTripToSettle(trip);
      setIsSettlementDialogOpen(true);
    }
  };

  // Función para verificar si la fecha del viaje es hoy o futura
  const isTripTodayOrFuture = (tripDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear a 00:00:00 para comparar solo fechas
    
    const tripDateObj = new Date(tripDate);
    tripDateObj.setHours(0, 0, 0, 0);
    
    return tripDateObj >= today;
  };

  // Función para actualizar automáticamente los estados basados en fechas
  const updateTripStatusesBasedOnDate = () => {
    const updatedAllTrips = allTrips.map(trip => {
      // No cambiar viajes cancelados
      if (trip.status === "cancelled") return trip;
      
      const isInFuture = isTripTodayOrFuture(trip.date);
      // Si el viaje es hoy o futuro → estado activo
      // Si el viaje es pasado → estado completado
      const newStatus = isInFuture ? "active" : "completed";
      
      // Solo actualizar si el estado actual es diferente
      if (trip.status !== newStatus) {
        return { ...trip, status: newStatus };
      }
      return trip;
    });
    
    // Actualizar solo si hay cambios
    if (JSON.stringify(updatedAllTrips) !== JSON.stringify(allTrips)) {
      setAllTrips(updatedAllTrips);
      
      // Update displayed trips if needed
      const updatedDisplayTrips = displayTrips.map(trip => {
        if (trip.status === "cancelled") return trip;
        
        const isInFuture = isTripTodayOrFuture(trip.date);
        const newStatus = isInFuture ? "active" : "completed";
        
        if (trip.status !== newStatus) {
          return { ...trip, status: newStatus };
        }
        return trip;
      });
      
      setDisplayTrips(updatedDisplayTrips);
    }
  };
  
  // Efecto para actualizar estados al cargar o cuando cambian las fechas
  React.useEffect(() => {
    updateTripStatusesBasedOnDate();
    // Implementar actualización periódica (cada día a las 00:00)
    const intervalId = setInterval(() => {
      const now = new Date();
      // Verificar si es medianoche (00:00)
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateTripStatusesBasedOnDate();
      }
    }, 60000); // Verificar cada minuto
    
    return () => clearInterval(intervalId);
  }, [allTrips.length]); // Ejecutar cuando cambia el número de viajes

  // Send notification to admins and managers
  const notifyManagersAndAdmins = (notification) => {
    try {
      console.log('Starting to send notifications to managers and admins');

      // Get local users list
      const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      
      // Get managers and admins usernames
      const managersAndAdmins = localUsers.filter(user => 
        user.role === "manager" || user.role === "admin"
      );

      if (!managersAndAdmins.length) {
        console.log('No managers or admins found');
        return;
      }

      // Get usernames of managers and admins
      const managerUsernames = managersAndAdmins.map(user => user.username);
      console.log('Manager and admin usernames:', managerUsernames);

      // Create notification data
      const notificationData = {
        ...notification,
        forRoles: ["manager", "admin"], // Send to all managers and admins by role
        timestamp: new Date().toISOString(),
        read: false
      };

      console.log('Notification data before sending:', notificationData);
      
      // Send notification
      addNotification(notificationData);
      
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification to managers and admins:', error);
    }
  };

  const handleStatusChange = (trip, newStatus) => {
    const updatedTrip = { ...trip, status: newStatus };
    const updatedTrips = allTrips.map(t => t.id === trip.id ? updatedTrip : t);
    setAllTrips(updatedTrips);
    
    // If the trip is completed, send a notification
    if (newStatus === "completed") {
      // Find customer name for the trip
      const customerName = trip.customer ? customers.find(c => c.id === trip.customer)?.name : null;
      
      // Get employee name for the trip
      const employeeName = trip.employee;
      
      // Send notification only to the employee responsible for the trip
      if (employeeName) {
        notifyTripCompletion(trip.tripNumber || trip.id, customerName, employeeName);
      }
    }
    
    toast({
      title: "تم تغيير حالة الرحلة",
    });

    // إرسال إشعار للمدراء والمسؤولين
    const statusTranslations = {
      active: "قيد التنفيذ",
      completed: "مكتملة",
      cancelled: "ملغاة"
    };
    const translatedStatus = statusTranslations[newStatus] || newStatus;

    notifyManagersAndAdmins({
          type: 'trip-status-changed',
          title: `تم تغيير حالة رحلة إلى ${translatedStatus}`,
          message: `قام الموظف ${userData?.name || 'المسؤول'} بتغيير حالة الرحلة رقم ${trip.tripNumber} إلى ${translatedStatus}.`,
          path: `/trips?tripId=${trip.id}`,
          icon: newStatus === 'completed' ? 'CheckCircle2' : newStatus === 'cancelled' ? 'XCircle' : 'Clock',
          color: newStatus === 'completed' ? 'green' : newStatus === 'cancelled' ? 'red' : 'blue'
    });
  };

  const handleCopyBooking = (trip) => {
    // Get trip type name
    const tripTypeName = tripTypes.find(t => t.id === trip.type)?.name || trip.type;
    
    // Get vehicle type name
    const vehicleTypeName = vehicleTypes.find(v => v.id === trip.vehicleType)?.name || trip.vehicleType;
    
    // Calculate due amount (collection amount)
    const tripPrice = parseFloat(trip.tripPrice) || 0;
    const paidAmount = parseFloat(trip.paidAmount) || 0;
    const collection = parseFloat(trip.collection) || 0;
    
    // Create booking message in the format specified by the user
    let message = `*تم تأكيد حجز رقم ${trip.tripNumber}*\n`;
    message += `> *بيانات التواصل*\n`;
    message += `* *الأسم:* أ/${trip.customerName}\n`;
    message += `* *الهاتف:* ${trip.customerPhone}\n`;
    message += `* *واتساب:* ${trip.customerWhatsapp || trip.customerPhone}\n\n`;
    
    message += `> *تفاصيل الحجز:*\n`;
    message += `* *التاريخ:* ${trip.date}\n`;
    message += `* *البيان:* ${tripTypeName}\n`;
    message += `* *نوع السيارة:* ${vehicleTypeName}\n`;
    message += `* *الكمية:* ${trip.quantity || '1'}\n`;
    message += `* *التحرك* :\n1. الساعة ${trip.route}\n`;
    message += `*دفع مع السائق: ${collection}ج.م*\n\n`;
    
    message += `> *المدفوعات:*\n`;
    message += `* *الإجمالي:* ${tripPrice}ج.م\n`;
    message += `* *مدفوع:* ${paidAmount}ج.م\n`;
    message += `*المبلغ المستحق: ${collection}ج.م*`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(message);
    toast({
      title: "تم نسخ الرسالة بنجاح",
      description: "تم نسخ رسالة الحجز للواتساب بنجاح",
    });
  };

  const handleCopyDriver = (trip) => {
    // Create driver details message in the format specified by the user
    let message = `*بيانات السائق*\n`;
    message += `الأسم: ${trip.driverName || 'غير محدد'}\n`;
    message += `الهاتف: ${trip.driverPhone || 'غير محدد'}`;

    // Copy to clipboard
    navigator.clipboard.writeText(message);
    toast({
      title: "تم نسخ البيانات بنجاح",
      description: "تم نسخ بيانات السائق بنجاح",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
    // Validation for trip details
    if (!formData.type || !formData.date || !formData.route || !formData.tripPrice) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول الأساسية للرحلة (النوع، التاريخ، المسار، سعر الرحلة)",
        variant: "destructive"
      });
      return;
    }
    
    // Additional validation for commercial price if it is not zero
    if (parseFloat(formData.commercialPrice) !== 0 && !formData.commercialPrice) {
          toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال السعر التجاري أو التأكد من أنه صفر",
        variant: "destructive"
      });
      return;
    }
    
    // Validate that paid amount does not exceed trip price
    if (parseFloat(formData.paidAmount) > parseFloat(formData.tripPrice)) {
            toast({
        title: "خطأ في المبلغ المدفوع",
        description: "لا يمكن أن يكون المبلغ المدفوع أكبر من سعر الرحلة",
        variant: "destructive"
            });
      return;
          }
        
    const tripData = {
          ...formData,
      tripNumber: formData.tripNumber || generateTripNumber(allTrips),
        status: formData.status || determineStatus(formData.date),
        employee: formData.employee || userData?.name,
        isSettled: formData.isSettled || false,
      createdAt: currentTrip?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentTrip?.createdBy || userData?.name || "System",
      updatedBy: userData?.name || "System",
    };

    let updatedTrips;
      const isNewTrip = !currentTrip;

    if (currentTrip) {
        updatedTrips = allTrips.map(trip => 
          trip.id === currentTrip.id ? { ...tripData, id: currentTrip.id } : trip
        );
    } else {
      const newTripWithId = { ...tripData, id: Date.now().toString() };
      updatedTrips = [newTripWithId, ...allTrips];
    }

              setAllTrips(updatedTrips);
    setIsDialogOpen(false);
    setCurrentTrip(null);
      setFormData({});
      
              toast({
        title: isNewTrip ? "تم إضافة الرحلة" : "تم تحديث الرحلة",
        description: isNewTrip 
          ? `تم إضافة الرحلة رقم ${tripData.tripNumber} بنجاح.`
          : `تم تحديث الرحلة رقم ${tripData.tripNumber} بنجاح.`
    });

      // إرسال الإشعار للمدراء والمسؤولين
      notifyManagersAndAdmins({
        type: isNewTrip ? 'trip-added' : 'trip-updated',
        title: isNewTrip ? "تم إضافة رحلة جديدة" : "تم تعديل رحلة",
        message: isNewTrip
          ? `قام الموظف ${userData?.name || 'المسؤول'} بإضافة رحلة جديدة برقم ${tripData.tripNumber}`
          : `قام الموظف ${userData?.name || 'المسؤول'} بتعديل بيانات الرحلة رقم ${tripData.tripNumber}`,
            path: `/trips?tripId=${tripData.id}`,
        icon: isNewTrip ? 'PlusCircle' : 'Edit',
        color: isNewTrip ? 'green' : 'blue'
          });

    } catch (error) {
      console.error('خطأ في حفظ الرحلة:', error);
      toast({
        title: "خطأ في حفظ الرحلة",
        description: "حدث خطأ أثناء محاولة حفظ الرحلة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!tripToDelete) return;

    try {
      const updatedTrips = allTrips.filter(trip => trip.id !== tripToDelete.id);
      setAllTrips(updatedTrips);
      setIsDeleteDialogOpen(false);
    
      toast({
      title: "تم حذف الرحلة",
      description: `تم حذف الرحلة رقم ${tripToDelete.tripNumber} بنجاح`,
    });

      // إرسال إشعار للمدراء والمسؤولين
      notifyManagersAndAdmins({
          type: 'trip-deleted',
          title: "تم حذف رحلة",
        message: `قام الموظف ${userData?.name || 'المسؤول'} بحذف الرحلة رقم ${tripToDelete.tripNumber}`,
          path: '/trips',
          icon: 'Trash2',
          color: 'red'
    });

    setTripToDelete(null);
    } catch (error) {
      console.error('خطأ في حذف الرحلة:', error);
      toast({
        title: "خطأ في حذف الرحلة",
        description: "حدث خطأ أثناء محاولة حذف الرحلة",
        variant: "destructive"
      });
    }
  };
  
  const handleSettlementConfirm = () => {
    if (tripToSettle) {
      // Don't allow changing settlement status to false if trip is cancelled
      if (tripToSettle.status === "cancelled" && tripToSettle.isSettled) {
        toast({
          title: "لا يمكن إلغاء تسوية الرحلات الملغاة",
          description: "الرحلات الملغاة يجب أن تكون مسواة دائمًا",
          variant: "destructive"
        });
        setTripToSettle(null);
        setIsSettlementDialogOpen(false);
        return;
      }
      
      const updatedTrips = allTrips.map(trip => 
        trip.id === tripToSettle.id ? { ...trip, isSettled: !trip.isSettled } : trip
      );
      setAllTrips(updatedTrips);
      
      // Update displayed trips if needed
      if (displayTrips.some(trip => trip.id === tripToSettle.id)) {
        const updatedDisplayTrips = displayTrips.map(trip => 
          trip.id === tripToSettle.id ? { ...trip, isSettled: !trip.isSettled } : trip
        );
        setDisplayTrips(updatedDisplayTrips);
      }
      
      setTripToSettle(null);
      setIsSettlementDialogOpen(false);
      toast({
        title: tripToSettle.isSettled ? "تم إلغاء تسوية الرحلة" : "تم تسوية الرحلة بنجاح",
      });
    }
  };

  // Handle bulk selection for checkboxes
  const handleSelectAllTrips = (checked) => {
    if (checked) {
      setSelectedTrips(filteredTrips.map(trip => trip.id));
    } else {
      setSelectedTrips([]);
    }
  };

  const handleSelectTrip = (tripId, checked, e) => {
    e.stopPropagation(); // Prevent row click event
    
    if (checked) {
      setSelectedTrips(prev => [...prev, tripId]);
    } else {
      setSelectedTrips(prev => prev.filter(id => id !== tripId));
    }
  };

  // Bulk actions handlers
  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    const updatedAllTrips = allTrips.filter(trip => !selectedTrips.includes(trip.id));
    setAllTrips(updatedAllTrips);
    
    // Update displayed trips
    const updatedDisplayTrips = displayTrips.filter(trip => !selectedTrips.includes(trip.id));
    setDisplayTrips(updatedDisplayTrips);
    
    setSelectedTrips([]);
    setIsBulkDeleteDialogOpen(false);
    toast({
      title: "تم حذف الرحلات المحددة",
      description: `تم حذف ${selectedTrips.length} رحلة بنجاح`,
    });
  };

  const handleBulkSettlement = (action) => {
    setBulkSettlementAction(action);
    setIsBulkSettlementDialogOpen(true);
  };

  const confirmBulkSettlement = () => {
    const isSettled = bulkSettlementAction === 'settled';
    
    // If trying to unsettled trips, check if any are cancelled and can't be unsettled
    if (!isSettled) {
      const cancelledTrips = allTrips.filter(trip => 
        selectedTrips.includes(trip.id) && trip.status === "cancelled"
      );
      
      if (cancelledTrips.length > 0) {
        toast({
          title: "لا يمكن إلغاء تسوية الرحلات الملغاة",
          description: `${cancelledTrips.length} من الرحلات المحددة هي رحلات ملغاة ولا يمكن إلغاء تسويتها`,
          variant: "destructive"
        });
        
        // Just proceed with the non-cancelled trips
        const updatedAllTrips = allTrips.map(trip => 
          selectedTrips.includes(trip.id) && trip.status !== "cancelled" ? { ...trip, isSettled } : trip
        );
        setAllTrips(updatedAllTrips);
        
        // Update displayed trips
        const updatedDisplayTrips = displayTrips.map(trip => 
          selectedTrips.includes(trip.id) && trip.status !== "cancelled" ? { ...trip, isSettled } : trip
        );
        setDisplayTrips(updatedDisplayTrips);
        
        setSelectedTrips([]);
        setIsBulkSettlementDialogOpen(false);
        return;
      }
    }
    
    // Normal flow
    const updatedAllTrips = allTrips.map(trip => 
      selectedTrips.includes(trip.id) ? { ...trip, isSettled } : trip
    );
    setAllTrips(updatedAllTrips);
    
    // Update displayed trips
    const updatedDisplayTrips = displayTrips.map(trip => 
      selectedTrips.includes(trip.id) ? { ...trip, isSettled } : trip
    );
    setDisplayTrips(updatedDisplayTrips);
    setSelectedTrips([]);
    setIsBulkSettlementDialogOpen(false);
    toast({
      title: isSettled ? "تم تسوية الرحلات المحددة" : "تم إلغاء تسوية الرحلات المحددة",
      description: `تم تعديل حالة ${selectedTrips.length} رحلة بنجاح`,
    });
  };

  const handleBulkStatusChange = () => {
    setIsBulkStatusDialogOpen(true);
  };

  const confirmBulkStatusChange = () => {
    const updatedAllTrips = allTrips.map(trip => 
      selectedTrips.includes(trip.id) ? { ...trip, status: "cancelled", isSettled: true } : trip
    );
    setAllTrips(updatedAllTrips);
    
    // Update displayed trips
    const updatedDisplayTrips = displayTrips.map(trip => 
      selectedTrips.includes(trip.id) ? { ...trip, status: "cancelled", isSettled: true } : trip
    );
    setDisplayTrips(updatedDisplayTrips);
    
    setSelectedTrips([]);
    setIsBulkStatusDialogOpen(false);
    toast({
      title: "تم تغيير حالة الرحلات المحددة",
      description: `تم تعديل حالة ${selectedTrips.length} رحلة إلى 'ملغاة' بنجاح وتعيينها كمسواة تلقائيًا`,
    });
  };

  // Function to export trips to Excel
  const handleExportToExcel = () => {
    try {
      // Create the worksheet data
      const worksheetData = filteredTrips.map(trip => ({
        'رقم الرحلة': trip.tripNumber,
        'النوع': tripTypes.find(t => t.id === trip.type)?.name || '',
        'التاريخ': trip.date,
        'المسار': trip.route,
        'الكمية': trip.quantity || 1,
        'السعر التجاري': trip.commercialPrice,
        'سعر الرحلة': trip.tripPrice,
        'المبلغ المدفوع': trip.paidAmount,
        'التحصيل': trip.collection,
        'العمولة': trip.commission,
        'المورد': suppliers.find(s => s.id === Number(trip.supplier))?.name || '',
        'الحالة': trip.status === 'completed' ? 'مكتملة' : trip.status === 'active' ? 'قيد التنفيذ' : 'ملغاة',
        'تمت التسوية': trip.isSettled ? 'نعم' : 'لا'
      }));

      // Convert worksheet data to Excel file
      const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: false });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
      
      // Generate Excel file
      XLSX.writeFile(workbook, `trips-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${worksheetData.length} رحلة إلى ملف Excel`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title} <span className="text-base font-normal text-gray-500 dark:text-gray-400">({filteredTrips.length})</span>
          </h2>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة رحلة جديدة
          </Button>
        </div>
      )}

      <TripFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customDate={customDate}
        onCustomDateChange={setCustomDate}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        selectedSuppliers={selectedSuppliers}
        onSuppliersFilterChange={setSelectedSuppliers}
        suppliers={suppliers}
        selectedEmployees={selectedEmployees}
        onEmployeesFilterChange={setSelectedEmployees}
        employees={employees}
        settlementStatus={settlementStatus}
        onSettlementStatusChange={setSettlementStatus}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction);
        }}
      />

      {filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {selectedTrips.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-700 dark:text-blue-400 font-medium">
                  تم تحديد {selectedTrips.length} رحلة
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTrips([])}>
                  إلغاء التحديد
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleBulkSettlement('settled')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  تسوية
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleBulkSettlement('unsettled')}
                >
                  <XCircle className="h-4 w-4" />
                  إلغاء التسوية
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleBulkStatusChange}
                >
                  <AlertTriangle className="h-4 w-4" />
                  تغيير إلى ملغاة
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </Button>
              </div>
            </div>
          )}

          <TripTable
            filteredTrips={filteredTrips}
            suppliers={suppliers}
            selectedTrips={selectedTrips}
            onSelectTrip={handleSelectTrip}
            onSelectAll={handleSelectAllTrips}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onCopyBooking={handleCopyBooking}
            onCopyDriver={handleCopyDriver}
            onSettlement={handleSettlement}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onGenerateInvoice={handleGenerateInvoice}
          />
        </>
      )}

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

      <SettlementDialog
        open={isSettlementDialogOpen}
        onOpenChange={setIsSettlementDialogOpen}
        tripToSettle={tripToSettle}
        onConfirm={handleSettlementConfirm}
      />
      
      {/* Status Change Dialog - especially for cancellation confirmation */}
      <AlertDialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير حالة الرحلة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تغيير حالة الرحلة إلى 'ملغاة'؟
              <br />
              <span className="font-bold">ملاحظة:</span> سيتم تعيين حالة التسوية إلى 'نعم' تلقائيًا للرحلات الملغاة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              // Update allTrips
              const updatedAllTrips = allTrips.map(t => 
                t.id === tripStatusData.trip.id ? { ...t, status: "cancelled", isSettled: true } : t
              );
              setAllTrips(updatedAllTrips);
              
              // Update displayTrips if needed
              if (displayTrips.some(t => t.id === tripStatusData.trip.id)) {
                const updatedDisplayTrips = displayTrips.map(t => 
                  t.id === tripStatusData.trip.id ? { ...t, status: "cancelled", isSettled: true } : t
                );
                setDisplayTrips(updatedDisplayTrips);
              }
              
              setIsStatusChangeDialogOpen(false);
              toast({
                title: "تم تغيير حالة الرحلة إلى ملغاة",
                description: "تم تعيين حالة التسوية إلى 'نعم' تلقائيًا"
              });
            }} className="bg-red-600 hover:bg-red-700">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف متعدد</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedTrips.length} رحلة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Settlement Dialog */}
      <AlertDialog open={isBulkSettlementDialogOpen} onOpenChange={setIsBulkSettlementDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير حالة التسوية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من {bulkSettlementAction === 'settled' ? 'تسوية' : 'إلغاء تسوية'} {selectedTrips.length} رحلة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkSettlement}>
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Change Dialog */}
      <AlertDialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير حالة الرحلات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تغيير حالة {selectedTrips.length} رحلة إلى 'ملغاة'؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkStatusChange} className="bg-yellow-600 hover:bg-yellow-700">
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TripsView;
