import React, { useState, useEffect } from "react";
import { Phone } from "lucide-react";

// Componente para mostrar una tarjeta de información
const InfoCard = ({ label, value, dir }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow duration-200">
      <div className="text-sm font-medium text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-lg" dir={dir || "rtl"}>
        {value === "غير متوفر" ? <span className="text-gray-400">{value}</span> : value}
      </div>
    </div>
  );
};

// Función para calcular el tiempo desde la fecha de contratación
const calculateEmploymentDuration = (hireDateStr) => {
  if (!hireDateStr) return "غير متوفر";
  
  try {
    // Convertir la fecha de contratación a objeto Date
    const hireDate = new Date(hireDateStr);
    
    // Asegurarse de que la fecha es válida
    if (isNaN(hireDate.getTime())) return "غير متوفر";
    
    // Fecha actual
    const today = new Date();
    
    // Calcular la diferencia en milisegundos
    const timeDiff = today - hireDate;
    
    // Convertir a días
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Si han pasado menos de 30 días, mostrar en días
    if (daysDiff < 30) {
      return `${daysDiff} يوم`;
    }
    
    // Calcular meses
    const monthsDiff = (
      (today.getFullYear() - hireDate.getFullYear()) * 12 + 
      (today.getMonth() - hireDate.getMonth())
    );
    
    // Si han pasado menos de 12 meses, mostrar en meses
    if (monthsDiff < 12) {
      return `${monthsDiff} شهر`;
    }
    
    // Calcular años y meses restantes
    const years = Math.floor(monthsDiff / 12);
    const remainingMonths = monthsDiff % 12;
    
    // Formatear el resultado
    if (remainingMonths === 0) {
      return `${years} سنة`;
    } else {
      return `${years} سنة و ${remainingMonths} شهر`;
    }
  } catch (error) {
    console.error("Error calculando duración de empleo:", error);
    return "غير متوفر";
  }
};

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usar un enfoque más seguro con try-catch por separado para cada operación
    // Primero intentamos obtener los datos del usuario
    let parsedUserData = null;
    try {
      const userDataStr = localStorage?.getItem?.('userData');
      if (userDataStr) {
        parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);
      }
    } catch (userError) {
      console.error("Error al obtener datos del usuario:", userError);
      // Establecer datos predeterminados para el usuario
      setUserData({ name: "مستخدم", role: "employee" });
      parsedUserData = { name: "مستخدم", role: "employee" };
    }
    
    // Luego, intentamos obtener los datos de los empleados en un bloque try-catch separado
    try {
      const employeesStr = localStorage?.getItem?.('employees');
      if (employeesStr) {
        const employees = JSON.parse(employeesStr);
        
        if (Array.isArray(employees) && employees.length > 0) {
          // Primero tratamos de encontrar una coincidencia si tenemos datos de usuario
          if (parsedUserData) {
            const employee = employees.find(emp => {
              return (
                (emp.username && parsedUserData.username && emp.username === parsedUserData.username) || 
                (emp.name && parsedUserData.name && emp.name === parsedUserData.name)
              );
            });
            
            if (employee) {
              setEmployeeData(employee);
            } else {
              // Si no hay coincidencia, usamos el primer empleado
              setEmployeeData(employees[0]);
            }
          } else {
            // Si no hay datos de usuario, usamos el primer empleado
            setEmployeeData(employees[0]);
          }
        }
      }
    } catch (employeeError) {
      console.error("Error al obtener datos de empleados:", employeeError);
    } finally {
      // Asegurarse de que loading se establezca en false pase lo que pase
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

  // Datos para mostrar, priorizando los datos de empleado sobre los de usuario
  const displayData = {
    name: employeeData?.name || userData?.name || "مستخدم",
    // Para mostrar en el encabezado (puede ser rol o posición)
    roleDisplay: employeeData?.position || userData?.role ? formatRole(userData?.role) : "موظف",
    // Para mostrar específicamente la posición/cargo en la sección de información laboral
    position: employeeData?.position || "غير متوفر",
    email: userData?.email || "غير متوفر",
    // Teléfono personal del empleado (número de identidad personal)
    personalPhone: employeeData?.personalId || "غير متوفر",
    employeeId: employeeData?.employeeId || "غير متوفر",
    personalId: employeeData?.personalId || "غير متوفر",
    hireDate: employeeData?.hireDate || "غير متوفر",
    employmentDuration: calculateEmploymentDuration(employeeData?.hireDate),
    completedTrips: employeeData?.completedTrips !== undefined ? employeeData.completedTrips.toString() : "غير متوفر"
  };

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary p-8 text-white bg-gradient-to-r from-primary to-blue-600">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="mb-4 sm:mb-0 sm:mr-6">
              <div className="h-32 w-32 rounded-full bg-white/20 text-white flex items-center justify-center text-5xl font-bold shadow-lg border-4 border-white/30 overflow-hidden relative">
                <span className="relative z-10">{displayData.name.charAt(0).toUpperCase()}</span>
                {/* Efecto de brillo */}
                <div className="absolute top-0 left-0 right-0 h-1/4 bg-white/20 rounded-t-full"></div>
              </div>
            </div>
            <div className="text-center sm:text-right sm:flex-1">
              <h1 className="text-3xl font-bold mb-2">{displayData.name}</h1>
              <p className="text-white/90 text-xl mb-4">{displayData.roleDisplay}</p>
              {employeeData?.hireDate && (
                <div className="mt-2 inline-block bg-white/15 px-5 py-2 rounded-full text-sm font-medium shadow-inner">
                  موظف منذ: {displayData.employmentDuration}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-gray-200">المعلومات الشخصية</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <InfoCard label="الاسم" value={displayData.name} />
            <InfoCard label="رقم الهاتف الشخصي" value={displayData.personalPhone} dir="ltr" />
          </div>
          
          {employeeData && (
            <>
              <h2 className="text-2xl font-bold mb-6 mt-10 pb-2 border-b border-gray-200">المعلومات الوظيفية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InfoCard label="الرقم الوظيفي" value={displayData.employeeId} />
                <InfoCard label="تاريخ التعيين" value={displayData.hireDate} />
                <InfoCard label="الرحلات المكتملة" value={displayData.completedTrips} />
              </div>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}

// Función para formatear el rol
const formatRole = (role) => {
  switch (role) {
    case 'manager': return 'مدير';
    case 'employee': return 'موظف';
    default: return 'مستخدم';
  }
};
