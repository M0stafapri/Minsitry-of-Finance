import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Calendar, Briefcase, CreditCard, Award, Hash } from "lucide-react";

const ProfileItem = ({ icon, label, value }) => {
  const Icon = icon;
  return (
    <div className="flex items-center mb-4 p-2 border-b">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mr-4">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium" dir={label === "رقم الهاتف" ? "ltr" : "rtl"}>{value || "غير متوفر"}</div>
      </div>
    </div>
  );
};

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // الحصول على بيانات المستخدم الحالي من localStorage
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);

        // الحصول على بيانات الموظفين من localStorage
        const employeesStr = localStorage.getItem('employees');
        if (employeesStr) {
          const employees = JSON.parse(employeesStr);
          
          // البحث عن الموظف المطابق للمستخدم الحالي (بناءً على اسم المستخدم)
          const employee = employees.find(emp => 
            emp.username === parsedUserData.username || 
            emp.name === parsedUserData.name
          );
          
          if (employee) {
            setEmployeeData(employee);
          } else {
            console.log("لم يتم العثور على بيانات الموظف");
            // إذا لم يتم العثور على الموظف، نستخدم بيانات المستخدم المتاحة
            setEmployeeData({
              name: parsedUserData.name,
              position: parsedUserData.role,
              ...parsedUserData
            });
          }
        }
      }
    } catch (err) {
      console.error("خطأ في تحميل بيانات المستخدم:", err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل بيانات الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700 text-center">
          <p>{error}</p>
          <p>يرجى تسجيل الخروج وإعادة تسجيل الدخول مرة أخرى</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-700 text-center">
          <p>لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.</p>
        </div>
      </div>
    );
  }

  const employee = employeeData || {};
  
  // تنسيق دور المستخدم بالعربية
  const formatRole = (role) => {
    switch (role) {
      case 'manager': return 'مدير';
      case 'employee': return 'موظف';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">الملف الشخصي</h1>

      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {employee.name ? employee.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl mb-1">{employee.name}</CardTitle>
            <p className="text-gray-500">{formatRole(employee.role || userData.role) || employee.position || "غير محدد"}</p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ProfileItem 
                  icon={User} 
                  label="الاسم الكامل" 
                  value={employee.name} 
                />
                <ProfileItem 
                  icon={Mail} 
                  label="البريد الإلكتروني" 
                  value={employee.email || userData.email} 
                />

                <ProfileItem 
                  icon={Hash} 
                  label="الرقم الوظيفي" 
                  value={employee.employeeId} 
                />
              </div>
              <div>
                <ProfileItem 
                  icon={Briefcase} 
                  label="المنصب" 
                  value={formatRole(employee.role || userData.role) || employee.position} 
                />
                <ProfileItem 
                  icon={Calendar} 
                  label="تاريخ التعيين" 
                  value={employee.hireDate} 
                />

              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
