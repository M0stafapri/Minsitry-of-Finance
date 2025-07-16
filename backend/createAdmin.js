require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Employee = require('./models/Employee');

const createAdmin = async () => {
  try {
    console.log('👑 Creating Admin User');
    console.log('====================\n');
    
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net');
    console.log('✅ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Employee.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n📋 Admin Credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      return;
    }
    
    // Generate valid Egyptian phone number
    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const validPhone = `+2010123${randomSix}`;
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await Employee.create({
      username: 'admin',
      password: hashedPassword,
      name: 'المدير العام',
      personalPhone: validPhone,
      role: 'مدير',
      employmentDate: new Date(),
      status: 'نشط',
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Name: المدير العام');
    console.log('   Role: مدير');
    console.log(`   Phone: ${validPhone}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start your backend server: npm start');
    console.log('   2. Use Postman to login with these credentials');
    console.log('   3. You can then create other employees');
    
  } catch (error) {
    console.error('🔴 Error creating admin:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('\n💡 Validation Errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`   ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
};

// Run the admin creation
createAdmin(); 