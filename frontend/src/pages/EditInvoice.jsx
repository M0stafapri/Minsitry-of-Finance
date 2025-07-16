import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications } from "@/context/NotificationsContext";

function EditInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [invoices, setInvoices] = useLocalStorage("invoices", []);
  const [allTrips] = useLocalStorage("trips", []);
  const [employees] = useLocalStorage("employees", []);
  const { addNotification } = useNotifications();
  const [formData, setFormData] = React.useState(location.state?.invoice || {});
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = React.useState(false);
  const [newStatusValue, setNewStatusValue] = React.useState(null);

  // Get user data
  const userData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  }, []);

  // Check if user has permission to edit this invoice
  const hasPermission = React.useMemo(() => {
    if (!formData.id || !userData.role) return false;

    // Admins can edit all invoices
    if (userData.role !== 'employee') return true;

    // Employees can only edit invoices for their trips
    const tripNumber = formData.tripDetails?.tripNumber;
    if (!tripNumber) return false;

    const trip = allTrips.find(t => t.tripNumber === tripNumber);
    return trip && trip.employee === userData.name;
  }, [formData, userData, allTrips]);

  React.useEffect(() => {
    if (!hasPermission) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية لتعديل هذه الفاتورة",
        variant: "destructive"
      });
      navigate("/invoices");
    }
  }, [hasPermission, navigate, toast]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update invoice in storage
    const updatedInvoiceData = {
      ...formData,
      updatedAt: new Date().toISOString(),
      updatedBy: userData?.name || "System"
    };
    const updatedInvoices = invoices.map(inv => 
      inv.id === formData.id ? updatedInvoiceData : inv
    );
    
    setInvoices(updatedInvoices);
    
    toast({
      title: "تم تحديث الفاتورة",
      description: "تم حفظ التغييرات بنجاح"
    });

    // Send notification to admins and managers
    const managersAndAdmins = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
    managersAndAdmins.forEach(user => {
      if (String(user.id) !== String(userData?.id)) { // Avoid notifying the user who made the change
        addNotification({
          type: 'invoice-updated',
          title: "تم تعديل فاتورة",
          message: `قام الموظف ${userData?.name || 'المسؤول'} بتعديل الفاتورة رقم ${formData.id} للعميل ${formData.customerName}.`,
          userId: String(user.id),
          forUser: String(user.id),
          path: `/invoices?invoiceId=${formData.id}`,
          icon: 'FileEdit',
          color: 'orange'
        });
      }
    });
    
    navigate("/invoices");
  };

  // Add new item to invoice
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { item: "", date: "", description: "", unitPrice: 0, quantity: 1, total: 0 }
      ]
    }));
  };

  // Remove item from invoice
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item in invoice
  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      if (!newItems[index]) {
        newItems[index] = { item: "", date: "", description: "", unitPrice: 0, quantity: 1, total: 0 };
      }
      
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        total: field === 'unitPrice' ? (value || 0) * (newItems[index].quantity || 1) :
                field === 'quantity' ? (value || 1) * (newItems[index].unitPrice || 0) :
                newItems[index].total || 0
      };
      
      // Calculate total amount
      const totalAmount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const remainingAmount = totalAmount - (prev.paidAmount || 0);
      
      // Automatically set status based on remaining amount
      let status = prev.status || 'معلق';
      if (remainingAmount === 0) {
        status = 'مدفوع';
      } else if (remainingAmount > 0) {
        status = 'معلق';
      }

      return {
        ...prev,
        items: newItems,
        totalAmount,
        remainingAmount,
        status
      };
    });
  };

  // Handle paid amount change
  const handlePaidAmountChange = (paidAmount) => {
    setFormData(prev => {
      // Ensure paid amount doesn't exceed total amount
      if (paidAmount > (prev.totalAmount || 0)) {
        toast({
          title: "خطأ في المبلغ المدفوع",
          description: "لا يمكن أن يكون المبلغ المدفوع أكبر من السعر الإجمالي",
          variant: "destructive"
        });
        return prev;
      }

      const remainingAmount = (prev.totalAmount || 0) - paidAmount;
      
      // Automatically set status based on remaining amount
      let status = prev.status;
      if (remainingAmount === 0) {
        status = 'مدفوع';
      } else if (remainingAmount > 0) {
        status = 'معلق';
      }

      return {
        ...prev,
        paidAmount,
        remainingAmount,
        status
      };
    });
  };

  // Handle status change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    
    // For changing to paid status when there's remaining amount
    if (newStatus === 'مدفوع' && formData.remainingAmount > 0) {
      setNewStatusValue(newStatus);
      setIsStatusChangeDialogOpen(true);
      return;
    }

    // For changing to pending status
    if (newStatus === 'معلق' && formData.remainingAmount === 0) {
      toast({
        title: "لا يمكن تغيير الحالة",
        description: "لا يمكن تغيير الحالة إلى معلق لأن المبلغ المستحق يساوي 0",
        variant: "destructive"
      });
      return;
    }

    // For all other cases
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleStatusChangeConfirm = () => {
    setFormData(prev => ({
      ...prev,
      status: newStatusValue,
      paidAmount: prev.totalAmount,
      remainingAmount: 0
    }));
    setIsStatusChangeDialogOpen(false);
    setNewStatusValue(null);
  };

  const itemOptions = [
    "ذهاب",
    "عودة",
    "ايجار يومي",
    "نصف يومي",
    "ايجار مع مبيت",
    "استقبال مطار",
    "تسفير مطار",
    "ايجار بدون سائق"
  ];

  if (!formData.id) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          لم يتم العثور على الفاتورة
        </div>
        <Button
          className="mt-4 mx-auto block"
          onClick={() => navigate("/invoices")}
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للفواتير
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-6">تعديل الفاتورة #{formData.id}</h1>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Label className="w-24">فاتورة لـ:</Label>
                  <Input
                    value={formData.customerName || ""}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-64"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-24">رقم الفاتورة:</Label>
                  <Input
                    value={formData.id}
                    readOnly
                    className="w-64 bg-gray-50"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-24">التاريخ:</Label>
                  <Input
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-64"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-24">الحالة:</Label>
                  <select
                    className="w-64 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.status || "معلق"}
                    onChange={handleStatusChange}
                  >
                    <option value="معلق">معلق</option>
                    <option value="مدفوع">مدفوع</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold mb-2">الدولية للنقل السياحي</div>
              <div className="text-sm text-gray-600">
                <div>27ش ميدان ابن الحكم، امام دنيا الجمبري</div>
                <div>برج المرمر، الدور السادس</div>
                <div>حلمية الزيتون، القاهرة</div>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-right border">البند</th>
                  <th className="p-3 text-right border">التاريخ</th>
                  <th className="p-3 text-right border">الوصف</th>
                  <th className="p-3 text-right border">سعر الوحدة</th>
                  <th className="p-3 text-right border">الكمية</th>
                  <th className="p-3 text-right border">المجموع</th>
                  <th className="p-3 text-center border">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 border">
                      <select
                        value={item.item || ""}
                        onChange={(e) => updateItem(index, "item", e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-800"
                      >
                        <option value="">اختر البند</option>
                        {itemOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItem(index, "date", e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        required
                        placeholder="ادخل الوصف"
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        required
                        min="1"
                        placeholder="1"
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        value={item.total}
                        readOnly
                        className="bg-gray-50"
                      />
                    </td>
                    <td className="p-3 border text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={formData.items?.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="mb-6"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة بند جديد
          </Button>

          {/* Invoice Summary */}
          <div className="border-t pt-6">
            <div className="flex justify-end space-y-2">
              <div className="w-72 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">الإجمالي:</span>
                  <span>{formData.totalAmount?.toFixed(2) || "0.00"} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">المبلغ المدفوع:</span>
                  <Input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => handlePaidAmountChange(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>المبلغ المستحق:</span>
                  <span>{formData.remainingAmount?.toFixed(2) || "0.00"} ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/invoices")}
          >
            إلغاء
          </Button>
          <Button type="submit">
            <Save className="ml-2 h-4 w-4" />
            حفظ التغييرات
          </Button>
        </div>
      </form>

      {/* Status Change Dialog */}
      <Dialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد تغيير حالة الفاتورة</DialogTitle>
            <DialogDescription>
              سيتم تعديل المبلغ المدفوع تلقائياً إلى {formData.totalAmount} ج.م وتغيير حالة الفاتورة إلى مدفوع.
              <br />
              هل تريد المتابعة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusChangeDialogOpen(false);
                setNewStatusValue(null);
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

export default EditInvoice; 