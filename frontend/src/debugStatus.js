// Debug script to check employee status values
import { employeeAPI } from './api/index.js';

const debugEmployeeStatus = async () => {
  try {
    console.log('🔍 Debugging Employee Status');
    console.log('===========================\n');
    
    // Fetch employees from API
    console.log('📡 Fetching employees from API...');
    const response = await employeeAPI.getAllEmployees();
    
    if (response.status === 'success') {
      const employees = response.data.employees || [];
      console.log(`✅ Found ${employees.length} employees\n`);
      
      // Check status values
      console.log('📋 Employee Status Values:');
      employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name} (${emp.username}):`);
        console.log(`   Status: "${emp.status}"`);
        console.log(`   Status type: ${typeof emp.status}`);
        console.log(`   Status length: ${emp.status ? emp.status.length : 'null'}`);
        console.log(`   Status === "نشط": ${emp.status === "نشط"}`);
        console.log('');
      });
      
      // Group by status
      const statusGroups = {};
      employees.forEach(emp => {
        const status = emp.status || 'undefined';
        if (!statusGroups[status]) {
          statusGroups[status] = [];
        }
        statusGroups[status].push(emp);
      });
      
      console.log('📊 Status Summary:');
      Object.keys(statusGroups).forEach(status => {
        console.log(`   "${status}": ${statusGroups[status].length} employee(s)`);
      });
      
    } else {
      console.error('❌ API response error:', response);
    }
    
  } catch (error) {
    console.error('🔴 Error debugging status:', error);
  }
};

// Run the debug
debugEmployeeStatus(); 