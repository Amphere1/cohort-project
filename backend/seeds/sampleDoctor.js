import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/doctorModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(error => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// List of specializations
const specializations = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Pediatrics',
  'Psychiatry',
  'Orthopedics',
  'Ophthalmology',
  'Gynecology',
  'Urology',
  'Radiology'
];

// List of qualifications
const qualifications = [
  'MBBS',
  'MD',
  'MS',
  'DNB',
  'DM',
  'MCh',
  'PhD',
  'FRCS',
  'MRCP',
  'MRCPCH',
  'FICM'
];

// Function to get random items from an array
const getRandomItems = (array, min, max) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to generate a random govt registration number
const generateGovtRegistrationNumber = () => {
  const prefix = ['MCI', 'DMC', 'NMC', 'SMC'][Math.floor(Math.random() * 4)];
  const year = 2010 + Math.floor(Math.random() * 15); // Random year between 2010-2024
  const number = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `${prefix}-${year}-${number}`;
};

// Function to generate sample doctor data with realistic information
const generateSampleDoctors = async (count) => {
  const doctors = [];
  const users = [];

  // Common password for all sample accounts for testing purposes
  const password = 'doctor123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const firstNames = [
    'Aditya', 'Neha', 'Rajesh', 'Priya', 'Vikram', 
    'Ananya', 'Sanjay', 'Meera', 'Arjun', 'Divya',
    'John', 'Sarah', 'Michael', 'Emma', 'David'
  ];
  
  const lastNames = [
    'Sharma', 'Patel', 'Singh', 'Gupta', 'Verma', 
    'Kumar', 'Shah', 'Reddy', 'Joshi', 'Mehta',
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones'
  ];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `Dr. ${firstName} ${lastName}`;
    
    const specialization = specializations[Math.floor(Math.random() * specializations.length)];
    const doctorQualifications = getRandomItems(qualifications, 1, 3);
    const experience = 3 + Math.floor(Math.random() * 25); // 3 to 27 years
    
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hospital.com`;
    const contactNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      // Create a user first
    const user = new User({
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      email: email,
      password: hashedPassword,
      role: 'doctor'
    });
    
    // Save user
    await user.save();
    users.push(user);
    
    // Create doctor with reference to user
    const doctor = new Doctor({
      name: fullName,
      govtRegistrationNumber: generateGovtRegistrationNumber(),
      specialization: specialization,
      experience: experience,
      contactNumber: contactNumber,
      email: email,
      password: hashedPassword, // Setting this directly (will be hashed by pre-save hook)
      qualifications: doctorQualifications,
      bio: `${fullName} is a highly skilled ${specialization} specialist with ${experience} years of experience. Specializing in the diagnosis and treatment of complex cases.`,
      availableDays: getRandomItems(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 4, 6),
      availableHours: {
        start: ['08:00', '09:00', '10:00'][Math.floor(Math.random() * 3)],
        end: ['17:00', '18:00', '19:00'][Math.floor(Math.random() * 3)]
      },
      active: Math.random() > 0.1, // 90% active
      ratings: {
        average: (3 + Math.random() * 2).toFixed(1), // 3.0 - 5.0 rating
        count: Math.floor(10 + Math.random() * 90) // 10-99 ratings
      },
      userId: user._id
    });
    
    // Save doctor
    await doctor.save();
    doctors.push(doctor);
    
    console.log(`Created doctor: ${fullName} (${specialization})`);
  }

  return { doctors, users };
};

// Seed function
const seedDoctors = async () => {
  try {
    // Clear existing doctor data and their associated users
    const existingDoctors = await Doctor.find({});
    const userIds = existingDoctors.map(doc => doc.userId).filter(id => id);
    
    await Doctor.deleteMany({});
    console.log('Cleared existing doctor data');
    
    // Delete users that were linked to doctors (but preserve admin/receptionist)
    if (userIds.length > 0) {
      await User.deleteMany({ 
        _id: { $in: userIds },
        role: 'doctor'
      });
      console.log('Cleared existing doctor user accounts');
    }

    // Generate and save sample doctors
    const { doctors } = await generateSampleDoctors(10);
    console.log(`Successfully seeded ${doctors.length} sample doctors`);
    
    // Log credentials for testing
    console.log('\nSample Login Credentials:');
    doctors.forEach(doctor => {
      console.log(`- ${doctor.name} (${doctor.specialization})`);
      console.log(`  Govt Registration: ${doctor.govtRegistrationNumber}`);
      console.log(`  Email: ${doctor.email}`);
      console.log(`  Password: doctor123`);
      console.log(``);
    });
    
    return doctors;
  } catch (error) {
    console.error('Error seeding doctors:', error);
    throw error;
  }
};

// Run the seeding process
seedDoctors()
  .then(() => {
    console.log('Seeding completed successfully');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during seeding:', error);
    mongoose.connection.close();
    process.exit(1);
  });
