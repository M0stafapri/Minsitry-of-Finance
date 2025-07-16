import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, CheckCircle2, List, Grid, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supplierAPI, carTypeAPI, customerAPI, employeeAPI } from "@/api";

function Suppliers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]); // <-- useState instead of useLocalStorage
  const [trips] = useLocalStorage("trips", []);
  // Car types from backend (must be inside the component)
  const [managedVehicleTypes, setManagedVehicleTypes] = useState([]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [supplierToDelete, setSupplierToDelete] = React.useState(null);
  const [supplierToUpdate, setSupplierToUpdate] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [displayMode, setDisplayMode] = React.useState("list");
  const [selectedVehicleType, setSelectedVehicleType] = React.useState("all");
  const [sortDirection, setSortDirection] = React.useState("desc"); // desc = highest first, asc = lowest first
  const [currentSupplier, setCurrentSupplier] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: "",
    institutionalCode: "",
    unitName: "",
    governorateOrMinistry: "",
  });
  const [isCarTypeDialogOpen, setIsCarTypeDialogOpen] = React.useState(false);
  const [newCarTypeName, setNewCarTypeName] = React.useState("");
  const [isEmptyField, setIsEmptyField] = React.useState(false);
  
  // State for add-customer dialog
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [addCustomerSupplier, setAddCustomerSupplier] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [customerFormData, setCustomerFormData] = useState({
    customerName: "",
    assignedEmployee: "",
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
  const [certificateScan, setCertificateScan] = useState(null);

  // Load user data from localStorage
  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setCurrentUser(userData);
    }
  }, []);

  // Fetch car types from backend on mount
  useEffect(() => {
    const fetchCarTypes = async () => {
      try {
        const data = await carTypeAPI.getAllCarTypes();
        // If backend returns { data: { carTypes: [...] } }
        setManagedVehicleTypes(data?.data?.carTypes || data || []);
      } catch (error) {
        toast({
          title: "خطأ في تحميل أنواع السيارات",
          description: error.message || "تعذر تحميل أنواع السيارات من الخادم.",
          variant: "destructive",
        });
      }
    };
    fetchCarTypes();
  }, []);

  // Fetch suppliers from backend on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierAPI.getAllSuppliers();
        // If backend returns { data: { suppliers: [...] } }
        setSuppliers(data?.data?.suppliers || []);
      } catch (error) {
        toast({
          title: "خطأ في تحميل الاكواد المؤسسية",
          description: error.message || "تعذر تحميل بيانات الكود المؤسسي من الخادم.",
          variant: "destructive",
        });
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch employees for the add-customer dialog
  useEffect(() => {
    if (isAddCustomerDialogOpen) {
      employeeAPI.getAllEmployees().then((data) => {
        setEmployees(data?.data?.employees || []);
      });
    }
  }, [isAddCustomerDialogOpen]);

  // Auto-calculate expiryDate when issueDate or certificateDuration changes
  useEffect(() => {
    if (customerFormData.issueDate && customerFormData.certificateDuration) {
      const issue = new Date(customerFormData.issueDate);
      const years = parseInt(customerFormData.certificateDuration, 10);
      if (!isNaN(issue.getTime()) && years > 0) {
        const expiry = new Date(issue);
        expiry.setFullYear(issue.getFullYear() + years);
        setCustomerFormData(prev => ({ ...prev, expiryDate: expiry.toISOString().split('T')[0] }));
      }
    }
  }, [customerFormData.issueDate, customerFormData.certificateDuration]);

  const filteredSuppliers = React.useMemo(() => {
    // First filter by search term
    let filtered = suppliers.filter((supplier) =>
      Object.values(supplier).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    // Then filter by vehicle type if not "all"
    if (selectedVehicleType !== "all") {
      filtered = filtered.filter((supplier) => 
        //supplier.vehicles && supplier.vehicles.includes(selectedVehicleType)
          supplier.availableCars && supplier.availableCars.includes(selectedVehicleType)
      );
    }
    
    // Sort by trip count from backend
    return filtered.sort((a, b) => {
      const aTrips = a.tripCount || 0;
      const bTrips = b.tripCount || 0;
      return sortDirection === "desc" ? bTrips - aTrips : aTrips - bTrips;
    });
  }, [suppliers, searchTerm, selectedVehicleType, sortDirection]);

  // Función original para añadir proveedores
  const _handleAdd = () => {
    setCurrentSupplier(null);
    setFormData({
      name: "",
      institutionalCode: "",
      unitName: "",
      governorateOrMinistry: "",
    });
    setIsDialogOpen(true);
  };
  
  // Función protegida con verificación de permisos
  const handleAdd = withPermissionCheck(_handleAdd, "suppliers", "add");

  // Función original para editar proveedores
  const _handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      _id: supplier._id,
      name: supplier.name,
      institutionalCode: supplier.institutionalCode || "",
      unitName: supplier.unitName || "",
      governorateOrMinistry: supplier.governorateOrMinistry || "",
    });
    setIsDialogOpen(true);
  };
  
  // Función protegida con verificación de permisos
  const handleEdit = withPermissionCheck(_handleEdit, "suppliers", "edit");

  // Función original para eliminar proveedores
  const _handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };
  
  // Función protegida con verificación de permisos
  const handleDelete = withPermissionCheck(_handleDelete, "suppliers", "delete");

  // Update confirmDelete logic
  const confirmDelete = async () => {
    try {
      await supplierAPI.deleteSupplier(supplierToDelete._id || supplierToDelete.id);
      setSuppliers((prev) => prev.filter((sup) => (sup._id || sup.id) !== (supplierToDelete._id || supplierToDelete.id)));
      setIsDeleteDialogOpen(false);
      toast({
        title: (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>تم حذف الكود المؤسسي</span>
          </div>
        ),
        description: `تم حذف الكود المؤسسي ${supplierToDelete.name} بنجاح`,
        className: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "خطأ في حذف الكود المؤسسي",
        description: error.message || "تعذر حذف الكود المؤسسي.",
        variant: "destructive",
      });
    }
  };

  // Update add/edit supplier logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id || formData.id) {
        // Edit mode: update existing supplier
        const id = formData._id || formData.id;
        const updated = await supplierAPI.updateSupplier(id, {
          name: formData.name,
          institutionalCode: formData.institutionalCode,
          unitName: formData.unitName,
          governorateOrMinistry: formData.governorateOrMinistry,
        });
        // Update local state
        const updatedSupplier = updated?.data?.supplier || updated;
        setSuppliers((prev) => prev.map((sup) => (sup._id === updatedSupplier._id || sup.id === updatedSupplier._id) ? updatedSupplier : sup));
        toast({
          title: (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>تم تحديث بيانات الكود المؤسسي</span>
            </div>
          ),
          description: `تم تحديث بيانات الكود المؤسسي ${formData.name} بنجاح`,
          className: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          duration: 3000,
        });
      } else {
        // Add mode: create new supplier
        const newSupplier = await supplierAPI.createSupplier({
          name: formData.name,
          institutionalCode: formData.institutionalCode,
          unitName: formData.unitName,
          governorateOrMinistry: formData.governorateOrMinistry,
        });
        setSuppliers((prev) => [...prev, newSupplier?.data?.supplier || newSupplier]);
        toast({
          title: (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>تم إضافة الكود المؤسسي</span>
            </div>
          ),
          description: `تم إضافة الكود المؤسسي ${formData.name} بنجاح`,
          className: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          duration: 3000,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: formData._id || formData.id ? "خطأ في تحديث الكود المؤسسي" : "خطأ في إضافة الكود المؤسسي",
        description: error.message || (formData._id || formData.id ? "تعذر تحديث بيانات الكود المؤسسي." : "تعذر إضافة الكود المؤسسي."),
        variant: "destructive",
      });
    }
  };

  // Update confirmUpdate logic
  const confirmUpdate = async () => {
    try {
      const updated = await supplierAPI.updateSupplier(supplierToUpdate._id || supplierToUpdate.id, {
        name: supplierToUpdate.name,
        institutionalCode: supplierToUpdate.institutionalCode,
        unitName: supplierToUpdate.unitName,
        governorateOrMinistry: supplierToUpdate.governorateOrMinistry,
      });
      // If backend returns { data: { supplier: {...} } }
      const updatedSupplier = updated?.data?.supplier || updated;
      setSuppliers((prev) => prev.map((sup) => (sup._id === updatedSupplier._id || sup.id === updatedSupplier._id) ? updatedSupplier : sup));
      setIsUpdateDialogOpen(false);
      setIsDialogOpen(false);
      toast({
        title: (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>تم تحديث الكود المؤسسي</span>
          </div>
        ),
        description: `تم تحديث بيانات الكود المؤسسي ${supplierToUpdate.name} بنجاح`,
        className: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "خطأ في تحديث الكود المؤسسي",
        description: error.message || "تعذر تحديث بيانات الكود المؤسسي.",
        variant: "destructive",
      });
    }
  };

  const getEmptyStateMessage = () => {
    if (selectedVehicleType !== 'all') {
      const vehicleName = managedVehicleTypes.find(v => v.id === selectedVehicleType)?.name;
      return {
        title: `لا يوجد موردين لديهم سيارة ${vehicleName}`,
        subtitle: 'قم بتغيير نوع السيارة أو إضافة كود مؤسسي جديد'
      };
    }
    
    if (searchTerm) {
      return {
        title: 'لا توجد نتائج بحث',
        subtitle: 'حاول تغيير كلمات البحث'
      };
    }

    return {
      title: 'لا يوجد أكواد مؤسسية',
      subtitle: 'قم بإضافة كود مؤسسي جديد'
    };
  };

  const handleOpenCarTypeDialog = () => {
    setIsCarTypeDialogOpen(true);
  };

  const handleSaveCarTypes = async () => {
    // Basic validation: ensure new car type name is not empty if provided
    if (newCarTypeName.trim() === "") {
      setIsEmptyField(true); // Set empty field state to true
      toast({
        title: "خطأ",
        description: "يرجى إدخال نوع السيارة",
        variant: "destructive",
      });
      return;
    }

    setIsEmptyField(false); // Reset empty field state
    const newCarTypeNameTrimmed = newCarTypeName.trim();
    // Check for duplicates
    if (managedVehicleTypes.some(vt => vt.name === newCarTypeNameTrimmed)) {
      toast({
        title: "خطأ",
        description: "نوع السيارة هذا موجود بالفعل.",
        variant: "destructive",
      });
      return;
    }

    try {
      await carTypeAPI.addCarType(newCarTypeNameTrimmed);
      toast({
        title: "تم الحفظ",
        description: `تم إضافة نوع السيارة ${newCarTypeNameTrimmed} بنجاح.`,
        className: "bg-green-50 border-green-200",
      });
      setNewCarTypeName(""); // Reset input
      // Refresh car types from backend
      const data = await carTypeAPI.getAllCarTypes();
      setManagedVehicleTypes(data?.data?.carTypes || data || []);
    } catch (error) {
      toast({
        title: "خطأ في إضافة نوع السيارة",
        description: error.message || "تعذر إضافة نوع السيارة.",
        variant: "destructive",
      });
    }
  };

  // Add handler for input change
  const handleCarTypeNameChange = (e) => {
    setNewCarTypeName(e.target.value);
    if (e.target.value.trim() !== "") {
      setIsEmptyField(false);
    }
  };

  const handleDeleteCarType = async (carTypeIdToDelete) => {
    // Prevent deleting if any supplier is using this car type (UI check)
    const isUsed = suppliers.some(supplier => supplier.availableCars?.includes(carTypeIdToDelete));
    if (isUsed) {
      toast({
        title: "لا يمكن الحذف",
        description: "نوع السيارة هذا مستخدم حاليًا بواسطة مورد واحد على الأقل.",
        variant: "destructive",
      });
      return;
    }
    try {
      await carTypeAPI.deleteCarType(carTypeIdToDelete);
      toast({
        title: "تم الحذف",
        description: "تم حذف نوع السيارة بنجاح.",
        variant: "destructive", // Or a neutral/info toast
      });
      // Refresh car types from backend
      const data = await carTypeAPI.getAllCarTypes();
      setManagedVehicleTypes(data?.data?.carTypes || data || []);
    } catch (error) {
      toast({
        title: "خطأ في حذف نوع السيارة",
        description: error.message || "تعذر حذف نوع السيارة.",
        variant: "destructive",
      });
    }
  };

  // Open add-customer dialog for a supplier
  const handleOpenAddCustomer = (supplier) => {
    setAddCustomerSupplier(supplier);
    setCustomerFormData({
      customerName: "",
      assignedEmployee: employees.length > 0 ? employees[0]._id : "",
      institutionalCode: supplier.institutionalCode,
      jobTitle: "",
      nationalId: "",
      unitName: supplier.unitName || "",
      systemName: supplier.governorateOrMinistry || "",
      email: "",
      certificateDuration: "",
      signatureType: "",
      certificateType: "",
      issueDate: "",
      expiryDate: "",
      certificateScan: null
    });
    setCertificateScan(null);
    setIsAddCustomerDialogOpen(true);
  };

  // Handle add-customer form submit
  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(customerFormData).forEach(([key, value]) => formDataToSend.append(key, value));
      if (certificateScan) formDataToSend.append('certificateScan', certificateScan);
      await customerAPI.createCustomer(formDataToSend);
      toast({ title: "تم إضافة صاحب التوقيع", description: "تم إضافة التوقيع بنجاح" });
      setIsAddCustomerDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في إضافة التوقيع",
        description: error.message || "تعذر إضافة التوقيع.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 sm:p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        إدارة الأكواد المؤسسية
        ({filteredSuppliers.length})
        </h1>
        {currentUser?.role !== 'employee' && (
          <div className="flex gap-2">
            <PermissionButton
              action="add"
              resource="suppliers"
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              <Plus className="mr-2 h-5 w-5" /> إضافة كود مؤسسي جديد
            </PermissionButton>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالكود المؤسسي، إسم الوحدة، إسم المنظومة، أو إسم المحافظة/ الوزارة"
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Remove the select dropdown for vehicle type (option value="all" and managedVehicleTypes) */}
          {/* Remove the select dropdown for sortDirection (عدد الرحلات: من الأعلى/من الأقل) */}
          
          <div className="flex items-center gap-2 min-w-[100px] justify-center">
            <button
              onClick={() => setDisplayMode("list")}
              className={`p-2 rounded-lg ${displayMode === "list" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="عرض القائمة"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDisplayMode("thumbnails")}
              className={`p-2 rounded-lg ${displayMode === "thumbnails" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="عرض المصغرات"
            >
              <Grid className="h-5 w-5" />
            </button>
          </div>
        </div>

        {displayMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-right py-3 px-4">الكود المؤسسي</th>
                <th className="text-right py-3 px-4">اسم المؤسسة</th>
                <th className="text-right py-3 px-4">اسم الوحدة</th>
                <th className="text-right py-3 px-4">اسم المحافظة/الوزارة</th>
                {currentUser?.role !== 'employee' && (
                  <th className="text-right py-3 px-4">الإجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser?.role === 'employee' ? "5" : "6"} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-lg">{getEmptyStateMessage().title}</span>
                        <span className="text-sm">{getEmptyStateMessage().subtitle}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                <motion.tr
                  key={supplier._id || supplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b dark:border-gray-700"
                >
                  <td className="py-3 px-4">{supplier.institutionalCode}</td>
                  <td className="py-3 px-4">{supplier.name}</td>
                  <td className="py-3 px-4">{supplier.unitName}</td>
                  <td className="py-3 px-4">{supplier.governorateOrMinistry}</td>
                  {currentUser?.role !== 'employee' && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-600 hover:bg-green-50"
                          onClick={() => handleOpenAddCustomer(supplier)}
                        >
                          إضافة توقيع
                        </Button>
                      </div>
                    </td>
                  )}
                </motion.tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-lg">{getEmptyStateMessage().title}</span>
                  <span className="text-sm">{getEmptyStateMessage().subtitle}</span>
                </div>
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
              <motion.div
                key={supplier._id || supplier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-primary">{supplier.name?.substring(0, 2)}</span>
                  </div>
                  <h3 className="font-bold text-lg">{supplier.name}</h3>
                  <p className="text-sm text-gray-500 mb-1"></p>
                  
                  {currentUser?.role !== 'employee' && (
                    <div className="flex justify-center gap-2 mt-3 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(supplier)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-700 border-green-600 hover:bg-green-50"
                        onClick={() => handleOpenAddCustomer(supplier)}
                      >
                        إضافة توقيع
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentSupplier ? "تعديل كود مؤسسي" : "اضافة كود مؤسسي"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="institutionalCode">الكود المؤسسي</Label>
                <Input
                  id="institutionalCode"
                  value={formData.institutionalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, institutionalCode: e.target.value })
                  }
                  placeholder=""
                  required
                />
                <p className="text-xs text-gray-500"></p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المؤسسة</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitName">اسم الوحدة</Label>
                <Input
                  id="unitName"
                  value={formData.unitName}
                  onChange={(e) =>
                    setFormData({ ...formData, unitName: e.target.value })
                  }
                  placeholder="مثال: الوحدة المركزية للنقل العام"
                  required
                />
                <p className="text-xs text-gray-500"></p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="governorateOrMinistry">المحافظة أو الوزارة</Label>
                <Input
                  id="governorateOrMinistry"
                  value={formData.governorateOrMinistry}
                  onChange={(e) =>
                    setFormData({ ...formData, governorateOrMinistry: e.target.value })
                  }
                  placeholder="مثال: وكالة النقل العام"
                  required
                />
                <p className="text-xs text-gray-500"></p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {currentSupplier ? "تحديث" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكود المؤسسي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الكود المؤسسي {supplierToDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.
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

      <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تحديث الكود المؤسسي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تحديث بيانات الكود المؤسسي {supplierToUpdate?.name}؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>
              تأكيد التحديث
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for Managing Car Types */}
      <Dialog open={isCarTypeDialogOpen} onOpenChange={setIsCarTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة أنواع السيارات</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newCarTypeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                إضافة نوع سيارة جديد
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newCarTypeName"
                  value={newCarTypeName}
                  onChange={handleCarTypeNameChange}
                  placeholder="مثال: باص 50 راكب"
                  className={`flex-grow ${isEmptyField ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <Button onClick={handleSaveCarTypes} variant="outline" className="shrink-0">
                  <Plus className="h-4 w-4 mr-1"/> إضافة
                </Button>
              </div>
              {isEmptyField && (
                <p className="mt-1 text-sm text-red-500">
                  هذا الحقل مطلوب
                </p>
              )}
            </div>
            {managedVehicleTypes.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">أنواع السيارات الحالية:</h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                  {managedVehicleTypes.map((vt) => (
                    <div key={vt._id || vt.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <span className="text-gray-700 dark:text-gray-300">{vt.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteCarType(vt._id )} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCarTypeDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إضافة توقيع جديد لهذا الكود المؤسسي</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomerSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">اسم صاحب التوقيع</Label>
                <Input
                  id="customerName"
                  value={customerFormData.customerName}
                  onChange={e => setCustomerFormData({ ...customerFormData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignedEmployee">الموظف المسؤول</Label>
                <select
                  id="assignedEmployee"
                  className="w-full border rounded px-2 py-1"
                  value={customerFormData.assignedEmployee}
                  onChange={e => setCustomerFormData({ ...customerFormData, assignedEmployee: e.target.value })}
                  required
                >
                  <option value="">اختر الموظف</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="institutionalCode">الكود المؤسسي</Label>
                <Input
                  id="institutionalCode"
                  value={customerFormData.institutionalCode}
                  readOnly
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitName">اسم الوحدة</Label>
                <Input
                  id="unitName"
                  value={customerFormData.unitName}
                  onChange={e => setCustomerFormData({ ...customerFormData, unitName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">الوظيفة</Label>
                <Input
                  id="jobTitle"
                  value={customerFormData.jobTitle}
                  onChange={e => setCustomerFormData({ ...customerFormData, jobTitle: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationalId">الرقم القومي</Label>
                <Input
                  id="nationalId"
                  value={customerFormData.nationalId}
                  onChange={e => setCustomerFormData({ ...customerFormData, nationalId: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="systemName">اسم المنظومة</Label>
                <Input
                  id="systemName"
                  value={customerFormData.systemName}
                  onChange={e => setCustomerFormData({ ...customerFormData, systemName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerFormData.email}
                  onChange={e => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateDuration">مدة الشهادة (بالسنوات)</Label>
                <select
                  id="certificateDuration"
                  className="w-full border rounded px-2 py-1"
                  value={customerFormData.certificateDuration}
                  onChange={e => setCustomerFormData({ ...customerFormData, certificateDuration: e.target.value })}
                  required
                >
                  <option value="">اختر مدة الصلاحية</option>
                  <option value="1">سنة</option>
                  <option value="2">سنتين</option>
                  <option value="3">تلاتة</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signatureType">نوع التوقيع</Label>
                <select
                  id="signatureType"
                  className="w-full border rounded px-2 py-1"
                  value={customerFormData.signatureType}
                  onChange={e => setCustomerFormData({ ...customerFormData, signatureType: e.target.value })}
                  required
                >
                  <option value="">اختر نوع التوقيع</option>
                  <option value="توقيع أول">توقيع أول</option>
                  <option value="توقيع تاني">توقيع تاني</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="certificateType">نوع الشهادة</Label>
                <select
                  id="certificateType"
                  className="w-full border rounded px-2 py-1"
                  value={customerFormData.certificateType}
                  onChange={e => setCustomerFormData({ ...customerFormData, certificateType: e.target.value })}
                  required
                >
                  <option value="">اختر نوع الشهادة</option>
                  <option value="SSL">SSL</option>
                  <option value="Email">Email</option>
                  <option value="Code signing">Code signing</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueDate">تاريخ الإصدار</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={customerFormData.issueDate}
                  onChange={e => setCustomerFormData({ ...customerFormData, issueDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={customerFormData.expiryDate}
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
                    setCertificateScan(file);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default Suppliers;
