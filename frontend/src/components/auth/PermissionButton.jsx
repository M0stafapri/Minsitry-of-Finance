import React from 'react';
import { Button } from "@/components/ui/button";
import PermissionGuard from './PermissionGuard';

/**
 * Botón que solo se muestra si el usuario tiene los permisos necesarios.
 * 
 * @param {Object} props - Las propiedades del componente
 * @param {string} props.section - La sección de permisos (ej: "employees", "trips")
 * @param {string} props.action - La acción de permisos (ej: "create", "update", "delete")
 * @param {string} props.variant - La variante de estilo del botón (opcional)
 * @param {Function} props.onClick - Función a ejecutar al hacer clic
 * @param {React.ReactNode} props.children - Contenido del botón
 * @returns {JSX.Element|null}
 */
const PermissionButton = ({ 
  section, 
  action, 
  variant = "default",
  onClick, 
  children,
  ...props 
}) => {
  return (
    <PermissionGuard 
      section={section} 
      action={action}
      fallback={null}
    >
      <Button
        variant={variant}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    </PermissionGuard>
  );
};

export default PermissionButton;
