import mongoose from 'mongoose';

// Function to generate a unique registration number for doctors
const generateRegistrationNumber = () => {
  const prefix = 'DR';
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
  return `${prefix}${year}${randomDigits}`;
};

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Doctor name is required"],
    trim: true
  },  registrationNumber: {
    type: String,
    unique: true,
    default: generateRegistrationNumber,
    immutable: true // Once created, can't be changed
  },
  govtRegistrationNumber: {
    type: String,
    required: [true, "Government registration number is required"],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Basic validation - can be customized based on government ID format
        return /^[A-Za-z0-9-]{5,20}$/.test(v);
      },
      message: props => `${props.value} is not a valid government registration number!`
    }
  },
  specialization: {
    type: String,
    required: [true, "Specialization is required"],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, "Years of experience is required"],
    min: [0, "Experience years cannot be negative"]
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    trim: true,
    select: false, // This ensures the password isn't returned in queries by default
    validate: {
      validator: function(v) {
        // Only validate if it's a new document or the password is being modified
        if (this.isNew || this.isModified('password')) {
          return v && v.length >= 6;
        }
        return true;
      },
      message: 'Password must be at least 6 characters long'
    }
  },
  availableDays: {
    type: [String],
    enum: {
      values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      message: '{VALUE} is not a valid day'
    },
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  availableHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  },
  qualifications: {
    type: [String],
    required: [true, "At least one qualification is required"],
    validate: {
      validator: function(quals) {
        return quals.length > 0;
      },
      message: "Please provide at least one qualification"
    }
  },
  bio: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add pre-save hook to ensure unique registration number
doctorSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if generated registration number already exists
    const existing = await this.constructor.findOne({ registrationNumber: this.registrationNumber });
    if (existing) {
      // If exists, generate a new one
      this.registrationNumber = generateRegistrationNumber();
    }
  }
  next();
});

// Add pre-save hook to hash passwords
doctorSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it's modified or new
    if (this.isModified('password') || this.isNew) {
      if (this.password) {
        const bcrypt = await import('bcrypt');
        const salt = await bcrypt.default.genSalt(10);
        this.password = await bcrypt.default.hash(this.password, salt);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const bcrypt = await import('bcrypt');
    // Since we're using select: false in the password field,
    // ensure we have the password field for comparison
    const doctor = this.password ? this : await this.constructor.findById(this._id).select('+password');
    
    if (!doctor.password) {
      return false; // No password set
    }

    return await bcrypt.default.compare(candidatePassword, doctor.password);
  } catch (error) {
    console.error('Error comparing doctor password:', error);
    return false;
  }
};

// Create a virtual for full name and credentials
doctorSchema.virtual('fullTitle').get(function() {
  return `Dr. ${this.name} (${this.specialization})`;
});

// Add indexes for frequently queried fields
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ active: 1 });
doctorSchema.index({ name: 'text', specialization: 'text' });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;