
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { SettlementCard } from "@/features/settlement/components/SettlementCard";
import { SupplierSettlementCard } from "@/features/settlement/components/SupplierSettlementCard";
import { getSupplierSettlements } from "@/features/settlement/utils";

function Settlement() {
  const [trips] = useLocalStorage("trips", []);
  const [suppliers] = useLocalStorage("suppliers", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState(null);
  
  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);
  
  // Filter trips based on user role
  const filteredTrips = React.useMemo(() => {
    if (!userData) return trips;
    
    // If user is an employee, only show their trips
    if (userData.role === 'موظف') {
      return trips.filter(trip => trip.employee === userData.name);
    }
    
    // For admin and other roles, show all trips
    return trips;
  }, [trips, userData]);

  const supplierSettlements = React.useMemo(() => {
    return getSupplierSettlements(filteredTrips, suppliers);
  }, [filteredTrips, suppliers]);

  const totalSettlement = React.useMemo(() => {
    return supplierSettlements.reduce((total, supplier) => total + supplier.totalSettlement, 0);
  }, [supplierSettlements]);

  const todaySettlement = React.useMemo(() => {
    return supplierSettlements.reduce((total, supplier) => total + supplier.todaySettlement, 0);
  }, [supplierSettlements]);

  const monthSettlement = React.useMemo(() => {
    return supplierSettlements.reduce((total, supplier) => total + supplier.monthSettlement, 0);
  }, [supplierSettlements]);

  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm) return supplierSettlements;
    
    return supplierSettlements.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplierSettlements, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          التسويات المالية
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SettlementCard 
          title="إجمالي التسويات" 
          amount={totalSettlement} 
        />
        <SettlementCard 
          title="تسويات اليوم" 
          amount={todaySettlement}
          delay={0.1}
        />
        <SettlementCard 
          title="تسويات الشهر" 
          amount={monthSettlement}
          delay={0.2}
        />
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          placeholder="بحث بالكود المؤسسي، إسم الوحدة، إسم المنظومة، أو إسم المحافظة/ الوزارة"
          className="pl-4 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier, index) => (
          <SupplierSettlementCard
            key={supplier.id}
            supplier={supplier}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default Settlement;
