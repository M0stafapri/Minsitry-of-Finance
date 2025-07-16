import React from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Check, 
  X, 
  MoreVertical, 
  Eye,
  Clock,
  Ban,
  CreditCard,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { withPermissionCheck } from "@/components/auth";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { tripTypes } from "@/features/trips/utils";
import { useNavigate } from "react-router-dom";

// Import Amiri font
import amiriRegular from '@/assets/fonts/Amiri-Regular.js';

function Invoices() {
  const [invoices, setInvoices] = useLocalStorage("invoices", []);
  const [allTrips] = useLocalStorage("trips", []);
  const { toast } = useToast();
  const [isTripSelectionDialogOpen, setIsTripSelectionDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tripSearchTerm, setTripSearchTerm] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedTrip, setSelectedTrip] = React.useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState(null);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = React.useState(false);
  const [statusChangeDetails, setStatusChangeDetails] = React.useState(null);
  const navigate = useNavigate();

  // Get user data
  const userData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  }, []);

  // Filter trips and invoices based on user role
  const filteredTrips = React.useMemo(() => {
    if (userData.role === 'employee') {
      return allTrips.filter(trip => trip.employee === userData.name);
    }
    return allTrips;
  }, [allTrips, userData]);

  const filteredInvoices = React.useMemo(() => {
    let filtered = invoices;
    
    if (userData.role === 'employee') {
      filtered = invoices.filter(invoice => {
        const tripNumber = invoice.tripDetails?.tripNumber;
        return filteredTrips.some(trip => trip.tripNumber === tripNumber);
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        Object.values(invoice).some(
          value => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      const statusMap = {
        'pending': 'معلق',
        'paid': 'مدفوع',
        'cancelled': 'ملغي'
      };
      filtered = filtered.filter(invoice => invoice.status === statusMap[selectedStatus]);
    }

    // Apply date filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
        return (
          invoiceDate.getFullYear() === filterYear &&
          (invoiceDate.getMonth() + 1) === filterMonth
        );
      });
    }

    return filtered;
  }, [invoices, userData, searchTerm, selectedStatus, selectedMonth, filteredTrips]);

  const _handleAdd = () => {
    setTripSearchTerm("");
    setSelectedTrip(null);
    setIsTripSelectionDialogOpen(true);
  };
  
  const handleAdd = withPermissionCheck(_handleAdd, "invoices", "add");
  
  const handleTripSelect = (trip) => {
    // Check if an invoice already exists for this trip
    const existingInvoice = invoices.find(invoice => 
      invoice.tripDetails?.tripNumber === trip.tripNumber
    );

    if (existingInvoice) {
      setIsTripSelectionDialogOpen(false);
      toast({
        title: "لا يمكن إنشاء الفاتورة",
        description: `يوجد فاتورة بالفعل لهذه الرحلة برقم ${existingInvoice.id}`,
        variant: "destructive"
      });
      return;
    }

    setIsTripSelectionDialogOpen(false);
    navigate("/invoices/create", { state: { trip } });
  };

  const handleStatusChangeConfirm = () => {
    const { invoice, newStatus } = statusChangeDetails;
    
    // Update invoice with new status and paid amount
    const updatedInvoice = {
      ...invoice,
      status: newStatus,
      paidAmount: invoice.totalAmount,
      remainingAmount: 0
    };

    const updatedInvoices = invoices.map(inv => 
      inv.id === invoice.id ? updatedInvoice : inv
    );
    
    setInvoices(updatedInvoices);
    setIsStatusChangeDialogOpen(false);
    setStatusChangeDetails(null);
    
    toast({
      title: "تم تغيير حالة الفاتورة",
      description: `تم تغيير حالة الفاتورة إلى ${newStatus}`
    });
  };

  const handleChangeStatus = (invoice, newStatus) => {
    // For changing to paid status
    if (newStatus === 'مدفوع' && invoice.remainingAmount > 0) {
      setStatusChangeDetails({ invoice, newStatus });
      setIsStatusChangeDialogOpen(true);
      return;
    }

    // For changing to pending status
    if (newStatus === 'معلق' && invoice.remainingAmount === 0) {
      toast({
        title: "لا يمكن تغيير الحالة",
        description: "لا يمكن تغيير الحالة إلى معلق لأن المبلغ المستحق يساوي 0",
        variant: "destructive"
      });
      return;
    }

    // For all other cases (including cancelled)
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoice.id ? { ...inv, status: newStatus } : inv
    );
    setInvoices(updatedInvoices);
    toast({
      title: "تم تغيير حالة الفاتورة",
      description: `تم تغيير حالة الفاتورة إلى ${newStatus}`
    });
  };

  const formatCurrency = (amount) => {
    if (amount === 0 || amount === '0') {
      return '0.00';
    }
    return `${Number(amount).toFixed(2)} ج.م`;
  };

  const downloadInvoice = (invoice) => {
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
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span style="font-weight: bold;">المبلغ المستحق</span>
              </div>
              <div style="
                grid-column: 6;
                padding: 6px 0;
                text-align: right;
                padding-right: 10px;
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-height: 32px;
              ">
                <span style="font-weight: bold;">${(invoice.remainingAmount || 0) === 0 ? '0.00' : `${Number(invoice.remainingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`}</span>
              </div>
            </div>

            <!-- Fixed Notes -->
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
    toast({
      title: "تم تحميل الفاتورة",
              description: "تم تحميل الفاتورة بصيغة PDF بنجاح"
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

  // Function to check if a trip has an invoice
  const getTripInvoice = React.useCallback((tripNumber) => {
    return invoices.find(invoice => invoice.tripDetails?.tripNumber === tripNumber);
  }, [invoices]);

  // Function to filter trips based on search criteria
  const getFilteredTrips = React.useCallback(() => {
    // Get only active and completed trips, sorted by date
    const validTrips = filteredTrips
      .filter(trip => trip.status !== 'cancelled')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // If no search term, return only the last 3 trips
    if (!tripSearchTerm.trim()) {
      return validTrips.slice(0, 3);
    }

    // Search in all relevant fields
    const searchLower = tripSearchTerm.toLowerCase().trim();
    return validTrips.filter(trip => {
      const tripNumber = String(trip.tripNumber || '');
      const destination = String(trip.destination || trip.route || '');
      const customerName = String(trip.customerName || '');
      const price = String(trip.tripPrice || trip.price || '');

      return (
        tripNumber.includes(searchLower) ||
        destination.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        price.includes(searchLower)
      );
    });
  }, [filteredTrips, tripSearchTerm]);

  const handleDeleteInvoice = () => {
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceToDelete.id);
    setInvoices(updatedInvoices);
    setIsDeleteDialogOpen(false);
    setInvoiceToDelete(null);
    toast({
      title: "تم حذف الفاتورة",
      description: "تم حذف الفاتورة بنجاح"
    });
  };

  // Add view invoice handler
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          إدارة الفواتير
          <span className="text-2xl font-medium text-gray-500">
            ({filteredInvoices.length})
          </span>
        </h1>
        <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={handleAdd}>
          <Plus className="h-5 w-5" />
          إنشاء فاتورة جديدة
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
                placeholder="بحث في الفواتير..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            
            <div className="flex gap-4 items-center">
              <select
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {(() => {
                  const months = [];
                  const today = new Date();
                  const year = today.getFullYear();
                  
                  // Add all months of current year
                  for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(year, i, 1);
                    const monthValue = `${year}-${String(i + 1).padStart(2, '0')}`;
                    const monthName = new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(monthDate);
                    months.push(
                      <option key={monthValue} value={monthValue}>
                        {monthName} {year}
                      </option>
                    );
                  }
                  
                  // Add "All Invoices" option
                  months.push(
                    <option key="all" value="all">
                      كل الفواتير
                    </option>
                  );
                  
                  return months;
                })()}
              </select>

              <select
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                }}
              >
                <option value="all">كل الحالات</option>
                <option value="pending">معلق</option>
                <option value="paid">مدفوع</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-right py-4 px-6 font-bold">رقم الفاتورة</th>
                <th className="text-right py-4 px-6">التاريخ</th>
                <th className="text-right py-4 px-6">التوقيع</th>
                <th className="text-right py-4 px-6">المبلغ</th>
                <th className="text-right py-4 px-6">الحالة</th>
                <th className="text-right py-4 px-6">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((invoice) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold">{invoice.id}</td>
                    <td className="py-4 px-6">{invoice.date}</td>
                    <td className="py-4 px-6">{invoice.customerName}</td>
                    <td className="py-4 px-6 text-blue-600 dark:text-blue-400 font-medium">
                      {formatCurrency(invoice.tripDetails?.tripPrice || invoice.amount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'مدفوع' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'معلق' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض الفاتورة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/invoices/edit/${invoice.id}`, { state: { invoice } })}>
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل الفاتورة
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Clock className="h-4 w-4 ml-2" />
                                تغيير الحالة
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={() => handleChangeStatus(invoice, 'معلق')}
                                >
                                  <Clock className="h-4 w-4 ml-2" />
                                  معلق
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleChangeStatus(invoice, 'مدفوع')}
                                >
                                  <Check className="h-4 w-4 ml-2" />
                                  مدفوع
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeStatus(invoice, 'ملغي')}>
                                  <Ban className="h-4 w-4 ml-2" />
                                  ملغي
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                              onClick={() => {
                                setInvoiceToDelete(invoice);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4 ml-2" />
                              حذف الفاتورة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              {(!filteredInvoices.length) && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 opacity-50" />
                      <span className="text-lg">لا يوجد فواتير</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trip Selection Dialog */}
      <Dialog open={isTripSelectionDialogOpen} onOpenChange={setIsTripSelectionDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>اختيار رحلة للفاتورة</DialogTitle>
            <DialogDescription>
              اختر رحلة من القائمة أدناه لإنشاء فاتورة لها
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن رحلة..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={tripSearchTerm}
              onChange={(e) => setTripSearchTerm(e.target.value)}
            />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[400px] mt-4">
            <div className="grid grid-cols-1 gap-4 p-2">
              {getFilteredTrips().map(trip => {
                const existingInvoice = getTripInvoice(trip.tripNumber);
                const isDisabled = !!existingInvoice;
                
                return (
                  <div
                    key={trip.tripNumber}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                      isDisabled 
                        ? 'border-gray-200 dark:border-gray-700 cursor-not-allowed' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md cursor-pointer'
                    } transition-all`}
                    onClick={() => !isDisabled && handleTripSelect(trip)}
                  >
                    {isDisabled && (
                      <div className="mb-3 bg-orange-50 text-orange-800 px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        تم إنشاء فاتورة برقم {existingInvoice.id}
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          {trip.tripNumber}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {trip.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {trip.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-x-6">
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1">المسار</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.destination || trip.route || 'غير محدد'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1">التوقيع</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.customerName || 'غير محدد'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold mb-1">المبلغ</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.tripPrice || trip.price || 0} ج.م
                          </div>
                        </div>
                      </div>
                      {trip.type && (
                        <div className="text-xs text-gray-500 mt-2">
                          نوع الرحلة: {tripTypes.find(t => t.id === trip.type)?.name || trip.type}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {getFilteredTrips().length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {tripSearchTerm ? "لا توجد رحلات متطابقة مع البحث" : "لا توجد رحلات متاحة"}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTripSelectionDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد حذف الفاتورة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف الفاتورة رقم {invoiceToDelete?.id}؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setInvoiceToDelete(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInvoice}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]" aria-describedby="invoice-view-description">
          <DialogHeader>
            <DialogTitle>عرض الفاتورة</DialogTitle>
            <div id="invoice-view-description" className="text-sm text-gray-500">
              عرض تفاصيل الفاتورة رقم {selectedInvoice?.id}
            </div>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">الدولية للنقل السياحي</h2>
                  <div className="text-sm text-gray-600">
                    <div>27ش ميدان ابن الحكم، امام دنيا الجمبري</div>
                    <div>برج المرمر، الدور السادس</div>
                    <div>حلمية الزيتون، القاهرة</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xl font-semibold">فاتورة #{selectedInvoice.id}</div>
                  <div className="text-sm text-gray-600">
                    <div>التاريخ: {selectedInvoice.date}</div>
                    <div>العميل: {selectedInvoice.customerName}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">البند</th>
                      <th className="px-4 py-2 text-right">التاريخ</th>
                      <th className="px-4 py-2 text-right">الوصف</th>
                      <th className="px-4 py-2 text-right">سعر الوحدة</th>
                      <th className="px-4 py-2 text-right">الكمية</th>
                      <th className="px-4 py-2 text-right">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.item}</td>
                        <td className="px-4 py-2">{item.date}</td>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Summary */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">الإجمالي:</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">المبلغ المدفوع:</span>
                    <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>المبلغ المستحق:</span>
                    <span>{formatCurrency(selectedInvoice.remainingAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Notes */}
              <div className="border-t pt-4 space-y-2 text-red-600 font-bold text-sm">
                <p>- هذه الفاتورة عادية وغير ضريبية، يُرجى مراعاة أن هذه الفاتورة تُصدر لأغراض التسجيل التجاري فقط.</p>
                <p>- يتم توفير سيارات بديلة علي الفور من نفس النوع المذكور اعلاه، وذلك في حالة تعطل السيارة او توقفها عن العمل</p>
                <p>- قد تتغير الأسعار في حالة زيادة اسعار الوقود</p>
              </div>

              {/* Invoice Status */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">حالة الفاتورة:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedInvoice.status === 'مدفوع' ? 'bg-green-100 text-green-800' :
                    selectedInvoice.status === 'معلق' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => downloadInvoice(selectedInvoice)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل الفاتورة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد تغيير حالة الفاتورة</DialogTitle>
            <DialogDescription>
              سيتم تعديل المبلغ المدفوع تلقائياً إلى {statusChangeDetails?.invoice?.totalAmount} ج.م وتغيير حالة الفاتورة إلى مدفوع.
              <br />
              هل تريد المتابعة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusChangeDialogOpen(false);
                setStatusChangeDetails(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="default"
              onClick={handleStatusChangeConfirm}
            >
              تأكيد
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Invoices;
