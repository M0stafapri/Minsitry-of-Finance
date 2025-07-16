
import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../utils";

export function SettlementCard({ title, amount, delay = 0 }) {
  const isPositive = amount > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="flex items-center gap-2">
        <p className={`text-3xl font-bold ${
          amount === 0 
            ? 'text-gray-600 dark:text-gray-400' 
            : isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
        }`}>
          {formatCurrency(amount)}
        </p>
        {amount !== 0 && (
          <Icon className={`h-6 w-6 ${
            isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`} />
        )}
      </div>
    </motion.div>
  );
}
