
import { format, startOfMonth, endOfMonth, isToday } from "date-fns";
import { ar } from "date-fns/locale";

export function calculateSupplierSettlement(trips, supplierId) {
  return trips
    .filter(trip => trip.supplier === supplierId && !trip.isSettled)
    .reduce((total, trip) => {
      const collection = Number(trip.collection) || 0;
      const commercialPrice = Number(trip.commercialPrice) || 0;
      return total + (collection - commercialPrice);
    }, 0);
}

export function formatCurrency(amount) {
  return `${Math.abs(amount).toLocaleString()} ج.م`;
}

export function filterTripsByPeriod(trips, period) {
  const today = new Date();
  
  switch (period) {
    case "today":
      return trips.filter(trip => isToday(new Date(trip.date)));
    case "currentMonth":
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      return trips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate >= monthStart && tripDate <= monthEnd;
      });
    default:
      return trips;
  }
}

export function getSupplierSettlements(trips, suppliers) {
  return suppliers.map(supplier => {
    const supplierTrips = trips.filter(trip => 
      trip.supplier === supplier.id.toString() && !trip.isSettled
    );
    
    const totalSettlement = supplierTrips.reduce((total, trip) => {
      const collection = Number(trip.collection) || 0;
      const commercialPrice = Number(trip.commercialPrice) || 0;
      return total + (collection - commercialPrice);
    }, 0);

    const todayTrips = filterTripsByPeriod(supplierTrips, "today");
    const monthTrips = filterTripsByPeriod(supplierTrips, "currentMonth");

    const todaySettlement = todayTrips.reduce((total, trip) => {
      const collection = Number(trip.collection) || 0;
      const commercialPrice = Number(trip.commercialPrice) || 0;
      return total + (collection - commercialPrice);
    }, 0);

    const monthSettlement = monthTrips.reduce((total, trip) => {
      const collection = Number(trip.collection) || 0;
      const commercialPrice = Number(trip.commercialPrice) || 0;
      return total + (collection - commercialPrice);
    }, 0);

    return {
      ...supplier,
      totalSettlement,
      todaySettlement,
      monthSettlement,
      tripsCount: supplierTrips.length,
      todayTripsCount: todayTrips.length,
      monthTripsCount: monthTrips.length
    };
  });
}
