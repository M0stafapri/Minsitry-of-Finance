/**
 * Utility functions for synchronizing customer data between customers and trips
 */

/**
 * Updates all trips with the updated customer information
 * @param {Object} customer - The updated customer object
 * @param {Array} trips - The array of trips to update
 * @returns {Array} - The updated trips array
 */
export const updateTripsWithCustomer = (customer, trips) => {
  if (!customer || !customer.phone || !trips || !trips.length) {
    return trips;
  }

  // Create a new array with updated trips
  const updatedTrips = trips.map(trip => {
    // Only update trips that have this customer's phone number
    if (trip.customerPhone === customer.phone) {
      return {
        ...trip,
        customerName: customer.name,
        customerWhatsapp: customer.whatsapp || customer.phone,
        // Don't update other trip-specific fields
      };
    }
    return trip;
  });

  return updatedTrips;
};

/**
 * Synchronizes all trips with the latest customer data
 * @param {Array} trips - The array of trips to update
 * @param {Array} customers - The array of customers with the latest data
 * @returns {Object} - Object containing updated trips and whether changes were made
 */
export const syncAllTripsWithCustomers = (trips, customers) => {
  if (!trips || !trips.length || !customers || !customers.length) {
    return { updatedTrips: trips, hasChanges: false };
  }

  let hasChanges = false;
  
  // Create a map of customers by phone number for quick lookup
  const customersByPhone = {};
  customers.forEach(customer => {
    if (customer.phone) {
      customersByPhone[customer.phone] = customer;
    }
  });

  // Update all trips with the latest customer information
  const updatedTrips = trips.map(trip => {
    // Skip if no customer phone
    if (!trip.customerPhone) {
      return trip;
    }

    // Look up the customer by phone number
    const customer = customersByPhone[trip.customerPhone];
    if (!customer) {
      return trip;
    }

    // Check if customer data needs to be updated
    if (trip.customerName !== customer.name || 
        trip.customerWhatsapp !== (customer.whatsapp || customer.phone)) {
      
      hasChanges = true;
      
      // Update the trip with the latest customer data
      return {
        ...trip,
        customerName: customer.name,
        customerWhatsapp: customer.whatsapp || customer.phone
      };
    }

    return trip;
  });

  return { updatedTrips, hasChanges };
};
