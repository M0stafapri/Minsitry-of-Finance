import React from "react";
import { motion } from "framer-motion";
import { Search, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  Table,
  TableBody,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function CommissionSettings() {
  const [employees, setEmployees] = useLocalStorage("employees", []);
  const [suppliers, setSuppliers] = useLocalStorage("suppliers", []);
  const [customCommissions, setCustomCommissions] = useLocalStorage("customCommissions", []);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const { toast } = useToast();

  // Get active employees only
  const activeEmployees = React.useMemo(() => {
    return employees.filter(emp => emp.status === "active");
  }, [employees]);

  // Filter suppliers based on search term
  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  // Create or update a commission record
  const handleCommissionChange = (employeeId, supplierId, value) => {
    // Parse value and ensure it's between 0 and 100
    const commissionValue = parseFloat(value);
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100) return;

    // Find if there's an existing record
    const existingIndex = customCommissions.findIndex(
      commission => commission.employeeId === employeeId && commission.supplierId === supplierId
    );

    if (existingIndex >= 0) {
      // Update existing record
      const updatedCommissions = [...customCommissions];
      updatedCommissions[existingIndex] = {
        ...updatedCommissions[existingIndex],
        commissionRate: commissionValue
      };
      setCustomCommissions(updatedCommissions);
    } else {
      // Create new record
      setCustomCommissions([
        ...customCommissions,
        {
          id: Date.now(),
          employeeId,
          supplierId,
          commissionRate: commissionValue
        }
      ]);
    }
  };

  // Get custom commission rate for an employee-supplier pair
  const getCommissionRate = (employeeId, supplierId) => {
    const customRate = customCommissions.find(
      commission => commission.employeeId === employeeId && commission.supplierId === supplierId
    );
    
    // If custom rate exists, return it, otherwise return the employee's base commission
    if (customRate) {
      return customRate.commissionRate;
    }
    
    // Get the employee's base commission
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? Number(employee.commission) : 0;
  };

  // Reset all custom commission rates for an employee
  const resetEmployeeCommissions = (employeeId) => {
    // Confirm with the user
    if (!confirm("هل أنت متأكد من إعادة ضبط جميع عمولات هذا الموظف؟")) return;
    
    // Remove all custom rates for this employee
    const updatedCommissions = customCommissions.filter(
      commission => commission.employeeId !== employeeId
    );
    
    setCustomCommissions(updatedCommissions);
    
    toast({
      title: "تم إعادة ضبط العمولات",
      description: "تم إعادة ضبط جميع عمولات الموظف إلى القيمة الأساسية",
      duration: 3000
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          إدارة عمولات الموظفين
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تحديد العمولات الخاصة للموظفين</CardTitle>
          <CardDescription>
            تحديد نسبة عمولة مختلفة لكل موظف مع كل مورد. القيمة الافتراضية هي نسبة العمولة الأساسية للموظف.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Select
                value={selectedEmployee || ""}
                onValueChange={(value) => setSelectedEmployee(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر موظف" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - ({employee.commission}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="بحث عن كود مؤسسي..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {selectedEmployee && (
              <Button
                variant="outline"
                onClick={() => resetEmployeeCommissions(selectedEmployee)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة ضبط
              </Button>
            )}
          </div>

          {selectedEmployee ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-bold">المورد</TableHead>
                    <TableHead className="text-right font-bold">نسبة العمولة (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                        لا يوجد موردين مطابقين لمعايير البحث
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <motion.tr
                        key={supplier.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b"
                      >
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell className="w-40">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={getCommissionRate(selectedEmployee, supplier.id)}
                            onChange={(e) => handleCommissionChange(
                              selectedEmployee,
                              supplier.id,
                              e.target.value
                            )}
                            className="w-28"
                          />
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              اختر موظف من القائمة لعرض وتعديل نسب العمولات
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>كيفية عمل العمولات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-bold mb-2">آلية احتساب العمولات:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  يمكنك تحديد نسبة عمولة خاصة لكل موظف مع كل مورد.
                </li>
                <li>
                  النسبة الافتراضية هي نسبة العمولة الأساسية المحددة في ملف الموظف.
                </li>
                <li>
                  يتم حساب العمولة كنسبة من الفرق بين سعر الرحلة والسعر التجاري.
                </li>
                <li>
                  مثال: إذا كان الموظف "محمد" عمولته الأساسية 50% ولكن مع المورد "الدولية" تم تحديد عمولته 100%،
                  فسيحصل على عمولة 100% من أي رحلة مع هذا المورد فقط.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CommissionSettings; 