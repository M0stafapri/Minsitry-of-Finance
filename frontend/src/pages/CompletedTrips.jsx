
import React from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import TripsView from "@/features/trips/components/TripsView";

function CompletedTrips() {
  const [trips] = useLocalStorage("trips", []);
  
  // Filtrar solo basado en el valor de status = "completed"
  const completedTrips = trips.filter(trip => trip.status === "completed");

  return (
    <TripsView
      title="الرحلات المكتملة"
      trips={completedTrips}
      emptyMessage="لا يوجد رحلات مكتملة"
      filterStatus="completed"
    />
  );
}

export default CompletedTrips;
