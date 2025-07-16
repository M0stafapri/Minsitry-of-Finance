import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Calendar, Grid, Plus, FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TripsView from "@/features/trips/components/TripsView";
import TripsCalendarView from "@/features/trips/components/TripsCalendarView";
import { cn } from "@/lib/utils";
import { tripTypes } from "@/features/trips/utils";
import * as XLSX from 'xlsx';

function Trips() {
  const navigate = useNavigate();
  const [trips] = useLocalStorage("trips", []);
  const [suppliers] = useLocalStorage("suppliers", []);
  const [userData, setUserData] = useState(null);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayedTripsCount, setDisplayedTripsCount] = useState(0);
  const { toast } = useToast();

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

  // Function to export trips to Excel
  const handleExportToExcel = () => {
    try {
      // Create the worksheet data
      const worksheetData = filteredTrips.map(trip => ({
        'رقم الرحلة': trip.tripNumber,
        'النوع': tripTypes.find(t => t.id === trip.type)?.name || '',
        'التاريخ': trip.date,
        'المسار': trip.route,
        'الكمية': trip.quantity || 1,
        'السعر التجاري': trip.commercialPrice,
        'سعر الرحلة': trip.tripPrice,
        'المبلغ المدفوع': trip.paidAmount,
        'التحصيل': trip.collection,
        'الكود المؤسسي': suppliers.find(s => s.id === Number(trip.supplier))?.name || '',
        'الحالة': trip.status === 'completed' ? 'مكتملة' : trip.status === 'active' ? 'قيد التنفيذ' : 'ملغاة',
        'تمت التسوية': trip.isSettled ? 'نعم' : 'لا'
      }));

      // Convert worksheet data to Excel file
      const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: false });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
      
      // Generate Excel file
      XLSX.writeFile(workbook, `trips-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${worksheetData.length} رحلة إلى ملف Excel`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            جميع الرحلات
            <span className="text-gray-500 mr-2">({displayedTripsCount})</span>
          </h1>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "flex items-center gap-1",
                viewMode === 'table' && "bg-primary text-white"
              )}
              onClick={() => setViewMode('table')}
            >
              <Grid className="h-4 w-4" />
              <span>جدول</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "flex items-center gap-1",
                viewMode === 'calendar' && "bg-primary text-white"
              )}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4" />
              <span>تقويم</span>
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
            إضافة رحلة جديدة
          </Button>
          <Button 
            variant="outline"
            className="flex items-center gap-2" 
            onClick={handleExportToExcel}
          >
            <FileDown className="h-5 w-5" />
            تصدير كملف Excel
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <TripsView
          trips={filteredTrips}
          emptyMessage="لا يوجد رحلات"
          filterStatus={null}
          showTitle={false}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          onTripsCountChange={setDisplayedTripsCount}
        />
      ) : (
        <TripsCalendarView 
          trips={filteredTrips} 
          suppliers={suppliers} 
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      )}
    </div>
  );
}

export default Trips;
