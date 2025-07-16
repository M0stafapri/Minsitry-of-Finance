import React from "react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { tripTypes } from "../utils";
import { CalendarIcon, CarIcon, UserIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

const tripStatusOptions = [
  { id: "active", name: "قيد التنفيذ" },
  { id: "completed", name: "مكتملة" },
  { id: "cancelled", name: "ملغاة" }
];

export function TripDetailsDialog({
  open,
  onOpenChange,
  selectedTrip,
  suppliers
}) {
  if (!selectedTrip) return null;

  // Función para formatear valores monetarios
  const formatCurrency = (value) => {
    if (!value) return "0";
    return Number(value).toLocaleString("ar-EG");
  };

  // Obtener el nombre del proveedor
  const supplierName = suppliers.find(s => s.id === Number(selectedTrip.supplier))?.name || "غير محدد";
  
  // Obtener el nombre del tipo de viaje
  const tripTypeName = tripTypes.find(t => t.id === selectedTrip.type)?.name || "غير محدد";
  
  // Obtener el nombre del estado del viaje
  const statusName = tripStatusOptions.find(s => s.id === selectedTrip.status)?.name || "قيد التنفيذ";
  
  // Calcular el balance
  const balance = (parseFloat(selectedTrip.tripPrice) || 0) - (parseFloat(selectedTrip.paidAmount) || 0);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[800px] max-w-[90vw]" aria-describedby="trip-details-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            تفاصيل الرحلة {selectedTrip.tripNumber && <span className="mr-2 text-lg font-normal text-gray-500">#{selectedTrip.tripNumber}</span>}
          </DialogTitle>
          <div id="trip-details-description" className="text-sm text-gray-500">
            عرض كافة تفاصيل الرحلة والمعلومات المتعلقة بها
          </div>
        </DialogHeader>
        
        {/* Información principal del viaje */}
        <div className="bg-primary-50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold">{selectedTrip.date}</span>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedTrip.status === "cancelled" ? "bg-red-100 text-red-800" : selectedTrip.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
              {statusName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{tripTypeName}</span>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Sección de cliente */}
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700 border-b pb-2">
              <UserIcon className="h-5 w-5 mr-2 text-primary" />
              بيانات التوقيع
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label className="text-gray-500">اسم التوقيع</Label>
                <div className="mt-1 font-semibold text-lg">{selectedTrip.customerName}</div>
              </div>
              <div>
                <Label className="text-gray-500">رقم هاتف صاحب التوقيع</Label>
                <div className="mt-1 font-semibold text-lg">{selectedTrip.customerPhone}</div>
              </div>
              <div>
                <Label className="text-gray-500">رقم واتساب صاحب التوقيع</Label>
                <div className="mt-1 font-semibold">{selectedTrip.customerWhatsapp || selectedTrip.customerPhone}</div>
              </div>
            </div>
          </div>
          
          {/* Sección de detalles del viaje */}
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700 border-b pb-2">
              <CarIcon className="h-5 w-5 mr-2 text-primary" />
              تفاصيل الرحلة
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label className="text-gray-500">المسار</Label>
                <div className="mt-1 font-semibold">{selectedTrip.route}</div>
              </div>
              <div>
                <Label className="text-gray-500">الكمية</Label>
                <div className="mt-1 font-semibold">{selectedTrip.quantity || 1}</div>
              </div>
              <div>
                <Label className="text-gray-500">الكود المؤسسي</Label>
                <div className="mt-1 font-semibold">{supplierName}</div>
              </div>
              <div>
                <Label className="text-gray-500">نوع السيارة</Label>
                <div className="mt-1 font-semibold">{selectedTrip.vehicleType}</div>
              </div>
            </div>
          </div>
          
          {/* Sección de información financiera */}
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700 border-b pb-2">
              <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
              المعلومات المالية
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <Label className="text-gray-500">السعر التجاري</Label>
                <div className="mt-1 font-semibold">{formatCurrency(selectedTrip.commercialPrice)} ج.م</div>
              </div>
              <div>
                <Label className="text-gray-500">سعر الرحلة</Label>
                <div className="mt-1 font-semibold">{formatCurrency(selectedTrip.tripPrice)} ج.م</div>
              </div>
              <div>
                <Label className="text-gray-500">المبلغ المدفوع</Label>
                <div className="mt-1 font-semibold">{formatCurrency(selectedTrip.paidAmount)} ج.م</div>
              </div>
              <div>
                <Label className="text-gray-500">التحصيل</Label>
                <div className="mt-1 font-semibold">{formatCurrency(selectedTrip.collection)} ج.م</div>
              </div>
              <div>
                <Label className="text-gray-500">العمولة</Label>
                <div className="mt-1 font-semibold">{formatCurrency(selectedTrip.commission)} ج.م</div>
              </div>
              <div>
                <Label className="text-gray-500">المتبقي</Label>
                <div className="mt-1 font-semibold text-primary">{formatCurrency(balance)} ج.م</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-gray-500">حالة التسوية</Label>
                  {selectedTrip.isSettled ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="font-semibold">تمت التسوية</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircleIcon className="h-4 w-4" />
                      <span className="font-semibold">لم تتم التسوية</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de información del conductor */}
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700 border-b pb-2">
              <UserIcon className="h-5 w-5 mr-2 text-primary" />
              بيانات السائق
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <Label className="text-gray-500">اسم السائق</Label>
                <div className="mt-1 font-semibold">{selectedTrip.driverName || "غير محدد"}</div>
              </div>
              <div>
                <Label className="text-gray-500">رقم هاتف السائق</Label>
                <div className="mt-1 font-semibold">{selectedTrip.driverPhone || "غير محدد"}</div>
              </div>
          </div>
          
            </div>
          </div>
          
          {/* Sección de imagen de prueba de pago */}
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary-700 border-b pb-2">
              <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
              إثبات الدفع
            </h3>
            <div className="mt-2">
              {selectedTrip.paymentProof && selectedTrip.paymentProof !== "" ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={selectedTrip.paymentProof}
                    alt="إثبات الدفع"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f8f9fa'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23adb5bd'%3Eلا يمكن تحميل الصورة%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                  لا يوجد صورة إثبات دفع
                </div>
              )}
            </div>
        </div>
        
        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
