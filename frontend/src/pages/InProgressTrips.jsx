
import React from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import TripsView from "@/features/trips/components/TripsView";

function InProgressTrips() {
  const [trips] = useLocalStorage("trips", []);
  
  // Filtrar solo basado en el valor de status = "active"
  const inProgressTrips = trips.filter(trip => trip.status === "active");

  return (
    <TripsView
      title="رحلات قيد التنفيذ"
      trips={inProgressTrips}
      emptyMessage="لا يوجد رحلات قيد التنفيذ"
      filterStatus="active"
    />
  );
}

export default InProgressTrips;
