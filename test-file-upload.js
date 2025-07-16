const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test file upload functionality
async function testFileUpload() {
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    // Create FormData
    const formData = new FormData();
    formData.append('customerName', 'Test Customer Name');
    formData.append('jobTitle', 'Test Job');
    formData.append('nationalId', '20000000000000');
    formData.append('unitName', 'Test Unit');
    formData.append('systemName', 'Test System');
    formData.append('email', 'test@example.com');
    formData.append('certificateDuration', '1');
    formData.append('signatureType', 'Test Signature');
    formData.append('certificateType', 'SSL');
    formData.append('issueDate', '2024-01-01');
    formData.append('expiryDate', '2025-01-01');
    formData.append('institutionalCode', 'TEST001');
    formData.append('assignedEmployee', '507f1f77bcf86cd799439011'); // You'll need a valid employee ID
    formData.append('notes', 'Test notes');
    formData.append('certificateScan', fs.createReadStream(testFilePath));
    
    console.log('🔍 [TEST] FormData created with file');
    console.log('🔍 [TEST] FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log('🔍 [TEST]', key, ':', value);
    }
    
    // Make the request
    const response = await fetch('http://localhost:3000/api/v1/customers/addNewCustomer', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need a valid token
      },
      body: formData
    });
    
    const result = await response.json();
    console.log('🔍 [TEST] Response:', result);
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('🔍 [TEST] Error:', error);
  }
}

// Run the test
testFileUpload(); 