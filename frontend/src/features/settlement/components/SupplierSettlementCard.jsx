
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, CalendarDays } from "lucide-react";
import { formatCurrency } from "../utils";

export function SupplierSettlementCard({ supplier, index }) {
  const isPositive = supplier.totalSettlement > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {supplier.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            عدد الرحلات: {supplier.tripsCount}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${
          supplier.totalSettlement === 0 
            ? 'text-gray-600 dark:text-gray-400' 
            : isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
        }`}>
          <span className="text-2xl font-bold">
            {formatCurrency(supplier.totalSettlement)}
          </span>
          {supplier.totalSettlement !== 0 && <Icon className="h-6 w-6" />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">اليوم ({supplier.todayTripsCount})</span>
          </div>
          <p className={`text-sm font-semibold ${
            supplier.todaySettlement === 0 
              ? 'text-gray-600 dark:text-gray-400' 
              : supplier.todaySettlement > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(supplier.todaySettlement)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">الشهر ({supplier.monthTripsCount})</span>
          </div>
          <p className={`text-sm font-semibold ${
            supplier.monthSettlement === 0 
              ? 'text-gray-600 dark:text-gray-400' 
              : supplier.monthSettlement > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(supplier.monthSettlement)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
