import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { validatePhoneNumber, formatPhoneNumber } from "@/lib/utils/phoneValidation";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { tripTypes } from "../utils";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

// قائمة أنواع السيارات (نفس القائمة المستخدمة في صفحة الموردين)
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


const tripStatusOptions = [
  { id: "active", name: "قيد التنفيذ" },
  { id: "completed", name: "مكتملة" },
  { id: "cancelled", name: "ملغاة" }
];

export function TripForm({
  open,
  onOpenChange,
  formData,
  setFormData,
  currentTrip,
  suppliers,
  selectedSupplierVehicles,
  setSelectedSupplierVehicles,
  onSubmit
}) {
  // Get customers from localStorage for auto-completion
  const [customers] = useLocalStorage("customers", []);
  
  // State for customer suggestions
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  
  // Function to filter customers based on input
  const filterCustomers = (input, field) => {
    if (!input || input.length < 2) {
      setCustomerSuggestions([]);
      if (field === 'name') {
        setShowNameSuggestions(false);
      } else if (field === 'phone') {
        setShowPhoneSuggestions(false);
      }
      return;
    }
    
    const filtered = customers.filter(customer => {
      if (field === 'name') {
        return customer.name.toLowerCase().includes(input.toLowerCase());
      } else if (field === 'phone') {
        return customer.phone.includes(input);
      }
      return false;
    });
    
    setCustomerSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    
    // Update the appropriate suggestion visibility state
    if (field === 'name') {
      setShowNameSuggestions(filtered.length > 0);
      setShowPhoneSuggestions(false); // Hide phone suggestions when filtering by name
    } else if (field === 'phone') {
      setShowPhoneSuggestions(filtered.length > 0);
      setShowNameSuggestions(false); // Hide name suggestions when filtering by phone
    }
  };
  
  // Function to select a customer from suggestions
  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerWhatsapp: customer.whatsapp || ""
    });
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
  };
  const { toast } = useToast();
  const [validationErrors, setValidationErrors] = React.useState({
    tripPrice: false,
    commercialPrice: false,
    paidAmount: false,
    type: false,
    supplier: false,
    vehicleType: false
  });
  
  // Función para verificar si la fecha del viaje es hoy o futura
  const isTripTodayOrFuture = (tripDate) => {
    if (!tripDate) return true; // Si no hay fecha, asumir futuro para evitar errores
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Resetear a 00:00:00 para comparar solo fechas
    
    const tripDateObj = new Date(tripDate);
    tripDateObj.setHours(0, 0, 0, 0);
    
    return tripDateObj >= today;
  };
  
  // Ajusta automáticamente el estado cuando cambia la fecha
  const updateStatusBasedOnDate = (newDate) => {
    // No modificar viajes cancelados
    if (formData.status === "cancelled") return;
    
    const isInFuture = isTripTodayOrFuture(newDate);
    const newStatus = isInFuture ? "active" : "completed";
    
    if (formData.status !== newStatus) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[800px] max-w-[90vw]" aria-describedby="trip-form-description">
        <DialogHeader className="pb-4 border-b mb-6">
          <DialogTitle className="text-2xl font-bold text-primary">
            {currentTrip ? "تعديل رحلة" : "إضافة رحلة جديدة"}
            {currentTrip && <span className="mr-2 text-lg font-normal text-gray-500">#{currentTrip.tripNumber}</span>}
          </DialogTitle>
          <div id="trip-form-description" className="text-sm text-gray-500">
            {currentTrip ? "قم بتعديل بيانات الرحلة" : "قم بإدخال بيانات الرحلة الجديدة"}
          </div>
          {currentTrip && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="ml-1 font-medium">التاريخ:</span> {currentTrip.date}
              </div>
              <div className="flex items-center mr-4">
                <span className="ml-1 font-medium">الحالة:</span> 
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${currentTrip.status === "active" ? "bg-blue-100 text-blue-800" : currentTrip.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} ml-2`}>
                  {currentTrip.status === "active" ? "قيد التنفيذ" : currentTrip.status === "completed" ? "مكتملة" : "ملغاة"}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>
        <form onSubmit={(e) => {
            e.preventDefault();
            
            // Resetear los errores de validación
            setValidationErrors({
              tripPrice: false,
              commercialPrice: false,
              paidAmount: false,
              type: false,
              supplier: false,
              vehicleType: false
            });
            
            let hasErrors = false;
            const errors = {};
          
          // Validación 1: Precio del viaje debe ser mayor que el precio comercial
          const tripPrice = parseFloat(formData.tripPrice) || 0;
          const commercialPrice = parseFloat(formData.commercialPrice) || 0;
          
          if (tripPrice <= commercialPrice) {
            toast({
              title: "خطأ في الأسعار",
              description: "يجب أن يكون سعر الرحلة أكبر من السعر التجاري.",
              variant: "destructive"
            });
            errors.tripPrice = true;
            errors.commercialPrice = true;
            hasErrors = true;
          }
          
          // Validación 2: El monto pagado no puede ser negativo
          const paidAmount = parseFloat(formData.paidAmount) || 0;
          
          if (paidAmount < 0) {
            toast({
              title: "خطأ في المبلغ المدفوع",
              description: "المبلغ المدفوع لا يمكن أن يكون أقل من صفر.",
              variant: "destructive"
            });
            errors.paidAmount = true;
            hasErrors = true;
          }
          
          // Validación 3: El monto pagado no puede ser mayor que el precio del viaje
          if (paidAmount > tripPrice) {
            toast({
              title: "خطأ في المبلغ المدفوع",
              description: "المبلغ المدفوع لا يمكن أن يكون أكبر من سعر الرحلة.",
              variant: "destructive"
            });
            errors.paidAmount = true;
            hasErrors = true;
          }
          
          // Validación 4: Validar campos obligatorios (نوع الرحلة، المورد، نوع السيارة)
          if (!formData.type || formData.type.trim() === "") {
            toast({
              title: "حقل مطلوب",
              description: "يجب اختيار نوع الرحلة.",
              variant: "destructive"
            });
            errors.type = true;
            hasErrors = true;
          }
          
          if (!formData.supplier || formData.supplier.trim() === "") {
            toast({
              title: "حقل مطلوب",
              description: "يجب اختيار المورد.",
              variant: "destructive"
            });
            errors.supplier = true;
            hasErrors = true;
          }
          
          if (!formData.vehicleType || formData.vehicleType.trim() === "") {
            toast({
              title: "حقل مطلوب",
              description: "يجب اختيار نوع السيارة.",
              variant: "destructive"
            });
            errors.vehicleType = true;
            hasErrors = true;
          }
          
          // Validación 5: Si se proporciona un número de teléfono del conductor, debe ser válido según el país
          if (formData.driverPhone && formData.driverPhone.trim() !== "") {
            const driverPhoneValidation = validatePhoneNumber(formData.driverPhone);
            if (!driverPhoneValidation.isValid) {
              toast({
                title: "خطأ في رقم هاتف السائق",
                description: driverPhoneValidation.error,
                variant: "destructive"
              });
              hasErrors = true;
            }
          }
          
          // Validación 6: Validar que el número de teléfono del cliente sea válido según el país
          if (formData.customerPhone) {
            const customerPhoneValidation = validatePhoneNumber(formData.customerPhone);
            if (!customerPhoneValidation.isValid) {
              toast({
                title: "خطأ في رقم هاتف العميل",
                description: customerPhoneValidation.error,
                variant: "destructive"
              });
              hasErrors = true;
            }
          } else {
            toast({
              title: "حقل مطلوب",
              description: "يجب إدخال رقم هاتف العميل.",
              variant: "destructive"
            });
            hasErrors = true;
          }
          
          // Validación 7: Si se proporciona un número de WhatsApp, debe ser válido según el país
          if (formData.customerWhatsapp && formData.customerWhatsapp.trim() !== "") {
            const whatsappValidation = validatePhoneNumber(formData.customerWhatsapp);
            if (!whatsappValidation.isValid) {
              toast({
                title: "خطأ في رقم واتساب العميل",
                description: whatsappValidation.error,
                variant: "destructive"
              });
              hasErrors = true;
            }
          }
          
          // Actualizar estado de errores para colorear los campos
          if (hasErrors) {
            setValidationErrors(errors);
            return; // Detener el envío del formulario si hay errores
          }
          
          // Si no hay errores, continuar con el envío normal
          onSubmit(e);
        }} className="bg-gray-50 -m-4 p-4 space-y-6">
          {/* بيانات العميل */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">1</span>بيانات العميل</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم العميل<span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                    value={formData.customerName}
                    onChange={(e) => {
                      setFormData({ ...formData, customerName: e.target.value });
                      filterCustomers(e.target.value, 'name');
                    }}
                    onFocus={() => {
                      if (formData.customerName && formData.customerName.length >= 2) {
                        filterCustomers(formData.customerName, 'name');
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowNameSuggestions(false), 200);
                    }}
                    placeholder="أدخل اسم العميل"
                    required
                  />
                  {showNameSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex flex-col"
                          onClick={() => selectCustomer(customer)}
                        >
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-sm text-gray-600">{customer.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>رقم هاتف العميل<span className="text-red-500">*</span></Label>
                <div className="relative">
                  <PhoneInput
                    value={formData.customerPhone}
                    onChange={(value) => {
                      setFormData({ ...formData, customerPhone: value });
                      filterCustomers(value, 'phone');
                    }}
                    onFocus={() => {
                      if (formData.customerPhone && formData.customerPhone.length >= 2) {
                        filterCustomers(formData.customerPhone, 'phone');
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowPhoneSuggestions(false), 200);
                    }}
                    placeholder="أدخل رقم هاتف العميل"
                    required
                    readOnly={currentTrip}
                    disabled={currentTrip}
                    error={formData.customerPhone && !validatePhoneNumber(formData.customerPhone).isValid}
                  />
                  {!currentTrip && showPhoneSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {customerSuggestions.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex flex-col"
                          onClick={() => selectCustomer(customer)}
                        >
                          <span className="font-medium">{customer.name}</span>
                          <span className="text-sm text-gray-600">{customer.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.customerPhone && !validatePhoneNumber(formData.customerPhone).isValid && (
                  <div className="text-red-500 text-xs mt-1">{validatePhoneNumber(formData.customerPhone).error}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label>رقم واتساب العميل</Label>
                <PhoneInput
                  value={formData.customerWhatsapp || ""}
                  onChange={(value) => {
                    setFormData({ ...formData, customerWhatsapp: value });
                  }}
                  placeholder="رقم الواتساب (اختياري)"
                  readOnly={currentTrip}
                  disabled={currentTrip}
                  error={formData.customerWhatsapp && !validatePhoneNumber(formData.customerWhatsapp).isValid}
                />
              </div>
            </div>
          </div>

          {/* نوع الرحلة والتاريخ */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">2</span>معلومات الرحلة الأساسية</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع الرحلة<span className="text-red-500">*</span></Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value });
                    // Limpiar el error si se selecciona un valor
                    if (validationErrors.type) {
                      setValidationErrors(prev => ({ ...prev, type: false }));
                    }
                  }}
                  required
                >
                  <SelectTrigger className={validationErrors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="اختر نوع الرحلة" />
                  </SelectTrigger>
                  {validationErrors.type && (
                    <div className="text-red-500 text-xs mt-1">يجب اختيار نوع الرحلة</div>
                  )}
                  <SelectContent>
                    {tripTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ الرحلة<span className="text-red-500">*</span></Label>
                <Input
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setFormData({ ...formData, date: newDate });
                    // Actualizar automáticamente el estado basado en la fecha
                    updateStatusBasedOnDate(newDate);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* بيانات الرحلة */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">3</span>تفاصيل الرحلة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المسار<span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="أدخل المسار"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>المورد<span className="text-red-500">*</span></Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => {
                    setFormData({ ...formData, supplier: value, vehicleType: "" });
                    const selectedSupplier = suppliers.find(s => s.id.toString() === value);
                    const vehicleTypes = selectedSupplier?.vehicles || [];
                    setSelectedSupplierVehicles(vehicleTypes.map(vehicleId => ({
                      id: vehicleId,
                      type: vehicleId
                    })));
                    // Limpiar el error si se selecciona un valor
                    if (validationErrors.supplier) {
                      setValidationErrors(prev => ({ ...prev, supplier: false }));
                    }
                  }}
                  required
                >
                  <SelectTrigger className={validationErrors.supplier ? "border-red-500" : ""}>
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  {validationErrors.supplier && (
                    <div className="text-red-500 text-xs mt-1">يجب اختيار المورد</div>
                  )}
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع السيارة<span className="text-red-500">*</span></Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, vehicleType: value });
                    // Limpiar el error si se selecciona un valor
                    if (validationErrors.vehicleType) {
                      setValidationErrors(prev => ({ ...prev, vehicleType: false }));
                    }
                  }}
                  disabled={!formData.supplier}
                  required
                >
                  <SelectTrigger className={validationErrors.vehicleType ? "border-red-500" : ""}>
                    <SelectValue placeholder="اختر نوع السيارة" />
                  </SelectTrigger>
                  {validationErrors.vehicleType && (
                    <div className="text-red-500 text-xs mt-1">يجب اختيار نوع السيارة</div>
                  )}
                  <SelectContent>
                    {selectedSupplierVehicles.map((vehicle) => {
                      // العثور على النوع المطابق من قائمة الأنواع لعرض الاسم الصحيح
                      const vehicleInfo = vehicleTypes.find(vt => vt.id === vehicle.type) || { id: vehicle.type, name: vehicle.type };
                      return (
                        <SelectItem key={vehicleInfo.id} value={vehicleInfo.id}>
                          {vehicleInfo.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* بيانات التكلفة */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">4</span>بيانات التكلفة</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر التجاري<span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  value={formData.commercialPrice}
                  onChange={(e) => {
                    const newCommercialPrice = parseFloat(e.target.value) || 0;
                    const tripPrice = formData.tripPrice || 0;
                    const quantity = parseInt(formData.quantity) || 1;
                    
                    setFormData({
                      ...formData,
                      baseCommercialPrice: newCommercialPrice / quantity,
                      commercialPrice: newCommercialPrice,
                      commission: tripPrice - newCommercialPrice
                    });
                    
                    // Resetear error al editar
                    if (validationErrors.commercialPrice) {
                      setValidationErrors(prev => ({
                        ...prev,
                        commercialPrice: false
                      }));
                    }
                  }}
                  placeholder="أدخل السعر التجاري"
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary ${validationErrors.commercialPrice ? "border-red-500 focus:ring-red-500" : ""}`}
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الرحلة<span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary ${validationErrors.tripPrice ? "border-red-500 focus:ring-red-500" : ""}`}
                  value={formData.tripPrice}
                  onChange={(e) => {
                    const newTripPrice = parseFloat(e.target.value) || 0;
                    const commercialPrice = formData.commercialPrice || 0;
                    const paidAmount = formData.paidAmount || 0;
                    const quantity = parseInt(formData.quantity) || 1;
                    
                    setFormData({
                      ...formData,
                      baseTripPrice: newTripPrice / quantity,
                      tripPrice: newTripPrice,
                      commission: newTripPrice - commercialPrice,
                      collection: newTripPrice - paidAmount
                    });
                    
                    // Resetear error al editar
                    if (validationErrors.tripPrice) {
                      setValidationErrors(prev => ({
                        ...prev,
                        tripPrice: false
                      }));
                    }
                    
                    // Verificar si el monto pagado ahora excede el precio del viaje
                    if (paidAmount > newTripPrice) {
                      setValidationErrors(prev => ({
                        ...prev,
                        paidAmount: true
                      }));
                    } else if (validationErrors.paidAmount) {
                      setValidationErrors(prev => ({
                        ...prev,
                        paidAmount: false
                      }));
                    }
                  }}
                  placeholder="أدخل سعر الرحلة"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ المدفوع<span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary ${validationErrors.paidAmount ? "border-red-500 focus:ring-red-500" : ""}`}
                  value={formData.paidAmount}
                  onChange={(e) => {
                    const newPaidAmount = parseFloat(e.target.value) || 0;
                    const tripPrice = formData.tripPrice || 0;
                    
                    setFormData({
                      ...formData,
                      paidAmount: newPaidAmount,
                      collection: tripPrice - newPaidAmount
                    });
                    
                    // Resetear error al editar
                    if (validationErrors.paidAmount) {
                      // Comprobar si el nuevo valor sigue siendo erróneo
                      if (newPaidAmount < 0 || newPaidAmount > tripPrice) {
                        // Mantener el error
                      } else {
                        // Resetear el error si el valor ahora es válido
                        setValidationErrors(prev => ({
                          ...prev,
                          paidAmount: false
                        }));
                      }
                    }
                  }}
                  placeholder="أدخل المبلغ المدفوع"
                  required
                  min="0"
                  max={formData.tripPrice || 0}
                />
              </div>
              <div className="space-y-2">
                <Label>التحصيل<span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  placeholder="أدخل التحصيل"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الكمية<span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    const commercialPrice = parseFloat(formData.baseCommercialPrice || formData.commercialPrice) || 0;
                    const tripPrice = parseFloat(formData.baseTripPrice || formData.tripPrice) || 0;
                    
                    setFormData({
                      ...formData,
                      quantity: newQuantity,
                      baseCommercialPrice: formData.baseCommercialPrice || commercialPrice,
                      baseTripPrice: formData.baseTripPrice || tripPrice,
                      commercialPrice: (formData.baseCommercialPrice || commercialPrice) * newQuantity,
                      tripPrice: (formData.baseTripPrice || tripPrice) * newQuantity,
                      commission: (formData.baseTripPrice || tripPrice) * newQuantity - (formData.baseCommercialPrice || commercialPrice) * newQuantity
                    });
                  }}
                  placeholder="أدخل الكمية"
                  required
                />
              </div>
              {/* Campo de status eliminado - ahora se determina automáticamente según la fecha */}
              {currentTrip && (
                <div className="space-y-2">
                  <Label>إلغاء الرحلة</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cancelTrip"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                      checked={formData.status === "cancelled"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Si se marca, cancelar el viaje y establecer isSettled
                          setFormData({ ...formData, status: "cancelled", isSettled: true });
                        } else {
                          // Si se desmarca, restaurar el estado basado en la fecha
                          const isInFuture = isTripTodayOrFuture(formData.date);
                          const newStatus = isInFuture ? "active" : "completed";
                          setFormData({ ...formData, status: newStatus });
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                      الرحلة ملغاة
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>العمولة</Label>
                <Input
                  type="number"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary bg-gray-100"
                  value={formData.commission}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* بيانات السائق */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">5</span>بيانات السائق</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم السائق</Label>
                <Input
                  type="text"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  placeholder="أدخل اسم السائق"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم هاتف السائق</Label>
                <div className="relative">
                  <Input
                    type="text"
                    className={`transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary ${!formData.driverPhone || formData.driverPhone.length === 0 || formData.driverPhone.length === 11 ? "" : "border-red-500"}`}
                    value={formData.driverPhone}
                    onChange={(e) => {
                      // تحقق من أن المدخل يحتوي فقط على أرقام
                      const value = e.target.value;
                      const numericValue = value.replace(/[^0-9]/g, '');
                      // تحديد عدد الأرقام إلى 11 رقم كحد أقصى
                      const limitedValue = numericValue.slice(0, 11);
                      setFormData({ ...formData, driverPhone: limitedValue });
                    }}
                    placeholder="أدخل رقم هاتف السائق (11 رقم)"
                  />
                  {formData.driverPhone && formData.driverPhone.length > 0 && formData.driverPhone.length !== 11 && (
                    <div className="text-red-500 text-xs mt-1">يجب أن يتكون رقم الهاتف من 11 رقم بالضبط</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* إثبات الدفع */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">6</span>إثبات الدفع</h3>
            <div className="space-y-2">
              <Label>صورة إثبات الدفع{formData.paidAmount > 0 && (!formData.paymentProof) ? <span className="text-red-500">*</span> : null}</Label>
              {formData.paymentProof && (
                <div className="mt-2 mb-4 relative w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={formData.paymentProof}
                    alt="إثبات الدفع"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23adb5bd'%3Eلا يمكن تحميل الصورة%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              )}
              <div className="flex items-start gap-2">
                <Input
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary-100 focus:border-primary"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        // Guardar la imagen como cadena base64
                        setFormData({ ...formData, paymentProof: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/*"
                  required={formData.paidAmount > 0 && !formData.paymentProof}
                />
                {currentTrip && formData.paymentProof && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setFormData({ ...formData, paymentProof: null })}
                  >
                    حذف
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {currentTrip && formData.paymentProof ? "يمكنك تغيير الصورة أو الاحتفاظ بالصورة الحالية" : "يرجى اختيار صورة إثبات الدفع"}
              </div>
            </div>
          </div>

          {/* بيانات التسوية */}
          <div className="rounded-lg border p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700"><span className="inline-block w-6 h-6 bg-primary-100 rounded-full mr-2 flex items-center justify-center text-primary">7</span>حالة التسوية</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>تمت التسوية</Label>
                <input
                  type="checkbox"
                  checked={formData.isSettled || (formData.status === "cancelled")}
                  onChange={(e) => {
                    // Prevent changing settlement status if trip is cancelled
                    if (formData.status !== "cancelled") {
                      setFormData({ ...formData, isSettled: e.target.checked });
                    }
                  }}
                  disabled={formData.status === "cancelled"}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                />
                {formData.status === "cancelled" && (
                  <span className="text-xs text-gray-500">(الرحلات الملغاة تحسب دائمًا كمسواة)</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-6 flex justify-between sticky bottom-0 bg-white py-4 shadow-md">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-300 hover:bg-gray-50 pl-6 pr-6"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-600 transition-colors pl-6 pr-6"
            >
              {currentTrip ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
