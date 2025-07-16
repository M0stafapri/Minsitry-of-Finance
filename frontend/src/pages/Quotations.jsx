import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Edit, Eye, X, MoreVertical, Check, Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Quotations() {
  const [quotations, setQuotations] = useLocalStorage("quotations", []);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [quotationToDelete, setQuotationToDelete] = React.useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [selectedQuotation, setSelectedQuotation] = React.useState(null);
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

  // Filter quotations based on search, status, and date
  const filteredQuotations = React.useMemo(() => {
    let filtered = quotations;
    
    if (userData.role === 'موظف') {
      filtered = quotations.filter(quote => quote.createdBy === userData.name);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        Object.values(quote).some(
          value => typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      const statusMap = {
        'pending': 'معلق',
        'accepted': 'مقبول',
        'rejected': 'مرفوض'
      };
      filtered = filtered.filter(quote => quote.status === statusMap[selectedStatus]);
    }

    // Apply date filter
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(quote => {
        const quoteDate = new Date(quote.date);
        const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
        return (
          quoteDate.getFullYear() === filterYear &&
          (quoteDate.getMonth() + 1) === filterMonth
        );
      });
    }

    return filtered;
  }, [quotations, userData, searchTerm, selectedStatus, selectedMonth]);

  const formatCurrency = (amount) => {
    if (amount === 0 || amount === '0' || !amount) {
      return '0.00 ج.م';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' ج.م';
  };

  const formatNumber = (amount) => {
    if (amount === 0 || amount === '0' || !amount) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleAdd = () => {
    navigate("/quotations/create");
  };

  const handleStatusChangeConfirm = () => {
    const { quote, newStatus } = statusChangeDetails;
    
    // Update quotation with new status and paid amount
    const updatedQuotation = {
      ...quote,
      status: newStatus,
      paidAmount: quote.totalAmount,
      remainingAmount: 0
    };

    const updatedQuotations = quotations.map(q => 
      q.id === quote.id ? updatedQuotation : q
    );
    
    setQuotations(updatedQuotations);
    setIsStatusChangeDialogOpen(false);
    setStatusChangeDetails(null);
    
    toast({
      title: "تم تغيير حالة عرض السعر",
      description: `تم تغيير حالة عرض السعر إلى ${newStatus}`
    });
  };

  const handleChangeStatus = (quote, newStatus) => {
    const updatedQuotations = quotations.map(q => 
      q.id === quote.id ? { ...q, status: newStatus } : q
    );
    setQuotations(updatedQuotations);
    toast({
      title: "تم تغيير حالة عرض السعر",
      description: `تم تغيير حالة عرض السعر إلى ${newStatus}`
    });
  };

  const handleViewQuotation = (quote) => {
    setSelectedQuotation(quote);
    setIsViewDialogOpen(true);
  };

  const handleDeleteQuotation = () => {
    const updatedQuotations = quotations.filter(q => q.id !== quotationToDelete.id);
    setQuotations(updatedQuotations);
    setIsDeleteDialogOpen(false);
    setQuotationToDelete(null);
    toast({
      title: "تم حذف عرض السعر",
      description: "تم حذف عرض السعر بنجاح"
    });
  };

  const downloadQuotation = (quote) => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = async () => {
        const content = document.createElement('div');
        content.style.width = '210mm';
        content.style.padding = '0';
        content.style.margin = '0';
        content.style.backgroundColor = 'white';
        content.style.direction = 'rtl';
        content.style.fontFamily = 'Tajawal, Arial, sans-serif';

        // Create content HTML
        content.innerHTML = `
          <div style="
            width: 100%;
            margin: 0 auto;
            padding: 5px 30px;
            position: relative;
            background: white;
            box-sizing: border-box;
          ">
            <!-- Background Logo Watermark -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 70%;
              height: 70%;
              background: url('/src/assets/img/logo.png') no-repeat center;
              background-size: contain;
              opacity: 0.03;
              z-index: 0;
            "></div>

            <!-- Header -->
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              width: 100%;
              position: relative;
              z-index: 1;
            ">
              <!-- Company Info -->
              <div style="
                text-align: right;
                flex: 1;
                display: flex;
                align-items: flex-start;
                gap: 10px;
              ">
                <img src="/src/assets/img/logo.png" style="
                  width: 65px;
                  height: auto;
                  object-fit: contain;
                " />
                <div>
                  <div style="
                    font-size: 18px;
                    font-weight: bold;
                    color: #002c77;
                    margin-bottom: 2px;
                  ">الدولية للنقل السياحي</div>
                  <div style="
                    font-size: 11px;
                    color: #666;
                    line-height: 1.3;
                  ">
                    27ش ميدان ابن الحكم، امام دنيا الجمبري<br>
                    برج المرمر، الدور السادس<br>
                    حلمية الزيتون، القاهرة
                  </div>
                </div>
              </div>

              <!-- Quote Info -->
              <div style="
                text-align: left;
                flex: 1;
              ">
                <div style="
                  font-size: 20px;
                  font-weight: bold;
                  color: #002c77;
                  margin-bottom: 3px;
                  text-align: left;
                ">عرض سعر</div>
                <div style="
                  font-size: 12px;
                  color: #666;
                  line-height: 1.3;
                  text-align: left;
                ">
                  رقم: ${quote.id}<br>
                  التاريخ: ${quote.date}
                </div>
              </div>
            </div>

            <!-- Customer Info -->
            <div style="
              margin-bottom: 15px;
              padding: 12px 15px;
              background-color: #f8fafc;
              border-radius: 6px;
            ">
              <div style="font-size: 14px;">
                <strong>السادة/</strong> ${quote.customerName}
              </div>
              <div style="
                margin-top: 8px;
                font-size: 14px;
                line-height: 1.4;
              ">
                تحية طيبة وبعد ...<br>
                يسعدنا نحن الشركة الدولية للنقل السياحي وإيجار السيارات أن نقدم لسيادتكم عرض سعر على النحو التالي:
              </div>
            </div>

            <!-- Items Table -->
                          <table style="
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              text-align: right;
            ">
              <thead>
                <tr>
                  <th style="
                    border: 0.5px solid #ccc;
                    padding: 6px 8px;
                    background-color: #002c77;
                    color: white;
                    font-size: 13px;
                    text-align: right;
                    width: 20%;
                  ">البند</th>
                  <th style="
                    border: 0.5px solid #ccc;
                    padding: 6px 8px;
                    background-color: #002c77;
                    color: white;
                    font-size: 13px;
                    text-align: right;
                    width: 35%;
                  ">البيان</th>
                  <th style="
                    border: 0.5px solid #ccc;
                    padding: 6px 8px;
                    background-color: #002c77;
                    color: white;
                    font-size: 13px;
                    text-align: left;
                    width: 15%;
                  ">سعر الوحدة</th>
                  <th style="
                    border: 0.5px solid #ccc;
                    padding: 6px 8px;
                    background-color: #002c77;
                    color: white;
                    font-size: 13px;
                    text-align: left;
                    width: 10%;
                  ">الكمية</th>
                  <th style="
                    border: 0.5px solid #ccc;
                    padding: 6px 8px;
                    background-color: #002c77;
                    color: white;
                    font-size: 13px;
                    text-align: left;
                    width: 15%;
                  ">المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items.map(item => `
                  <tr>
                    <td style="
                      border: 0.5px solid #ccc;
                      padding: 6px 8px;
                      font-size: 13px;
                      text-align: right;
                      background-color: #fff;
                    ">${item.item}</td>
                    <td style="
                      border: 0.5px solid #ccc;
                      padding: 6px 8px;
                      font-size: 13px;
                      text-align: right;
                      background-color: #fff;
                    ">${item.description}</td>
                    <td style="
                      border: 0.5px solid #ccc;
                      padding: 6px 8px;
                      font-size: 13px;
                      text-align: left;
                      background-color: #fff;
                    ">${formatNumber(item.unitPrice)}</td>
                    <td style="
                      border: 0.5px solid #ccc;
                      padding: 6px 8px;
                      font-size: 13px;
                      text-align: left;
                      background-color: #fff;
                    ">${item.quantity}</td>
                    <td style="
                      border: 0.5px solid #ccc;
                      padding: 6px 8px;
                      font-size: 13px;
                      text-align: left;
                      background-color: #fff;
                    ">${formatNumber(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals Section -->
            <div style="
              width: 300px;
              margin-right: auto;
              margin-left: 0;
              margin-bottom: 15px;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 10px;
                background-color: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
              ">
                <span style="font-weight: bold; font-size: 13px;">المجموع الفرعي:</span>
                <span style="text-align: left; font-size: 13px;">${formatNumber(quote.subtotal)} ج.م</span>
              </div>

              ${quote.includeVAT ? `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  padding: 6px 10px;
                  background-color: #f0fdf4;
                  border-bottom: 1px solid #e2e8f0;
                  color: #16a34a;
                ">
                  <span style="font-weight: bold; font-size: 13px;">ضريبة القيمة المضافة (14%):</span>
                  <span style="text-align: left; font-size: 13px;">${formatNumber(quote.vatAmount)} ج.م</span>
                </div>
              ` : ''}

              ${quote.includeTaxDiscount ? `
                <div style="
                  display: flex;
                  justify-content: space-between;
                  padding: 6px 10px;
                  background-color: #fef2f2;
                  border-bottom: 1px solid #e2e8f0;
                  color: #dc2626;
                ">
                  <span style="font-weight: bold; font-size: 13px;">الخصم الضريبي (3%):</span>
                  <span style="text-align: left; font-size: 13px;">-${formatNumber(quote.taxDiscountAmount)} ج.م</span>
                </div>
              ` : ''}

              <div style="
                display: flex;
                justify-content: space-between;
                padding: 8px 10px;
                background-color: #002c77;
                color: white;
                font-size: 15px;
                font-weight: bold;
                margin-top: 2px;
                border-radius: 0 0 6px 6px;
              ">
                <span>الإجمالي:</span>
                <span style="text-align: left;">${formatNumber(quote.totalAmount)} ج.م</span>
              </div>
            </div>

                          <!-- Notes Section -->
            <div style="
              margin: 15px 0;
              padding: 12px 15px;
              background-color: #fff5f5;
              border: 1px solid #dc2626;
              border-radius: 6px;
            ">
              <div style="
                color: #dc2626;
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 14px;
              ">ملاحظات هامة:</div>
              ${quote.notes ? `
              <ul style="
                color: #dc2626;
                list-style-type: disc;
                padding-right: 20px;
                margin: 0;
                line-height: 1.5;
                font-size: 13px;
              ">
                ${quote.notes.split('\n').map(line => line.trim() ? `<li style="margin-bottom: 5px;">${line}</li>` : '').join('')}
              </ul>
              ` : ''}
            </div>

            <!-- Spacer -->
            <div style="flex-grow: 1; min-height: 30px;"></div>

            <!-- Footer with Contact Info -->
            <div style="
              width: 100%;
              margin-top: 30px;
              padding: 10px 0;
              border-top: 1px solid #e2e8f0;
              text-align: right;
              color: #444;
              direction: rtl;
              font-size: 11px;
              line-height: 1.4;
            ">
              <div style="margin-bottom: 4px;">
                <span><strong>البريد الإلكتروني: </strong>info@dawliacars.com</span>
                <span style="margin: 0 8px;">|</span>
                <span><strong>موبايل: </strong>01005839672</span>
                <span style="margin: 0 8px;">|</span>
                <span><strong>موبايل: </strong>01099219028</span>
              </div>
              <div>
                <strong>العنوان: </strong>27ش ميدان ابن الحكم، امام دنيا الجمبري، برج المرمر، الدور السادس، حلمية الزيتون، القاهرة
              </div>
            </div>
          </div>
        `;

        // Add to document temporarily
        document.body.appendChild(content);

        try {
          // Configure pdf options with better image handling
          const opt = {
            filename: `عرض-سعر-${quote.id}.pdf`,
            margin: [10, 0, 10, 0], // [top, right, bottom, left]
            image: { 
              type: 'jpeg', 
              quality: 1
            },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
              imageTimeout: 0
            },
            jsPDF: {
              unit: 'mm',
              format: 'a4',
              orientation: 'portrait',
              compress: true
            }
          };

          // Generate PDF
          const worker = html2pdf().from(content).set(opt);
          await worker.save();

          toast({
            title: "تم تحميل عرض السعر",
            description: "تم تحميل عرض السعر بنجاح"
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast({
            title: "خطأ في تحميل عرض السعر",
            description: "حدث خطأ أثناء إنشاء ملف PDF",
            variant: "destructive"
          });
        } finally {
          // Clean up
          if (document.body.contains(content)) {
            document.body.removeChild(content);
          }
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        }
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
      console.error('Error in downloadQuotation:', error);
      toast({
        title: "خطأ في تحميل عرض السعر",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive"
      });
    }
  };

  // Update status map
  const statusMap = {
    'pending': 'معلق',
    'accepted': 'مقبول',
    'rejected': 'مرفوض'
  };

  // Update status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'مقبول':
        return 'bg-green-100 text-green-800';
      case 'مرفوض':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getEmptyStateMessage = () => {
    if (selectedMonth !== 'all') {
      const date = new Date(selectedMonth + '-01');
      const monthName = new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(date);
      const year = date.getFullYear();
      return {
        title: `لا يوجد عروض أسعار في ${monthName} ${year}`,
        subtitle: 'قم بتغيير الشهر أو إنشاء عرض سعر جديد'
      };
    }
    
    if (searchTerm) {
      return {
        title: 'لا توجد نتائج بحث',
        subtitle: 'حاول تغيير كلمات البحث'
      };
    }

    if (selectedStatus !== 'all') {
      const statusMap = {
        'pending': 'معلق',
        'accepted': 'مقبول',
        'rejected': 'مرفوض'
      };
      return {
        title: `لا يوجد عروض أسعار بحالة ${statusMap[selectedStatus]}`,
        subtitle: 'قم بتغيير الحالة أو إنشاء عرض سعر جديد'
      };
    }

    return {
      title: 'لا يوجد عروض أسعار',
      subtitle: 'قم بإنشاء عرض سعر جديد'
    };
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">عروض الأسعار</h1>
        <Button onClick={handleAdd}>إنشاء عرض سعر جديد</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-4">
            <input
              type="month"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <select
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="accepted">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-right py-4 px-6 font-bold">رقم عرض السعر</th>
                <th className="text-right py-4 px-6">التاريخ</th>
                <th className="text-right py-4 px-6">العميل</th>
                <th className="text-right py-4 px-6">المبلغ</th>
                <th className="text-right py-4 px-6">الحالة</th>
                <th className="text-right py-4 px-6">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-lg">{getEmptyStateMessage().title}</span>
                      <span className="text-sm">{getEmptyStateMessage().subtitle}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((quote) => (
                    <motion.tr
                      key={quote.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold">{quote.id}</td>
                      <td className="py-4 px-6">{quote.date}</td>
                      <td className="py-4 px-6">{quote.customerName}</td>
                      <td className="py-4 px-6 text-blue-600 dark:text-blue-400 font-medium">
                        {formatCurrency(quote.totalAmount)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadQuotation(quote)}
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
                              <DropdownMenuItem onClick={() => handleViewQuotation(quote)}>
                                <Eye className="h-4 w-4 ml-2" />
                                عرض عرض السعر
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/quotations/edit/${quote.id}`, { state: { quote } })}>
                                <Edit className="h-4 w-4 ml-2" />
                                تعديل عرض السعر
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Clock className="h-4 w-4 ml-2" />
                                  تغيير الحالة
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem 
                                    onClick={() => handleChangeStatus(quote, 'معلق')}
                                  >
                                    <Clock className="h-4 w-4 ml-2" />
                                    معلق
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleChangeStatus(quote, 'مقبول')}
                                  >
                                    <Check className="h-4 w-4 ml-2" />
                                    مقبول
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleChangeStatus(quote, 'مرفوض')}
                                  >
                                    <Ban className="h-4 w-4 ml-2" />
                                    مرفوض
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                onClick={() => {
                                  setQuotationToDelete(quote);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4 ml-2" />
                                حذف عرض السعر
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف عرض السعر رقم {quotationToDelete?.id}؟
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setQuotationToDelete(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteQuotation}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="quotation-status-description">
          <DialogHeader>
            <DialogTitle>تأكيد تغيير حالة عرض السعر</DialogTitle>
            <div id="quotation-status-description" className="text-sm text-gray-500">
              هل تريد تغيير حالة عرض السعر؟ سيتم تحديث حالة عرض السعر.
            </div>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]" aria-describedby="quotation-view-description">
          <DialogHeader>
            <DialogTitle>عرض عرض السعر</DialogTitle>
            <div id="quotation-view-description" className="text-sm text-gray-500">
              تفاصيل عرض السعر رقم {selectedQuotation?.id}
            </div>
          </DialogHeader>
          
          {selectedQuotation && (
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
                  <div className="text-xl font-semibold">عرض سعر #{selectedQuotation.id}</div>
                  <div className="text-sm text-gray-600">
                    <div>التاريخ: {selectedQuotation.date}</div>
                    <div>التوقيع: {selectedQuotation.customerName}</div>
                  </div>
                </div>
              </div>

              {/* Quotation Items */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right">البند</th>
                      <th className="px-4 py-2 text-right">البيان</th>
                      <th className="px-4 py-2 text-right">سعر الوحدة</th>
                      <th className="px-4 py-2 text-right">الكمية</th>
                      <th className="px-4 py-2 text-right">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotation.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.item}</td>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2">{formatNumber(item.unitPrice)}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">{formatNumber(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quotation Summary */}
              <div className="flex flex-col items-end gap-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">المجموع الفرعي:</span>
                    <span>{formatCurrency(selectedQuotation.subtotal)}</span>
                  </div>
                  {selectedQuotation.includeVAT && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-semibold">ضريبة القيمة المضافة (14%):</span>
                      <span>{formatCurrency(selectedQuotation.vatAmount)}</span>
                    </div>
                  )}
                  {selectedQuotation.includeTaxDiscount && (
                    <div className="flex justify-between text-red-600">
                      <span className="font-semibold">الخصم الضريبي (3%):</span>
                      <span>-{formatCurrency(selectedQuotation.taxDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>الإجمالي:</span>
                    <span>{formatCurrency(selectedQuotation.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Notes */}
              <div className="border rounded-lg p-4">
                <div className="text-red-600 font-bold mb-2">ملاحظات هامة:</div>
                <ul className="text-red-600 list-disc pr-5 space-y-1">
                  <li>في حالة عطل السيارة يتم استبدالها فوراً</li>
                  <li>الأسعار قابلة للتغيير في حالة ارتفاع أسعار الوقود</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">حالة عرض السعر:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedQuotation.status)}`}>
                    {selectedQuotation.status}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => downloadQuotation(selectedQuotation)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل عرض السعر
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Quotations; 