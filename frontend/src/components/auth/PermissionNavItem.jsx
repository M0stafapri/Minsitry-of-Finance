import React from 'react';
import { Link } from 'react-router-dom';
import { PermissionGuard } from './index';

/**
 * مكون لعرض عناصر القائمة الجانبية بناءً على صلاحيات المستخدم
 * 
 * @param {Object} props
 * @param {string} props.to - مسار الصفحة
 * @param {string} props.section - القسم المرتبط بالصلاحيات (مثل "employees", "trips")
 * @param {React.ReactNode} props.icon - أيقونة العنصر
 * @param {string} props.label - نص العنصر
 * @returns {JSX.Element|null}
 */
const PermissionNavItem = ({ to, section, icon, label, ...props }) => {
  return (
    <PermissionGuard 
      section={section} 
      action="view"
      fallback={null}
    >
      <Link
        to={to}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
        {...props}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </PermissionGuard>
  );
};

export default PermissionNavItem;
