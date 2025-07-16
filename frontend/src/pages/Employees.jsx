import React from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, CheckCircle2, List, Grid, Loader2 } from "lucide-react";
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
import EmployeeDetailsDialog from "@/features/employees/components/EmployeeDetailsDialog";
import { employeeAPI } from '../api';

function validatePhoneNumbers(phones) {
  if (!phones) return true; // Empty phone numbers are valid
  const phoneArray = phones.split('\n').map(phone => phone.trim()).filter(phone => phone.length > 0);
  return phoneArray.length === 0 || phoneArray.every(phone => /^\d{11}$/.test(phone));
}

function Employees() {
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [currentEmployee, setCurrentEmployee] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [displayMode, setDisplayMode] = React.useState("list");
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    personalPhone: "",
    role: "موظف",
    employmentDate: ""
  });
  
  // حالة إظهار/إخفاء كلمة المرور
  const [showPassword, setShowPassword] = React.useState(false);

  // Fetch employees from backend
  const fetchEmployees = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getAllEmployees();
      if (response.status === "success") {
        const employeesData = response.data.employees || [];
        console.log('🔍 Debug - Employees data received:', employeesData);
        console.log('🔍 Debug - Status values:', employeesData.map(emp => ({ name: emp.name, status: emp.status })));
        setEmployees(employeesData);
      } else {
        throw new Error(response.message || "فشل في جلب بيانات المستخدمين");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message || "حدث خطأ أثناء جلب بيانات المستخدمين");
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء جلب بيانات المستخدمين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load employees on component mount
  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = React.useMemo(() => {
    // First filter by status if needed
    const statusFiltered = statusFilter === "all" 
      ? employees 
      : employees.filter(employee => employee.status === statusFilter);
    
    // Then filter by search term
    return statusFiltered.filter((employee) =>
      Object.values(employee).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [employees, searchTerm, statusFilter]);

  const getEmptyStateMessage = () => {
    if (statusFilter !== 'all') {
      return {
        title: `لا يوجد مستخدمين ${statusFilter === 'نشط' ? 'نشطين' : statusFilter === 'غير نشط' ? 'متوقفين' : 'معلقين'}`,
        subtitle: 'قم بتغيير حالة التصفية أو إضافة مستخدم جديد'
      };
    }
    
    return {
      title: "لا يوجد مستخدمين",
      subtitle: "ابدأ بإضافة مستخدم جديد"
    };
  };

  const _handleAdd = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      personalPhone: "",
      role: "موظف",
      employmentDate: ""
    });
    setCurrentEmployee(null);
    setIsDialogOpen(true);
  };

  const handleAdd = withPermissionCheck(_handleAdd, "employees", "add");

  const _handleEdit = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      username: employee.username,
      password: "",
      personalPhone: employee.personalPhone,
      role: employee.role || 'موظف',
      employmentDate: employee.employmentDate ? new Date(employee.employmentDate).toISOString().split("T")[0] : ""
    });
    
    setIsDialogOpen(true);
  };
  
  const handleEdit = withPermissionCheck(_handleEdit, "employees", "edit");

  const _handleDelete = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = withPermissionCheck(_handleDelete, "employees", "delete");

  const handleRowClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setRefreshing(true);
      // Note: The backend doesn't have a delete endpoint yet, so we'll just remove from state
      // In a real implementation, you would call: await employeeAPI.deleteEmployee(employeeToDelete._id);
      setEmployees(employees.filter((emp) => emp._id !== employeeToDelete._id));
      setIsDeleteDialogOpen(false);
      toast({
        title: "تم حذف الموظف",
        description: "تم حذف الموظف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الموظف",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate personal phone
    if (!/^\d{11}$/.test(formData.personalPhone)) {
      toast({
        title: "خطأ في البيانات",
        description: "رقم الهاتف الشخصي يجب أن يتكون من 11 رقم",
        variant: "destructive"
      });
      return;
    }

    // Validate username (English only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast({
        title: "خطأ في البيانات",
        description: "اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط",
        variant: "destructive"
      });
      return;
    }

    try {
      setRefreshing(true);
      
      if (currentEmployee) {
        // Update existing employee
        const updateData = {
          ...formData,
        };
        
        const response = await employeeAPI.updateEmployee(currentEmployee._id, updateData);
        
        if (response.status === "success") {
          // Refresh the employees list
          await fetchEmployees();
          
          toast({
            title: "تم تحديث الموظف",
            description: "تم تحديث بيانات الموظف بنجاح",
          });
          
          setIsDialogOpen(false);
          setCurrentEmployee(null);
        } else {
          throw new Error(response.message || "فشل في تحديث الموظف");
        }
      } else {
        // Create new employee
        const createData = {
          ...formData,
        };
        
        console.log('📝 Creating employee with data:', createData);
        const response = await employeeAPI.createEmployee(createData);
        console.log('✅ Employee creation response:', response);
        
        if (response.status === "success") {
          // Refresh the employees list
          await fetchEmployees();
          
          toast({
            title: "تم إضافة الموظف",
            description: "تمت إضافة الموظف بنجاح",
          });
          
          setIsDialogOpen(false);
        } else {
          throw new Error(response.message || "فشل في إضافة الموظف");
        }
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الموظف",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          إدارة المستخدمين ({filteredEmployees.length})
        </h1>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={fetchEmployees}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span>تحديث</span>
          </Button>
          <PermissionButton 
            section="employees" 
            action="create" 
            onClick={handleAdd} 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة موظف</span>
          </PermissionButton>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث عن موظف..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          <div className="min-w-[180px]">
            <select
              className="w-full p-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">الكل</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
              <option value="معلق">معلق</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="ml-2 text-lg text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : (
          <>
            {displayMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-right py-3 px-4">الاسم</th>
                    <th className="text-right py-3 px-4">رقم الهاتف الشخصي</th>
                    <th className="text-right py-3 px-4">اسم المستخدم</th>
                    <th className="text-right py-3 px-4">الدور</th>
                    <th className="text-right py-3 px-4">تاريخ التوظيف</th>
                    <th className="text-right py-3 px-4">الحالة</th>
                    <th className="text-right py-3 px-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-lg">{getEmptyStateMessage().title}</span>
                            <span className="text-sm">{getEmptyStateMessage().subtitle}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                    <motion.tr
                      key={employee._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(employee)}
                    >
                      <td className="py-3 px-4">{employee.name}</td>
                      <td className="py-3 px-4">{employee.personalPhone}</td>
                      <td className="py-3 px-4">{employee.username}</td>
                      <td className="py-3 px-4">{employee.role}</td>
                      <td className="py-3 px-4">{employee.employmentDate ? new Date(employee.employmentDate).toLocaleDateString('en-US') : "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.status === "نشط" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredEmployees.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-lg">{getEmptyStateMessage().title}</span>
                      <span className="text-sm">{getEmptyStateMessage().subtitle}</span>
                    </div>
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRowClick(employee)}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <span className="text-xl font-bold text-primary">{employee.name?.substring(0, 2)}</span>
                      </div>
                      <h3 className="font-bold text-lg">{employee.name}</h3>
                    
                      <p className="text-sm mb-1 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${employee.status === "نشط" ? "bg-green-500" : "bg-red-500"}`}></span>
                        {employee.status}
                        {/* Debug info */}
                        <span className="text-xs text-gray-400">({employee.status === "نشط" ? "active" : "inactive"})</span>
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{employee.employeeId}</p>
                    </div>
                    <div className="flex justify-center mt-3 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(employee);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentEmployee ? "تعديل موظف" : "إضافة موظف جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">الاسم</Label>
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
                <Label htmlFor="personalId">رقم الهاتف الشخصي</Label>
                <Input
                  id="personalId"
                  value={formData.personalPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, personalPhone: e.target.value })
                  }
                  pattern="\d{11}"
                  title="يجب أن يتكون من 11 رقم"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">اسم المستخدم (بالإنجليزية فقط)</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  pattern="[a-zA-Z0-9_]+"
                  title="يجب أن يحتوي على حروف إنجليزية وأرقام فقط"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">الدور (الصلاحيات)</Label>
                <select
                  id="role"
                  className="w-full p-2 border rounded-lg"
                  value={formData.role || "موظف"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <option value="مدير">مدير</option>
                  <option value="موظف">موظف</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="employmentDate">تاريخ التوظيف</Label>
                <Input
                  id="employmentDate"
                  type="date"
                  value={formData.employmentDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={refreshing}>
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {currentEmployee ? "جاري التحديث..." : "جاري الإضافة..."}
                  </>
                ) : (
                  currentEmployee ? "تحديث" : "إضافة"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف موظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الموظف {employeeToDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.
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

      <EmployeeDetailsDialog
        employee={selectedEmployee}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}

export default Employees;
