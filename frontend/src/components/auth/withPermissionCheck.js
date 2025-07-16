/**
 * Función de orden superior que envuelve cualquier función y la protege con verificación de permisos.
 * Si el usuario no tiene los permisos necesarios, la función original no se ejecutará.
 * 
 * @param {Function} fn - La función a proteger
 * @param {string} section - La sección de permisos (ej: "employees", "trips")
 * @param {string} action - La acción de permisos (ej: "add", "edit", "delete")
 * @returns {Function} - Una nueva función que verifica permisos antes de ejecutar la función original
 */
const withPermissionCheck = (fn, section, action) => {
  return (...args) => {
    // Verificar permisos
    if (!hasPermission(section, action)) {
      console.error(`Acceso denegado: No tienes permiso para ${action} en ${section}`);
      
      // Opcionalmente, mostrar una notificación al usuario
      try {
        const { toast } = require("@/components/ui/use-toast");
        toast({
          title: "Acceso denegado",
          description: `No tienes permiso para ${getActionName(action)} en esta sección`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("No se pudo mostrar la notificación", error);
      }
      
      return null; // Detener la ejecución
    }
    
    // Si tiene permisos, ejecutar la función original
    return fn(...args);
  };
};

/**
 * Verifica si el usuario actual tiene el permiso específico
 * Modificado para permitir todas las acciones para todos los usuarios
 * @param {string} section - La sección de permisos (ya no se utiliza)
 * @param {string} action - La acción de permisos (ya no se utiliza)
 * @returns {boolean} - siempre devuelve true tras eliminar el sistema de permisos
 */
const hasPermission = (section, action) => {
  // El sistema de permisos ha sido eliminado
  // Todos los usuarios tienen acceso a todas las funciones
  return true;
};

/**
 * Obtiene un nombre legible para la acción de permiso
 * @param {string} action - La acción de permisos
 * @returns {string} - Nombre legible de la acción
 */
const getActionName = (action) => {
  const actionNames = {
    'add': 'añadir elementos',
    'edit': 'editar elementos',
    'delete': 'eliminar elementos',
    'view': 'ver elementos'
  };
  
  return actionNames[action] || action;
};

export { withPermissionCheck, hasPermission };
