const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test employees endpoint
    console.log('📋 Testing employees endpoint...');
    const employeesResponse = await fetch(`${API_BASE_URL}/v1/employees`);
    console.log('Status:', employeesResponse.status);
    console.log('Headers:', employeesResponse.headers.get('content-type'));
    
    if (employeesResponse.ok) {
      const employeesData = await employeesResponse.json();
      console.log('✅ Employees API Response:', JSON.stringify(employeesData, null, 2));
    } else {
      const errorText = await employeesResponse.text();
      console.log('❌ Employees API Error:', errorText);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test customers endpoint
    console.log('📋 Testing customers endpoint...');
    const customersResponse = await fetch(`${API_BASE_URL}/v1/customers`);
    console.log('Status:', customersResponse.status);
    
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      console.log('✅ Customers API Response:', JSON.stringify(customersData, null, 2));
    } else {
      const errorText = await customersResponse.text();
      console.log('❌ Customers API Error:', errorText);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test suppliers endpoint
    console.log('📋 Testing suppliers endpoint...');
    const suppliersResponse = await fetch(`${API_BASE_URL}/v1/suppliers`);
    console.log('Status:', suppliersResponse.status);
    
    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      console.log('✅ Suppliers API Response:', JSON.stringify(suppliersData, null, 2));
    } else {
      const errorText = await suppliersResponse.text();
      console.log('❌ Suppliers API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 