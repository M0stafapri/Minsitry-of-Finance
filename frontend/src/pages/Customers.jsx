import React from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, User, FileDown, Ban, RotateCcw, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { PermissionButton, withPermissionCheck } from "@/components/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { updateTripsWithCustomer } from "@/lib/utils/customerSync";
import { validatePhoneNumber, formatPhoneNumber, displayPhoneWithoutCountryCode, displayWhatsApp } from "@/lib/utils/phoneValidation";
import * as XLSX from 'xlsx';
import { customerAPI, employeeAPI } from "@/api";
import { supplierAPI } from "@/api";
import { auditLogAPI } from "@/api";

// Utility function to construct proper file URLs
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  console.log('🔍 [FILE_URL] Original path:', filePath);
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    console.log('🔍 [FILE_URL] Already full URL:', filePath);
    return filePath;
  }
  
  // If it's a relative path, construct the full URL
  // Use the base URL without /api for static file serving
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Extract base URL by removing /api/v1 if it exists
  let BASE_URL;
  if (API_BASE_URL.includes('/api/v1')) {
    BASE_URL = API_BASE_URL.replace('/api/v1', '');
  } else if (API_BASE_URL.includes('/api')) {
    BASE_URL = API_BASE_URL.replace('/api', '');
  } else {
    BASE_URL = API_BASE_URL;
  }
  
  // Remove leading slash from filePath if it exists to avoid double slashes
  const cleanFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  const fullUrl = `${BASE_URL}/${cleanFilePath}`;
  
  console.log('🔍 [FILE_URL] API_BASE_URL:', API_BASE_URL);
  console.log('🔍 [FILE_URL] BASE_URL:', BASE_URL);
  console.log('🔍 [FILE_URL] Clean file path:', cleanFilePath);
  console.log('🔍 [FILE_URL] Constructed URL:', fullUrl);
  
  return fullUrl;
};

// Function to generate a unique customer ID
const generateCustomerId = (existingCustomers) => {
  const lastCustomer = [...existingCustomers].sort((a, b) => {
    const numA = a.customerId ? parseInt(a.customerId.replace("CUST-", "")) : 0;
    const numB = b.customerId ? parseInt(b.customerId.replace("CUST-", "")) : 0;
    return numB - numA;
  })[0];
  if (!lastCustomer) return "CUST-001";
  
  const lastNumber = parseInt(lastCustomer.customerId.split("-")[1]);
  return `CUST-${String(lastNumber + 1).padStart(3, "0")}`;
}

function Customers() {
  const [customers, setCustomers] = React.useState([]);
  const [trips] = useLocalStorage("trips", []);
  const [employees, setEmployees] = React.useState([]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [suppliers, setSuppliers] = React.useState([]);
  
  // Load user data from localStorage
  const [userData, setUserData] = React.useState(null);
  const [isEmployeeRole, setIsEmployeeRole] = React.useState(false);
  
  // Load user data on component mount
  React.useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        
        // Check if user has employee role only
        setIsEmployeeRole(parsedUserData.role === 'employee');
      }
    } catch (error) {
      console.error('خطأ في قراءة بيانات المستخدم:', error);
    }
  }, []);
  
  const [formData, setFormData] = React.useState({
    customerName: "",
    assignedEmployee: "",
    notes: "",
    institutionalCode: "",
    jobTitle: "",
    nationalId: "",
    unitName: "",
    systemName: "",
    email: "",
    certificateDuration: "",
    signatureType: "",
    certificateType: "",
    issueDate: "",
    expiryDate: "",
    certificateScan: null
  });
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = React.useState({
    phone: null,
    whatsapp: null
  });
  
  // Set the employee field to the current user's _id if they have employee role
  React.useEffect(() => {
    if (userData && isEmployeeRole && employees.length > 0) {
      const found = employees.find(emp => emp.name === userData.name);
      setFormData(prev => ({
        ...prev,
        assignedEmployee: found ? found._id : ""
      }));
    }
  }, [userData, isEmployeeRole, employees]);

  // Add logic to auto-calculate expiryDate when issueDate or certificateDuration changes
  React.useEffect(() => {
    if (formData.issueDate && formData.certificateDuration) {
      const issue = new Date(formData.issueDate);
      const years = parseInt(formData.certificateDuration, 10);
      if (!isNaN(issue.getTime()) && years > 0) {
        const expiry = new Date(issue);
        expiry.setFullYear(issue.getFullYear() + years);
        setFormData(prev => ({ ...prev, expiryDate: expiry.toISOString().split('T')[0] }));
      }
    }
  }, [formData.issueDate, formData.certificateDuration]);
  
  // Function to sync customers from trips
  const syncCustomersFromTrips = React.useCallback(() => {
    // Create a map of existing customers by phone number for quick lookup
    const existingCustomersByPhone = {};
    customers.forEach(customer => {
      if (customer.personalPhone) {
        existingCustomersByPhone[customer.personalPhone] = customer;
      }
    });
    
    // Get unique customers from trips
    const newCustomers = [];
    const processedPhoneNumbers = new Set();
    
    trips.forEach(trip => {
      // Skip if no customer phone or if we've already processed this phone number
      if (!trip.customerPhone || processedPhoneNumbers.has(trip.customerPhone)) {
        return;
      }
      
      processedPhoneNumbers.add(trip.customerPhone);
      
      // Check if this customer already exists
      if (!existingCustomersByPhone[trip.customerPhone]) {
        // Create a new customer
        newCustomers.push({
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          customerId: generateCustomerId([...customers, ...newCustomers]),
          customerName: trip.customerName || "",
          personalPhone: trip.customerPhone,
          whatsAppNumber: trip.customerWhatsapp || trip.customerPhone,
          assignedEmployee: trip.employee || "", // Use the employee assigned to the trip
          notes: "",
          createdFrom: trip.tripNumber,
          createdAt: new Date().toISOString()
        });
      }
    });
    
    // If we have new customers, add them to the list
    if (newCustomers.length > 0) {
      setCustomers([...newCustomers, ...customers]);
      toast({
        title: "تم إضافة العملاء",
        description: `تم إضافة ${newCustomers.length} عميل جديد من بيانات الرحلات`
      });
    }
  }, [customers, trips, toast]);
  
  // Sync customers when the component mounts or trips change
  React.useEffect(() => {
    syncCustomersFromTrips();
  }, [syncCustomersFromTrips, trips]);

  const [customersLoading, setCustomersLoading] = React.useState(true);

  // Fetch customers from backend on mount
  React.useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerAPI.getAllCustomers();
        setCustomers(data?.data?.customers || []);
        localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
      } catch (error) {
        toast({
          title: "خطأ في تحميل العملاء",
          description: error.message || "تعذر تحميل بيانات التوقيعات من الخادم.",
          variant: "destructive",
        });
      } finally {
        setCustomersLoading(false);
      }
    };
    fetchCustomers();
  }, [toast]);

  // Fetch employees from backend on mount
  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeAPI.getAllEmployees();
        setEmployees(data?.data?.employees || []);
      } catch (error) {
        toast({
          title: "خطأ في تحميل الموظفين",
          description: error.message || "تعذر تحميل بيانات الموظفين من الخادم.",
          variant: "destructive",
        });
      }
    };
    fetchEmployees();
  }, [toast]);

  // Fetch suppliers for institutional codes
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierAPI.getAllSuppliers();
        setSuppliers(data?.data?.suppliers || []);
      } catch (error) {
        toast({
          title: "خطأ في تحميل الأكواد المؤسسية",
          description: error.message || "تعذر تحميل بيانات الأكواد المؤسسية من الخادم.",
          variant: "destructive",
        });
      }
    };
    fetchSuppliers();
  }, [toast]);

  // Filter customers based on search term and user role
  const filteredCustomers = React.useMemo(() => {
    // First filter by user role - if employee, only show their customers
    const roleFilteredCustomers = isEmployeeRole && userData
      ? customers.filter(customer => customer.assignedEmployee === userData.name)
      : customers;
    
    // Then filter by search term (search all fields)
    if (!searchTerm.trim()) return roleFilteredCustomers;
    const searchLower = searchTerm.toLowerCase();
    return roleFilteredCustomers.filter((customer) => {
      // Flatten all fields (including nested assignedEmployee.name)
      let values = Object.values(customer).map(v => {
        if (typeof v === 'object' && v !== null) {
          // If assignedEmployee, try .name
          if ('name' in v) return v.name;
          // Otherwise, join all string values
          return Object.values(v).join(' ');
        }
        return v;
      });
      // Add assignedEmployee.name explicitly if not already
      if (customer.assignedEmployee && typeof customer.assignedEmployee === 'object' && customer.assignedEmployee.name) {
        values.push(customer.assignedEmployee.name);
      }
      // Join all values as a single string
      const haystack = values.filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(searchLower);
    });
  }, [customers, searchTerm, isEmployeeRole, userData]);

  // Original function to add customer
  const _handleAdd = () => {
    setFormData({
      customerName: "",
      assignedEmployee: employees.length > 0 ? employees[0]._id : "",
      notes: "",
      institutionalCode: "",
      jobTitle: "",
      nationalId: "",
      unitName: "",
      systemName: "",
      email: "",
      certificateDuration: "",
      signatureType: "",
      certificateType: "",
      issueDate: "",
      expiryDate: "",
      certificateScan: null
    });
    setIsDialogOpen(true);
  };
  
  // Protected function with permission check
  const handleAdd = withPermissionCheck(_handleAdd, "customers", "add");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({
      phone: null,
      whatsapp: null
    });
    
    // Validate form
    if (!formData.customerName.trim() || formData.customerName.trim().split(/\s+/).length !== 4) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم صاحب التوقيع رباعي (أربعة كلمات)",
        variant: "destructive"
      });
      return;
    }
    
    // Validate employee
    if (!formData.assignedEmployee) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار الموظف المسؤول",
        variant: "destructive"
      });
      return;
    }

    if (!formData.nationalId.trim() || !/^[23][0-9]{13}$/.test(formData.nationalId)) {
      toast({
        title: "خطأ في الرقم القومي",
        description: "الرقم القومي يجب أن يبدأ بـ 2 أو 3 ويتكون من 14 رقمًا",
        variant: "destructive"
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
      if (certificateScan) formDataToSend.append('certificateScan', certificateScan);

      console.log('🔍 [FRONTEND] Creating customer with file:', certificateScan);
      console.log('🔍 [FRONTEND] FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log('🔍 [FRONTEND]', key, ':', value);
      }

      await customerAPI.createCustomer(formDataToSend);
      toast({ title: "تم إضافة صاحب التوقيع", description: "تم إضافة التوقيع بنجاح" });
      setIsDialogOpen(false);
      // Refresh customers from backend
      const data = await customerAPI.getAllCustomers();
      setCustomers(data?.data?.customers || []);
      localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
    } catch (error) {
      toast({
        title: "خطأ في إضافة التوقيع",
        description: error.message || "تعذر إضافة التوقيع.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      customerName: customer.customerName,
      assignedEmployee: customer.assignedEmployee?._id || customer.assignedEmployee || "",
      notes: customer.notes || "",
      institutionalCode: customer.institutionalCode || "",
      jobTitle: customer.jobTitle || "",
      nationalId: customer.nationalId || "",
      unitName: customer.unitName || "",
      systemName: customer.systemName || "",
      email: customer.email || "",
      certificateDuration: customer.certificateDuration || "",
      signatureType: customer.signatureType || "",
      certificateType: customer.certificateType || "",
      issueDate: customer.issueDate || "",
      expiryDate: customer.expiryDate || "",
      certificateScan: customer.certificateScan || null
    });
    setCertificateScan(null); // Reset file input for editing
    setCustomerToDelete(customer); // Reusing this state for editing
    setIsDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({
      phone: null,
      whatsapp: null
    });
    
    // Validate form
    if (!formData.customerName.trim() || formData.customerName.trim().split(/\s+/).length !== 4) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم صاحب التوقيع رباعي (أربعة كلمات)",
        variant: "destructive"
      });
      return;
    }
    
    // Validate employee
    if (!formData.assignedEmployee) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار الموظف المسؤول",
        variant: "destructive"
      });
      return;
    }

    if (!formData.nationalId.trim() || !/^[23][0-9]{13}$/.test(formData.nationalId)) {
      toast({
        title: "خطأ في الرقم القومي",
        description: "الرقم القومي يجب أن يبدأ بـ 2 أو 3 ويتكون من 14 رقمًا",
        variant: "destructive"
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'certificateScan') formDataToSend.append(key, value);
      });
      if (certificateScan) formDataToSend.append('certificateScan', certificateScan);
      
      console.log('🔍 [FRONTEND] Updating customer with file:', certificateScan);
      console.log('🔍 [FRONTEND] FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log('🔍 [FRONTEND]', key, ':', value);
      }
      
      const response = await customerAPI.updateCustomer(customerToDelete._id, formDataToSend);
      // If backend returns the updated customer, update formData.certificateScan with the new file URL
      if (response && response.data && response.data.customer) {
        setFormData(prev => ({ ...prev, certificateScan: response.data.customer.certificateScan || null }));
      }
      toast({ title: "تم تحديث التوقيع", description: "تم تحديث بيانات التوقيع بنجاح" });
      setIsDialogOpen(false);
      setCustomerToDelete(null);
      // Refresh customers from backend
      const data = await customerAPI.getAllCustomers();
      setCustomers(data?.data?.customers || []);
      localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
    } catch (error) {
      toast({
        title: "خطأ في تحديث التوقيع",
        description: error.message || "تعذر تحديث بيانات التوقيع.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await customerAPI.deleteCustomer(customerToDelete._id);
      toast({ title: "تم حذف التوقيع", description: "تم حذف التوقيع بنجاح" });
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      // Refresh customers from backend
      const data = await customerAPI.getAllCustomers();
      setCustomers(data?.data?.customers || []);
      localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
    } catch (error) {
      toast({
        title: "خطأ في حذف التوقيع",
        description: error.message || "تعذر حذف التوقيع.",
        variant: "destructive",
      });
    }
  };

  // Add revoke/renew handler
  const handleRevokeOrRenew = async (customer) => {
    if (customer.status === "Revoked") {
      setCustomerToRenew(customer);
      setRenewDialogOpen(true);
      return;
    }
    setCustomerToRevoke(customer);
    setRevokeDialogOpen(true);
  };

  const confirmRevoke = async () => {
    if (!customerToRevoke) return;
    try {
      await customerAPI.revokeCustomer(customerToRevoke._id || customerToRevoke.id);
      toast({ title: "تم إلغاء التوقيع", description: `تم إلغاء توقيع ${customerToRevoke.customerName}` });
      // Refresh customers from backend
      const data = await customerAPI.getAllCustomers();
      setCustomers(data?.data?.customers || []);
      localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
    } catch (error) {
      toast({
        title: "خطأ في الإلغاء",
        description: error.message || "تعذر إلغاء التوقيع.",
        variant: "destructive",
      });
    }
    setRevokeDialogOpen(false);
    setCustomerToRevoke(null);
  };

  const [selectedCustomerIds, setSelectedCustomerIds] = React.useState([]);
  const [renewDialogOpen, setRenewDialogOpen] = React.useState(false);
  const [customerToRenew, setCustomerToRenew] = React.useState(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = React.useState(false);
  const [customerToRevoke, setCustomerToRevoke] = React.useState(null);
  const [auditLogDialogOpen, setAuditLogDialogOpen] = React.useState(false);
  const [auditLogCustomer, setAuditLogCustomer] = React.useState(null);
  const [auditLogEntries, setAuditLogEntries] = React.useState([]);
  const [auditLogLoading, setAuditLogLoading] = React.useState(false);
  const [certificateScan, setCertificateScan] = React.useState(null);

  // Helper to toggle selection
  const handleSelectCustomer = (id) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };
  const handleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c._id || c.id));
    }
  };

  // Function to export customers to Excel
  const handleExportToExcel = () => {
    try {
      // Use only selected customers if any, otherwise all filtered
      const exportCustomers = selectedCustomerIds.length > 0
        ? filteredCustomers.filter(c => selectedCustomerIds.includes(c._id || c.id))
        : filteredCustomers;
      const worksheetData = exportCustomers.map(customer => {
        const supplier = suppliers.find(s => s.institutionalCode === customer.institutionalCode);
        return {
          'اسم صاحب التوقيع (رباعي)': customer.customerName,
          'الوظيفة': customer.jobTitle,
          'الرقم القومي': customer.nationalId,
          'اسم الوحدة': customer.unitName,
          'اسم المنظومة': customer.systemName,
          'البريد الالكتروني': customer.email,
          'مدة الصلاحية': customer.certificateDuration,
          'نوع التوقيع': customer.signatureType,
          'نوع الشهادة': customer.certificateType,
          'تاريخ الإصدار': customer.issueDate,
          'تاريخ الانتهاء': customer.expiryDate,
          'اسم المورد (الكود المؤسسي)': supplier ? `${supplier.name} (${supplier.institutionalCode})` : customer.institutionalCode,
          'الموظف المسؤول': typeof customer.assignedEmployee === 'object'
            ? customer.assignedEmployee?.name || ''
            : customer.assignedEmployee || '',
          'الحالة': customer.status === 'Active' ? 'نشط' : 'ملغي',
        };
      });

      // Convert worksheet data to Excel file
      const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: false });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      
      // Generate Excel file
      XLSX.writeFile(workbook, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${worksheetData.length} توقيع إلى ملف Excel`,
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

  const handleShowAuditLog = async (customer) => {
    setAuditLogCustomer(customer);
    setAuditLogDialogOpen(true);
    setAuditLogLoading(true);
    try {
      const res = await auditLogAPI.getLogsByCustomer(customer._id || customer.id);
      setAuditLogEntries(res.logs || []);
    } catch (e) {
      setAuditLogEntries([]);
    }
    setAuditLogLoading(false);
  };

  const fieldLabels = {
    customerName: "اسم صاحب التوقيع",
    assignedEmployee: "الموظف المسؤول",
    notes: "ملاحظات",
    institutionalCode: "الكود المؤسسي",
    jobTitle: "الوظيفة",
    nationalId: "الرقم القومي",
    unitName: "اسم الوحدة",
    systemName: "اسم المنظومة",
    email: "البريد الإلكتروني",
    certificateDuration: "مدة الصلاحية",
    signatureType: "نوع التوقيع",
    certificateType: "نوع الشهادة",
    issueDate: "تاريخ الإصدار",
    expiryDate: "تاريخ الانتهاء",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            إدارة التوقيعات ({filteredCustomers.length})
          </h1>
          {isEmployeeRole && userData && (
            <p className="text-sm text-blue-600 mt-1">
              عرض التوقيعات المسجلين من خلال: {userData.name}
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
        <PermissionButton 
          section="customers" 
          action="add" 
          onClick={handleAdd} 
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة توقيع</span>
        </PermissionButton>
          <Button 
            variant="outline"
            className="flex items-center gap-2" 
            onClick={handleExportToExcel}
          >
            <FileDown className="h-4 w-4" />
           طباعة كشف التسليمات
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن بيانات صاحب توقيع مسجل بقاعدة البيانات بأي من بيانات هذا الشخص ("
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-3 px-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="text-right py-3 px-4">اسم صاحب التوقيع (رباعي)</th>
                <th className="text-right py-3 px-4">الوظيفة</th>
                <th className="text-right py-3 px-4">الرقم القومي</th>
                <th className="text-right py-3 px-4">اسم الوحدة</th>
                <th className="text-right py-3 px-4">اسم المنظومة</th>
                <th className="text-right py-3 px-4">البريد الالكتروني</th>
                <th className="text-right py-3 px-4">مدة الصلاحية</th>
                <th className="text-right py-3 px-4">نوع التوقيع</th>
                <th className="text-right py-3 px-4">نوع الشهادة</th>
                <th className="text-right py-3 px-4">تاريخ الإصدار</th>
                <th className="text-right py-3 px-4">تاريخ الانتهاء</th>
                <th className="text-right py-3 px-4">اسم المورد (الكود المؤسسي)</th>
                <th className="text-center py-3 px-4">الموظف المسؤول</th>
                <th className="text-center py-3 px-4">الحالة</th>
                <th className="text-center py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <motion.tr
                  key={customer._id || customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b dark:border-gray-700"
                >
                  <td className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.includes(customer._id || customer.id)}
                      onChange={() => handleSelectCustomer(customer._id || customer.id)}
                    />
                  </td>
                  <td className="py-3 px-4">{customer.customerName}</td>
                  <td className="py-3 px-4">{customer.jobTitle}</td>
                  <td className="py-3 px-4">{customer.nationalId}</td>
                  <td className="py-3 px-4">{customer.unitName}</td>
                  <td className="py-3 px-4">{customer.systemName}</td>
                  <td className="py-3 px-4">{customer.email}</td>
                  <td className="py-3 px-4">{customer.certificateDuration}</td>
                  <td className="py-3 px-4">{customer.signatureType}</td>
                  <td className="py-3 px-4">{customer.certificateType}</td>
                  <td className="py-3 px-4">{customer.issueDate}</td>
                  <td className="py-3 px-4">{
                    customer.expiryDate ? new Date(customer.expiryDate).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
                  }</td>
                  <td className="py-3 px-4">{
                    (() => {
                      const supplier = suppliers.find(s => s.institutionalCode === customer.institutionalCode);
                      return supplier ? `${supplier.name} (${supplier.institutionalCode})` : customer.institutionalCode;
                    })()
                  }</td>
                  <td className="py-3 px-4 text-center">
                    {customer.assignedEmployee?.name || ""}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {customer.status === "Active" ? "نشط" : "ملغي"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokeOrRenew(customer)}
                        title={customer.status === "Revoked" ? "تجديد الشهادة تلقائيًا لمدة ثلاث سنوات" : "إلغاء التوقيع"}
                      >
                        {customer.status === "Revoked" ? (
                          <RotateCcw className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowAuditLog(customer)}
                        title="سجل العمليات"
                      >
                        <List className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredCustomers.length === 0 && !customersLoading && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    لا يوجد عملاء مطابقين للبحث
                  </td>
                </tr>
              )}
              {customersLoading && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    جاري تحميل أصحاب التوقيعات...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {customerToDelete ? "تعديل بيانات صاحب التوقيع" : "إضافة صاحب توقيع جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={customerToDelete ? handleUpdate : handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم صاحب التوقيع (رباعي)</Label>
                <Input
                  id="name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="employee">الموظف المسؤول</Label>
                {isEmployeeRole ? (
                  <input
                    id="employee"
                    className="w-full p-2 border rounded-lg bg-gray-100"
                    value={formData.assignedEmployee}
                    readOnly
                    disabled
                  />
                ) : (
                  <select
                    id="employee"
                    className="w-full p-2 border rounded-lg"
                    value={formData.assignedEmployee}
                    onChange={(e) => setFormData({ ...formData, assignedEmployee: e.target.value })}
                    required
                  >
                    <option value="">اختر الموظف المسؤول</option>
                    {employees.map((employee) => (
                      <option key={employee._id || employee.id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="institutionalCode">الكود المؤسسي</Label>
                <select
                  id="institutionalCode"
                  className="w-full p-2 border rounded-lg"
                  value={formData.institutionalCode}
                  onChange={(e) => setFormData({ ...formData, institutionalCode: e.target.value })}
                  required
                >
                  <option value="">اختر الكود المؤسسي</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id || supplier.id} value={supplier.institutionalCode}>
                      {supplier.institutionalCode} - {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">الوظيفة *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="أدخل الوظيفة"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationalId">الرقم القومي *</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={e => setFormData({ ...formData, nationalId: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="أدخل الرقم القومي الرقم القومي المكون من 14 رقمًا"
                  maxLength={14}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitName">اسم الوحدة *</Label>
                <Input
                  id="unitName"
                  value={formData.unitName}
                  onChange={e => setFormData({ ...formData, unitName: e.target.value })}
                  placeholder="أدخل اسم الوحدة"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="systemName">اسم المنظومة *</Label>
                <Input
                  id="systemName"
                  value={formData.systemName}
                  onChange={e => setFormData({ ...formData, systemName: e.target.value })}
                  placeholder="أدخل اسم المنظومة"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الالكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="أدخل البريد الالكتروني"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateDuration">مدة صالحية الشهادة *</Label>
                <select
                  id="certificateDuration"
                  className="w-full p-2 border rounded-lg"
                  value={formData.certificateDuration}
                  onChange={e => setFormData({ ...formData, certificateDuration: e.target.value })}
                  required
                >
                  <option value="">اختر مدة الصلاحية</option>
                  <option value="1">سنة</option>
                  <option value="2">سنتين</option>
                  <option value="3">تلاتة</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signatureType">نوع التوقيع *</Label>
                <select
                  id="signatureType"
                  className="w-full p-2 border rounded-lg"
                  value={formData.signatureType}
                  onChange={e => setFormData({ ...formData, signatureType: e.target.value })}
                  required
                >
                  <option value="">اختر نوع التوقيع</option>
                  <option value="توقيع أول">توقيع أول</option>
                  <option value="توقيع تاني">توقيع تاني</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateType">نوع الشهادة *</Label>
                <select
                  id="certificateType"
                  className="w-full p-2 border rounded-lg"
                  value={formData.certificateType}
                  onChange={e => setFormData({ ...formData, certificateType: e.target.value })}
                  required
                >
                  <option value="">اختر نوع الشهادة</option>
                  <option value="SSL">SSL</option>
                  <option value="Email">Email</option>
                  <option value="Code signing">Code signing</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueDate">تاريخ إصدار شهادة التوقيع الإلكتروني *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">تاريخ انتهاء شهادة التوقيع الإلكتروني</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  readOnly
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateScan">مسح ضوئي للشهادة (اختياري)</Label>
                <input
                  id="certificateScan"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => {
                    const file = e.target.files[0];
                    console.log('🔍 [FRONTEND] File selected:', file);
                    setCertificateScan(file);
                  }}
                />
                {formData.certificateScan && typeof formData.certificateScan === 'string' && (
                  <a href={getFileUrl(formData.certificateScan)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-1 block">عرض المسح الضوئي الحالي</a>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {customerToDelete ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف التوقيع "{customerToDelete?.customerName}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Confirmation Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد تجديد الشهادة</DialogTitle>
          </DialogHeader>
          <div>
            هل أنت متأكد أنك تريد تجديد الشهادة تلقائيًا لمدة ثلاث سنوات لصاحب التوقيع:
            <b> {customerToRenew?.customerName} </b>؟
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (customerToRenew) {
                  try {
                    await customerAPI.renewCustomer(customerToRenew._id || customerToRenew.id);
                    toast({ title: "تم تجديد التوقيع", description: `تم تجديد توقيع ${customerToRenew.customerName} لمدة ثلاث سنوات` });
                    // Refresh customers from backend
                    const data = await customerAPI.getAllCustomers();
                    setCustomers(data?.data?.customers || []);
                    localStorage.setItem('customers', JSON.stringify(data?.data?.customers || []));
                  } catch (error) {
                    toast({
                      title: "خطأ في التجديد",
                      description: error.message || "تعذر تجديد التوقيع.",
                      variant: "destructive",
                    });
                  }
                }
                setRenewDialogOpen(false);
                setCustomerToRenew(null);
              }}
            >
              نعم، جدد الشهادة
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRenewDialogOpen(false);
                setCustomerToRenew(null);
              }}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد إلغاء التوقيع</DialogTitle>
          </DialogHeader>
          <div>
            هل أنت متأكد أنك تريد إلغاء توقيع:
            <b> {customerToRevoke?.customerName} </b>؟
          </div>
          <DialogFooter>
            <Button
              onClick={confirmRevoke}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              نعم، إلغاء التوقيع
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeDialogOpen(false);
                setCustomerToRevoke(null);
              }}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditLogDialogOpen} onOpenChange={setAuditLogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>سجل العمليات لصاحب التوقيع: {auditLogCustomer?.customerName}</DialogTitle>
          </DialogHeader>
          {auditLogLoading ? (
            <div>جاري التحميل...</div>
          ) : auditLogEntries.length === 0 ? (
            <div>لا يوجد عمليات مسجلة لهذا العميل.</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1">العملية</th>
                    <th className="px-2 py-1">المستخدم</th>
                    <th className="px-2 py-1">التاريخ</th>
                    <th className="px-2 py-1">تفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogEntries.map((log) => (
                    <tr key={log._id}>
                      <td className="px-2 py-1">{log.action}</td>
                      <td className="px-2 py-1">{log.actor?.name || "-"}</td>
                      <td className="px-2 py-1">{new Date(log.timestamp).toLocaleString("ar-EG")}</td>
                      <td className="px-2 py-1">
                        {log.changes || log.metadata ? (
                          <table className="min-w-full text-xs border rounded bg-gray-50">
                            <tbody>
                              {Object.entries(log.changes || log.metadata).map(([key, value]) => (
                                <tr key={key}>
                                  <td className="font-bold px-1 py-0.5 border-b border-gray-200">{fieldLabels[key] || key}</td>
                                  <td className="px-1 py-0.5 border-b border-gray-200">{String(value)}</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="font-bold px-1 py-0.5">التاريخ والوقت</td>
                                <td className="px-1 py-0.5">{new Date(log.timestamp).toLocaleString("ar-EG")}</td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogCustomer?.certificateScan && (
                <div className="my-2">
                  <span className="font-bold">ملف الشهادة الممسوحة ضوئياً:</span>
                  {(() => {
                    const fileUrl = getFileUrl(auditLogCustomer.certificateScan);
                    console.log('🔍 [AUDIT_LOG] Customer certificateScan:', auditLogCustomer.certificateScan);
                    console.log('🔍 [AUDIT_LOG] File URL:', fileUrl);
                    
                    if (!fileUrl) {
                      return <span>لا يوجد ملف مسجل</span>;
                    }
                    
                    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(auditLogCustomer.certificateScan)) {
                      return (
                        <div className="mt-2">
                          <img
                            src={fileUrl}
                            alt="مسح الشهادة"
                            style={{ maxWidth: "100%", maxHeight: 300, border: "1px solid #ccc", borderRadius: 8 }}
                          />
                        </div>
                      );
                    } else if (auditLogCustomer.certificateScan.toLowerCase().endsWith('.pdf')) {
                      return (
                        <div className="mt-2">
                          <embed
                            src={fileUrl}
                            type="application/pdf"
                            width="100%"
                            height="400px"
                          />
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">فتح الملف في نافذة جديدة</a>
                        </div>
                      );
                    } else {
                      return (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">عرض الملف</a>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Customers;
