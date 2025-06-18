import mongoose from 'mongoose';

// Function to generate a random bill number
const generateRandomBillNumber = () => {
  const prefix = 'BN';
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  return `${prefix}${randomDigits}-${timestamp}`;
};

const patientDetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Patient name is required"],
    trim: true 
  },
  age: {
    type: Number,
    required: [true, "Patient age is required"],
    min: [0, "Age cannot be negative"]
  },
  billNumber: {
    type: String,
    default: generateRandomBillNumber,
    unique: true,
    trim: true
  },
  symptoms: {
    type: [String],
    required: [true, "At least one symptom is required"],
    validate: {
      validator: function(symptoms) {
        return symptoms.length > 0;
      },
      message: "Please provide at least one symptom"
    }
  },
  preferredDoctor: {
    type: String,
    trim: true
  },
  appointmentComplete: {
    type: Boolean,
    default: false
  },
  // New fields for doctor appointment integration
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  recommendedSpecialization: {
    type: String,
    trim: true
  },
  appointmentStatus: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  appointmentDate: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
  },
  appointmentReason: {
    type: String,
    trim: true
  },
  caseSummary: {
    summary: String,
    possibleConditions: [String],
    recommendedTests: [String],
    suggestedQuestions: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically update createdAt and updatedAt fields
});

// Create a virtual property for patient's full record
patientDetailSchema.virtual('fullRecord').get(function() {
  return `${this.name} (${this.age}) - Bill #${this.billNumber}`;
});

// Add text index for searching patients
patientDetailSchema.index({ 
  name: 'text', 
  symptoms: 'text',
  preferredDoctor: 'text',
  recommendedSpecialization: 'text',
  appointmentReason: 'text',
  'caseSummary.summary': 'text'
});

// Add pre-save middleware to ensure unique bill number
patientDetailSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check if the generated bill number already exists
    const existing = await this.constructor.findOne({ billNumber: this.billNumber });
    if (existing) {
      // If exists, generate a new one
      this.billNumber = generateRandomBillNumber();
    }
  }
  next();
});

// Create and export the Patient model
const PatientDetail = mongoose.model('PatientDetail', patientDetailSchema);

export default PatientDetail;