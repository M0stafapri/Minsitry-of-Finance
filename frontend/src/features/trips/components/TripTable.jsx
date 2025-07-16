import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MoreVertical, 
  Eye, 
  Edit,
  Copy,
  User,
  Trash2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckSquare,
  XSquare,
  ChevronRight,
  FileText,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { tripTypes, getSettlementValue, getTripStatus } from "../utils";
import { parseISO, isAfter, isBefore, startOfDay } from "date-fns";

export function TripTable({ 
  filteredTrips,
  suppliers,
  selectedTrips,
  onSelectTrip,
  onSelectAll,
  onViewDetails,
  onEdit,
  onCopyBooking,
  onCopyDriver,
  onSettlement,
  onStatusChange,
  onDelete,
  onGenerateInvoice
}) {
  // استخراج بيانات المستخدم الحالي من localStorage
  const [userData, setUserData] = useState(null);
  const [showTotals, setShowTotals] = useState(false);
  
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('خطأ في قراءة بيانات المستخدم:', error);
    }
  }, []);

  // Helper function to check if trip date is in the future
  const isTripDateInFuture = (tripDate) => {
    try {
      const today = startOfDay(new Date());
      const tripDateObj = startOfDay(parseISO(tripDate));
      return isAfter(tripDateObj, today);
    } catch (error) {
      console.error("Error parsing trip date:", error);
      return false;
    }
  };

  // Helper function to check if trip date is in the past
  const isTripDateInPast = (tripDate) => {
    try {
      const today = startOfDay(new Date());
      const tripDateObj = startOfDay(parseISO(tripDate));
      return isBefore(tripDateObj, today);
    } catch (error) {
      console.error("Error parsing trip date:", error);
      return false;
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      commercialPrice: 0,
      tripPrice: 0,
      paidAmount: 0,
      collection: 0,
      commission: 0,
      settlementValue: 0
    };

    filteredTrips.forEach(trip => {
      totals.commercialPrice += Number(trip.commercialPrice || 0);
      totals.tripPrice += Number(trip.tripPrice || 0);
      totals.paidAmount += Number(trip.paidAmount || 0);
      totals.collection += Number(trip.collection || 0);
      totals.commission += Number(trip.commission || 0);
      totals.settlementValue += getSettlementValue(trip);
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                    checked={selectedTrips.length > 0 && selectedTrips.length === filteredTrips.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">رقم الرحلة</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">البند</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">تاريخ الرحلة</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">المسار</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">الكمية</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">السعر التجاري</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">سعر الرحلة</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">المبلغ المدفوع</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">التحصيل</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">العمولة</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">المورد</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">قيمة التسوية</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">التسوية</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">حالة الرحلة</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">الموظف</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredTrips.map((trip) => {
                const settlementValue = getSettlementValue(trip);
                // Use the updated getTripStatus function that handles cancellation status
                const tripStatus = getTripStatus(trip.date, trip.status);
                
                return (
                  <motion.tr 
                    key={trip.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedTrips.includes(trip.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    onClick={() => onViewDetails(trip)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-3 py-2 text-center text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-500"
                        checked={selectedTrips.includes(trip.id)}
                        onChange={(e) => onSelectTrip(trip.id, e.target.checked, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300 font-bold">
                      {trip.tripNumber}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                      {tripTypes.find(t => t.id === trip.type)?.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.date}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.route}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.quantity || 1}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.commercialPrice}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.tripPrice}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.paidAmount}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.collection}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">{trip.commission}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                      {suppliers.find(s => s.id === Number(trip.supplier))?.name}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {settlementValue === 0 ? (
                        <span className="text-gray-900 dark:text-gray-300">0</span>
                      ) : (
                        <div className={`flex items-center gap-1 ${
                          settlementValue > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          <span>{Math.abs(settlementValue)}</span>
                          {settlementValue !== 0 && (
                            settlementValue > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                      {trip.isSettled ? "نعم" : "لا"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tripStatus === "ملغاة"
                          ? "bg-red-100 text-red-800" 
                          : tripStatus === "مكتملة" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {tripStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-300">
                      {trip.employee || ""}
                    </td>
                    <td className="px-3 py-2 text-xs" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(trip)}>
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(trip)}>
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onGenerateInvoice(trip)}
                            disabled={trip.status === "cancelled"}
                          >
                            <FileText className="ml-2 h-4 w-4" />
                            اصدار فاتورة PDF
                            {trip.status === "cancelled" && (
                              <span className="mr-2 text-xs text-gray-500">(غير متاح للرحلات الملغاة)</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyBooking(trip)}>
                            <Copy className="ml-2 h-4 w-4" />
                            نسخ رسالة الحجز للواتساب
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyDriver(trip)}>
                            <User className="ml-2 h-4 w-4" />
                            نسخ بيانات السائق
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <CheckCircle2 className="ml-2 h-4 w-4" />
                              حالة التسوية
                              <ChevronRight className="mr-auto h-4 w-4" />
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent sideOffset={24} alignOffset={-5}>
                              <DropdownMenuItem 
                                onClick={() => onSettlement({...trip, isSettled: false}, true)}
                                disabled={trip.status === "cancelled"}
                              >
                                <XCircle className="ml-2 h-4 w-4 text-orange-500" />
                                إلغاء التسوية
                                {trip.status === "cancelled" && (
                                  <span className="mr-2 text-xs text-gray-500">(غير متاح للرحلات الملغاة)</span>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onSettlement({...trip, isSettled: true}, true)}>
                                <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                                تسوية الرحلة
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Clock className="ml-2 h-4 w-4" />
                              حالة الرحلة
                              <ChevronRight className="mr-auto h-4 w-4" />
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent sideOffset={24} alignOffset={-5}>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(trip, "active")}
                                disabled={isTripDateInPast(trip.date)}
                              >
                                <Clock className="ml-2 h-4 w-4 text-yellow-500" />
                                قيد التنفيذ
                                {isTripDateInPast(trip.date) && (
                                  <span className="mr-2 text-xs text-gray-500">(تاريخ الرحلة في الماضي)</span>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(trip, "completed")}
                                disabled={isTripDateInFuture(trip.date)}
                              >
                                <CheckSquare className="ml-2 h-4 w-4 text-green-500" />
                                مكتملة
                                {isTripDateInFuture(trip.date) && (
                                  <span className="mr-2 text-xs text-gray-500">(تاريخ الرحلة في المستقبل)</span>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onStatusChange(trip, "cancelled")}>
                                <XSquare className="ml-2 h-4 w-4 text-red-500" />
                                ملغاة
                                <span className="mr-2 text-xs text-gray-500">(سيتم تسوية الرحلة تلقائيًا)</span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => onDelete(trip)}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                );
              })}
              
              {/* Totals Row */}
              {showTotals && filteredTrips.length > 0 && (
                <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                  <td className="px-3 py-3 text-center text-xs font-bold text-blue-900 dark:text-blue-100">
                    الإجمالي
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    {totals.commercialPrice.toLocaleString()} ج.م
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    {totals.tripPrice.toLocaleString()} ج.م
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    {totals.paidAmount.toLocaleString()} ج.م
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    {totals.collection.toLocaleString()} ج.م
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    {totals.commission.toLocaleString()} ج.م
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold">
                    {totals.settlementValue === 0 ? (
                      <span className="text-blue-900 dark:text-blue-100">0</span>
                    ) : (
                      <div className={`flex items-center gap-1 ${
                        totals.settlementValue > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        <span>{Math.abs(totals.settlementValue).toLocaleString()}</span>
                        {totals.settlementValue !== 0 && (
                          totals.settlementValue > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-900 dark:text-blue-100">
                    -
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Toggle Button - At the bottom */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant={showTotals ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTotals(!showTotals)}
            className="flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            {showTotals ? "إخفاء الإجمالي" : "إظهار الإجمالي"}
          </Button>
          {showTotals && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              إجمالي {filteredTrips.length} رحلة
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
