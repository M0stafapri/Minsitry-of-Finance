import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { tripTypes } from "@/features/trips/utils";
import { useNotifications } from "@/context/NotificationsContext";

function CreateInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useLocalStorage("invoices", []);
  const [employees] = useLocalStorage("employees", []);
  const { addNotification } = useNotifications();
  const [userData, setUserData] = React.useState(null);
  
  // Get selected trip from location state
  const selectedTrip = location.state?.trip;
  
  // If no trip is selected, redirect back to invoices page
  React.useEffect(() => {
    if (!selectedTrip) {
      navigate("/invoices");
    }
    // Load user data
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [selectedTrip, navigate]);

  const [invoiceItems, setInvoiceItems] = React.useState([
    {
      id: 1,
      item: tripTypes.find(t => t.id === selectedTrip?.type)?.name || selectedTrip?.type || "",
      date: selectedTrip?.date || "",
      description: selectedTrip?.destination || selectedTrip?.route || "",
      unitPrice: selectedTrip?.tripPrice || selectedTrip?.price || 0,
      quantity: selectedTrip?.quantity || 1,
      total: (selectedTrip?.tripPrice || selectedTrip?.price || 0) * (selectedTrip?.quantity || 1)
    }
  ]);

  const [formData, setFormData] = React.useState({
    customerName: selectedTrip?.customerName || "",
    invoiceNumber: selectedTrip?.tripNumber || "",
    date: new Date().toISOString().split("T")[0],
    paidAmount: 0
  });

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

  const addNewItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        id: invoiceItems.length + 1,
        item: "",
        date: "",
        description: "",
        unitPrice: 0,
        quantity: 1,
        total: 0
      }
    ]);
  };

  const removeItem = (id) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate total if quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const remainingAmount = totalAmount - formData.paidAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newInvoice = {
      id: formData.invoiceNumber,
      customerName: formData.customerName,
      date: formData.date,
      items: invoiceItems,
      totalAmount,
      paidAmount: Number(formData.paidAmount),
      remainingAmount,
      tripDetails: selectedTrip,
      status: remainingAmount === 0 ? "مدفوع" : "معلق",
      createdBy: userData?.name || "System"
    };

    setInvoices([newInvoice, ...invoices]);
    toast({
      title: "تم إنشاء الفاتورة",
      description: "تم إنشاء الفاتورة بنجاح"
    });

    // Send notification to admins and managers
    const managersAndAdmins = employees.filter(emp => emp.role === "manager" || emp.role === "admin");
    managersAndAdmins.forEach(user => {
      if (String(user.id) !== String(userData?.id)) { // Avoid notifying the user who made the change
        addNotification({
          type: 'invoice-created',
          title: "تم إنشاء فاتورة جديدة",
          message: `قام الموظف ${userData?.name || 'المسؤول'} بإنشاء فاتورة جديدة برقم ${newInvoice.id} للعميل ${newInvoice.customerName}.`,
          userId: String(user.id),
          forUser: String(user.id),
          path: `/invoices?invoiceId=${newInvoice.id}`, // Or a specific view page if available
          icon: 'FileText',
          color: 'purple'
        });
      }
    });

    navigate("/invoices");
  };

  if (!selectedTrip) return null;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-6">فاتورة جديدة</h1>
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Label className="w-24">فاتورة لـ:</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="w-64"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-24">رقم الفاتورة:</Label>
                  <Input
                    value={formData.invoiceNumber}
                    readOnly
                    className="w-64 bg-gray-50"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="w-24">التاريخ:</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-64"
                  />
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
                {invoiceItems.map((item) => (
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
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      />
                    </td>
                    <td className="p-3 border">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        min="1"
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
                        onClick={() => removeItem(item.id)}
                        disabled={invoiceItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
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
            onClick={addNewItem}
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
                  <span>{totalAmount} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">المبلغ المدفوع:</span>
                  <Input
                    type="number"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                    className="w-32"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>المبلغ المستحق:</span>
                  <span>{remainingAmount} ج.م</span>
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
            حفظ الفاتورة
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateInvoice; 