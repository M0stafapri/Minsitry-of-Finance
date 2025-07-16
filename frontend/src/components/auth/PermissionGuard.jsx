import React from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

/**
 * Componente que verifica si el usuario tiene los permisos necesarios
 * para acceder a una funcionalidad o sección específica.
 * 
 * @param {Object} props
 * @param {string} props.section - La sección de permisos a verificar (ej: "employees", "trips")
 * @param {string} props.action - La acción a verificar (ej: "view", "create", "update", "delete")
 * @param {JSX.Element} props.children - Los componentes hijos a renderizar si el usuario tiene permisos
 * @param {JSX.Element} props.fallback - Componente opcional a renderizar si el usuario no tiene permisos
 * @returns {JSX.Element}
 */
const PermissionGuard = ({ section, action, children, fallback }) => {
  const { toast } = useToast();
  
  // Recuperar datos del usuario y permisos del localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  
  const userRole = userData.role || 'employee';
  const currentRole = permissions.currentRole || userRole;
  
  // El sistema de permisos ha sido eliminado - todos los usuarios tienen acceso completo
  const hasPermission = () => {
    // Solo verificamos que el usuario tenga datos básicos
    if (!userData || !userData.id) {
      console.warn('No se encontraron datos de usuario');
      return false;
    }
    
    // Tras la eliminación del sistema de permisos, todos los usuarios tienen acceso completo
    return true;
  };
  
  // Si el usuario tiene permisos, mostrar los componentes hijos
  if (hasPermission()) {
    return children;
  }
  
  // Si no tiene permisos y se proporciona un componente alternativo, mostrarlo
  if (fallback) {
    return fallback;
  }
  
  // Redirigir a la página principal
  return <Navigate to="/" replace />;
};

export default PermissionGuard;
