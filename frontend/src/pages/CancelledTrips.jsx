
import React from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import TripsView from "@/features/trips/components/TripsView";

function CancelledTrips() {
  const [trips] = useLocalStorage("trips", []);
  
  const cancelledTrips = trips.filter(trip => trip.status === "cancelled");

  return (
    <TripsView
      title="الرحلات الملغاة"
      trips={cancelledTrips}
      emptyMessage="لا يوجد رحلات ملغاة"
      filterStatus="cancelled"
    />
  );
}

export default CancelledTrips;
