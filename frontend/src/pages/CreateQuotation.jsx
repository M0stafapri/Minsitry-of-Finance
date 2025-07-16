import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/context/NotificationsContext";

function CreateQuotation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotations, setQuotations] = useLocalStorage("quotations", []);
  const [employees] = useLocalStorage("employees", []);
  const { addNotification } = useNotifications();
  const [userData, setUserData] = React.useState(null);
  const [includeVAT, setIncludeVAT] = React.useState(false);
  const [includeTaxDiscount, setIncludeTaxDiscount] = React.useState(false);
  
  const [quotationItems, setQuotationItems] = React.useState([
    {
      id: 1,
      item: "",
      description: "",
      unitPrice: 0,
      quantity: 1,
      total: 0
    }
  ]);

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

  const generateQuotationNumber = () => {
    const randomDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `Q${randomDigits}`;
  };

  const [formData, setFormData] = React.useState({
    customerName: "",
    quotationNumber: generateQuotationNumber(),
    date: new Date().toISOString().split("T")[0],
    notes: "يتم توفير سيارات بديلة علي الفور، في حالة تعطل السيارة او توقفها عن الحركة\nقد تتغير الأسعار في حالة تغير أسعار الوقود",
  });

  React.useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  const maxDate = new Date().toISOString().split("T")[0];

  const addNewItem = () => {
    setQuotationItems([
      ...quotationItems,
      {
        id: quotationItems.length + 1,
        item: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        total: 0
      }
    ]);
  };

  const removeItem = (id) => {
    if (quotationItems.length > 1) {
      setQuotationItems(quotationItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setQuotationItems(quotationItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = quotationItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = includeVAT ? subtotal * 0.14 : 0;
  const taxDiscountAmount = includeTaxDiscount ? subtotal * 0.03 : 0;
  const totalAmount = subtotal + vatAmount - taxDiscountAmount;

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

  const handleSubmit = (e) => {
    e.preventDefault();

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

    const invalidItems = quotationItems.some(item => 
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

    const newQuotation = {
      id: formData.quotationNumber,
      customerName: formData.customerName,
      date: formData.date,
      notes: formData.notes || "",
      items: quotationItems,
      subtotal,
      includeVAT,
      vatAmount,
      includeTaxDiscount,
      taxDiscountAmount,
      totalAmount,
      status: "معلق",
      createdBy: userData?.name || "System"
    };

    setQuotations([newQuotation, ...quotations]);
    toast({
      title: "تم إنشاء عرض السعر",
      description: "تم إنشاء عرض السعر بنجاح"
    });

    const managersAndAdmins = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
    managersAndAdmins.forEach(user => {
      if (String(user.id) !== String(userData?.id)) {
        addNotification({
          type: 'quotation-created',
          title: "تم إنشاء عرض سعر جديد",
          message: `قام الموظف ${userData?.name || 'المسؤول'} بإنشاء عرض سعر جديد برقم ${newQuotation.id} للعميل ${newQuotation.customerName}.`,
          userId: String(user.id),
          forUser: String(user.id),
          path: `/quotations?quotationId=${newQuotation.id}`,
          icon: 'FilePlus',
          color: 'teal'
        });
      }
    });

    navigate("/quotations");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إنشاء عرض سعر جديد</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>رقم عرض السعر</Label>
            <Input
              value={formData.quotationNumber}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label>اسم صاحب التوقيع / الجهة</Label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              placeholder="ادخل اسم صاحب التوقيع او الجهة"
            />
          </div>
          <div>
            <Label>التاريخ</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={maxDate}
              required
            />
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
                {quotationItems.map((item) => (
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
                        disabled={quotationItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
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
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {includeVAT && (
                <div className="flex justify-between text-green-600">
                  <span className="font-semibold">ضريبة القيمة المضافة (14%):</span>
                  <span>+{formatCurrency(vatAmount)}</span>
                </div>
              )}
              {includeTaxDiscount && (
                <div className="flex justify-between text-red-600">
                  <span className="font-semibold">الخصم الضريبي (3%):</span>
                  <span>-{formatCurrency(taxDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>الإجمالي:</span>
                <span>{formatCurrency(totalAmount)}</span>
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
            إنشاء عرض السعر
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateQuotation; 