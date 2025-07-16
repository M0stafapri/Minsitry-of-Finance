import { format, isToday, isTomorrow, isYesterday, parseISO, isWithinInterval, endOfDay, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";

export const tripTypes = [
  { id: "oneway", name: "ذهاب" },
  { id: "return", name: "عودة" },
  { id: "daily", name: "ايجار يومي" },
  { id: "halfday", name: "نصف يومي" },
  { id: "overnight", name: "ايجار مع مبيت" },
  { id: "airport_arrival", name: "استقبال مطار" },
  { id: "airport_departure", name: "تسفير مطار" },
  { id: "self_drive", name: "ايجار بدون سائق" }
];

export const dateFilterOptions = [
  { id: "all", name: "كل الرحلات" },
  { id: "currentMonth", name: "الشهر الحالي" },
  { id: "today", name: "رحلات اليوم" },
  { id: "tomorrow", name: "رحلات الغد" },
  { id: "yesterday", name: "رحلات الأمس" },
  { id: "custom", name: "تاريخ محدد" },
  { id: "range", name: "نطاق تاريخ" }
];

export function generateTripNumber() {
  const min = 10000000;
  const max = 99999999;
  let number;
  do {
    number = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (number.toString().startsWith('0'));
  return number.toString();
}

export function getSettlementValue(trip) {
  const collection = Number(trip.collection) || 0;
  const commercialPrice = Number(trip.commercialPrice) || 0;
  return collection - commercialPrice;
}

export function getTripStatus(tripDate, tripStatus) {
  // Usar únicamente el valor de status para determinar el estado del viaje
  // Si no se proporciona un valor explícito de status, usar 'active' como predeterminado
  
  switch (tripStatus) {
    case "cancelled":
      return "ملغاة"; // Cancelado
    case "completed":
      return "مكتملة"; // Completado
    case "active":
      return "قيد التنفيذ"; // En progreso
    default:
      // Si no hay un valor de status, asignar 'active' como predeterminado
      return "قيد التنفيذ";
  }
}

export function filterTripsByDate(trips, dateFilter, customDate, startDate, endDate) {
  return trips.filter(trip => {
    if (!trip.date) return false;
    
    try {
      const tripDate = parseISO(trip.date);
      
      switch (dateFilter) {
        case "currentMonth": {
          // Obtener el mes y año actual
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          
          // Verificar si el viaje está en el mes actual
          return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
        }
        case "today":
          return isToday(tripDate);
        case "tomorrow":
          return isTomorrow(tripDate);
        case "yesterday":
          return isYesterday(tripDate);
        case "custom":
          if (!customDate) return true;
          return format(tripDate, "yyyy-MM-dd") === customDate;
        case "range":
          if (!startDate || !endDate) return true;
          try {
            const start = startOfDay(parseISO(startDate));
            const end = endOfDay(parseISO(endDate));
            return isWithinInterval(tripDate, { start, end });
          } catch (error) {
            console.error("Date range filtering error:", error);
            return true;
          }
        default:
          return true;
      }
    } catch (error) {
      console.error("Date filtering error:", error);
      return true;
    }
  });
}

export function sortTrips(trips, sortField, sortDirection) {
  return [...trips].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Convert string numbers to actual numbers for proper sorting
    if (["tripPrice", "commercialPrice", "paidAmount", "collection", "commission"].includes(sortField)) {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    }

    // Handle date sorting
    if (sortField === "date") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}
