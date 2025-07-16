import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function EmployeeDetailsDialog({ employee, open, onOpenChange }) {
  if (!employee) return null;

  const formatDate = (date) => {
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: ar });
    } catch (error) {
      return date;
    }
  };

  const renderField = (label, value) => (
    <div className="mb-4">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</dt>
      <dd className="text-base text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );

  const renderPhoneNumbers = (phones) => {
    if (!phones) return null;
    return phones.split('\n').map((phone, index) => (
      <div key={index} className="flex items-center gap-2">
        <span className="text-gray-900 dark:text-gray-100">{phone.trim()}</span>
      </div>
    ));
  };

  const renderDocument = (doc, label) => {
    if (!doc) return <p className="text-gray-500 dark:text-gray-400">لم يتم رفع {label}</p>;
    
    // Handle File objects (for backward compatibility)
    if (doc instanceof File) {
      const url = URL.createObjectURL(doc);
      if (doc.type.startsWith('image/')) {
        return <img src={url} alt={label} className="max-w-full h-auto rounded-lg" />;
      }
      return (
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          عرض {label}
        </a>
      );
    }
    
    // Handle base64 encoded files (new format)
    if (doc.data && doc.name) {
      if (doc.type && doc.type.startsWith('image/')) {
        return <img src={doc.data} alt={label} className="max-w-full h-auto rounded-lg" />;
      }
      return (
        <a 
          href={doc.data}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          download={doc.name}
        >
          عرض {doc.name}
        </a>
      );
    }
    
    return <p className="text-gray-500 dark:text-gray-400">الملف غير متوفر</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" aria-describedby="employee-details-description">
        <DialogHeader>
          <DialogTitle className="text-2xl mb-6">تفاصيل الموظف</DialogTitle>
          <div id="employee-details-description" className="text-sm text-gray-500">
            عرض المعلومات الشخصية والوظيفية الكاملة للموظف
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات الأساسية</h3>
              {renderField("الاسم", employee.name)}
              {renderField("الرقم الوظيفي", employee.employeeId)}
              {renderField("الرقم الشخصي", employee.personalId)}
              {renderField("تاريخ التوظيف", formatDate(employee.hireDate))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-primary">المعلومات المالية</h3>
              {renderField("الراتب الأساسي", employee.salary ? `${employee.salary} ج.م` : "غير متوفر")}
              {renderField("نسبة العمولة", employee.commission ? `${employee.commission}%` : "غير متوفر")}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-primary">معلومات الحساب</h3>
              {renderField("اسم المستخدم", employee.username)}
              {renderField("الرحلات المنفذة", employee.completedTrips)}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-primary">المستندات</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    مستند الهوية الشخصية
                  </h4>
                  {renderDocument(employee.identityDoc, "مستند الهوية")}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    السيرة الذاتية
                  </h4>
                  {renderDocument(employee.cvDoc, "السيرة الذاتية")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeDetailsDialog;
