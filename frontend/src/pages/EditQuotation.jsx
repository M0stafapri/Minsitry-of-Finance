import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Save, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications } from "@/context/NotificationsContext";

function EditQuotation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [quotations, setQuotations] = useLocalStorage("quotations", []);
  const [employees] = useLocalStorage("employees", []);
  const { addNotification } = useNotifications();
  const [formData, setFormData] = React.useState(location.state?.quote || {});
  const [includeVAT, setIncludeVAT] = React.useState(location.state?.quote?.includeVAT || false);
  const [includeTaxDiscount, setIncludeTaxDiscount] = React.useState(location.state?.quote?.includeTaxDiscount || false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = React.useState(false);
  const [newStatusValue, setNewStatusValue] = React.useState(null);

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

  const maxDate = new Date().toISOString().split("T")[0];

  // Get user data
  const userData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  }, []);

  // Check if user has permission to edit this quotation
  const hasPermission = React.useMemo(() => {
    if (!formData.id || !userData.role) return false;

    // Admins can edit all quotations
    if (userData.role !== 'employee') return true;

    // Employees can only edit their own quotations
    return formData.createdBy === userData.name;
  }, [formData, userData]);

  // Set default notes if not already set
  React.useEffect(() => {
    if (formData.id && !formData.notes) {
      setFormData(prev => ({
        ...prev,
        notes: "يتم توفير سيارات بديلة علي الفور، في حالة تعطل السيارة او توقفها عن الحركة\nقد تتغير الأسعار في حالة تغير أسعار الوقود"
      }));
    }
  }, [formData.id]);

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: prev.items.length + 1,
          item: "",
          description: "",
          unitPrice: 0,
          quantity: 1,
          total: 0
        }
      ]
    }));
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }));
    }
  };

  const updateItem = (id, field, value) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      });

      const subtotal = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const vatAmount = includeVAT ? subtotal * 0.14 : 0;
      const taxDiscountAmount = includeTaxDiscount ? subtotal * 0.03 : 0;
      const totalAmount = subtotal + vatAmount - taxDiscountAmount;

      return {
        ...prev,
        items: newItems,
        subtotal,
        vatAmount,
        taxDiscountAmount,
        totalAmount
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!formData.customerName.trim()) {
      toast({
        title: "حقل مطلوب",
        description: "يرجى إدخال اسم صاحب التوقيع",
        variant: "destructive"
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "حقل مطلوب",
        description: "يرجى اختيار التاريخ",
        variant: "destructive"
      });
      return;
    }

    // Validate items
    const invalidItems = formData.items?.some(item => 
      !item.item.trim() || 
      !item.description.trim() || 
      !item.unitPrice || 
      !item.quantity
    );

    if (invalidItems) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى إكمال جميع حقول البنود",
        variant: "destructive"
      });
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const vatAmount = includeVAT ? subtotal * 0.14 : 0;
    const taxDiscountAmount = includeTaxDiscount ? subtotal * 0.03 : 0;
    const totalAmount = subtotal + vatAmount - taxDiscountAmount;

    const updatedQuotationData = {
      ...formData,
      subtotal,
      includeVAT,
      vatAmount,
      includeTaxDiscount,
      taxDiscountAmount,
      totalAmount,
      updatedAt: new Date().toISOString(),
      updatedBy: userData?.name || "System"
    };

    const updatedQuotations = quotations.map(quote =>
      quote.id === formData.id ? updatedQuotationData : quote
    );

    setQuotations(updatedQuotations);
    toast({
      title: "تم تحديث عرض السعر",
      description: "تم تحديث عرض السعر بنجاح"
    });

    // Send notification to admins and managers
    const managersAndAdmins = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
    managersAndAdmins.forEach(user => {
      if (String(user.id) !== String(userData?.id)) { // Avoid notifying the user who made the change
        addNotification({
          type: 'quotation-updated',
          title: "تم تعديل عرض سعر",
          message: `قام الموظف ${userData?.name || 'المسؤول'} بتعديل عرض السعر رقم ${formData.id} للعميل ${formData.customerName}.`,
          userId: String(user.id),
          forUser: String(user.id),
          path: `/quotations?quotationId=${formData.id}`,
          icon: 'FileEdit',
          color: 'orange'
        });
      }
    });

    navigate("/quotations");
  };

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

  if (!formData.id) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          لم يتم العثور على عرض السعر
        </div>
        <Button
          className="mt-4 mx-auto block"
          onClick={() => navigate("/quotations")}
        >
          العودة لعروض الأسعار
        </Button>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          ليس لديك صلاحية لتعديل عرض السعر هذا
        </div>
        <Button
          className="mt-4 mx-auto block"
          onClick={() => navigate("/quotations")}
        >
          العودة لعروض الأسعار
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">تعديل عرض السعر #{formData.id}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>رقم عرض السعر</Label>
            <Input
              value={formData.id}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label>اسم صاحب التوقيع</Label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              placeholder="ادخل اسم صاحب التوقيع"
            />
          </div>
          <div>
            <Label>التاريخ</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              max={maxDate}
            />
          </div>
          <div>
            <Label>الحالة</Label>
            <select
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.status || "معلق"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="معلق">معلق</option>
              <option value="مقبول">مقبول</option>
              <option value="مرفوض">مرفوض</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">البنود</h2>
            <Button
              type="button"
              onClick={addNewItem}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة بند
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="p-3 border">البند</th>
                  <th className="p-3 border w-1/3">البيان</th>
                  <th className="p-3 border">سعر الوحدة</th>
                  <th className="p-3 border">الكمية</th>
                  <th className="p-3 border">المجموع</th>
                  <th className="p-3 border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {formData.items?.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 border">
                      <select
                        value={item.item}
                        onChange={(e) => updateItem(item.id, 'item', e.target.value)}
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
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        required
                        placeholder="ادخل البيان"
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
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
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
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
                    <td className="p-3 border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={formData.items.length === 1}
                      >
                        <Minus className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 border-t pt-4">
          <div className="flex flex-col gap-4 items-end">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={includeVAT ? "default" : "outline"}
                onClick={() => setIncludeVAT(!includeVAT)}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {includeVAT ? "إلغاء ضريبة القيمة المضافة" : "إضافة ضريبة القيمة المضافة 14%"}
              </Button>
              <Button
                type="button"
                variant={includeTaxDiscount ? "default" : "outline"}
                onClick={() => setIncludeTaxDiscount(!includeTaxDiscount)}
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {includeTaxDiscount ? "إلغاء الخصم الضريبي" : "إضافة الخصم الضريبي 3%"}
              </Button>
            </div>
            
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">المجموع الفرعي:</span>
                <span>{formatCurrency(formData.subtotal)}</span>
              </div>
              {includeVAT && (
                <div className="flex justify-between text-green-600">
                  <span className="font-semibold">ضريبة القيمة المضافة (14%):</span>
                  <span>+{formatCurrency(formData.vatAmount)}</span>
                </div>
              )}
              {includeTaxDiscount && (
                <div className="flex justify-between text-red-600">
                  <span className="font-semibold">الخصم الضريبي (3%):</span>
                  <span>-{formatCurrency(formData.taxDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>الإجمالي:</span>
                <span>{formatCurrency(formData.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-6 pt-6">
          <Label>ملاحظات (ستظهر في الفاتورة)</Label>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="أدخل أي ملاحظات إضافية هنا..."
            className="min-h-[100px] w-full mt-2"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/quotations")}
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
            <DialogTitle>تأكيد تغيير حالة عرض السعر</DialogTitle>
            <DialogDescription>
              سيتم تعديل المبلغ المدفوع تلقائياً إلى {formData.totalAmount} ج.م وتغيير حالة عرض السعر إلى مدفوع.
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

export default EditQuotation; 