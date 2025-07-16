
import React from "react";

export function checkDuplicateEmployee(employees, formData, currentEmployee = null) {
  const duplicates = {
    username: employees.find(emp => emp.username === formData.username && emp.id !== currentEmployee?.id),
    personalId: employees.find(emp => emp.personalId === formData.personalId && emp.id !== currentEmployee?.id),
  };

  const errors = [];
  
  if (duplicates.username) {
    errors.push(`اسم المستخدم "${formData.username}" مستخدم بالفعل`);
  }
  
  if (duplicates.personalId) {
    errors.push(`الرقم الشخصي "${formData.personalId}" مستخدم بالفعل`);
  }
  
  return {
    hasDuplicates: errors.length > 0,
    errors
  };
}
