import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

/**
 * مكون يحمي المسارات بناءً على صلاحيات المستخدم
 * 
 * @param {Object} props
 * @param {JSX.Element} props.children - المكونات المراد عرضها إذا كان المستخدم مصرحاً له
 * @param {string} props.section - القسم المطلوب (مثل "employees", "trips")
 * @param {string} props.action - الإجراء المطلوب (عادة "view" للصفحات)
 * @param {string} props.redirectTo - المسار للتوجيه إليه إذا لم يكن المستخدم مصرحاً له (اختياري، الافتراضي هو "/")
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, section, action = 'view', redirectTo = '/' }) => {
  const { toast } = useToast();
  const location = useLocation();
  
  // التحقق من وجود بيانات المستخدم
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  
  // التحقق من وجود توكن تسجيل الدخول
  const isAuthenticated = !!localStorage.getItem('userToken');
  
  // الحصول على دور المستخدم
  const userRole = userData.role || 'employee';
  
  // التحقق من المستخدم - تم إزالة نظام الصلاحيات
  const hasPermission = () => {
    // إذا لم يكن المستخدم مسجل الدخول، توجيه إلى صفحة تسجيل الدخول
    if (!isAuthenticated) {
      return false;
    }
    
    // تم إزالة نظام إدارة الصلاحيات - كل المستخدمين لديهم الوصول الكامل
    return true;
  };
  
  // تم إزالة التحقق من الصلاحيات في useEffect بعد إزالة نظام الصلاحيات
  useEffect(() => {
    // لم يعد هناك حاجة للتحقق من الصلاحيات بعد إزالة النظام
  }, []);
  
  // إذا لم يكن المستخدم مصرحاً له، توجيه إلى الصفحة المحددة
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasPermission()) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // إذا كان المستخدم مصرحاً له، عرض المحتوى
  return children;
};

export default ProtectedRoute;
