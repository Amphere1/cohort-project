import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for setup script'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create default accounts
const createDefaultAccounts = async () => {
  try {
    console.log('Creating default admin and receptionist accounts...');

    // Check if default accounts already exist
    const adminExists = await User.findOne({ role: 'admin', isDefaultAccount: true });
    const receptionistExists = await User.findOne({ role: 'receptionist', isDefaultAccount: true });

    // Default password - should be changed after first login
    const defaultPassword = 'HealthClinic@2025';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Create admin account if it doesn't exist
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@healthclinic.com',
        password: hashedPassword,
        role: 'admin',
        isDefaultAccount: true
      });

      await admin.save();
      console.log('✅ Admin account created successfully');
    } else {
      console.log('ℹ️ Admin account already exists');
    }

    // Create receptionist account if it doesn't exist
    if (!receptionistExists) {
      const receptionist = new User({
        username: 'receptionist',
        email: 'reception@healthclinic.com',
        password: hashedPassword,
        role: 'receptionist',
        isDefaultAccount: true
      });

      await receptionist.save();
      console.log('✅ Receptionist account created successfully');
    } else {
      console.log('ℹ️ Receptionist account already exists');
    }

    console.log('\n📝 Default Accounts:');
    console.log('-------------------');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Email: admin@healthclinic.com');
    console.log('  Password: HealthClinic@2025');
    console.log('\nReceptionist:');
    console.log('  Username: receptionist');
    console.log('  Email: reception@healthclinic.com');
    console.log('  Password: HealthClinic@2025');
    console.log('\n⚠️ IMPORTANT: Please change these passwords after first login!');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Setup completed successfully');

  } catch (error) {
    console.error('Error creating default accounts:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
createDefaultAccounts();
