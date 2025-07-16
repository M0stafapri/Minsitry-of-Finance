import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Intento simple de obtener datos del usuario
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);
      } else {
        // Si no hay datos, usamos un valor predeterminado
        setUserData({ name: "مستخدم", role: "employee" });
      }
    } catch (err) {
      console.error("Error:", err);
      // En caso de error, usamos un valor predeterminado
      setUserData({ name: "مستخدم", role: "employee" });
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  // Función para formatear el rol
  const formatRole = (role) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'manager': return 'مدير';
      case 'employee': return 'موظف';
      default: return 'مستخدم';
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">الملف الشخصي</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
          <CardTitle className="text-center">{userData?.name || "مستخدم"}</CardTitle>
          <p className="text-center text-gray-500">{formatRole(userData?.role)}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">الاسم</div>
              <div className="font-medium">{userData?.name || "غير متوفر"}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">المنصب</div>
              <div className="font-medium">{formatRole(userData?.role) || "غير متوفر"}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">البريد الإلكتروني</div>
              <div className="font-medium">{userData?.email || "غير متوفر"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
