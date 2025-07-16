import React from "react";
import { Search, Filter, Calendar, X, Check, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { dateFilterOptions } from "../utils";
import { format, isValid, parse } from "date-fns";
import { ar } from "date-fns/locale";

export function TripFilters({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  customDate,
  onCustomDateChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedSuppliers,
  onSuppliersFilterChange,
  suppliers,
  selectedEmployees,
  onEmployeesFilterChange,
  employees,
  sortField,
  sortDirection,
  onSortChange,
  settlementStatus,
  onSettlementStatusChange
}) {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState(startDate || "");
  const [tempEndDate, setTempEndDate] = React.useState(endDate || "");
  const [isSupplierFilterOpen, setIsSupplierFilterOpen] = React.useState(false);
  const [isEmployeeFilterOpen, setIsEmployeeFilterOpen] = React.useState(false);

  // Initialize selectedSuppliers and selectedEmployees as arrays if they're not already
  const currentSelectedSuppliers = Array.isArray(selectedSuppliers) ? selectedSuppliers : [];
  const currentSelectedEmployees = Array.isArray(selectedEmployees) ? selectedEmployees : [];

  // Format the date range for display
  const formatDateRange = (start, end) => {
    if (!start || !end) return "";
    
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isValid(startDate) && isValid(endDate)) {
        return `${format(startDate, "yyyy-MM-dd")} → ${format(endDate, "yyyy-MM-dd")}`;
      }
    } catch (error) {
      console.error("Error formatting date range:", error);
    }
    
    return "";
  };
  
  // Handle opening the date picker dialog
  const handleOpenDatePicker = () => {
    setTempStartDate(startDate || "");
    setTempEndDate(endDate || "");
    setIsDatePickerOpen(true);
  };
  
  // Apply the selected date range
  const handleApplyDateRange = () => {
    if (onStartDateChange) {
      onStartDateChange(tempStartDate);
    }
    
    if (onEndDateChange) {
      onEndDateChange(tempEndDate);
    }
    
    setIsDatePickerOpen(false);
  };
  
  // Clear the date range
  const handleClearDateRange = () => {
    setTempStartDate("");
    setTempEndDate("");
  };

  // Handle supplier selection
  const handleSupplierToggle = (supplierId) => {
    const newSelectedSuppliers = currentSelectedSuppliers.includes(supplierId)
      ? currentSelectedSuppliers.filter(id => id !== supplierId)
      : [...currentSelectedSuppliers, supplierId];
    
    onSuppliersFilterChange(newSelectedSuppliers);
  };

  // Handle employee selection
  const handleEmployeeToggle = (employeeName) => {
    const newSelectedEmployees = currentSelectedEmployees.includes(employeeName)
      ? currentSelectedEmployees.filter(name => name !== employeeName)
      : [...currentSelectedEmployees, employeeName];
    
    onEmployeesFilterChange(newSelectedEmployees);
  };

  // Clear all supplier filters
  const clearSupplierFilters = () => {
    onSuppliersFilterChange([]);
  };

  // Clear all employee filters
  const clearEmployeeFilters = () => {
    onEmployeesFilterChange([]);
  };

  // Select all suppliers
  const selectAllSuppliers = () => {
    const allSupplierIds = suppliers.map(supplier => supplier.id.toString());
    onSuppliersFilterChange(allSupplierIds);
  };

  // Select all employees
  const selectAllEmployees = () => {
    const allEmployeeNames = employees.map(employee => employee.name);
    onEmployeesFilterChange(allEmployeeNames);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            className="w-full pl-4 pr-10"
            placeholder="البحث عن رحلة..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={onDateFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="تصفية حسب التاريخ" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Input
              type="date"
              value={customDate}
              onChange={(e) => onCustomDateChange(e.target.value)}
              className="w-[180px]"
            />
          )}

          {dateFilter === "range" && (
            <>
              <div 
                className="flex items-center w-[300px] border rounded-md p-2 cursor-pointer hover:border-gray-400 transition-colors"
                onClick={handleOpenDatePicker}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">
                  {startDate && endDate 
                    ? formatDateRange(startDate, endDate)
                    : "اختر نطاق التاريخ"}
                </span>
                {startDate && endDate && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 -mr-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStartDateChange) onStartDateChange("");
                      if (onEndDateChange) onEndDateChange("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="text-center">اختر نطاق التاريخ</DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">من تاريخ</label>
                        <Input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => {
                            setTempStartDate(e.target.value);
                            // Set end date to same or later if end date is before start date
                            if (tempEndDate && e.target.value && tempEndDate < e.target.value) {
                              setTempEndDate(e.target.value);
                            }
                          }}
                          dir="ltr"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">إلى تاريخ</label>
                        <Input
                          type="date"
                          value={tempEndDate}
                          min={tempStartDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={handleClearDateRange}>
                        مسح
                      </Button>
                      <div className="flex gap-2">
                        <DialogClose asChild>
                          <Button variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button 
                          onClick={handleApplyDateRange}
                          disabled={!tempStartDate || !tempEndDate}
                        >
                          تطبيق
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Multi-Select Supplier Filter */}
        <Popover open={isSupplierFilterOpen} onOpenChange={setIsSupplierFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              <span>
                {currentSelectedSuppliers.length === 0 
                  ? "الموردين" 
                  : currentSelectedSuppliers.length === suppliers.length 
                    ? "كل الموردين" 
                    : `${currentSelectedSuppliers.length} مورد محدد`}
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">اختر الموردين</h4>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectAllSuppliers}
                    className="text-xs"
                  >
                    الكل
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSupplierFilters}
                    className="text-xs"
                  >
                    مسح
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`supplier-${supplier.id}`}
                      checked={currentSelectedSuppliers.includes(supplier.id.toString())}
                      onCheckedChange={() => handleSupplierToggle(supplier.id.toString())}
                    />
                    <label
                      htmlFor={`supplier-${supplier.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {supplier.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {currentSelectedSuppliers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  {currentSelectedSuppliers.map((supplierId) => {
                    const supplier = suppliers.find(s => s.id.toString() === supplierId);
                    return supplier ? (
                      <Badge 
                        key={supplierId} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {supplier.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Multi-Select Employee Filter - Solo visible para administradores */}
        {(() => {
          try {
            const userDataStr = window.localStorage.getItem('userData');
            if (!userDataStr) return false;
            const userData = JSON.parse(userDataStr);
            return userData.role !== "employee";
          } catch (error) {
            console.error("Error al leer datos de usuario:", error);
            return false;
          }
        })() && (
          <Popover open={isEmployeeFilterOpen} onOpenChange={setIsEmployeeFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span>
                  {currentSelectedEmployees.length === 0 
                    ? "الموظفين" 
                    : currentSelectedEmployees.length === employees.length 
                      ? "كل الموظفين" 
                      : `${currentSelectedEmployees.length} موظف محدد`}
                </span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">اختر الموظفين</h4>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={selectAllEmployees}
                      className="text-xs"
                    >
                      الكل
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearEmployeeFilters}
                      className="text-xs"
                    >
                      مسح
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={currentSelectedEmployees.includes(employee.name)}
                        onCheckedChange={() => handleEmployeeToggle(employee.name)}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {employee.name}
                      </label>
                    </div>
                  ))}
                </div>
                
                {currentSelectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t">
                    {currentSelectedEmployees.map((employeeName) => (
                      <Badge 
                        key={employeeName} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {employeeName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Settlement Status Filter */}
        <Select value={settlementStatus} onValueChange={onSettlementStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="حالة التسوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل التسويات</SelectItem>
            <SelectItem value="settled">تمت التسوية</SelectItem>
            <SelectItem value="unsettled">لم تتم التسوية</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <Select value={sortField} onValueChange={(value) => onSortChange(value, sortDirection)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">التاريخ</SelectItem>
            <SelectItem value="tripPrice">سعر الرحلة</SelectItem>
            <SelectItem value="collection">التحصيل</SelectItem>
            <SelectItem value="commission">العمولة</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
        >
          <Filter className={`h-4 w-4 ${sortDirection === "desc" ? "transform rotate-180" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
