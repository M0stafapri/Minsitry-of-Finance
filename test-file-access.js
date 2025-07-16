const fs = require('fs');
const path = require('path');

// Test file access functionality
async function testFileAccess() {
  try {
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, 'backend', 'uploads');
    console.log('🔍 [TEST] Uploads directory:', uploadsDir);
    console.log('🔍 [TEST] Directory exists:', fs.existsSync(uploadsDir));
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('🔍 [TEST] Files in uploads directory:', files);
      
      if (files.length > 0) {
        const testFile = files[0];
        const filePath = path.join(uploadsDir, testFile);
        const fileStats = fs.statSync(filePath);
        
        console.log('🔍 [TEST] Test file:', testFile);
        console.log('🔍 [TEST] File size:', fileStats.size, 'bytes');
        console.log('🔍 [TEST] File path for URL:', `uploads/${testFile}`);
        console.log('🔍 [TEST] Full URL would be:', `http://localhost:3000/uploads/${testFile}`);
        
        // Test if we can read the file
        try {
          const fileContent = fs.readFileSync(filePath);
          console.log('🔍 [TEST] File is readable, first 100 bytes:', fileContent.slice(0, 100));
        } catch (readError) {
          console.error('🔍 [TEST] Error reading file:', readError.message);
        }
      }
    }
    
    // Test URL construction
    const testPaths = [
      'uploads/test-file.pdf',
      '/uploads/test-file.pdf',
      'uploads\\test-file.pdf',
      'http://localhost:3000/uploads/test-file.pdf'
    ];
    
    console.log('🔍 [TEST] URL construction tests:');
    testPaths.forEach(testPath => {
      const API_BASE_URL = 'http://localhost:3000';
      let fullUrl;
      
      if (testPath.startsWith('http://') || testPath.startsWith('https://')) {
        fullUrl = testPath;
      } else {
        const cleanFilePath = testPath.startsWith('/') ? testPath.substring(1) : testPath;
        fullUrl = `${API_BASE_URL}/${cleanFilePath}`;
      }
      
      console.log('🔍 [TEST]', testPath, '->', fullUrl);
    });
    
  } catch (error) {
    console.error('🔍 [TEST] Error:', error);
  }
}

// Run the test
testFileAccess(); 