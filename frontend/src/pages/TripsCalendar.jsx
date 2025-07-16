import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Calendar, Grid } from "lucide-react";
import TripsCalendarView from "@/features/trips/components/TripsCalendarView";

function TripsCalendar() {
  const navigate = useNavigate();
  const [trips] = useLocalStorage("trips", []);
  const [suppliers] = useLocalStorage("suppliers", []);
  const [userData, setUserData] = useState(null);
  const [filteredTrips, setFilteredTrips] = useState([]);

  // Load user data and filter trips
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        
        // Filter trips if user is an employee
        if (parsedUserData.role === "موظف") {
          const employeeTrips = trips.filter(trip => trip.employee === parsedUserData.name);
          setFilteredTrips(employeeTrips);
        } else {
          // For admin and other roles, show all trips
          setFilteredTrips(trips);
        }
      } else {
        // If no user data, show all trips
        setFilteredTrips(trips);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setFilteredTrips(trips);
    }
  }, [trips]);

  // Function to switch to table view
  const switchToTableView = () => {
    navigate('/trips');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">التقويم الشهري للرحلات</h1>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1"
            onClick={switchToTableView}
          >
            <Grid className="h-4 w-4" />
            <span>جدول</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1 bg-primary text-white"
          >
            <Calendar className="h-4 w-4" />
            <span>تقويم</span>
          </Button>
        </div>
      </div>
      <TripsCalendarView trips={filteredTrips} suppliers={suppliers} />
    </div>
  );
}

export default TripsCalendar; 